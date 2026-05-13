import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../api/http'
import { projectsApi } from '../api/projects.api'
import { submissionsApi } from '../api/submissions.api'
import { tasksApi, type TaskDeadlineFilter } from '../api/tasks.api'
import type { Project, Submission, Task } from '../api/types'
import ProjectEditModal from './ProjectEditModal'
import TaskCreateModal from './TaskCreateModal'
import TaskEditModal from './TaskEditModal'
import { DEFAULT_PROJECT_EMOJI } from './projectEmojiOptions'

type Mode = 'teacher' | 'student'

export default function ProjectPage() {
    const { projectId } = useParams()
    const projectIdNum = projectId ? Number(projectId) : NaN

    const navigate = useNavigate()

    const [mode, setMode] = useState<Mode>('student')
    const [project, setProject] = useState<Project | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [mySubs, setMySubs] = useState<Record<number, Submission | null>>({})
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [editOpen, setEditOpen] = useState(false)
    const [taskCreateOpen, setTaskCreateOpen] = useState(false)
    const [taskEditOpen, setTaskEditOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)

    const [copied, setCopied] = useState(false)

    const [taskSearch, setTaskSearch] = useState('')
    const [debouncedTaskSearch, setDebouncedTaskSearch] = useState('')
    const [deadlineFilter, setDeadlineFilter] = useState<TaskDeadlineFilter>('ALL')

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedTaskSearch(taskSearch.trim())
        }, 300)

        return () => window.clearTimeout(timeout)
    }, [taskSearch])

    const load = useCallback(async (searchValue?: string, deadlineValue?: TaskDeadlineFilter) => {
        if (!projectId) return

        const pid = Number(projectId)
        if (!Number.isFinite(pid)) return

        setLoading(true)
        setErr(null)

        try {
            const normalizedSearch = searchValue?.trim() || undefined
            const effectiveDeadlineFilter = deadlineValue ?? 'ALL'

            const [my, enrolled, ts] = await Promise.all([
                projectsApi.my(),
                projectsApi.enrolled(),
                tasksApi.list(pid, {
                    search: normalizedSearch,
                    deadlineFilter: effectiveDeadlineFilter,
                }),
            ])

            const ownedProject = my.find((x) => x.id === pid) ?? null
            const enrolledProject = enrolled.find((x) => x.id === pid) ?? null
            const effectiveProject = ownedProject ?? enrolledProject
            const effectiveMode: Mode = ownedProject ? 'teacher' : 'student'

            setProject(effectiveProject)
            setMode(effectiveMode)
            setTasks(ts)

            if (!effectiveProject) {
                setMySubs({})
                setErr('Project not found')
                return
            }

            if (effectiveMode === 'student') {
                const pairs = await Promise.all(
                    ts.map(async (task: Task) => {
                        try {
                            const submission = await submissionsApi.my(pid, task.id)
                            return [task.id, submission] as const
                        } catch {
                            return [task.id, null] as const
                        }
                    })
                )

                const map: Record<number, Submission | null> = {}
                for (const [taskId, submission] of pairs) {
                    map[taskId] = submission
                }

                setMySubs(map)
            } else {
                setMySubs({})
            }
        } catch (error) {
            setErr(getApiErrorMessage(error, 'Failed to load project'))
        } finally {
            setLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        void load(debouncedTaskSearch, deadlineFilter)
    }, [load, debouncedTaskSearch, deadlineFilter])

    const deleteProject = async () => {
        if (mode !== 'teacher') return
        if (!projectId || Number.isNaN(projectIdNum)) return
        if (!confirm('Delete this project?')) return

        setLoading(true)
        setErr(null)

        try {
            await projectsApi.delete(projectIdNum)
            navigate('/')
        } catch (error) {
            setErr(getApiErrorMessage(error, 'Delete failed'))
        } finally {
            setLoading(false)
        }
    }

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
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1200)
        }
    }

    const handleProjectUpdated = (updatedProject: Project) => {
        setProject(updatedProject)
        setEditOpen(false)
        setErr(null)
    }

    const handleTaskCreated = (createdTask: Task) => {
        setTasks((currentTasks) => [createdTask, ...currentTasks])
        setTaskCreateOpen(false)
        setErr(null)
        void load(debouncedTaskSearch, deadlineFilter)
    }

    const openTaskEditor = async (task: Task) => {
        if (!Number.isFinite(projectIdNum)) return

        setLoading(true)
        setErr(null)

        try {
            const loadedTask = await tasksApi.get(projectIdNum, task.id)
            setEditingTask(loadedTask)
            setTaskEditOpen(true)
        } catch (error) {
            setErr(getApiErrorMessage(error, 'Failed to load task for editing'))
        } finally {
            setLoading(false)
        }
    }

    const handleTaskUpdated = (updatedTask: Task) => {
        setTasks((currentTasks) => currentTasks.map((task) => task.id === updatedTask.id ? updatedTask : task))
        setEditingTask(updatedTask)
        setTaskEditOpen(false)
        setErr(null)
    }

    const submittedCount = useMemo(() => Object.values(mySubs).filter(Boolean).length, [mySubs])

    const progressPct = useMemo(() => {
        const total = tasks.length
        if (total === 0) return 0
        return Math.round((submittedCount / total) * 100)
    }, [submittedCount, tasks.length])

    const projectEmoji = project?.emoji?.trim() || DEFAULT_PROJECT_EMOJI
    const isTeacher = mode === 'teacher'
    const backTo = isTeacher ? '/projects/mine' : '/projects/enrolled'
    const deadlineLabel = project?.deadline ?? 'No deadline'
    const taskFiltersActive = taskSearch.trim() || deadlineFilter !== 'ALL'
    const openTaskCount = Math.max(tasks.length - submittedCount, 0)

    return (
        <div className="page-wrap page-stack project-detail-page">
            <header className="project-detail-topline">
                <Link to={backTo} className="project-detail-back">
                    <span aria-hidden="true">&lt;-</span>
                    <span>Back</span>
                </Link>

                {loading ? (
                    <div className="project-detail-topline__meta">
                        <span className="project-detail-loading">Updating</span>
                    </div>
                ) : null}
            </header>

            {err ? <div className="alert alert--error">{err}</div> : null}

            <section className="project-detail-hero">
                <div className="project-detail-hero__content">
                    <div className="project-detail-icon-shell">
                        <div className="project-card-mark project-card-mark--emoji project-detail-emoji" aria-hidden="true">
                            <span>{projectEmoji}</span>
                        </div>
                    </div>

                    <div className="project-detail-copy">
                        <h1 className="project-detail-name">{project?.name ?? (loading ? 'Loading...' : 'Project')}</h1>
                        <p className="project-detail-description">{project?.description ?? 'No description'}</p>

                        <div className="project-detail-metrics" aria-label="Project summary">
                            <span className="project-detail-metric">
                                <span>Deadline</span>
                                <strong>{deadlineLabel}</strong>
                            </span>
                            <span className="project-detail-metric">
                                <span>Tasks</span>
                                <strong>{tasks.length}</strong>
                            </span>
                            {!isTeacher ? (
                                <span className="project-detail-metric">
                                    <span>Submitted</span>
                                    <strong>{submittedCount}/{tasks.length}</strong>
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>

                {isTeacher ? (
                    <div className="project-detail-command">
                        <div className="project-detail-command__actions">
                            <button
                                className="btn btn--ghost"
                                onClick={() => setEditOpen(true)}
                                disabled={loading || !project}
                                type="button"
                            >
                                Edit project
                            </button>

                            <button className="btn btn--danger" onClick={deleteProject} disabled={loading} type="button">
                                Delete
                            </button>
                        </div>
                    </div>
                ) : null}
            </section>

            <div className="project-detail-shell">
                <aside className="project-detail-rail" aria-label="Project status">
                    <section className="project-rail-panel">
                        <div className="project-rail-title">Project details</div>
                        <div className="project-rail-row">
                            <span>Deadline</span>
                            <strong>{deadlineLabel}</strong>
                        </div>
                        <div className="project-rail-row">
                            <span>Total tasks</span>
                            <strong>{tasks.length}</strong>
                        </div>
                        {!isTeacher ? (
                            <>
                                <div className="project-rail-row">
                                    <span>Open tasks</span>
                                    <strong>{openTaskCount}</strong>
                                </div>
                                <div className="project-rail-progress">
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                                    </div>
                                    <span>{progressPct}% complete</span>
                                </div>
                            </>
                        ) : (
                            <p className="project-rail-note">
                                Create tasks, review submissions, and keep the project clear for students.
                            </p>
                        )}
                    </section>

                    {project?.joinCode ? (
                        <section className="project-rail-panel project-rail-panel--code">
                            <div className="project-rail-title">Invite code</div>
                            <button
                                type="button"
                                className="project-rail-code"
                                onClick={() => void copy(project.joinCode ?? '')}
                            >
                                {copied ? 'Copied' : project.joinCode}
                            </button>
                        </section>
                    ) : null}
                </aside>

                <main className="project-detail-main">
                    <div className="project-detail-main__head">
                        <div className="project-tasks-head">
                            <div>
                                <h2 className="project-tasks-head__title">Tasks</h2>
                                <p className="project-tasks-head__text">
                                    Search, open, submit, and review assignments in this project.
                                </p>
                            </div>

                            <div className="project-tasks-head__actions">
                                {isTeacher ? (
                                    <button
                                        className="btn btn--primary"
                                        onClick={() => setTaskCreateOpen(true)}
                                        disabled={loading || !project}
                                        type="button"
                                    >
                                        Create task
                                    </button>
                                ) : null}

                                <button
                                    className="btn btn--ghost"
                                    onClick={() => void load(debouncedTaskSearch, deadlineFilter)}
                                    disabled={loading}
                                    type="button"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="project-detail-main__body">
                        <div className="project-task-toolbar">
                            <input
                                className="inp project-task-toolbar__search"
                                value={taskSearch}
                                onChange={(event) => setTaskSearch(event.target.value)}
                                placeholder="Search tasks by title..."
                            />

                            <select
                                className="inp project-task-toolbar__filter"
                                value={deadlineFilter}
                                onChange={(event) => setDeadlineFilter(event.target.value as TaskDeadlineFilter)}
                            >
                                <option value="ALL">All deadlines</option>
                                <option value="UPCOMING">Upcoming</option>
                                <option value="OVERDUE">Overdue</option>
                                <option value="NO_DEADLINE">No deadline</option>
                            </select>

                            {taskFiltersActive ? (
                                <button
                                    type="button"
                                    className="btn btn--ghost"
                                    onClick={() => {
                                        setTaskSearch('')
                                        setDeadlineFilter('ALL')
                                    }}
                                >
                                    Clear
                                </button>
                            ) : null}
                        </div>

                        {tasks.length === 0 ? (
                            <div className="empty project-empty-state">
                                <div className="empty-icon">TS</div>
                                <div className="empty-text">No tasks found</div>
                                <div className="empty-sub">
                                    {taskFiltersActive
                                        ? 'Try another task title or change the deadline filter.'
                                        : isTeacher
                                            ? 'Create your first task.'
                                            : 'Ask your teacher to add tasks.'}
                                </div>
                            </div>
                        ) : (
                            <div className="project-task-list">
                                {tasks.map((task: Task) => {
                                    const submission = mySubs[task.id]

                                    return (
                                        <article key={task.id} className="project-task-item">
                                            <div className="project-task-item__main">
                                                <div className="project-task-item__top">
                                                    <h3>{task.title}</h3>
                                                    {!isTeacher ? (
                                                        <span className={submission ? 'status-pill st-done' : 'status-pill st-open'}>
                                                            {submission ? 'Submitted' : 'Not submitted'}
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <p>{task.description || 'No description'}</p>

                                                <div className="project-task-item__meta">
                                                    <span>{task.deadline || 'No deadline'}</span>
                                                    <span>{task.maxScore} pts</span>
                                                    {!isTeacher ? (
                                                        <>
                                                            <span>Teacher: {submission?.teacherScore ?? '-'}</span>
                                                            <span>AI: {submission?.aiScore ?? '-'}</span>
                                                        </>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="project-task-item__actions">
                                                {isTeacher ? (
                                                    <>
                                                        <Link
                                                            to={`/projects/${projectId}/tasks/${task.id}`}
                                                            state={{ mode }}
                                                            className="btn btn--ghost"
                                                        >
                                                            Open
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            className="btn btn--ghost"
                                                            onClick={() => void openTaskEditor(task)}
                                                            disabled={loading}
                                                        >
                                                            Edit
                                                        </button>

                                                        <Link
                                                            to={`/projects/${projectId}/tasks/${task.id}/submissions`}
                                                            state={{ mode }}
                                                            className="btn btn--primary"
                                                        >
                                                            Submissions
                                                        </Link>
                                                    </>
                                                ) : (
                                                    <Link
                                                        to={`/projects/${projectId}/tasks/${task.id}`}
                                                        state={{ mode }}
                                                        className="btn btn--primary"
                                                    >
                                                        Submit
                                                    </Link>
                                                )}
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <ProjectEditModal
                open={editOpen}
                project={project}
                onClose={() => setEditOpen(false)}
                onUpdated={handleProjectUpdated}
            />

            <TaskCreateModal
                open={taskCreateOpen}
                projectId={projectIdNum}
                onClose={() => setTaskCreateOpen(false)}
                onCreated={handleTaskCreated}
            />

            <TaskEditModal
                open={taskEditOpen}
                projectId={projectIdNum}
                task={editingTask}
                onClose={() => setTaskEditOpen(false)}
                onUpdated={handleTaskUpdated}
            />
        </div>
    )
}
