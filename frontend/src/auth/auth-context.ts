import { createContext } from 'react'
import type { Me } from '../api/types'

export type AuthState = {
    isReady: boolean
    me: Me | null
    loginWithGoogle: () => void
    logout: () => Promise<void>
    refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
