import { api } from './http'
import type { Me } from './types'

export type UserUpdateRequest = {
    name?: string
    avatarUrl?: string
}

export const authApi = {
    me: () => api<Me>('/api/me'),
    logout: () => api<void>('/logout', { method: 'POST' }),
    updateProfile: (body: UserUpdateRequest) =>
        api<Me>('/api/me', {
            method: 'PATCH',
            body: JSON.stringify(body),
        }),
}