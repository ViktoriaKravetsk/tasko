import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { Submission, Task } from '../api/types'
import { submissionsApi } from '../api/submissions.api'
import { tasksApi } from '../api/tasks.api'

type Mode = 'teacher' | 'student'
type LocationState = { mode?: Mode }

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

    const submissionStatus =
        mySubmission == null ? 'NOT_SUBMITTED' : mySubmission.teacherScore == null ? 'SUBMITTED' : 'GRADED'
    const resubmissionAfterGradeAllowed = task?.allowResubmissionAfterGrade !== false
    const isResubmissionLocked =
        !isTeacher && mySubmission?.teacherScore != null && !resubmissionAfterGradeAllowed

    async function load() {
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
                } catch (e: any) {
                    if (e?.status === 404) {
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
        } catch (e: any) {
            setError(e?.message ?? e?.response?.data?.message ?? 'Failed to load task')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()
    }, [pid, tid, isTeacher])

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
        } catch (e: any) {
            setError(e?.message ?? e?.response?.data?.message ?? 'Failed to submit answer')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="page-wrap page-stack">
            <div className="section-top section-top--with-links">
                <Link
                    to={`/projects/${pid}`}
                    state={{ mode }}
                    className="btn btn--ghost"
                    style={{ textDecoration: 'none' }}
                >
                    ← Back to project
                </Link>

                <div className="section-actions">
                    <button
                        className="btn"
                        onClick={() => void load()}
                        disabled={loading || saving}
                        type="button"
                    >
                        {loading ? 'Loading…' : 'Refresh'}
                    </button>

                    {isTeacher ? (
                        <Link
                            to={`/projects/${pid}/tasks/${tid}/submissions`}
                            state={{ mode }}
                            className="btn btn--primary"
                            style={{ textDecoration: 'none' }}
                        >
                            Review submissions →
                        </Link>
                    ) : null}
                </div>
            </div>

            {error ? (
                <div className="alert alert--error">
                    {error}
                </div>
            ) : null}

            {success ? (
                <div className="alert">
                    {success}
                </div>
            ) : null}

            {loading ? (
                <div className="empty">
                    <div className="empty-icon">⏳</div>
                    <div className="empty-text">Loading…</div>
                </div>
            ) : null}

            {task ? (
                <>
                    <section className="panel">
                        <div className="panel-body">
                            <div className="task-detail-layout">
                                <div>
                                    <h1 className="task-detail-title">{task.title}</h1>

                                    <p className="task-detail-description">
                                        {task.description || 'No description'}
                                    </p>
                                </div>

                                <div className="task-detail-side">
                                    <span className="meta-pill">
                                        📅 {task.deadline || 'No deadline'}
                                    </span>

                                    <span className="meta-pill">
                                        Max: {task.maxScore}
                                    </span>

                                    <span className="meta-pill">
                                        Resubmission: {resubmissionAfterGradeAllowed ? 'allowed' : 'locked after grading'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {!isTeacher ? (
                        <section className="panel">
                            <div className="panel-body">
                                <div
                                    className="section-top section-top--with-links"
                                    style={{ marginBottom: 18 }}
                                >
                                    <div>
                                        <h2 style={{ margin: 0 }}>Your submission</h2>
                                        <div className="panel-sub">
                                            Write your answer, then submit it to your teacher.
                                        </div>
                                    </div>

                                    <span
                                        className={
                                            submissionStatus === 'GRADED'
                                                ? 'badge badge--mint'
                                                : 'badge badge--pink'
                                        }
                                    >
                                        {submissionStatus}
                                    </span>
                                </div>

                                {isResubmissionLocked ? (
                                    <div className="alert alert--error" style={{ marginBottom: 14 }}>
                                        This submission has been graded. Resubmission is disabled for this task.
                                    </div>
                                ) : mySubmission?.teacherScore != null ? (
                                    <div className="alert" style={{ marginBottom: 14 }}>
                                        Updating this submission will send it for review again.
                                    </div>
                                ) : null}

                                <label className="tasko-field">
                                    <span>Text answer</span>
                                    <textarea
                                        className="inp submission-textarea"
                                        value={textAnswer}
                                        onChange={(e) => setTextAnswer(e.target.value)}
                                        placeholder="Write your answer here..."
                                        disabled={loading || saving || isResubmissionLocked}
                                    />
                                </label>

                                <label className="tasko-field" style={{ marginTop: 14 }}>
                                    <span>File link</span>
                                    <input
                                        className="inp"
                                        value={fileLink}
                                        onChange={(e) => setFileLink(e.target.value)}
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
                                        {saving
                                            ? 'Saving…'
                                            : mySubmission
                                                ? 'Update submission →'
                                                : 'Submit answer →'}
                                    </button>
                                </div>

                                <div className="submission-meta">
                                    <div>Submitted at: {formatDateTime(mySubmission?.submittedAt)}</div>

                                    <div>Teacher score: {mySubmission?.teacherScore ?? '—'}</div>
                                    <div>Teacher comment: {mySubmission?.teacherComment ?? '—'}</div>

                                    <div>AI status: {getAiStatusLabel(mySubmission)}</div>
                                    <div>AI score: {getAiScore(mySubmission)}</div>
                                    <div>AI comment: {getAiComment(mySubmission)}</div>
                                    {mySubmission?.aiErrorMessage ? (
                                        <div>AI note: {mySubmission.aiErrorMessage}</div>
                                    ) : null}
                                </div>
                            </div>
                        </section>
                    ) : null}
                </>
            ) : null}
        </div>
    )
}

function formatDateTime(value?: string | null) {
    if (!value) return '—'

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
    if (!submission) return '—'
    if (getAiStatus(submission) !== 'DONE') return '—'

    const s = submission as any

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
        '—'
    )
}

function getAiComment(submission: Submission | null) {
    if (!submission) return '—'
    if (getAiStatus(submission) !== 'DONE') return '—'

    const s = submission as any

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
        '—'
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
