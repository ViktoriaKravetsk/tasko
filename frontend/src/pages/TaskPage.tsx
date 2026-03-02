import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { Task, Submission } from '../api/types'
import { tasksApi } from '../api/tasks.api'
import { submissionsApi } from '../api/submissions.api'

type LocationState = { mode?: 'teacher' | 'student' }

export default function TaskPage() {
    const { projectId, taskId } = useParams()
    const pid = Number(projectId)
    const tid = Number(taskId)

    const mode = ((useLocation().state as LocationState | null)?.mode ?? 'student') as 'teacher' | 'student'
    const isTeacher = useMemo(() => mode === 'teacher', [mode])

    const [task, setTask] = useState<Task | null>(null)
    const [mySubmission, setMySubmission] = useState<Submission | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const submissionStatus =
        mySubmission == null ? 'NOT_SUBMITTED' : mySubmission.teacherScore == null ? 'SUBMITTED' : 'GRADED'

    async function load() {
        setLoading(true)
        setError(null)
        try {
            const t = await tasksApi.get(pid, tid)
            setTask(t)

            if (!isTeacher) {
                const s = await submissionsApi.my(pid, tid)
                setMySubmission(s)
            }
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load task')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()
    }, [pid, tid, isTeacher])

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <Link to={`/projects/${pid}`} state={{ mode }} className="btn btn--ghost">
                    ← Back to project
                </Link>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn" onClick={() => void load()} disabled={loading}>
                        {loading ? 'Loading…' : 'Refresh'}
                    </button>

                    {isTeacher ? (
                        <Link to={`/projects/${pid}/tasks/${tid}/submissions`} state={{ mode }} className="btn btn--primary">
                            Review submissions →
                        </Link>
                    ) : (
                        <Link to={`/projects/${pid}/tasks/${tid}/submission`} state={{ mode }} className="btn btn--primary">
                            Open my submission →
                        </Link>
                    )}
                </div>
            </div>

            {error ? (
                <div className="card card--soft" style={{ marginTop: 12 }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 11 }}>Error</div>
                    <div className="small">{error}</div>
                </div>
            ) : null}

            {loading ? <div className="small" style={{ marginTop: 10 }}>Loading…</div> : null}

            {task ? (
                <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                    <div className="card card--soft">
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                            <div>
                                <h1>{task.title}</h1>
                                {task.description ? <div className="small">{task.description}</div> : null}
                            </div>

                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {task.deadline ? <span className="badge badge--blue">Deadline: {task.deadline}</span> : null}
                                <span className="badge">Max: {task.maxScore}</span>
                            </div>
                        </div>
                    </div>

                    {!isTeacher ? (
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                <h2>Your submission</h2>
                                <span className={submissionStatus === 'GRADED' ? 'badge badge--mint' : 'badge badge--pink'}>
                                    {submissionStatus}
                                </span>
                            </div>

                            <div className="small" style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                                <div>Submitted at: {mySubmission?.submittedAt ?? '—'}</div>
                                <div>Teacher score: {mySubmission?.teacherScore ?? '—'}</div>
                            </div>

                            <div style={{ marginTop: 12 }}>
                                <Link to={`/projects/${pid}/tasks/${tid}/submission`} state={{ mode }} className="btn btn--primary">
                                    Edit / View my submission →
                                </Link>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}