import { useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../api/projects.api'
import { useAuth } from '../auth/AuthContext'

type ActiveModal = 'create' | 'join' | null

export default function ProjectsHubPage() {
    const auth = useAuth()

    const [activeModal, setActiveModal] = useState<ActiveModal>(null)

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [deadline, setDeadline] = useState('')
    const [joinCode, setJoinCode] = useState('')

    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const firstName = auth.me?.name?.trim()?.split(' ')[0] || 'there'

    const closeModal = () => {
        if (loading) return
        setActiveModal(null)
        setErr(null)
    }

    const openCreateModal = () => {
        setErr(null)
        setSuccess(null)
        setActiveModal('create')
    }

    const openJoinModal = () => {
        setErr(null)
        setSuccess(null)
        setActiveModal('join')
    }

    const create = async () => {
        if (!name.trim()) return

        setLoading(true)
        setErr(null)
        setSuccess(null)

        try {
            await projectsApi.create({
                name: name.trim(),
                description: description.trim() ? description.trim() : null,
                deadline: deadline || null,
            })

            setName('')
            setDescription('')
            setDeadline('')
            setActiveModal(null)
            setSuccess('Project created successfully.')
        } catch (error: any) {
            setErr(error?.message ?? error?.response?.data?.message ?? 'Could not create the project.')
        } finally {
            setLoading(false)
        }
    }

    const join = async () => {
        if (!joinCode.trim()) return

        setLoading(true)
        setErr(null)
        setSuccess(null)

        try {
            await projectsApi.joinByCode({ joinCode: joinCode.trim() })
            setJoinCode('')
            setActiveModal(null)
            setSuccess('You joined the project successfully.')
        } catch (error: any) {
            setErr(error?.message ?? error?.response?.data?.message ?? 'Could not join the project.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-wrap tasko-hub">
            <section className="tasko-hub__hero">
                <div className="tasko-hub__eyebrow">TASKO PROJECT CENTER</div>

                <h1 className="tasko-hub__title">
                    Welcome, {firstName}
                </h1>

                <p className="tasko-hub__text">
                    Create learning projects, join active classes, manage tasks, and keep feedback in one organized place.
                </p>
            </section>

            {err ? <div className="alert alert--error tasko-hub__alert">{err}</div> : null}
            {success ? <div className="alert tasko-hub__alert">{success}</div> : null}

            <section className="tasko-hub__grid">
                <button
                    type="button"
                    className="tasko-action-card tasko-action-card--create"
                    onClick={openCreateModal}
                >
                    <span className="tasko-action-card__icon tasko-action-card__icon--create" aria-hidden="true" />

                    <span className="tasko-action-card__content">
                        <span className="tasko-action-card__title">Create project</span>
                        <span className="tasko-action-card__desc">
                            Start a workspace for tasks, submissions, and grading.
                        </span>
                    </span>

                    <span className="tasko-action-card__arrow">-&gt;</span>
                </button>

                <button
                    type="button"
                    className="tasko-action-card tasko-action-card--join"
                    onClick={openJoinModal}
                >
                    <span className="tasko-action-card__icon tasko-action-card__icon--join" aria-hidden="true">
                        <svg className="tasko-action-card__svg" viewBox="0 0 64 64" focusable="false">
                            <circle cx="21" cy="32" r="11" />
                            <circle cx="21" cy="32" r="4" />
                            <path d="M32 32H55" />
                            <path d="M46 32V42" />
                            <path d="M55 32V39" />
                        </svg>
                    </span>

                    <span className="tasko-action-card__content">
                        <span className="tasko-action-card__title">Join project</span>
                        <span className="tasko-action-card__desc">
                            Enter an invite code from your teacher or project owner.
                        </span>
                    </span>

                    <span className="tasko-action-card__arrow">-&gt;</span>
                </button>

                <Link to="/projects/mine" className="tasko-action-card tasko-action-card--mine">
                    <span className="tasko-action-card__icon tasko-action-card__icon--mine" aria-hidden="true" />

                    <span className="tasko-action-card__content">
                        <span className="tasko-action-card__title">My projects</span>
                        <span className="tasko-action-card__desc">
                            Review the projects you created and manage their tasks.
                        </span>
                    </span>

                    <span className="tasko-action-card__arrow">-&gt;</span>
                </Link>

                <Link to="/projects/enrolled" className="tasko-action-card tasko-action-card--enrolled">
                    <span className="tasko-action-card__icon tasko-action-card__icon--enrolled" aria-hidden="true" />

                    <span className="tasko-action-card__content">
                        <span className="tasko-action-card__title">Participating projects</span>
                        <span className="tasko-action-card__desc">
                            Open projects you joined and continue your assigned work.
                        </span>
                    </span>

                    <span className="tasko-action-card__arrow">-&gt;</span>
                </Link>
            </section>

            {activeModal === 'create' ? (
                <div className="tasko-modal-backdrop" onMouseDown={closeModal}>
                    <section className="tasko-modal" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="tasko-modal__header">
                            <div>
                                <div className="tasko-modal__eyebrow">New project</div>
                                <h2 className="tasko-modal__title">Create project</h2>
                            </div>

                            <button
                                type="button"
                                className="tasko-modal__close"
                                onClick={closeModal}
                                aria-label="Close"
                            >
                                x
                            </button>
                        </div>

                        <div className="tasko-modal__body">
                            <label className="tasko-field">
                                <span>Project name</span>
                                <input
                                    className="inp"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="For example: Web Design Lab"
                                />
                            </label>

                            <label className="tasko-field">
                                <span>Description</span>
                                <textarea
                                    className="inp"
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    placeholder="Briefly describe what this project is about"
                                />
                            </label>

                            <label className="tasko-field">
                                <span>Deadline</span>
                                <input
                                    className="inp"
                                    type="date"
                                    value={deadline}
                                    onChange={(event) => setDeadline(event.target.value)}
                                />
                            </label>
                        </div>

                        <div className="tasko-modal__footer">
                            <button
                                type="button"
                                className="btn btn--ghost"
                                onClick={closeModal}
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn btn--primary"
                                onClick={create}
                                disabled={loading || !name.trim()}
                            >
                                {loading ? 'Creating...' : 'Create project'}
                            </button>
                        </div>
                    </section>
                </div>
            ) : null}

            {activeModal === 'join' ? (
                <div className="tasko-modal-backdrop" onMouseDown={closeModal}>
                    <section className="tasko-modal tasko-modal--small" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="tasko-modal__header">
                            <div>
                                <div className="tasko-modal__eyebrow">Invite code</div>
                                <h2 className="tasko-modal__title">Join project</h2>
                            </div>

                            <button
                                type="button"
                                className="tasko-modal__close"
                                onClick={closeModal}
                                aria-label="Close"
                            >
                                x
                            </button>
                        </div>

                        <div className="tasko-modal__body">
                            <label className="tasko-field">
                                <span>Project code</span>
                                <input
                                    className="inp"
                                    value={joinCode}
                                    onChange={(event) => setJoinCode(event.target.value)}
                                    placeholder="Enter the project code"
                                />
                            </label>

                            <div className="hint-box">
                                <div className="hint-title">Hint</div>
                                <div className="hint-text">
                                    Ask your teacher or project owner for the invite code.
                                </div>
                            </div>
                        </div>

                        <div className="tasko-modal__footer">
                            <button
                                type="button"
                                className="btn btn--ghost"
                                onClick={closeModal}
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn btn--primary green"
                                onClick={join}
                                disabled={loading || !joinCode.trim()}
                            >
                                {loading ? 'Joining...' : 'Join project'}
                            </button>
                        </div>
                    </section>
                </div>
            ) : null}
        </div>
    )
}
