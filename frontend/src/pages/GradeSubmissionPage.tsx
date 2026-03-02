import { useEffect, useMemo, useState } from 'react'
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
    const isTeacher = useMemo(() => mode === 'teacher', [mode])

    const [task, setTask] = useState<Task | null>(null)
    const [sub, setSub] = useState<Submission | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [teacherScore, setTeacherScore] = useState<number>(0)
    const [teacherComment, setTeacherComment] = useState<string>('')

    async function load() {
        setLoading(true)
        setError(null)
        try {
            const t = await tasksApi.get(pid, tid)
            setTask(t)

            const full = await submissionsApi.getById(pid, tid, sid)
            setSub(full)

            setTeacherScore(full.teacherScore ?? 0)
            setTeacherComment(full.teacherComment ?? '')
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load')
        } finally {
            setLoading(false)
        }
    }

    async function onSave() {
        if (!isTeacher || !task) return
        setError(null)

        if (teacherScore < 0 || teacherScore > task.maxScore) {
            setError(`Score must be between 0 and ${task.maxScore}`)
            return
        }

        try {
            const updated = await submissionsApi.grade(pid, tid, sid, {
                teacherScore: Number(teacherScore),
                teacherComment: teacherComment.trim() ? teacherComment.trim() : null,
            })
            setSub(updated)
        } catch (e: any) {
            setError(e?.message ?? 'Failed to save grade')
        }
    }

    useEffect(() => {
        void load()
    }, [pid, tid, sid])

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <Link to={`/projects/${pid}/tasks/${tid}/submissions`} state={{ mode }} className="btn btn--ghost">
                    ← Back
                </Link>

                <button className="btn" onClick={() => void load()} disabled={loading}>
                    {loading ? 'Loading…' : 'Refresh'}
                </button>
            </div>

            <div style={{ marginTop: 14 }}>
                <h1>Grade submission</h1>
                {task && sub ? (
                    <div className="small">{task.title} • Student: {sub.studentName ?? 'Unknown'}</div>
                ) : null}
            </div>

            {error ? (
                <div className="card card--soft" style={{ marginTop: 12 }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 11 }}>Error</div>
                    <div className="small">{error}</div>
                </div>
            ) : null}

            {loading ? <div className="small" style={{ marginTop: 10 }}>Loading…</div> : null}

            {task && sub ? (
                <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                    <div className="card card--soft">
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span className="badge">Task: {task.title}</span>
                            <span className="badge badge--olive">Max: {task.maxScore}</span>
                            <span className="badge">Student: {sub.studentName ?? 'Unknown'}</span>
                            <span className="badge">Submitted: {sub.submittedAt ?? '—'}</span>
                        </div>

                        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                            <div className="card" style={{ boxShadow: 'var(--shadow-sm)' }}>
                                <h2>Text</h2>
                                <div className="small" style={{ whiteSpace: 'pre-wrap' }}>
                                    {sub.textAnswer ?? '—'}
                                </div>
                            </div>

                            <div className="card" style={{ boxShadow: 'var(--shadow-sm)' }}>
                                <h2>File link</h2>

                                {sub.fileLink ? (
                                    <a
                                        href={sub.fileLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn--primary"
                                        style={{
                                            height: 36,
                                            padding: '0 10px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        Open link →
                                    </a>
                                ) : (
                                    <div className="small">—</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h2>Teacher grade</h2>

                        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                            <input
                                className="input"
                                type="number"
                                min={0}
                                max={task.maxScore}
                                value={teacherScore}
                                onChange={(e) => setTeacherScore(Number(e.target.value))}
                            />

                            <textarea
                                className="input"
                                rows={4}
                                placeholder="Teacher comment (optional)"
                                value={teacherComment}
                                onChange={(e) => setTeacherComment(e.target.value)}
                            />

                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button className="btn btn--primary" onClick={onSave} disabled={!isTeacher}>
                                    Save
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        setTeacherScore(sub.teacherScore ?? 0)
                                        setTeacherComment(sub.teacherComment ?? '')
                                    }}
                                    disabled={!isTeacher}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}