import { api } from './http'
import type { Task } from './types'

export type TaskCreateRequest = {
    title: string
    description?: string | null
    deadline?: string | null
    maxScore: number
}

export const tasksApi = {
    list: (projectId: number) =>
        api<Task[]>(`/api/projects/${projectId}/tasks`),

    get: (projectId: number, taskId: number) =>
        api<Task>(`/api/projects/${projectId}/tasks/${taskId}`),

    create: (projectId: number, body: TaskCreateRequest) =>
        api<Task>(`/api/projects/${projectId}/tasks`, {
            method: 'POST',
            body: JSON.stringify(body),
        }),
}