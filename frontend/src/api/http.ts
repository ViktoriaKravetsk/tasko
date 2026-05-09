const API_BASE = ''

export class ApiError extends Error {
    status: number
    statusText: string
    data: unknown

    constructor(status: number, statusText: string, message: string, data: unknown = null) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.statusText = statusText
        this.data = data
    }
}

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
}

function getErrorMessage(data: unknown, fallback: string): string {
    if (data && typeof data === 'object' && 'message' in data) {
        const message = (data as { message?: unknown }).message

        if (typeof message === 'string' && message.trim()) {
            return message
        }
    }

    if (typeof data === 'string' && data.trim()) {
        return data
    }

    return fallback
}

export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
    const method = (init.method ?? 'GET').toUpperCase()
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

    const headers: Record<string, string> = {
        ...(init.headers as Record<string, string> | undefined),
    }

    if (init.body != null && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
    }

    if (isStateChanging) {
        const token = getCookie('XSRF-TOKEN')
        if (token) headers['X-XSRF-TOKEN'] = token
    }

    const res = await fetch(API_BASE + url, {
        ...init,
        credentials: 'include',
        headers,
    })

    const ct = res.headers.get('content-type') || ''

    if (!res.ok) {
        let data: unknown = null

        if (ct.includes('application/json')) {
            data = await res.json().catch(() => null)
        } else {
            data = await res.text().catch(() => '')
        }

        throw new ApiError(
            res.status,
            res.statusText,
            getErrorMessage(data, `${res.status} ${res.statusText}`),
            data
        )
    }

    if (!ct.includes('application/json')) return undefined as T

    return (await res.json()) as T
}