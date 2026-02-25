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

    const location = useLocation()
    const mode = ((location.state as LocationState | null)?.mode ?? 'student') as 'teacher' | 'student'
    const isTeacher = useMemo(() => mode === 'teacher', [mode])

    const [task, setTask] = useState<Task | null>(null)
    const [mySubmission, setMySubmission] = useState<Submission | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [textAnswer, setTextAnswer] = useState('')
    const [fileLink, setFileLink] = useState('')
    const [saving, setSaving] = useState(false)

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
                setTextAnswer(s?.textAnswer ?? '')
                setFileLink(s?.fileLink ?? '')
            }
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load task')
        } finally {
            setLoading(false)
        }
    }

    async function onSubmit() {
        setSaving(true)
        setError(null)
        try {
            const saved = await submissionsApi.submit(pid, tid, {
                textAnswer: textAnswer.trim() ? textAnswer.trim() : null,
                fileLink: fileLink.trim() ? fileLink.trim() : null,
            })
            setMySubmission(saved)
        } catch (e: any) {
            setError(e?.message ?? 'Failed to submit')
        } finally {
            setSaving(false)
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

                {isTeacher ? (
                    <Link to={`/projects/${pid}/tasks/${tid}/submissions`} state={{ mode }} className="btn btn--primary">
                        View submissions →
                    </Link>
                ) : (
                    <button className="btn" onClick={() => void load()} disabled={loading}>
                        {loading ? 'Loading…' : 'Refresh'}
                    </button>
                )}
            </div>

            <div style={{ marginTop: 14 }}>
                {error ? (
                    <div className="card card--soft">
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 11 }}>Error</div>
                        <div className="small">{error}</div>
                    </div>
                ) : null}

                {loading ? <div className="small" style={{ marginTop: 10 }}>Loading…</div> : null}

                {task ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginTop: 12 }}>
                            <div>
                                <h1>{task.title}</h1>
                                {task.description ? <div className="small">{task.description}</div> : null}
                            </div>

                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {task.deadline ? <span className="badge badge--olive">Deadline: {task.deadline}</span> : null}
                                <span className="badge">Max: {task.maxScore}</span>
                            </div>
                        </div>

                        {!isTeacher ? (
                            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                                <div className="card card--soft">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                        <h2>My submission</h2>
                                        <span className="badge">{submissionStatus}</span>
                                    </div>

                                    <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                    <textarea
                        className="input"
                        placeholder="Text answer"
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                    />
                                        <input
                                            className="input"
                                            placeholder="File link (optional)"
                                            value={fileLink}
                                            onChange={(e) => setFileLink(e.target.value)}
                                        />

                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            <button className="btn btn--primary" onClick={onSubmit} disabled={saving}>
                                                {saving ? 'Saving…' : mySubmission ? 'Update submission' : 'Submit'}
                                            </button>
                                            <button
                                                className="btn"
                                                onClick={() => {
                                                    setTextAnswer(mySubmission?.textAnswer ?? '')
                                                    setFileLink(mySubmission?.fileLink ?? '')
                                                }}
                                                disabled={saving}
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <h2>Status</h2>
                                    <div className="small" style={{ display: 'grid', gap: 6 }}>
                                        <div>Submitted at: {mySubmission?.submittedAt ?? '—'}</div>
                                        <div>Teacher score: {mySubmission?.teacherScore ?? '—'}</div>
                                        {mySubmission?.teacherComment ? <div>Teacher comment: {mySubmission.teacherComment}</div> : null}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </>
                ) : null}
            </div>
        </div>
    )
}