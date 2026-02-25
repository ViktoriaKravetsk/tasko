import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/auth.api'
import type { Me } from '../api/types'

type AuthState = {
    isReady: boolean
    me: Me | null
    loginWithGoogle: () => void
    logout: () => Promise<void>
    refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false)
    const [me, setMe] = useState<Me | null>(null)

    const refresh = async () => {
        try {
            const data = await authApi.me()
            setMe(data)
        } catch {
            setMe(null)
        } finally {
            setIsReady(true)
        }
    }

    useEffect(() => {
        void refresh()
    }, [])

    const loginWithGoogle = () => {
        // через Vite proxy, без CORS
        window.location.href = 'http://localhost:8083/oauth2/authorization/google'
    }

    const logout = async () => {
        try {
            await authApi.logout()
        } finally {
            setMe(null)
            window.location.href = '/login'
        }
    }

    const value = useMemo<AuthState>(() => ({ isReady, me, loginWithGoogle, logout, refresh }), [isReady, me])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}