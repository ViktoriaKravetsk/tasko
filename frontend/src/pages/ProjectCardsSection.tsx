import type { KeyboardEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project } from '../api/types'
import { DEFAULT_PROJECT_EMOJI } from './projectEmojiOptions'

type Props = {
    title: string
    subtitle?: string
    projects: Project[]
    copied?: string | null
    onCopy?: (text: string) => Promise<void> | void
    emptyIcon: string
    emptyText: string
    emptySub: string
    badgeClassName: string
    badgeLabel?: string | number
    showJoinCode?: boolean
    headerSlot?: ReactNode
    footerSlot?: ReactNode
}

export default function ProjectCardsSection({
                                                title,
                                                subtitle,
                                                projects,
                                                copied,
                                                onCopy,
                                                emptyIcon,
                                                emptyText,
                                                emptySub,
                                                badgeClassName,
                                                badgeLabel,
                                                showJoinCode = true,
                                                headerSlot,
                                                footerSlot,
                                            }: Props) {
    const navigate = useNavigate()

    const openProject = (project: Project) => {
        navigate(`/projects/${project.id}`, { state: { project } })
    }

    const handleProjectKeyDown = (event: KeyboardEvent<HTMLElement>, project: Project) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openProject(project)
        }
    }

    return (
        <section className="panel section-gap-md">
            <div className="panel-header">
                <div>
                    <div className="panel-title">{title}</div>
                    {subtitle ? <div className="panel-sub">{subtitle}</div> : null}
                </div>

                {headerSlot}

                <span className={`count-pill ${badgeClassName}`}>{badgeLabel ?? projects.length}</span>
            </div>

            <div className="panel-body">
                {projects.length === 0 ? (
                    <div className="empty">
                        <div className="empty-icon">{emptyIcon}</div>
                        <div className="empty-text">{emptyText}</div>
                        <div className="empty-sub">{emptySub}</div>
                    </div>
                ) : (
                    <div className="projects-grid projects-grid--airy">
                        {projects.map((project) => (
                            <article
                                key={project.id}
                                className="project-card project-card--openable"
                                role="button"
                                tabIndex={0}
                                title="Open project"
                                onClick={() => openProject(project)}
                                onKeyDown={(event) => handleProjectKeyDown(event, project)}
                            >
                                <div
                                    className="project-card-mark project-card-mark--emoji"
                                    data-tone={getProjectTone(project.id)}
                                    aria-hidden="true"
                                >
                                    <span>{project.emoji?.trim() || DEFAULT_PROJECT_EMOJI}</span>
                                </div>

                                <div className="project-card-name">
                                    {project.name}
                                </div>

                                <div className="project-card-desc" title={project.description ?? undefined}>
                                    {project.description?.trim() || 'No description'}
                                </div>

                                <div className="project-card-meta">
                                    <span className="project-card-date">
                                        {project.deadline ?? 'No deadline'}
                                    </span>

                                    {showJoinCode && project.joinCode && onCopy ? (
                                        <button
                                            type="button"
                                            className="count-pill count-pill--pink"
                                            title="Copy join code"
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                void onCopy(project.joinCode ?? '')
                                            }}
                                        >
                                            {copied === project.joinCode ? 'Copied' : project.joinCode}
                                        </button>
                                    ) : null}
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {footerSlot}
            </div>
        </section>
    )
}

function getProjectTone(id: number): number {
    return Math.abs(hash(String(id))) % 4
}

function hash(value: string): number {
    let hashValue = 0

    for (let index = 0; index < value.length; index += 1) {
        hashValue = (hashValue * 31 + value.charCodeAt(index)) | 0
    }

    return hashValue
}
