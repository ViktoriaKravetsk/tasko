import { api } from './http'
import type { ProjectProgress } from './types'

export const progressApi = {
    my: (projectId: number) =>
        api<ProjectProgress>(`/api/projects/${projectId}/progress/me`),
}