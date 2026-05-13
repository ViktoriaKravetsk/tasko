import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../api/http'
import { submissionsApi } from '../api/submissions.api'
import { tasksApi } from '../api/tasks.api'
import type { SubmissionShort, Task } from '../api/types'

type LocationState = { mode?: 'teacher' | 'student' }

export default function TaskSubmissionsPage() {
    const { projectId, taskId } = useParams()
    const pid = Number(projectId)
    const tid = Number(taskId)
    const mode = ((useLocation().state as LocationState | null)?.mode ?? 'teacher') as 'teacher' | 'student'

    const [task, setTask] = useState<Task | null>(null)
    const [items, setItems] = useState<SubmissionShort[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearch(search.trim())
        }, 300)

        return () => window.clearTimeout(timeout)
    }, [search])

    const load = useCallback(async (searchValue?: string) => {
        setLoading(true)
        setError(null)

        try {
            const normalizedSearch = searchValue?.trim() || undefined
            const [loadedTask, list] = await Promise.all([
                tasksApi.get(pid, tid),
                submissionsApi.listByTask(pid, tid, normalizedSearch),
            ])

            setTask(loadedTask)
            setItems(list)
        } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load submissions'))
        } finally {
            setLoading(false)
        }
    }, [pid, tid])

    useEffect(() => {
        void load(debouncedSearch)
    }, [load, debouncedSearch])

    const submittedCount = useMemo(() => items.filter((item) => item.status !== 'NOT_SUBMITTED').length, [items])
    const gradedCount = useMemo(() => items.filter((item) => item.status === 'GRADED').length, [items])
    const pendingCount = Math.max(submittedCount - gradedCount, 0)
    const missingCount = Math.max(items.length - submittedCount, 0)

    return (
        <div className="page-wrap page-stack submissions-page">
            <header className="submissions-topline">
                <Link to={`/projects/${pid}/tasks/${tid}`} state={{ mode }} className="project-detail-back">
                    <span aria-hidden="true">&lt;-</span>
                    <span>Back to task</span>
                </Link>

                <button className="btn btn--ghost" onClick={() => void load(debouncedSearch)} disabled={loading} type="button">
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </header>

            {error ? <div className="alert alert--error">{error}</div> : null}

            <section className="submissions-hero">
                <div className="submissions-hero__copy">
                    <h1 className="submissions-hero__title">Submissions</h1>
                    <p className="submissions-hero__text">
                        {task?.title ?? 'Task submissions'}
                    </p>
                </div>

                <div className="submissions-stats" aria-label="Submission summary">
                    <span>
                        <strong>{items.length}</strong>
                        <span>Students</span>
                    </span>
                    <span>
                        <strong>{pendingCount}</strong>
                        <span>Need review</span>
                    </span>
                    <span>
                        <strong>{gradedCount}</strong>
                        <span>Graded</span>
                    </span>
                    <span>
                        <strong>{missingCount}</strong>
                        <span>No work</span>
                    </span>
                </div>
            </section>

            <section className="submissions-panel">
                <div className="submissions-toolbar">
                    <div className="my-projects-panel-search">
                        <span className="my-projects-search__icon" aria-hidden="true" />
                        <input
                            className="inp my-projects-search__input"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search student by name..."
                        />

                        {loading ? <span className="my-projects-search-status">Updating</span> : null}

                        {search.trim() ? (
                            <button type="button" className="btn btn--ghost" onClick={() => setSearch('')}>
                                Clear
                            </button>
                        ) : null}
                    </div>
                </div>

                {!loading && items.length === 0 ? (
                    <div className="empty project-empty-state">
                        <div className="empty-icon">SB</div>
                        <div className="empty-text">No students found</div>
                        <div className="empty-sub">
                            {debouncedSearch ? 'Try another student name.' : 'Students have not submitted work for this task yet.'}
                        </div>
                    </div>
                ) : null}

                {items.length > 0 ? (
                    <div className="submissions-list">
                        {items.map((submission) => (
                            <article
                                key={`${submission.studentId}-${submission.id ?? 'none'}`}
                                className={getCardClassName(submission)}
                            >
                                <div className="submission-review-card__avatar" aria-hidden="true">
                                    {getInitials(submission.studentName)}
                                </div>

                                <div className="submission-review-card__main">
                                    <div className="submission-review-card__top">
                                        <div>
                                            <h2>{submission.studentName ?? 'Unknown student'}</h2>
                                            <div className="submission-review-card__sub">
                                                {submission.id != null ? `Submission #${submission.id}` : 'Waiting for student work'}
                                            </div>
                                        </div>
                                        <span className={getStatusClassName(submission.status)}>
                                            {getStatusLabel(submission.status)}
                                        </span>
                                    </div>

                                    <div className="submission-review-card__meta">
                                        <span>Submitted: {formatDateTime(submission.submittedAt)}</span>
                                        <span className={submission.late ? 'submission-chip--late' : ''}>
                                            Late: {submission.late ? 'Yes' : 'No'}
                                        </span>
                                        <span>AI: {getAiLabel(submission)}</span>
                                        <span>Score: {getScoreLabel(submission)}</span>
                                    </div>
                                </div>

                                <div className="submission-review-card__actions">
                                    {submission.id != null ? (
                                        <Link
                                            to={`/projects/${pid}/tasks/${tid}/submissions/${submission.id}`}
                                            state={{ mode }}
                                            className="btn btn--primary"
                                        >
                                            {submission.status === 'GRADED' ? 'Review grade' : 'Grade'}
                                        </Link>
                                    ) : (
                                        <span className="submission-review-card__empty">No work</span>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                ) : null}
            </section>
        </div>
    )
}

function getStatusClassName(status?: SubmissionShort['status']) {
    if (status === 'GRADED') return 'status-pill st-done'
    if (status === 'SUBMITTED') return 'status-pill st-open'
    return 'status-pill'
}

function getStatusLabel(status?: SubmissionShort['status']) {
    if (status === 'GRADED') return 'Graded'
    if (status === 'SUBMITTED') return 'Submitted'
    return 'Not submitted'
}

function getCardClassName(submission: SubmissionShort) {
    if (submission.status === 'GRADED') return 'submission-review-card submission-review-card--graded'
    if (submission.status === 'SUBMITTED') return 'submission-review-card submission-review-card--submitted'
    return 'submission-review-card submission-review-card--missing'
}

function getAiLabel(submission: SubmissionShort) {
    if (submission.status === 'NOT_SUBMITTED') return '-'
    if (submission.aiStatus === 'DONE') return submission.aiScore != null ? `Done (${submission.aiScore})` : 'Done'
    if (submission.aiStatus === 'FAILED') return 'Failed'
    if (submission.aiStatus === 'DISABLED') return 'Disabled'
    return 'Pending'
}

function getScoreLabel(submission: SubmissionShort) {
    if (submission.status === 'NOT_SUBMITTED') return '-'
    return submission.teacherScore ?? 'Needs grade'
}

function getInitials(name?: string | null) {
    const words = name?.trim().split(/\s+/).filter(Boolean) ?? []
    if (words.length === 0) return 'ST'

    return words
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? '')
        .join('')
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
