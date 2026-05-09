import { api } from './http'
import type { Submission, SubmissionShort } from './types'

export type SubmitRequest = {
    textAnswer?: string | null
    fileLink?: string | null
}

export type GradeRequest = {
    teacherScore: number
    teacherComment?: string | null
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

export const submissionsApi = {
    my: (projectId: number, taskId: number) =>
        api<Submission | null>(`/api/projects/${projectId}/tasks/${taskId}/submission/me`),

    submit: (projectId: number, taskId: number, body: SubmitRequest) =>
        api<Submission>(`/api/projects/${projectId}/tasks/${taskId}/submission`, {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    listByTask: (projectId: number, taskId: number, search?: string) =>
        api<SubmissionShort[]>(
            `/api/projects/${projectId}/tasks/${taskId}/submissions${buildQuery({
                search: search?.trim() || undefined,
            })}`
        ),

    getById: (projectId: number, taskId: number, submissionId: number) =>
        api<Submission>(`/api/projects/${projectId}/tasks/${taskId}/submissions/${submissionId}`),

    grade: (projectId: number, taskId: number, submissionId: number, body: GradeRequest) =>
        api<Submission>(`/api/projects/${projectId}/tasks/${taskId}/submissions/${submissionId}/grade`, {
            method: 'PUT',
            body: JSON.stringify(body),
        }),

    reEvaluateAi: (projectId: number, taskId: number, submissionId: number) =>
        api<Submission>(`/api/projects/${projectId}/tasks/${taskId}/submissions/${submissionId}/ai-evaluate`, {
            method: 'POST',
        }),
}