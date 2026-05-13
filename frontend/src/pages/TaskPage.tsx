import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { Submission, Task } from '../api/types'
import { getApiErrorMessage, getApiErrorStatus } from '../api/http'
import { submissionsApi } from '../api/submissions.api'
import { tasksApi } from '../api/tasks.api'
import TaskEditModal from './TaskEditModal'

type Mode = 'teacher' | 'student'
type LocationState = { mode?: Mode }
type SubmissionWithAiAliases = Submission & {
    ai_score?: number | null
    aiGrade?: number | null
    ai_grade?: number | null
    aiEvaluationScore?: number | null
    ai_evaluation_score?: number | null
    aiMark?: number | null
    ai_mark?: number | null
    aiTeacherScore?: number | null
    ai_teacher_score?: number | null
    ai_comment?: string | null
    aiFeedback?: string | null
    ai_feedback?: string | null
    aiEvaluation?: string | null
    ai_evaluation?: string | null
    aiExplanation?: string | null
    ai_explanation?: string | null
    aiTeacherComment?: string | null
    ai_teacher_comment?: string | null
}

export default function TaskPage() {
    const { projectId, taskId } = useParams()
    const pid = projectId ? Number(projectId) : NaN
    const tid = taskId ? Number(taskId) : NaN

    const mode = ((useLocation().state as LocationState | null)?.mode ?? 'student') as Mode
    const isTeacher = useMemo(() => mode === 'teacher', [mode])

    const [task, setTask] = useState<Task | null>(null)
    const [mySubmission, setMySubmission] = useState<Submission | null>(null)
    const [textAnswer, setTextAnswer] = useState('')
    const [fileLink, setFileLink] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [editOpen, setEditOpen] = useState(false)

    const submissionStatus =
        mySubmission == null ? 'NOT_SUBMITTED' : mySubmission.teacherScore == null ? 'SUBMITTED' : 'GRADED'
    const resubmissionAfterGradeAllowed = task?.allowResubmissionAfterGrade !== false
    const isResubmissionLocked =
        !isTeacher && mySubmission?.teacherScore != null && !resubmissionAfterGradeAllowed

    const load = useCallback(async () => {
        if (!Number.isFinite(pid) || !Number.isFinite(tid)) {
            setError('Invalid task link')
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const loadedTask = await tasksApi.get(pid, tid)
            setTask(loadedTask)

            if (!isTeacher) {
                try {
                    const loadedSubmission = await submissionsApi.my(pid, tid)

                    setMySubmission(loadedSubmission)
                    setTextAnswer(loadedSubmission?.textAnswer ?? '')
                    setFileLink(loadedSubmission?.fileLink ?? '')
                } catch (e) {
                    if (getApiErrorStatus(e) === 404) {
                        setMySubmission(null)
                        setTextAnswer('')
                        setFileLink('')
                        return
                    }

                    throw e
                }
            } else {
                setMySubmission(null)
                setTextAnswer('')
                setFileLink('')
            }
        } catch (e) {
            setError(getApiErrorMessage(e, 'Failed to load task'))
        } finally {
            setLoading(false)
        }
    }, [pid, tid, isTeacher])

    useEffect(() => {
        void load()
    }, [load])

    async function submitAnswer() {
        if (!Number.isFinite(pid) || !Number.isFinite(tid)) return

        const normalizedTextAnswer = textAnswer.trim()
        const normalizedFileLink = fileLink.trim()

        if (!normalizedTextAnswer && !normalizedFileLink) {
            setError('Write an answer or add a file link before submitting.')
            return
        }

        if (
            mySubmission &&
            isSameSubmissionContent(
                mySubmission,
                normalizedTextAnswer || null,
                normalizedFileLink || null
            )
        ) {
            setError(null)
            setSuccess('No changes to update.')
            return
        }

        if (isResubmissionLocked) {
            setSuccess(null)
            setError('This submission has already been graded. Resubmission is disabled for this task.')
            return
        }

        const hadSubmission = mySubmission != null
        const wasGraded = mySubmission?.teacherScore != null

        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            const savedSubmission = await submissionsApi.submit(pid, tid, {
                textAnswer: normalizedTextAnswer || null,
                fileLink: normalizedFileLink || null,
            })

            setMySubmission(savedSubmission)
            setTextAnswer(savedSubmission.textAnswer ?? normalizedTextAnswer)
            setFileLink(savedSubmission.fileLink ?? normalizedFileLink)
            setSuccess(
                !hadSubmission
                    ? 'Submission sent.'
                    : wasGraded
                        ? 'Submission updated and sent for review again.'
                        : 'Submission updated.'
            )
        } catch (e) {
            setError(getApiErrorMessage(e, 'Failed to submit answer'))
        } finally {
            setSaving(false)
        }
    }

    const handleTaskUpdated = (updatedTask: Task) => {
        setTask(updatedTask)
        setEditOpen(false)
        setError(null)
        setSuccess('Task updated.')
    }

    return (
        <div className="page-wrap page-stack task-detail-page">
            <header className="task-detail-topline">
                <Link to={`/projects/${pid}`} state={{ mode }} className="project-detail-back">
                    <span aria-hidden="true">&lt;-</span>
                    <span>Back to project</span>
                </Link>

                <div className="task-detail-topline__actions">
                    <button className="btn btn--ghost" onClick={() => void load()} disabled={loading || saving} type="button">
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>

                    {isTeacher && task ? (
                        <>
                            <button
                                className="btn btn--ghost"
                                onClick={() => setEditOpen(true)}
                                disabled={loading || saving}
                                type="button"
                            >
                                Edit task
                            </button>

                            <Link
                                to={`/projects/${pid}/tasks/${tid}/submissions`}
                                state={{ mode }}
                                className="btn btn--primary"
                            >
                                Review submissions
                            </Link>
                        </>
                    ) : null}
                </div>
            </header>

            {error ? <div className="alert alert--error">{error}</div> : null}
            {success ? <div className="alert">{success}</div> : null}

            {loading ? (
                <div className="empty task-detail-empty">
                    <div className="empty-icon">...</div>
                    <div className="empty-text">Loading...</div>
                </div>
            ) : null}

            {task ? (
                <>
                    <section className="task-detail-hero">
                        <div className="task-detail-hero__main">
                            <div className="tasko-hub__eyebrow">{isTeacher ? 'Created task' : 'Project task'}</div>
                            <h1 className="task-detail-title">{task.title}</h1>
                            <p className="task-detail-description">{task.description || 'No description'}</p>
                        </div>

                        <aside className="task-detail-summary" aria-label="Task summary">
                            <div className="task-detail-summary__row">
                                <span>Deadline</span>
                                <strong>{task.deadline || 'No deadline'}</strong>
                            </div>
                            <div className="task-detail-summary__row">
                                <span>Max score</span>
                                <strong>{task.maxScore}</strong>
                            </div>
                            <div className="task-detail-summary__row">
                                <span>Resubmission</span>
                                <strong>{resubmissionAfterGradeAllowed ? 'Allowed' : 'Locked after grading'}</strong>
                            </div>
                        </aside>
                    </section>

                    {!isTeacher ? (
                        <section className="task-submission-panel">
                            <div className="task-submission-panel__head">
                                <div>
                                    <div className="task-submission-panel__title">Your submission</div>
                                    <p className="task-submission-panel__text">
                                        Write your answer or attach a file link, then submit it to your teacher.
                                    </p>
                                </div>

                                <span className={submissionStatus === 'GRADED' ? 'badge badge--mint' : 'badge badge--pink'}>
                                    {submissionStatus}
                                </span>
                            </div>

                            {isResubmissionLocked ? (
                                <div className="alert alert--error">
                                    This submission has been graded. Resubmission is disabled for this task.
                                </div>
                            ) : mySubmission?.teacherScore != null ? (
                                <div className="alert">
                                    Updating this submission will send it for review again.
                                </div>
                            ) : null}

                            <label className="tasko-field">
                                <span>Text answer</span>
                                <textarea
                                    className="inp submission-textarea"
                                    value={textAnswer}
                                    onChange={(event) => setTextAnswer(event.target.value)}
                                    placeholder="Write your answer here..."
                                    disabled={loading || saving || isResubmissionLocked}
                                />
                            </label>

                            <label className="tasko-field">
                                <span>File link</span>
                                <input
                                    className="inp"
                                    value={fileLink}
                                    onChange={(event) => setFileLink(event.target.value)}
                                    placeholder="Paste a file link here..."
                                    disabled={loading || saving || isResubmissionLocked}
                                />
                            </label>

                            <div className="submission-actions">
                                <button
                                    className="btn btn--primary"
                                    type="button"
                                    onClick={submitAnswer}
                                    disabled={loading || saving || isResubmissionLocked || (!textAnswer.trim() && !fileLink.trim())}
                                >
                                    {saving ? 'Saving...' : mySubmission ? 'Update submission' : 'Submit answer'}
                                </button>
                            </div>

                            <div className="submission-meta-grid">
                                <div>
                                    <span>Submitted at</span>
                                    <strong>{formatDateTime(mySubmission?.submittedAt)}</strong>
                                </div>
                                <div>
                                    <span>Teacher score</span>
                                    <strong>{mySubmission?.teacherScore ?? '-'}</strong>
                                </div>
                                <div>
                                    <span>Teacher comment</span>
                                    <strong>{mySubmission?.teacherComment ?? '-'}</strong>
                                </div>
                                <div>
                                    <span>AI status</span>
                                    <strong>{getAiStatusLabel(mySubmission)}</strong>
                                </div>
                                <div>
                                    <span>AI score</span>
                                    <strong>{getAiScore(mySubmission)}</strong>
                                </div>
                                <div>
                                    <span>AI comment</span>
                                    <strong>{getAiComment(mySubmission)}</strong>
                                </div>
                                {mySubmission?.aiErrorMessage ? (
                                    <div>
                                        <span>AI note</span>
                                        <strong>{mySubmission.aiErrorMessage}</strong>
                                    </div>
                                ) : null}
                            </div>
                        </section>
                    ) : null}
                </>
            ) : null}

            <TaskEditModal
                open={editOpen}
                projectId={pid}
                task={task}
                onClose={() => setEditOpen(false)}
                onUpdated={handleTaskUpdated}
            />
        </div>
    )
}

