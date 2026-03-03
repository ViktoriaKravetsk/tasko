import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { Submission, Task } from '../api/types'
import { submissionsApi } from '../api/submissions.api'
import { tasksApi } from '../api/tasks.api'

type LocationState = { mode?: 'teacher' | 'student' }

export default function MySubmissionPage() {
    const { projectId, taskId } = useParams()
    const pid = Number(projectId)
    const tid = Number(taskId)

    const mode = ((useLocation().state as LocationState | null)?.mode ?? 'student') as 'teacher' | 'student'
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

            const s = await submissionsApi.my(pid, tid)
            setMySubmission(s)
            setTextAnswer(s?.textAnswer ?? '')
            setFileLink(s?.fileLink ?? '')
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load submission')
        } finally {
            setLoading(false)
        }
    }

    async function onSubmit() {
        setSaving(true)
        setError(null)
        try {
            const saved = await submissionsApi.submit(pid, tid, {
                textAnswer: textAnswer.trim() || null,
                fileLink: fileLink.trim() || null,
            })
            setMySubmission(saved)
        } catch (e: any) {
            setError(e?.message ?? 'Failed to submit')
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        if (isTeacher) return
        void load()
    }, [pid, tid, isTeacher])

    if (isTeacher) {
        return (
            <div className="card">
                <h1>Not available</h1>
                <div className="small">Teachers don’t have “My submission”.</div>
            </div>
        )
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to={`/projects/${pid}/tasks/${tid}`} state={{ mode }} className="btn btn--ghost">
                    ← Back
                </Link>

                <button className="btn" onClick={() => void load()} disabled={loading || saving}>
                    Refresh
                </button>
            </div>

            <h1 style={{ marginTop: 16 }}>My submission</h1>
            {task && <div className="small">{task.title}</div>}

            {error && <div className="small" style={{ color: 'red' }}>{error}</div>}
            {loading && <div className="small">Loading…</div>}

            <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
                <div className="card card--soft">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h2>Work</h2>
                        <span>{submissionStatus}</span>
                    </div>

                    <textarea
                        className="input"
                        placeholder="Text answer"
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                    />

                    <input
                        className="input"
                        placeholder="File link"
                        value={fileLink}
                        onChange={(e) => setFileLink(e.target.value)}
                    />

                    <button className="btn btn--primary" onClick={onSubmit} disabled={saving}>
                        {saving ? 'Saving…' : mySubmission ? 'Update submission' : 'Submit'}
                    </button>
                </div>

                <div className="card">
                    <h2>Status</h2>
                    <div className="small">
                        <div>Submitted at: {mySubmission?.submittedAt ?? '—'}</div>
                        <div>Teacher score: {mySubmission?.teacherScore ?? '—'}</div>
                        {mySubmission?.teacherComment && (
                            <div>Teacher comment: {mySubmission.teacherComment}</div>
                        )}
                    </div>
                </div>

                <div className="card card--soft">
                    <h2>🤖 AI Evaluation</h2>

                    {!mySubmission && <div className="small">No submission yet.</div>}

                    {mySubmission && !mySubmission.aiEvaluatedAt && (
                        <div className="small">AI is evaluating...</div>
                    )}

                    {mySubmission && mySubmission.aiEvaluatedAt && (
                        <>
                            <div>
                                AI score: <strong>{mySubmission.aiScore ?? 0}</strong>
                            </div>
                            {mySubmission.aiComment && (
                                <div className="small" style={{ whiteSpace: 'pre-wrap' }}>
                                    {mySubmission.aiComment}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}