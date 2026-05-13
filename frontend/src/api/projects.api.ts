import { api } from './http'

export type Project = {
    id: number
    name: string
    emoji?: string | null
    description?: string | null
    deadline?: string | null
    joinCode: string
}

export type ProjectCreateRequest = {
    name: string
    emoji?: string | null
    description?: string | null
    deadline?: string | null
}

export type ProjectUpdateRequest = ProjectCreateRequest

export type JoinByCodeRequest = {
    joinCode: string
}

export type ProjectPageResponse = {
    items: Project[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
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

    myPage: (options: { search?: string; page?: number; size?: number } = {}) =>
        api<ProjectPageResponse>(`/api/projects/my/page${buildQuery({
            search: options.search?.trim() || undefined,
            page: String(options.page ?? 0),
            size: String(options.size ?? 9),
        })}`),

    enrolled: (search?: string) =>
        api<Project[]>(`/api/projects/enrolled${buildQuery({ search: search?.trim() || undefined })}`),

    create: (body: ProjectCreateRequest) =>
        api<Project>('/api/projects', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    update: (projectId: number, body: ProjectUpdateRequest) =>
        api<Project>(`/api/projects/${projectId}`, {
            method: 'PUT',
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
