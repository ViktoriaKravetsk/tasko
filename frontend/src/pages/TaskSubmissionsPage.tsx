import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { submissionsApi } from '../api/submissions.api'
import type { SubmissionShort } from '../api/types'

type LocationState = { mode?: 'teacher' | 'student' }

export default function TaskSubmissionsPage() {
    const { projectId, taskId } = useParams()
    const pid = Number(projectId)
    const tid = Number(taskId)

    const mode = ((useLocation().state as LocationState | null)?.mode ?? 'teacher') as 'teacher' | 'student'

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

    async function load(searchValue?: string) {
        setLoading(true)
        setError(null)

        try {
            const normalizedSearch = searchValue?.trim() || undefined
            const list = await submissionsApi.listByTask(pid, tid, normalizedSearch)
            setItems(list)
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load submissions')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load(debouncedSearch)
    }, [pid, tid, debouncedSearch])

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link to={`/projects/${pid}/tasks/${tid}`} state={{ mode }} className="btn btn--ghost">
                    ← Back
                </Link>

                <button className="btn" onClick={() => void load(debouncedSearch)} disabled={loading}>
                    {loading ? 'Loading…' : 'Refresh'}
                </button>
            </div>

            <div style={{ marginTop: 14, marginBottom: 10 }}>
                <h1>Submissions</h1>
                <div className="small">All submissions for this task</div>
            </div>

            <div
                className="card card--soft"
                style={{
                    marginTop: 12,
                    marginBottom: 12,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <input
                    className="inp"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search student by name..."
                    style={{ maxWidth: 320, margin: 0 }}
                />

                {search.trim() ? (
                    <button type="button" className="btn btn--ghost" onClick={() => setSearch('')}>
                        Clear
                    </button>
                ) : null}
            </div>

            {error ? (
                <div className="card card--soft" style={{ borderColor: 'var(--ink)' }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 11 }}>Error</div>
                    <div className="small">{error}</div>
                </div>
            ) : null}

            {!loading && items.length === 0 ? (
                <div className="card card--soft" style={{ marginTop: 12 }}>
                    <h2>No students found</h2>
                    <div className="small">
                        {debouncedSearch ? 'Try another student name.' : 'Students haven’t submitted anything for this task.'}
                    </div>
                </div>
            ) : null}

            {items.length > 0 ? (
                <div style={{ marginTop: 12 }}>
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Student</th>
                            <th>Status</th>
                            <th>Submitted</th>
                            <th>Late</th>
                            <th>AI</th>
                            <th>Score</th>
                            <th />
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((s) => (
                            <tr key={`${s.studentId}-${s.id ?? 'none'}`}>
                                <td>{s.studentName ?? 'Unknown'}</td>
                                <td>{s.status ?? 'NOT_SUBMITTED'}</td>
                                <td>{s.submittedAt ?? '—'}</td>
                                <td>{s.late ? 'Yes' : 'No'}</td>
                                <td>{getAiLabel(s)}</td>
                                <td>{s.teacherScore ?? '—'}</td>
                                <td style={{ textAlign: 'right' }}>
                                    {s.id != null ? (
                                    <Link
                                        to={`/projects/${pid}/tasks/${tid}/submissions/${s.id}`}
                                        state={{ mode }}
                                        className="btn btn--primary"
                                        style={{ height: 36, padding: '0 10px' }}
                                    >
                                        Grade →
                                    </Link>
                                    ) : (
                                        <span className="small">No work</span>
                                    )}
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

function getAiLabel(submission: SubmissionShort) {
    if (submission.status === 'NOT_SUBMITTED') return '—'
    if (submission.aiStatus === 'DONE') return submission.aiScore != null ? `Done (${submission.aiScore})` : 'Done'
    if (submission.aiStatus === 'FAILED') return 'Failed'
    if (submission.aiStatus === 'DISABLED') return 'Disabled'
    return 'Pending'
}
