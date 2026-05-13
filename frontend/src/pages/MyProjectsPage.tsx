import { useCallback, useEffect, useRef, useState } from 'react'
import { projectsApi } from '../api/projects.api'
import type { Project } from '../api/types'
import { getApiErrorMessage } from '../api/http'
import ProjectCardsSection from './ProjectCardsSection'
import ProjectCreateModal from './ProjectCreateModal'

const PROJECTS_PAGE_SIZE = 9

export default function MyProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [page, setPage] = useState(0)
    const [totalProjects, setTotalProjects] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [createOpen, setCreateOpen] = useState(false)
    const requestIdRef = useRef(0)

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearch(search.trim())
            setPage(0)
        }, 250)

        return () => window.clearTimeout(timeout)
    }, [search])

    const loadProjects = useCallback(async (searchValue: string, pageValue: number) => {
        const requestId = requestIdRef.current + 1
        requestIdRef.current = requestId

        setLoading(true)
        setError(null)

        try {
            const response = await projectsApi.myPage({
                search: searchValue || undefined,
                page: pageValue,
                size: PROJECTS_PAGE_SIZE,
            })

            if (requestId !== requestIdRef.current) {
                return
            }

            setProjects(response.items)
            setTotalProjects(response.totalElements)
            setTotalPages(response.totalPages)
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
        void loadProjects(debouncedSearch, page)
    }, [loadProjects, debouncedSearch, page])

    const onProjectCreated = () => {
        setSuccess('Project created successfully.')
        setPage(0)
        void loadProjects(debouncedSearch, 0)
    }

    const pageNumbers = getPageNumbers(page, totalPages)
    const emptyText = loading && projects.length === 0 ? 'Loading projects...' : 'No projects found'
    const emptySub = debouncedSearch ? 'Try another search phrase.' : 'Create your first project.'

    return (
        <div className="page-wrap page-stack my-projects-page">
            <section className="my-projects-hero">
                <div className="my-projects-hero__main">
                    <div className="tasko-hub__eyebrow">Created by me</div>
                    <h1 className="my-projects-hero__title">My Projects</h1>
                    <p className="my-projects-hero__text">
                        Your own project workspaces for tasks, submissions, grading, and student progress.
                    </p>
                </div>

                <button
                    type="button"
                    className="my-projects-create-card"
                    onClick={() => {
                        setSuccess(null)
                        setCreateOpen(true)
                    }}
                >
                    <span className="my-projects-create-card__icon" aria-hidden="true" />
                    <span className="my-projects-create-card__content">
                        <span className="my-projects-create-card__label">New workspace</span>
                        <strong>Create project</strong>
                    </span>
                    <span className="my-projects-create-card__arrow">-&gt;</span>
                </button>
            </section>

            {error ? <div className="alert alert--error">{error}</div> : null}
            {success ? <div className="alert">{success}</div> : null}
            <ProjectCardsSection
                title="Project spaces"
                subtitle="Open and manage the workspaces you created."
                projects={projects}
                emptyIcon="MP"
                emptyText={emptyText}
                emptySub={emptySub}
                badgeClassName="count-pill--yellow"
                badgeLabel={totalProjects}
                showJoinCode={false}
                headerSlot={
                    <div className="my-projects-panel-search">
                        <span className="my-projects-search__icon" aria-hidden="true" />
                        <input
                            className="inp my-projects-search__input"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search my projects..."
                        />

                        {loading ? <span className="my-projects-search-status">Updating</span> : null}

                        {search.trim() ? (
                            <button type="button" className="btn btn--ghost" onClick={() => setSearch('')}>
                                Clear
                            </button>
                        ) : null}
                    </div>
                }
                footerSlot={
                    totalPages > 1 ? (
                        <nav className="my-projects-pagination" aria-label="Project pages">
                            <button
                                type="button"
                                className="btn btn--ghost"
                                onClick={() => setPage((value) => Math.max(value - 1, 0))}
                                disabled={page === 0}
                            >
                                Prev
                            </button>

                            <div className="my-projects-pagination__pages">
                                {pageNumbers.map((pageNumber) => (
                                    <button
                                        key={pageNumber}
                                        type="button"
                                        className={pageNumber === page ? 'my-projects-page-btn my-projects-page-btn--active' : 'my-projects-page-btn'}
                                        onClick={() => setPage(pageNumber)}
                                        aria-current={pageNumber === page ? 'page' : undefined}
                                    >
                                        {pageNumber + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="btn btn--ghost"
                                onClick={() => setPage((value) => Math.min(value + 1, totalPages - 1))}
                                disabled={page >= totalPages - 1}
                            >
                                Next
                            </button>
                        </nav>
                    ) : null
                }
            />

            <ProjectCreateModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={onProjectCreated}
            />
        </div>
    )
}

function getPageNumbers(currentPage: number, totalPages: number) {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, index) => index)
    }

    const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5))
    return Array.from({ length: 5 }, (_, index) => start + index)
}
