const API_BASE = ''

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
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

    if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `${res.status} ${res.statusText}`)
    }

    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) return undefined as T
    return (await res.json()) as T
}