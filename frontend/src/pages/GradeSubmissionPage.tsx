import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { Submission, Task } from '../api/types'
import { submissionsApi } from '../api/submissions.api'
import { tasksApi } from '../api/tasks.api'
import { getApiErrorMessage } from '../api/http'

type LocationState = { mode?: 'teacher' | 'student' }

export default function GradeSubmissionPage() {
    const { projectId, taskId, submissionId } = useParams()

    const pid = Number(projectId)
    const tid = Number(taskId)
    const sid = Number(submissionId)
    const mode = ((useLocation().state as LocationState | null)?.mode ?? 'teacher') as 'teacher' | 'student'

    const [task, setTask] = useState<Task | null>(null)
    const [submission, setSubmission] = useState<Submission | null>(null)
    const [teacherScore, setTeacherScore] = useState<number>(0)
    const [teacherComment, setTeacherComment] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const teacherScoreError =
        !Number.isFinite(teacherScore)
            ? 'Score must be a number.'
            : !Number.isInteger(teacherScore)
                ? 'Score must be a whole number.'
                : teacherScore < 0
                    ? 'Score must be at least 0.'
                    : task && teacherScore > task.maxScore
                        ? `Score must be <= ${task.maxScore}.`
                        : null
    const canSaveGrade = task != null && !saving && !loading && teacherScoreError == null

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const [loadedTask, loadedSubmission] = await Promise.all([
                tasksApi.get(pid, tid),
                submissionsApi.getById(pid, tid, sid),
            ])

            setTask(loadedTask)
            setSubmission(loadedSubmission)
            setTeacherScore(loadedSubmission.teacherScore ?? 0)
            setTeacherComment(loadedSubmission.teacherComment ?? '')
        } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load submission'))
        } finally {
            setLoading(false)
        }
    }, [pid, tid, sid])

    useEffect(() => {
        if (mode !== 'teacher') return
        void load()
    }, [load, mode])

    async function onGrade() {
        if (!task) return
        if (teacherScoreError) {
            setSuccess(null)
            setError(teacherScoreError)
            return
        }

        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            const updated = await submissionsApi.grade(pid, tid, sid, {
                teacherScore,
                teacherComment: teacherComment.trim() || null,
            })

            setSubmission(updated)
            setSuccess('Grade saved.')
        } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to grade'))
        } finally {
            setSaving(false)
        }
    }

    async function reEvaluateAi() {
        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            const updated = await submissionsApi.reEvaluateAi(pid, tid, sid)
            setSubmission(updated)
            await load()
            setSuccess('AI evaluation queued.')
        } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to re-evaluate AI'))
        } finally {
            setSaving(false)
        }
    }

    if (mode !== 'teacher') {
        return (
            <div className="page-wrap page-stack submissions-page">
                <div className="empty">
                    <div className="empty-icon">NO</div>
                    <div className="empty-text">Not available</div>
                    <div className="empty-sub">Only teachers can grade submissions.</div>
                </div>
            </div>
        )
    }

    return (
        <div className="page-wrap page-stack grade-page">
            <header className="submissions-topline">
                <Link to={`/projects/${pid}/tasks/${tid}/submissions`} state={{ mode }} className="project-detail-back">
                    <span aria-hidden="true">&lt;-</span>
                    <span>Back to submissions</span>
                </Link>

                <button className="btn btn--ghost" onClick={() => void load()} disabled={loading || saving} type="button">
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </header>

            {error ? <div className="alert alert--error">{error}</div> : null}
            {success ? <div className="alert">{success}</div> : null}

            <section className="submissions-hero grade-hero">
                <div className="submissions-hero__copy">
                    <div className="tasko-hub__eyebrow">Teacher grading</div>
                    <h1 className="submissions-hero__title">Grade submission</h1>
                    <p className="submissions-hero__text">
                        {submission?.studentName ? `${submission.studentName} - ${task?.title ?? 'Task'}` : task?.title ?? 'Submission review'}
                    </p>
                </div>

                <div className="submissions-stats" aria-label="Grade summary">
                    <span>
                        <strong>{submission?.teacherScore ?? '-'}</strong>
                        <span>Current score</span>
                    </span>
                    <span>
                        <strong>{task?.maxScore ?? '-'}</strong>
                        <span>Max score</span>
                    </span>
                    <span>
                        <strong>{getAiStatusLabel(submission)}</strong>
                        <span>AI status</span>
                    </span>
                </div>
            </section>

            {loading ? (
                <div className="empty">
                    <div className="empty-icon">...</div>
                    <div className="empty-text">Loading...</div>
                </div>
            ) : null}

            {task && submission ? (
                <div className="grade-layout">
                    <main className="grade-main">
                        <section className="grade-panel">
                            <div className="grade-panel__title">Task condition</div>
                            <h2>{task.title}</h2>
                            <p>{task.description?.trim() || 'No description provided.'}</p>
                            <div className="submission-review-card__meta">
                                <span>Deadline: {task.deadline || 'No deadline'}</span>
                                <span>Max score: {task.maxScore}</span>
                            </div>
                        </section>

                        <section className="grade-panel">
                            <div className="grade-panel__title">Student work</div>
                            <div className="grade-answer">
                                {submission.textAnswer || 'No text answer.'}
                            </div>

                            {submission.fileLink ? (
                                <a className="grade-file-link" href={submission.fileLink} target="_blank" rel="noreferrer">
                                    Open attached file
                                </a>
                            ) : null}
                        </section>

                        <section className="grade-panel">
                            <div className="grade-panel__title">AI evaluation</div>
                            <div className="submission-review-card__meta">
                                <span>Status: {getAiStatusLabel(submission)}</span>
                                <span>Suggested score: {getAiStatus(submission) === 'DONE' ? submission.aiScore ?? '-' : '-'}</span>
                            </div>

                            {getAiStatus(submission) === 'PENDING' ? (
                                <p>AI is evaluating this submission.</p>
                            ) : null}

                            {getAiStatus(submission) === 'DONE' && submission.aiComment ? (
                                <div className="grade-answer grade-answer--soft">{submission.aiComment}</div>
                            ) : null}

                            {(getAiStatus(submission) === 'FAILED' || getAiStatus(submission) === 'DISABLED') ? (
                                <div className="alert alert--error">
                                    {submission.aiErrorMessage ?? 'AI evaluation is not available.'}
                                </div>
                            ) : null}

                            <button
                                className="btn btn--ghost"
                                onClick={reEvaluateAi}
                                disabled={saving || getAiStatus(submission) === 'PENDING'}
                                type="button"
                            >
                                Re-evaluate AI
                            </button>
                        </section>
                    </main>

                    <aside className="grade-sidebar">
                        <section className="grade-panel grade-panel--sticky">
                            <div className="grade-panel__title">Teacher grading</div>

                            <label className="tasko-field">
                                <span>Score</span>
                                <input
                                    type="number"
                                    className="inp"
                                    min={0}
                                    max={task.maxScore}
                                    step={1}
                                    value={teacherScore}
                                    onChange={(event) => {
                                        const value = event.currentTarget.valueAsNumber
                                        setTeacherScore(Number.isNaN(value) ? 0 : value)
                                    }}
                                />
                            </label>

                            {teacherScoreError ? <div className="field-error">{teacherScoreError}</div> : null}

                            <label className="tasko-field">
                                <span>Teacher comment</span>
                                <textarea
                                    className="inp"
                                    placeholder="Write feedback for the student"
                                    value={teacherComment}
                                    onChange={(event) => setTeacherComment(event.target.value)}
                                />
                            </label>

                            <button className="btn btn--primary" onClick={onGrade} disabled={!canSaveGrade} type="button">
                                {saving ? 'Saving...' : 'Save grade'}
                            </button>
                        </section>
                    </aside>
                </div>
            ) : null}
        </div>
    )
}

function getAiStatus(submission: Submission | null) {
    if (!submission) return 'PENDING'
    if (submission.aiStatus) return submission.aiStatus
    return submission.aiEvaluatedAt ? 'DONE' : 'PENDING'
}

function getAiStatusLabel(submission: Submission | null) {
    switch (getAiStatus(submission)) {
        case 'DONE':
            return 'Done'
        case 'FAILED':
            return 'Failed'
        case 'DISABLED':
            return 'Disabled'
        case 'PENDING':
        default:
            return 'Pending'
    }
}
