import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage, getApiErrorStatus } from '../api/http'
import { submissionsApi } from '../api/submissions.api'
import { tasksApi } from '../api/tasks.api'
import type { Submission, Task } from '../api/types'

export default function MySubmissionPage() {
    const { projectId, taskId } = useParams()
    const pid = Number(projectId)
    const tid = Number(taskId)

    const [task, setTask] = useState<Task | null>(null)
    const [submission, setSubmission] = useState<Submission | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadSubmission = useCallback(async () => {
        if (!Number.isFinite(pid) || !Number.isFinite(tid)) return

        setLoading(true)
        setError(null)

        try {
            const loadedTask = await tasksApi.get(pid, tid)
            setTask(loadedTask)

            try {
                const loadedSubmission = await submissionsApi.my(pid, tid)
                setSubmission(loadedSubmission)
            } catch (error) {
                if (getApiErrorStatus(error) === 404) {
                    setSubmission(null)
                    return
                }

                throw error
            }
        } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load submission'))
        } finally {
            setLoading(false)
        }
    }, [pid, tid])

    useEffect(() => {
        void loadSubmission()
    }, [loadSubmission])

    return (
        <div className="page-wrap page-stack submissions-page">
            <header className="submissions-topline">
                <Link to={`/projects/${pid}/tasks/${tid}`} state={{ mode: 'student' }} className="project-detail-back">
                    <span aria-hidden="true">&lt;-</span>
                    <span>Back to task</span>
                </Link>

                <button className="btn btn--ghost" onClick={() => void loadSubmission()} disabled={loading} type="button">
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </header>

            {error ? <div className="alert alert--error">{error}</div> : null}

            <section className="submissions-hero">
                <div className="submissions-hero__copy">
                    <div className="tasko-hub__eyebrow">My work</div>
                    <h1 className="submissions-hero__title">My submission</h1>
                    <p className="submissions-hero__text">{task?.title ?? 'Submission details'}</p>
                </div>

                <div className="submissions-stats" aria-label="Submission summary">
                    <span>
                        <strong>{submission ? getSubmissionStatus(submission) : 'Not sent'}</strong>
                        <span>Status</span>
                    </span>
                    <span>
                        <strong>{submission?.teacherScore ?? '-'}</strong>
                        <span>Teacher score</span>
                    </span>
                    <span>
                        <strong>{submission?.aiScore ?? '-'}</strong>
                        <span>AI score</span>
                    </span>
                </div>
            </section>

            {loading ? (
                <div className="empty">
                    <div className="empty-icon">...</div>
                    <div className="empty-text">Loading...</div>
                </div>
            ) : null}

            {!loading && !submission ? (
                <div className="empty">
                    <div className="empty-icon">NS</div>
                    <div className="empty-text">No submission yet</div>
                    <div className="empty-sub">Submit your answer from the task page.</div>
                </div>
            ) : null}

            {submission ? (
                <section className="grade-panel">
                    <div className="grade-panel__title">Submission details</div>

                    <div className="submission-meta-grid">
                        <div>
                            <span>Submitted at</span>
                            <strong>{formatDateTime(submission.submittedAt)}</strong>
                        </div>
                        <div>
                            <span>Late</span>
                            <strong>{submission.late ? 'Yes' : 'No'}</strong>
                        </div>
                        <div>
                            <span>Teacher score</span>
                            <strong>{submission.teacherScore ?? '-'}</strong>
                        </div>
                        <div>
                            <span>Teacher comment</span>
                            <strong>{submission.teacherComment ?? '-'}</strong>
                        </div>
                        <div>
                            <span>AI score</span>
                            <strong>{submission.aiScore ?? '-'}</strong>
                        </div>
                        <div>
                            <span>AI status</span>
                            <strong>{submission.aiStatus ?? 'PENDING'}</strong>
                        </div>
                    </div>

                    <div className="grade-answer">
                        {submission.textAnswer || 'No text answer.'}
                    </div>

                    {submission.fileLink ? (
                        <a className="grade-file-link" href={submission.fileLink} target="_blank" rel="noreferrer">
                            Open attached file
                        </a>
                    ) : null}
                </section>
            ) : null}
        </div>
    )
}

function getSubmissionStatus(submission: Submission) {
    if (submission.teacherScore != null) return 'Graded'
    return 'Submitted'
}

function formatDateTime(value?: string | null) {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return new Intl.DateTimeFormat('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}
