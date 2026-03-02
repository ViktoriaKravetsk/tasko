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
        if (isTeacher) return
        void load()
    }, [pid, tid, isTeacher])

    if (isTeacher) {
        return (
            <div className="card">
                <h1>Not available</h1>
                <div className="small">Teachers don’t have “My submission”.</div>
                <div style={{ marginTop: 12 }}>
                    <Link to={`/projects/${pid}/tasks/${tid}`} state={{ mode }} className="btn btn--ghost">
                        ← Back
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <Link to={`/projects/${pid}/tasks/${tid}`} state={{ mode }} className="btn btn--ghost">
                    ← Back to task
                </Link>

                <button className="btn" onClick={() => void load()} disabled={loading || saving}>
                    {loading ? 'Loading…' : 'Refresh'}
                </button>
            </div>

            <div style={{ marginTop: 14 }}>
                <h1>My submission</h1>
                {task ? <div className="small">{task.title}</div> : null}
            </div>

            {error ? (
                <div className="card card--soft" style={{ marginTop: 12 }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 11 }}>Error</div>
                    <div className="small">{error}</div>
                </div>
            ) : null}

            {loading ? <div className="small" style={{ marginTop: 10 }}>Loading…</div> : null}

            <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                <div className="card card--soft">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                        <h2>Work</h2>
                        <span className={submissionStatus === 'GRADED' ? 'badge badge--mint' : 'badge badge--pink'}>
                            {submissionStatus}
                        </span>
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
        </div>
    )
}