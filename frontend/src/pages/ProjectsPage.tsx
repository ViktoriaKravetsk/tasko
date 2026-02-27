import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi, type Project } from '../api/projects.api'

function errMsg(e: unknown) {
    return e instanceof Error ? e.message : 'Error'
}

export default function ProjectsPage() {
    const [myProjects, setMyProjects] = useState<Project[]>([])
    const [enrolled, setEnrolled] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>('')

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [deadline, setDeadline] = useState('')
    const [createLoading, setCreateLoading] = useState(false)

    const [joinCode, setJoinCode] = useState('')
    const [joinLoading, setJoinLoading] = useState(false)
    const [joinInfo, setJoinInfo] = useState('')

    useEffect(() => {
        void load()
    }, [])

    async function load() {
        setError('')
        setJoinInfo('')
        setLoading(true)
        try {
            const [mine, stud] = await Promise.all([projectsApi.my(), projectsApi.enrolled()])
            setMyProjects(mine ?? [])
            setEnrolled(stud ?? [])
        } catch (e) {
            setError(errMsg(e))
        } finally {
            setLoading(false)
        }
    }

    async function onCreate() {
        setError('')
        if (!name.trim()) {
            setError('Project name is required')
            return
        }

        setCreateLoading(true)
        try {
            const p = await projectsApi.create({
                name: name.trim(),
                description: description.trim() ? description.trim() : null,
                deadline: deadline ? deadline : null,
            })

            setMyProjects((prev) => [p, ...prev])
            setName('')
            setDescription('')
            setDeadline('')
        } catch (e) {
            setError(errMsg(e))
        } finally {
            setCreateLoading(false)
        }
    }

    async function onJoin() {
        setError('')
        setJoinInfo('')
        const code = joinCode.trim()
        if (!code) {
            setError('Join code is required')
            return
        }

        setJoinLoading(true)
        try {
            const p = await projectsApi.joinByCode({ joinCode: code })
            setEnrolled((prev) => (prev.some((x) => x.id === p.id) ? prev : [p, ...prev]))
            setJoinInfo(`Joined: ${p.name}`)
            setJoinCode('')
        } catch (e) {
            setError(errMsg(e))
        } finally {
            setJoinLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="card">
                <h1>Projects</h1>
                <div className="small">Loading projects…</div>
            </div>
        )
    }

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                        <h1>Projects</h1>
                        <div className="small">Create or join a course project.</div>
                    </div>

                    <button className="btn" onClick={() => void load()} disabled={loading}>
                        Refresh
                    </button>
                </div>

                {error ? (
                    <div className="card card--soft" style={{ marginTop: 12 }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 11 }}>Error</div>
                        <div className="small">{error}</div>
                    </div>
                ) : null}

                {joinInfo ? (
                    <div className="card card--soft" style={{ marginTop: 12 }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 11 }}>OK</div>
                        <div className="small">{joinInfo}</div>
                    </div>
                ) : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="card card--soft">
                    <h2>Create project</h2>

                    <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />

                        <textarea
                            className="input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description (optional)"
                            rows={3}
                        />

                        <input className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} type="date" />

                        <button className="btn btn--primary" onClick={onCreate} disabled={createLoading}>
                            {createLoading ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </div>

                <div className="card card--soft">
                    <h2>Join by code</h2>

                    <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                        <input className="input" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Join code" />

                        <button className="btn btn--primary" onClick={onJoin} disabled={joinLoading}>
                            {joinLoading ? 'Joining…' : 'Join'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2>My projects </h2>
                <div className="small">Projects which you created</div>

                {myProjects.length === 0 ? <div className="small" style={{ marginTop: 10 }}>No projects yet.</div> : null}

                <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                    {myProjects.map((p) => (
                        <div key={p.id} className="card card--soft" style={{ boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                                    <div className="small" style={{ marginTop: 6 }}>
                                        joinCode: <span className="badge">{p.joinCode}</span>
                                        {p.deadline ? <span style={{ marginLeft: 10 }}>deadline: {p.deadline}</span> : null}
                                    </div>
                                </div>

                                <Link
                                    to={`/projects/${p.id}`}
                                    state={{ project: p, mode: 'teacher' as const }}
                                    className="btn btn--primary"
                                    style={{ height: 36, padding: '0 10px' }}
                                >
                                    Open →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card">
                <h2>Enrolled projects </h2>
                <div className="small">Projects you have enrolled</div>

                {enrolled.length === 0 ? <div className="small" style={{ marginTop: 10 }}>Not enrolled yet.</div> : null}

                <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                    {enrolled.map((p) => (
                        <div key={p.id} className="card card--soft" style={{ boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                                    <div className="small" style={{ marginTop: 6 }}>
                                        joinCode: <span className="badge">{p.joinCode}</span>
                                    </div>
                                </div>

                                <Link
                                    to={`/projects/${p.id}`}
                                    state={{ project: p, mode: 'student' as const }}
                                    className="btn btn--primary"
                                    style={{ height: 36, padding: '0 10px' }}
                                >
                                    Open →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        @media (max-width: 980px) {
          div[style*="grid-template-columns: '1fr 1fr'"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
        </div>
    )
}