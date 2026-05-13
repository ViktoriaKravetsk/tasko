import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import ProjectCreateModal from './ProjectCreateModal'
import ProjectJoinModal from './ProjectJoinModal'

type ActiveModal = 'create' | 'join' | null

export default function ProjectsHubPage() {
    const auth = useAuth()

    const [activeModal, setActiveModal] = useState<ActiveModal>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const firstName = auth.me?.name?.trim()?.split(' ')[0] || 'there'

    const openCreateModal = () => {
        setSuccess(null)
        setActiveModal('create')
    }

    const openJoinModal = () => {
        setSuccess(null)
        setActiveModal('join')
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

            <ProjectCreateModal
                open={activeModal === 'create'}
                onClose={() => setActiveModal(null)}
                onCreated={() => setSuccess('Project created successfully.')}
            />

            <ProjectJoinModal
                open={activeModal === 'join'}
                onClose={() => setActiveModal(null)}
                onJoined={() => setSuccess('You joined the project successfully.')}
            />
        </div>
    )
}
