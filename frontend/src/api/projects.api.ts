import { api } from './http'

export type Project = {
    id: number
    name: string
    description?: string | null
    deadline?: string | null
    joinCode: string
}

export type ProjectCreateRequest = {
    name: string
    description?: string | null
    deadline?: string | null
}

export type JoinByCodeRequest = {
    joinCode: string
}

export const projectsApi = {
    my: () => api<Project[]>('/api/projects/my'),
    enrolled: () => api<Project[]>('/api/projects/enrolled'),

    create: (body: ProjectCreateRequest) =>
        api<Project>('/api/projects', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    joinByCode: (body: JoinByCodeRequest) =>
        api<Project>('/api/projects/join', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    delete: (projectId: number) =>
        api<void>(`/api/projects/${projectId}`, {
            method: 'DELETE',
        }),

    leave: (projectId: number) =>
        api<void>(`/api/projects/${projectId}/leave`, {
            method: 'POST',
        }),
}