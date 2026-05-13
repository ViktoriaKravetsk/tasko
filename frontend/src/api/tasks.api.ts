import { api } from './http'
import type { Task } from './types'

export type TaskCreateRequest = {
    title: string
    description?: string | null
    deadline?: string | null
    maxScore: number
    allowResubmissionAfterGrade?: boolean
}

export type TaskDeadlineFilter = 'ALL' | 'UPCOMING' | 'OVERDUE' | 'NO_DEADLINE'

function buildQuery(params: Record<string, string | undefined | null>) {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value != null && value !== '') {
            searchParams.set(key, value)
        }
    })

    const query = searchParams.toString()
    return query ? `?${query}` : ''
}

export const tasksApi = {
    list: (
        projectId: number,
        options?: { search?: string; deadlineFilter?: TaskDeadlineFilter }
    ) =>
        api<Task[]>(
            `/api/projects/${projectId}/tasks${buildQuery({
                search: options?.search?.trim() || undefined,
                deadlineFilter:
                    options?.deadlineFilter && options.deadlineFilter !== 'ALL'
                        ? options.deadlineFilter
                        : undefined,
            })}`
        ),

    get: (projectId: number, taskId: number) =>
        api<Task>(`/api/projects/${projectId}/tasks/${taskId}`),

    create: (projectId: number, body: TaskCreateRequest) =>
        api<Task>(`/api/projects/${projectId}/tasks`, {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    delete: (projectId: number, taskId: number) =>
        api<void>(`/api/projects/${projectId}/tasks/${taskId}`, {
            method: 'DELETE',
        }),
}
