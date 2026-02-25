import { api } from './http'
import type { Me } from './types'

export const authApi = {
    me: () => api<Me>('/api/me'),
    logout: () => api<void>('/logout', { method: 'POST' }),
}