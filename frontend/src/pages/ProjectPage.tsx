import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { projectsApi } from '../api/projects.api'
import { submissionsApi } from '../api/submissions.api'
import { tasksApi, type TaskDeadlineFilter } from '../api/tasks.api'
import type { Project, Submission, Task } from '../api/types'

type Mode = 'teacher' | 'student'
type Tab = 'overview' | 'tasks' | 'create'

export default function ProjectPage() {
    const { projectId } = useParams()
    const projectIdNum = projectId ? Number(projectId) : NaN

    const navigate = useNavigate()

    const [mode, setMode] = useState<Mode>('student')
    const [project, setProject] = useState<Project | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [mySubs, setMySubs] = useState<Record<number, Submission | null>>({})
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const [tab, setTab] = useState<Tab>('tasks')
    const [tTitle, setTTitle] = useState('')
    const [tDesc, setTDesc] = useState('')
    const [tDeadline, setTDeadline] = useState('')
    const [tMaxScore, setTMaxScore] = useState<number>(10)
    const [tAllowResubmissionAfterGrade, setTAllowResubmissionAfterGrade] = useState(true)
    const [copied, setCopied] = useState(false)

    const [taskSearch, setTaskSearch] = useState('')
    const [debouncedTaskSearch, setDebouncedTaskSearch] = useState('')
    const [deadlineFilter, setDeadlineFilter] = useState<TaskDeadlineFilter>('ALL')

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedTaskSearch(taskSearch.trim())
        }, 300)

        return () => window.clearTimeout(timeout)
    }, [taskSearch])

    const load = async (searchValue?: string, deadlineValue?: TaskDeadlineFilter) => {
        if (!projectId) return

        const pid = Number(projectId)
        if (!Number.isFinite(pid)) return

        setLoading(true)
        setErr(null)

        try {
            const normalizedSearch = searchValue?.trim() || undefined
            const effectiveDeadlineFilter = deadlineValue ?? 'ALL'

            const [my, enrolled, ts] = await Promise.all([
                projectsApi.my(),
                projectsApi.enrolled(),
                tasksApi.list(pid, {
                    search: normalizedSearch,
                    deadlineFilter: effectiveDeadlineFilter,
                }),
            ])

            const ownedProject = my.find((x) => x.id === pid) ?? null
            const enrolledProject = enrolled.find((x) => x.id === pid) ?? null

            const effectiveProject = ownedProject ?? enrolledProject
            const effectiveMode: Mode = ownedProject ? 'teacher' : 'student'

            setProject(effectiveProject)
            setMode(effectiveMode)
            setTasks(ts)

            if (!effectiveProject) {
                setMySubs({})
                setErr('Project not found')
                return
            }

            if (effectiveMode === 'student') {
                const pairs = await Promise.all(
                    ts.map(async (t: Task) => {
                        try {
                            const s = await submissionsApi.my(pid, t.id)
                            return [t.id, s] as const
                        } catch {
                            return [t.id, null] as const
                        }
                    })
                )

                const map: Record<number, Submission | null> = {}
                for (const [tid, s] of pairs) {
                    map[tid] = s
                }

                setMySubs(map)
            } else {
                setMySubs({})
            }
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? 'Failed to load project')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load(debouncedTaskSearch, deadlineFilter)
    }, [projectId, debouncedTaskSearch, deadlineFilter])

    const createTask = async () => {
        if (mode !== 'teacher') return
        if (!projectId || Number.isNaN(projectIdNum)) return
        if (!tTitle.trim()) return

        setLoading(true)
        setErr(null)

        try {
            await tasksApi.create(projectIdNum, {
                title: tTitle.trim(),
                description: tDesc.trim() || undefined,
                deadline: tDeadline || undefined,
                maxScore: tMaxScore,
                allowResubmissionAfterGrade: tAllowResubmissionAfterGrade,
            })

            setTTitle('')
            setTDesc('')
            setTDeadline('')
            setTMaxScore(10)
            setTAllowResubmissionAfterGrade(true)

            await load(debouncedTaskSearch, deadlineFilter)
            setTab('tasks')
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? 'Create task failed')
        } finally {
            setLoading(false)
        }
    }

    const deleteProject = async () => {
        if (mode !== 'teacher') return
        if (!projectId || Number.isNaN(projectIdNum)) return
        if (!confirm('Delete this project?')) return

        setLoading(true)
        setErr(null)

        try {
            await projectsApi.delete(projectIdNum)
            navigate('/')
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? 'Delete failed')
        } finally {
            setLoading(false)
        }
    }

    const copy = async (text: string) => {
        if (!text) return

        try {
            await navigator.clipboard.writeText(text)
        } catch {
            const ta = document.createElement('textarea')
            ta.value = text
            document.body.appendChild(ta)
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
        } finally {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1200)
        }
    }

    const submittedCount = useMemo(() => Object.values(mySubs).filter(Boolean).length, [mySubs])

    const progressPct = useMemo(() => {
        const total = tasks.length
        if (total === 0) return 0
        return Math.round((submittedCount / total) * 100)
    }, [submittedCount, tasks.length])

    const emojis = useMemo(
        () => ['📚', '🎨', '🔬', '🚀', '💡', '🎯', '🌍', '🎵', '🖌️', '⚽', '🧠', '🔭'],
        []
    )

    const emoji = useMemo(
        () => (projectId ? emojis[Math.abs(hash(projectId)) % emojis.length] : '📚'),
        [emojis, projectId]
    )

    return (
        <div className="page-wrap">
            <Link to={mode === 'teacher' ? '/projects/mine' : '/projects/enrolled'} className="btn btn--ghost" style={{ textDecoration: 'none' }}>
                ← Back
            </Link>

            {err && (
                <div className="alert alert--error" style={{ marginTop: 12 }}>
                    {err}
                </div>
            )}

            <div className="panel" style={{ marginTop: 14 }}>
                <div className="panel-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <div className="project-card-emoji" style={{ margin: 0 }}>
                            {emoji}
                        </div>

                        <div>
                            <div className="panel-title">{project?.name ?? (loading ? 'Loading…' : 'Project')}</div>
                            <div className="panel-sub">{project?.description ?? 'No description'}</div>
                        </div>
                    </div>

                    {project?.joinCode ? (
                        <button
                            className="count-pill count-pill--pink"
                            onClick={() => void copy(project.joinCode ?? '')}
                            title="Copy join code"
                            type="button"
                        >
                            {copied ? 'Copied ✓' : `${project.joinCode} 📋`}
                        </button>
                    ) : null}

                    {mode === 'teacher' ? (
                        <button className="btn btn--danger" onClick={deleteProject} disabled={loading} type="button">
                            🗑 Delete
                        </button>
                    ) : null}
                </div>

                <div className="panel-body">
                    <div className="tabs">
                        <button
                            className={tab === 'overview' ? 'tab tab--active' : 'tab'}
                            onClick={() => setTab('overview')}
                            type="button"
                        >
                            🌼 Overview
                        </button>

                        <button
                            className={tab === 'tasks' ? 'tab tab--active' : 'tab'}
                            onClick={() => setTab('tasks')}
                            type="button"
                        >
                            📋 Tasks
                        </button>

                        {mode === 'teacher' ? (
                            <button
                                className={tab === 'create' ? 'tab tab--active' : 'tab'}
                                onClick={() => setTab('create')}
                                type="button"
                            >
                                ✨ Create task
                            </button>
                        ) : null}
                    </div>

                    {tab === 'overview' ? (
                        <div className="overview-grid">
                            <div className="info-card">
                                <div className="info-title">Quick info</div>
                                <div className="info-row">
                                    <span>🗓 Deadline</span>
                                    <span>{project?.deadline ?? 'No deadline'}</span>
                                </div>
                                <div className="info-row">
                                    <span>📌 Tasks</span>
                                    <span>{tasks.length}</span>
                                </div>

                                {mode === 'student' ? (
                                    <div className="info-row">
                                        <span>✅ Submitted</span>
                                        <span>{submittedCount}</span>
                                    </div>
                                ) : null}
                            </div>

                            <div className="info-card">
                                <div className="info-title">My progress</div>
                                {mode === 'student' ? (
                                    <>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                                        </div>
                                        <div className="progress-label">
                                            {progressPct}% ({submittedCount}/{tasks.length})
                                        </div>
                                    </>
                                ) : (
                                    <div className="muted">
                                        As a teacher, you can create tasks and review submissions.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {tab === 'tasks' ? (
                        <>
                            <div
                                className="panel"
                                style={{
                                    marginBottom: 16,
                                    padding: 16,
                                    background: 'rgba(255,255,255,0.44)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 12,
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <input
                                        className="inp"
                                        value={taskSearch}
                                        onChange={(e) => setTaskSearch(e.target.value)}
                                        placeholder="Search tasks by title..."
                                        style={{ maxWidth: 320, margin: 0 }}
                                    />

                                    <select
                                        className="inp"
                                        value={deadlineFilter}
                                        onChange={(e) => setDeadlineFilter(e.target.value as TaskDeadlineFilter)}
                                        style={{ maxWidth: 220, margin: 0 }}
                                    >
                                        <option value="ALL">All deadlines</option>
                                        <option value="UPCOMING">Upcoming</option>
                                        <option value="OVERDUE">Overdue</option>
                                        <option value="NO_DEADLINE">No deadline</option>
                                    </select>

                                    {taskSearch.trim() || deadlineFilter !== 'ALL' ? (
                                        <button
                                            type="button"
                                            className="btn btn--ghost"
                                            onClick={() => {
                                                setTaskSearch('')
                                                setDeadlineFilter('ALL')
                                            }}
                                        >
                                            Clear
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            {tasks.length === 0 ? (
                                <div className="empty">
                                    <div className="empty-icon">📝</div>
                                    <div className="empty-text">No tasks found</div>
                                    <div className="empty-sub">
                                        {taskSearch.trim() || deadlineFilter !== 'ALL'
                                            ? 'Try another task title or change the deadline filter.'
                                            : mode === 'teacher'
                                                ? 'Create your first task!'
                                                : 'Ask your teacher to add tasks.'}
                                    </div>
                                </div>
                            ) : (
                                <div className="tasks-grid">
                                    {tasks.map((t: Task) => {
                                        const sub = mySubs[t.id]

                                        return (
                                            <div key={t.id} className="task-card">
                                                <div className="task-top">
                                                    <div>
                                                        <div className="task-title">{t.title}</div>
                                                        <div className="task-desc">{t.description || 'No description'}</div>
                                                    </div>

                                                    {mode === 'student' ? (
                                                        <span className={sub ? 'status-pill st-done' : 'status-pill st-open'}>
                                                            {sub ? '✅ Submitted' : '⏳ Not submitted'}
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div className="task-meta">
                                                    <span className="meta-pill">📅 {t.deadline || 'No deadline'}</span>
                                                </div>

                                                <div className="task-actions">
                                                    <Link
                                                        to={`/projects/${projectId}/tasks/${t.id}`}
                                                        state={{ mode }}
                                                        className="btn btn--ghost"
                                                        style={{ textDecoration: 'none' }}
                                                    >
                                                        Open
                                                    </Link>

                                                    {mode === 'teacher' ? (
                                                        <Link
                                                            to={`/projects/${projectId}/tasks/${t.id}/submissions`}
                                                            state={{ mode }}
                                                            className="btn btn--primary"
                                                            style={{ textDecoration: 'none' }}
                                                        >
                                                            Submissions →
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            to={`/projects/${projectId}/tasks/${t.id}`}
                                                            state={{ mode }}
                                                            className="btn btn--primary"
                                                            style={{ textDecoration: 'none' }}
                                                        >
                                                            Submit / View answer →
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    ) : null}

                    {tab === 'create' && mode === 'teacher' ? (
                        <div className="create-wrap">
                            <div className="create-card">
                                <div className="info-title">✨ Create a task</div>
                                <div className="muted">
                                    Fill out the fields below and publish it to your students.
                                </div>

                                <div style={{ height: 12 }} />

                                <input
                                    className="inp"
                                    value={tTitle}
                                    onChange={(e) => setTTitle(e.target.value)}
                                    placeholder="Task title"
                                />

                                <textarea
                                    className="inp"
                                    value={tDesc}
                                    onChange={(e) => setTDesc(e.target.value)}
                                    placeholder="Description (optional)"
                                />

                                <div className="row2">
                                    <input
                                        className="inp"
                                        type="date"
                                        value={tDeadline}
                                        onChange={(e) => setTDeadline(e.target.value)}
                                    />

                                    <input
                                        className="inp"
                                        type="number"
                                        min={0}
                                        max={1000}
                                        value={tMaxScore}
                                        onChange={(e) => setTMaxScore(Number(e.target.value))}
                                        placeholder="Max score"
                                    />
                                </div>

                                <label
                                    className="tasko-field"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 10,
                                        marginTop: 4,
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={tAllowResubmissionAfterGrade}
                                        onChange={(e) => setTAllowResubmissionAfterGrade(e.target.checked)}
                                    />
                                    <span>Allow resubmission after grading</span>
                                </label>

                                <button
                                    className="btn-primary"
                                    onClick={createTask}
                                    disabled={loading || !tTitle.trim()}
                                    type="button"
                                >
                                    Create ✨
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

function hash(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
    return h
}
