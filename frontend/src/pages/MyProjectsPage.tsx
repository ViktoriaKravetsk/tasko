import { useEffect, useState } from 'react'
import { projectsApi } from '../api/projects.api'
import type { Project } from '../api/types'
import ProjectCardsSection from './ProjectCardsSection'
import ProjectsSearchBar from './ProjectsSearchBar'

export default function MyProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState<string | null>(null)

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
        return () => window.clearTimeout(timeout)
    }, [search])

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)

            try {
                setProjects(await projectsApi.my(debouncedSearch || undefined))
            } catch (error: any) {
                setError(error?.response?.data?.message ?? 'Failed to load projects.')
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [debouncedSearch])

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

    return (
        <div className="page-wrap page-stack">
            <div className="section-top">
                <h2>My Projects</h2>
                <span className="star-deco">✦</span>
            </div>

            <ProjectsSearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search my projects by name..."
            />

            {error ? <div className="alert alert--error">{error}</div> : null}
            {loading ? <div className="panel panel--compact">Loading...</div> : null}

            {!loading ? (
                <ProjectCardsSection
                    title="📁 My Projects"
                    subtitle=""
                    projects={projects}
                    copied={copied}
                    onCopy={copy}
                    emptyIcon="🌱"
                    emptyText="No projects yet"
                    emptySub={debouncedSearch ? 'Try another search phrase.' : 'Create your first project on the Projects page.'}
                    badgeClassName="count-pill--yellow"
                />
            ) : null}
        </div>
    )
}