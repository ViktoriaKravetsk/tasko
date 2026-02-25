import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { Project, Task, ProjectProgress } from '../api/types'
import { tasksApi } from '../api/tasks.api'
import { progressApi } from '../api/progress.api'

type LocationState = {
    project?: Project
    mode?: 'teacher' | 'student'
}

export default function ProjectPage() {
    const { projectId } = useParams()
    const pid = Number(projectId)

    const location = useLocation()
    const state = (location.state || {}) as LocationState

    const mode = state.mode ?? 'student'
    const isTeacher = useMemo(() => mode === 'teacher', [mode])

    const [project] = useState<Project | null>(state.project ?? null)

    const [tasks, setTasks] = useState<Task[]>([])
    const [progress, setProgress] = useState<ProjectProgress | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [deadline, setDeadline] = useState('')
    const [maxScore, setMaxScore] = useState(10)
    const [creating, setCreating] = useState(false)

    async function load() {
        setError('')
        setLoading(true)
        try {
            const [t, p] = await Promise.all([tasksApi.list(pid), progressApi.my(pid).catch(() => null)])
            setTasks(t)
            setProgress(p)
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load project')
        } finally {
            setLoading(false)
        }
    }

    async function onCreateTask() {
        if (!title.trim()) return
        setCreating(true)
        setError('')
        try {
            await tasksApi.create(pid, {
                title: title.trim(),
                description: description.trim() ? description.trim() : null,
                deadline: deadline ? deadline : null,
                maxScore: Number(maxScore),
            })
            setTitle('')
            setDescription('')
            setDeadline('')
            setMaxScore(10)
            await load()
        } catch (e: any) {
            setError(e?.message ?? 'Failed to create task')
        } finally {
            setCreating(false)
        }
    }

    useEffect(() => {
        if (!Number.isFinite(pid)) return
        void load()
    }, [pid])

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                        <h1>{project?.name ?? `Project #${pid}`}</h1>
                        {project?.description ? <div className="small" style={{ marginTop: 6 }}>{project.description}</div> : null}

                        <div className="small" style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {project?.deadline ? <span className="badge badge--olive">deadline: {project.deadline}</span> : null}
                            {project?.joinCode ? <span className="badge">joinCode: {project.joinCode}</span> : null}
                            <span className="badge">{mode.toUpperCase()}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button className="btn" onClick={() => void load()} disabled={loading}>
                            {loading ? 'Loading…' : 'Refresh'}
                        </button>
                        <Link to="/" className="btn btn--ghost">
                            ← Back
                        </Link>
                    </div>
                </div>

                {error ? (
                    <div className="card card--soft" style={{ marginTop: 12 }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 11 }}>Error</div>
                        <div className="small">{error}</div>
                    </div>
                ) : null}
            </div>

            {progress ? (
                <div className="card card--soft">
                    <h2>My progress</h2>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <span className="badge badge--olive">
              {progress.earned} / {progress.total}
            </span>
                        <div className="small">Earned points / total points.</div>
                    </div>
                </div>
            ) : null}

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                        <h2>Tasks</h2>
                        <div className="small">Open a task to submit or grade .</div>
                    </div>
                </div>

                {loading ? <div className="small" style={{ marginTop: 10 }}>Loading…</div> : null}
                {!loading && tasks.length === 0 ? <div className="small" style={{ marginTop: 10 }}>No tasks yet.</div> : null}

                {tasks.length > 0 ? (
                    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                        {tasks.map((t) => (
                            <div key={t.id} className="card card--soft" style={{ boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{t.title}</div>
                                        <div className="small" style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            {t.deadline ? <span className="badge badge--olive">deadline: {t.deadline}</span> : null}
                                            <span className="badge">max: {t.maxScore}</span>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/projects/${pid}/tasks/${t.id}`}
                                        state={{ mode }}
                                        className="btn btn--primary"
                                        style={{ height: 36, padding: '0 10px' }}
                                    >
                                        Open →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>

            {isTeacher ? (
                <div className="card card--soft">
                    <h2>Create task</h2>

                    <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />

                        <textarea
                            className="input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description (optional)"
                            rows={4}
                        />

                        <input className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} type="date" />

                        <input
                            className="input"
                            value={maxScore}
                            onChange={(e) => setMaxScore(Number(e.target.value))}
                            type="number"
                            min={0}
                        />

                        <button className="btn btn--primary" onClick={onCreateTask} disabled={creating || !title.trim()}>
                            {creating ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    )
}