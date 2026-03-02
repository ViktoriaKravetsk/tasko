import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project } from '../api/types'
import { projectsApi } from '../api/projects.api'

type Mode = 'teacher' | 'student'

export default function ProjectsPage() {
    const navigate = useNavigate()

    const [owned, setOwned] = useState<Project[]>([])
    const [enrolled, setEnrolled] = useState<Project[]>([])
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [deadline, setDeadline] = useState('')
    const [joinCode, setJoinCode] = useState('')

    const [copied, setCopied] = useState<string | null>(null)

    const copy = async (text: string) => {
        if (!text) return
        try {
            await navigator.clipboard.writeText(text)
        } catch {
            const ta = document.createElement('textarea')
            ta.value = text
            document.body.appendChild(ta)
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
        } finally {
            setCopied(text)
            window.setTimeout(() => setCopied(null), 1200)
        }
    }

    const load = async () => {
        setLoading(true)
        setErr(null)
        try {
            const [my, enr] = await Promise.all([projectsApi.my(), projectsApi.enrolled()])
            setOwned(my)
            setEnrolled(enr)
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? 'Failed to load projects')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const create = async () => {
        if (!name.trim()) return
        setLoading(true)
        setErr(null)
        try {
            await projectsApi.create({
                name: name.trim(),
                description: description.trim() ? description.trim() : null,
                deadline: deadline ? deadline : null,
            })
            setName('')
            setDescription('')
            setDeadline('')
            await load()
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? 'Create failed')
        } finally {
            setLoading(false)
        }
    }

    const join = async () => {
        if (!joinCode.trim()) return
        setLoading(true)
        setErr(null)
        try {
            await projectsApi.joinByCode({ joinCode: joinCode.trim() })
            setJoinCode('')
            await load()
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? 'Join failed')
        } finally {
            setLoading(false)
        }
    }

    const openProject = (p: Project, mode: Mode) => {
        navigate(`/projects/${p.id}`, { state: { mode, project: p } })
    }

    const emojis = useMemo(() => ['📚', '🎨', '🔬', '🚀', '💡', '🎯', '🌍', '🎵', '🖌️', '⚽', '🧠', '🔭'], [])
    const pickEmoji = (id: number) => emojis[Math.abs(hash(String(id))) % emojis.length]

    return (
        <div className="page-wrap">
            <div className="section-top">
                <h2>Projects</h2>
                <span className="star-deco">✦</span>
                <span className="star-deco">⭐</span>
                <button className="btn-refresh" onClick={load} disabled={loading}>
                    <span className="icon">🔄</span> Refresh
                </button>
            </div>

            {err && <div className="alert alert--error">{err}</div>}

            <div className="forms-grid">
                <div className="form-card">
                    <div className="form-card-header">
                        <span className="form-card-title">✏️ Create project</span>
                        <span className="role-badge rb-teacher">Teacher</span>
                    </div>
                    <div className="form-card-body">
                        <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" />
                        <textarea
                            className="inp"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description (optional)"
                        />
                        <input className="inp" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                        <button className="btn-primary" onClick={create} disabled={loading || !name.trim()}>
                            Create ✨
                        </button>
                    </div>
                </div>

                <div className="form-card">
                    <div className="form-card-header">
                        <span className="form-card-title">🔑 Join by code</span>
                        <span className="role-badge rb-student">Student</span>
                    </div>
                    <div className="form-card-body">
                        <input
                            className="inp"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="Enter join code..."
                        />
                        <button className="btn-primary green" onClick={join} disabled={loading || !joinCode.trim()}>
                            Join 🚀
                        </button>

                        <div className="hint-box">
                            <div className="hint-title">💡 How it works?</div>
                            <div className="hint-text">Ask your teacher for a project code and enter it above to join.</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel" style={{ marginTop: 20 }}>
                <div className="panel-header">
                    <div>
                        <div className="panel-title">📁 My projects</div>
                        <div className="panel-sub">Projects you created</div>
                    </div>
                    <span className="count-pill count-pill--yellow">{owned.length}</span>
                </div>

                <div className="panel-body">
                    {owned.length === 0 ? (
                        <div className="empty">
                            <div className="empty-icon">🌱</div>
                            <div className="empty-text">No projects yet</div>
                            <div className="empty-sub">Create your first project above!</div>
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {owned.map((p) => (
                                <div key={p.id} className="project-card" onClick={() => openProject(p, 'teacher')}>
                                    <div className="project-card-emoji">{pickEmoji(p.id)}</div>
                                    <div className="project-card-name">{p.name}</div>
                                    <div className="project-card-desc">{p.description ?? 'No description'}</div>
                                    <div className="project-card-meta">
                                        <span>👤 Teacher</span>
                                        <span className="project-card-date">{p.deadline ?? 'No deadline'}</span>

                                        {p.joinCode ? (
                                            <button
                                                type="button"
                                                className="count-pill count-pill--pink"
                                                title="Copy join code"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    void copy(p.joinCode ?? '')
                                                }}
                                            >
                                                {copied === p.joinCode ? 'Copied ✓' : `${p.joinCode} 📋`}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">🎒 Enrolled projects</div>
                        <div className="panel-sub">Projects you joined</div>
                    </div>
                    <span className="count-pill count-pill--pink">{enrolled.length}</span>
                </div>

                <div className="panel-body">
                    {enrolled.length === 0 ? (
                        <div className="empty">
                            <div className="empty-icon">🔍</div>
                            <div className="empty-text">Not enrolled yet</div>
                            <div className="empty-sub">Join a project using a code!</div>
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {enrolled.map((p) => (
                                <div key={p.id} className="project-card" onClick={() => openProject(p, 'student')}>
                                    <div className="project-card-emoji">{pickEmoji(p.id)}</div>
                                    <div className="project-card-name">{p.name}</div>
                                    <div className="project-card-desc">{p.description ?? 'Joined via code'}</div>
                                    <div className="project-card-meta">
                                        <span>🎒 Student</span>

                                        {p.joinCode ? (
                                            <button
                                                type="button"
                                                className="count-pill count-pill--pink"
                                                title="Copy join code"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    void copy(p.joinCode ?? '')
                                                }}
                                            >
                                                {copied === p.joinCode ? 'Copied ✓' : `${p.joinCode} 📋`}
                                            </button>
                                        ) : (
                                            <span className="project-card-date" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function hash(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
    return h
}