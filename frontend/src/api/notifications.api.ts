import { api } from './http'

export type AppNotification = {
    id: number
    type:
        | 'TASK_CREATED'
        | 'TASK_GRADED'
        | 'SUBMISSION_CREATED'
        | 'SUBMISSION_UPDATED'
        | 'SUBMISSION_RESUBMITTED_AFTER_GRADE'
        | 'DEADLINE_REMINDER'
    title: string
    message: string
    href?: string | null
    relatedEntityId?: number | null
    readAt?: string | null
    createdAt?: string | null
}

export const notificationsApi = {
    list: () => api<AppNotification[]>('/api/notifications'),

    unreadCount: () => api<number>('/api/notifications/unread-count'),

    markRead: (notificationId: number) =>
        api<AppNotification>(`/api/notifications/${notificationId}/read`, {
            method: 'PUT',
        }),

    markAllRead: () =>
        api<void>('/api/notifications/read-all', {
            method: 'PUT',
        }),

    delete: (notificationId: number) =>
        api<void>(`/api/notifications/${notificationId}`, {
            method: 'DELETE',
        }),
}
