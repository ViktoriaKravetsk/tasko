import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { Submission } from '../api/types'
import { submissionsApi } from '../api/submissions.api'

type LocationState = { mode?: 'teacher' | 'student' }

export default function TaskSubmissionsPage() {
    const { projectId, taskId } = useParams()
    const pid = Number(projectId)
    const tid = Number(taskId)

    const mode = ((useLocation().state as LocationState | null)?.mode ?? 'teacher') as 'teacher' | 'student'

    const [items, setItems] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    async function load() {
        setLoading(true)
        setError(null)
        try {
            const list = await submissionsApi.listByTask(pid, tid)
            setItems(list)
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load submissions')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()
    }, [pid, tid])

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <Link to={`/projects/${pid}/tasks/${tid}`} state={{ mode }} className="btn btn--ghost">
                    ← Back
                </Link>

                <button className="btn" onClick={() => void load()} disabled={loading}>
                    {loading ? 'Loading…' : 'Refresh'}
                </button>
            </div>

            <div style={{ marginTop: 14, marginBottom: 10 }}>
                <h1>Submissions</h1>
                <div className="small">Task #{tid} • Project #{pid}</div>
            </div>

            {error ? (
                <div className="card card--soft" style={{ borderColor: 'var(--ink)' }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 11 }}>Error</div>
                    <div className="small">{error}</div>
                </div>
            ) : null}

            {!loading && items.length === 0 ? (
                <div className="card card--soft" style={{ marginTop: 12 }}>
                    <h2>No submissions yet</h2>
                    <div className="small">Students haven’t submitted anything for this task.</div>
                </div>
            ) : null}

            {items.length > 0 ? (
                <div style={{ marginTop: 12 }}>
                    <table className="table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Student</th>
                            <th>Submitted</th>
                            <th>Score</th>
                            <th />
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((s) => (
                            <tr key={s.id}>
                                <td>#{s.id}</td>
                                <td>{s.studentId}</td>
                                <td>{s.submittedAt ?? '—'}</td>
                                <td>{s.teacherScore ?? '—'}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <Link
                                        to={`/projects/${pid}/tasks/${tid}/submissions/${s.id}`}
                                        state={{ mode }}
                                        className="btn btn--primary"
                                        style={{ height: 36, padding: '0 10px' }}
                                    >
                                        Grade →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    )
}