function formatDateTime(value?: string | null) {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}

function isSameSubmissionContent(
    submission: Submission,
    textAnswer: string | null,
    fileLink: string | null
) {
    return normalizeOptional(submission.textAnswer) === textAnswer
        && normalizeOptional(submission.fileLink) === fileLink
}

function normalizeOptional(value?: string | null) {
    const normalized = value?.trim() ?? ''
    return normalized ? normalized : null
}

function getAiScore(submission: Submission | null) {
    if (!submission) return '-'
    if (getAiStatus(submission) !== 'DONE') return '-'

    const s = submission as SubmissionWithAiAliases

    return (
        s.aiScore ??
        s.ai_score ??
        s.aiGrade ??
        s.ai_grade ??
        s.aiEvaluationScore ??
        s.ai_evaluation_score ??
        s.aiMark ??
        s.ai_mark ??
        s.aiTeacherScore ??
        s.ai_teacher_score ??
        '-'
    )
}

function getAiComment(submission: Submission | null) {
    if (!submission) return '-'
    if (getAiStatus(submission) !== 'DONE') return '-'

    const s = submission as SubmissionWithAiAliases

    return (
        s.aiComment ??
        s.ai_comment ??
        s.aiFeedback ??
        s.ai_feedback ??
        s.aiEvaluation ??
        s.ai_evaluation ??
        s.aiExplanation ??
        s.ai_explanation ??
        s.aiTeacherComment ??
        s.ai_teacher_comment ??
        '-'
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
