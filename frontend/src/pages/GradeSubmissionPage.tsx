import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { Submission, Task } from '../api/types'
import { submissionsApi } from '../api/submissions.api'
import { tasksApi } from '../api/tasks.api'

type LocationState = { mode?: 'teacher' | 'student' }

function formatTaskDeadline(deadline?: string | null) {
    if (!deadline) return null

    const date = new Date(deadline)
    if (Number.isNaN(date.getTime())) return deadline

    return date.toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
}

function getAiStatus(submission: Submission) {
    if (submission.aiStatus) return submission.aiStatus
    return submission.aiEvaluatedAt ? 'DONE' : 'PENDING'
}

function getAiStatusLabel(submission: Submission) {
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

    async function load() {
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const t = await tasksApi.get(pid, tid)
            setTask(t)

            const s = await submissionsApi.getById(pid, tid, sid)
            setSubmission(s)

            setTeacherScore(s.teacherScore ?? 0)
            setTeacherComment(s.teacherComment ?? '')
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load')
        } finally {
            setLoading(false)
        }
    }

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
        } catch (e: any) {
            setError(e?.message ?? 'Failed to grade')
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
        } catch (e: any) {
            setError(e?.message ?? 'Failed to re-evaluate AI')
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        if (mode !== 'teacher') return
        void load()
    }, [pid, tid, sid, mode])

    if (mode !== 'teacher') {
        return (
            <div className="card">
                <h1>Not available</h1>
                <div className="small">Only teachers can grade submissions.</div>
            </div>
        )
    }

    return (
        <div className="card">
            <Link to={`/projects/${pid}/tasks/${tid}/submissions`} state={{ mode }} className="btn btn--ghost">
                ← Back
            </Link>

            <h1 style={{ marginTop: 16 }}>Grade submission</h1>

            {error && (
                <div className="small" style={{ color: 'red', marginTop: 12 }}>
                    {error}
                </div>
            )}

            {success && (
                <div className="small" style={{ color: 'green', marginTop: 12 }}>
                    {success}
                </div>
            )}

            {loading && (
                <div className="small" style={{ marginTop: 12 }}>
                    Loading…
                </div>
            )}

            {task && (
                <div className="card card--soft" style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ marginTop: 0 }}>Task condition</h2>

                            <h3 style={{ margin: '8px 0 10px' }}>
                                {task.title}
                            </h3>

                            <div style={{ whiteSpace: 'pre-wrap' }}>
                                {task.description?.trim() || 'No description provided.'}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: 10, minWidth: 160 }}>
                            {formatTaskDeadline(task.deadline) && (
                                <div className="pill">
                                    📅 {formatTaskDeadline(task.deadline)}
                                </div>
                            )}

                            <div className="pill">
                                Max: {task.maxScore}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {submission && (
                <div style={{ marginTop: 16, display: 'grid', gap: 20 }}>
                    <div className="card card--soft">
                        <h2>Student work</h2>

                        <div style={{ whiteSpace: 'pre-wrap' }}>
                            {submission.textAnswer || '—'}
                        </div>

                        {submission.fileLink && (
                            <div style={{ marginTop: 12 }}>
                                <a href={submission.fileLink} target="_blank" rel="noreferrer">
                                    {submission.fileLink}
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="card card--soft">
                        <h2>Teacher grading</h2>

                        <input
                            type="number"
                            className="input"
                            min={0}
                            max={task?.maxScore ?? 100}
                            step={1}
                            value={teacherScore}
                            onChange={(e) => {
                                const value = e.currentTarget.valueAsNumber
                                setTeacherScore(Number.isNaN(value) ? 0 : value)
                            }}
                        />

                        {teacherScoreError ? (
                            <div className="small" style={{ color: 'red' }}>
                                {teacherScoreError}
                            </div>
                        ) : null}

                        <textarea
                            className="input"
                            placeholder="Teacher comment"
                            value={teacherComment}
                            onChange={(e) => setTeacherComment(e.target.value)}
                        />

                        <button className="btn btn--primary" onClick={onGrade} disabled={!canSaveGrade}>
                            {saving ? 'Saving…' : 'Save grade'}
                        </button>
                    </div>

                    <div className="card card--soft">
                        <h2>🤖 AI Evaluation</h2>

                        <div className="small">
                            Status: {getAiStatusLabel(submission)}
                        </div>

                        {getAiStatus(submission) === 'PENDING' ? (
                            <div className="small" style={{ marginTop: 8 }}>AI is evaluating...</div>
                        ) : null}

                        {getAiStatus(submission) === 'DONE' && (
                            <>
                                <div style={{ marginTop: 8 }}>
                                    AI suggested score: <strong>{submission.aiScore ?? 0}</strong>
                                </div>

                                {submission.aiComment && (
                                    <div className="small" style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
                                        {submission.aiComment}
                                    </div>
                                )}
                            </>
                        )}

                        {(getAiStatus(submission) === 'FAILED' || getAiStatus(submission) === 'DISABLED') ? (
                            <div className="small" style={{ whiteSpace: 'pre-wrap', marginTop: 8, color: 'red' }}>
                                {submission.aiErrorMessage ?? 'AI evaluation is not available.'}
                            </div>
                        ) : null}

                        <div style={{ marginTop: 12 }}>
                            <button
                                className="btn"
                                onClick={reEvaluateAi}
                                disabled={saving || getAiStatus(submission) === 'PENDING'}
                            >
                                🔁 Re-evaluate AI
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
