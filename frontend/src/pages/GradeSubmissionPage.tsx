import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { Submission, Task } from '../api/types'
import { submissionsApi } from '../api/submissions.api'
import { tasksApi } from '../api/tasks.api'

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

    async function load() {
        setLoading(true)
        setError(null)
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
        setSaving(true)
        setError(null)
        try {
            const updated = await submissionsApi.grade(pid, tid, sid, {
                teacherScore,
                teacherComment: teacherComment.trim() || null,
            })
            setSubmission(updated)
        } catch (e: any) {
            setError(e?.message ?? 'Failed to grade')
        } finally {
            setSaving(false)
        }
    }

    async function reEvaluateAi() {
        setSaving(true)
        setError(null)
        try {
            const updated = await submissionsApi.reEvaluateAi(pid, tid, sid)
            setSubmission(updated)
            await load()
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
            {task && <div className="small">{task.title}</div>}

            {error && <div className="small" style={{ color: 'red' }}>{error}</div>}
            {loading && <div className="small">Loading…</div>}

            {submission && (
                <div style={{ marginTop: 16, display: 'grid', gap: 20 }}>
                    <div className="card card--soft">
                        <h2>Student work</h2>
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                            {submission.textAnswer || '—'}
                        </div>
                        {submission.fileLink && (
                            <div>
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
                            value={teacherScore}
                            onChange={(e) => setTeacherScore(Number(e.target.value))}
                        />

                        <textarea
                            className="input"
                            placeholder="Teacher comment"
                            value={teacherComment}
                            onChange={(e) => setTeacherComment(e.target.value)}
                        />

                        <button className="btn btn--primary" onClick={onGrade} disabled={saving}>
                            {saving ? 'Saving…' : 'Save grade'}
                        </button>
                    </div>


                    <div className="card card--soft">
                        <h2>🤖 AI Evaluation</h2>

                        {!submission.aiEvaluatedAt && (
                            <div className="small">AI is evaluating...</div>
                        )}

                        {submission.aiEvaluatedAt && (
                            <>
                                <div>
                                    AI suggested score: <strong>{submission.aiScore ?? 0}</strong>
                                </div>

                                {submission.aiComment && (
                                    <div className="small" style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
                                        {submission.aiComment}
                                    </div>
                                )}
                            </>
                        )}

                        <div style={{ marginTop: 12 }}>
                            <button className="btn" onClick={reEvaluateAi} disabled={saving}>
                                🔁 Re-evaluate AI
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}