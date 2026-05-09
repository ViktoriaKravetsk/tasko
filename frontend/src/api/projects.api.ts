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

export const projectsApi = {
    my: (search?: string) =>
        api<Project[]>(`/api/projects/my${buildQuery({ search: search?.trim() || undefined })}`),

    enrolled: (search?: string) =>
        api<Project[]>(`/api/projects/enrolled${buildQuery({ search: search?.trim() || undefined })}`),

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