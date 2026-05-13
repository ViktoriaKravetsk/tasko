import { useCallback, useEffect, useRef, useState } from 'react'
import { projectsApi } from '../api/projects.api'
import type { Project } from '../api/types'
import { getApiErrorMessage } from '../api/http'
import ProjectCardsSection from './ProjectCardsSection'
import ProjectJoinModal from './ProjectJoinModal'

export default function EnrolledProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [copied, setCopied] = useState<string | null>(null)
    const [joinOpen, setJoinOpen] = useState(false)
    const requestIdRef = useRef(0)

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
        return () => window.clearTimeout(timeout)
    }, [search])

    const loadProjects = useCallback(async (searchValue: string) => {
        const requestId = requestIdRef.current + 1
        requestIdRef.current = requestId

        setLoading(true)
        setError(null)

        try {
            const response = await projectsApi.enrolled(searchValue || undefined)

            if (requestId !== requestIdRef.current) {
                return
            }

            setProjects(response)
        } catch (error) {
            if (requestId !== requestIdRef.current) {
                return
            }

            setError(getApiErrorMessage(error, 'Failed to load projects.'))
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        void loadProjects(debouncedSearch)
    }, [loadProjects, debouncedSearch])

    const copy = async (text: string) => {
        if (!text) return

        try {
            await navigator.clipboard.writeText(text)
        } catch {
            const textarea = document.createElement('textarea')
            textarea.value = text
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
        } finally {
            setCopied(text)
            window.setTimeout(() => setCopied(null), 1200)
        }
    }

    const emptyText = loading && projects.length === 0 ? 'Loading projects...' : 'No projects found'
    const emptySub = debouncedSearch ? 'Try another search phrase.' : 'Join a project with an invite code.'

    return (
        <div className="page-wrap page-stack my-projects-page enrolled-projects-page">
            <section className="my-projects-hero">
                <div className="my-projects-hero__main">
                    <div className="tasko-hub__eyebrow">Joined by me</div>
                    <h1 className="my-projects-hero__title">Participating Projects</h1>
                    <p className="my-projects-hero__text">
                        Project spaces where you study, submit tasks, and track your work.
                    </p>
                </div>

                <button
                    type="button"
                    className="my-projects-create-card enrolled-projects-join-card"
                    onClick={() => {
                        setSuccess(null)
                        setJoinOpen(true)
                    }}
                >
                    <span className="my-projects-create-card__icon enrolled-projects-join-card__icon" aria-hidden="true" />
                    <span className="my-projects-create-card__content">
                        <span className="my-projects-create-card__label">Invite code</span>
                        <strong>Join project</strong>
                    </span>
                    <span className="my-projects-create-card__arrow">-&gt;</span>
                </button>
            </section>

            {error ? <div className="alert alert--error">{error}</div> : null}
            {success ? <div className="alert">{success}</div> : null}

            <ProjectCardsSection
                title="Learning spaces"
                subtitle="Open the projects where you participate."
                projects={projects}
                copied={copied}
                onCopy={copy}
                emptyIcon="JP"
                emptyText={emptyText}
                emptySub={emptySub}
                badgeClassName="count-pill--pink"
                badgeLabel={projects.length}
                headerSlot={
                    <div className="my-projects-panel-search">
                        <span className="my-projects-search__icon" aria-hidden="true" />
                        <input
                            className="inp my-projects-search__input"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search joined projects..."
                        />

                        {loading ? <span className="my-projects-search-status">Updating</span> : null}

                        {search.trim() ? (
                            <button type="button" className="btn btn--ghost" onClick={() => setSearch('')}>
                                Clear
                            </button>
                        ) : null}
                    </div>
                }
            />

            <ProjectJoinModal
                open={joinOpen}
                onClose={() => setJoinOpen(false)}
                onJoined={() => {
                    setSuccess('You joined the project successfully.')
                    void loadProjects(debouncedSearch)
                }}
            />
        </div>
    )
}
