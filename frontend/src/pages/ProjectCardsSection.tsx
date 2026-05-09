import { useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project } from '../api/types'

type Props = {
    title: string
    subtitle: string
    projects: Project[]
    copied: string | null
    onCopy: (text: string) => Promise<void> | void
    emptyIcon: string
    emptyText: string
    emptySub: string
    badgeClassName: string
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
                                            }: Props) {
    const navigate = useNavigate()

    const [emojis] = useState([
        '📚',
        '🎨',
        '🔬',
        '🚀',
        '💡',
        '🎯',
        '🌍',
        '🎵',
        '🖌️',
        '⚽',
        '🧠',
        '🔭',
    ])

    const emojiFor = useMemo(() => {
        return (id: number) => emojis[Math.abs(hash(String(id))) % emojis.length]
    }, [emojis])

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

                <span className={`count-pill ${badgeClassName}`}>{projects.length}</span>
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
                                <div className="project-card-emoji">{emojiFor(project.id)}</div>

                                <div className="project-card-name">
                                    {project.name}
                                </div>

                                <div className="project-card-desc">
                                    {project.description ?? 'No description'}
                                </div>

                                <div className="project-card-meta">
                                    <span className="project-card-date">
                                        {project.deadline ?? 'No deadline'}
                                    </span>

                                    {project.joinCode ? (
                                        <button
                                            type="button"
                                            className="count-pill count-pill--pink"
                                            title="Copy join code"
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                void onCopy(project.joinCode ?? '')
                                            }}
                                        >
                                            {copied === project.joinCode ? 'Copied ✓' : `${project.joinCode} 📋`}
                                        </button>
                                    ) : null}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

function hash(value: string): number {
    let hashValue = 0

    for (let index = 0; index < value.length; index += 1) {
        hashValue = (hashValue * 31 + value.charCodeAt(index)) | 0
    }

    return hashValue
}