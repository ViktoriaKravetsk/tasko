import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
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

    const refresh = useCallback(async () => {
        try {
            const data = await authApi.me()
            setMe(data)
        } catch {
            setMe(null)
        } finally {
            setIsReady(true)
        }
    }, [])

    useEffect(() => {
        void refresh()
    }, [refresh])

    const loginWithGoogle = useCallback(() => {
        window.location.href = 'http://localhost:8083/oauth2/authorization/google'
    }, [])

    const logout = useCallback(async () => {
        try {
            await authApi.logout()
        } finally {
            setMe(null)
            window.location.href = '/login'
        }
    }, [])

    const value = useMemo<AuthState>(
        () => ({ isReady, me, loginWithGoogle, logout, refresh }),
        [isReady, me, loginWithGoogle, logout, refresh]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}