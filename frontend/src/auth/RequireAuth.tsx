import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const auth = useAuth()

    if (!auth.isReady) return <div style={{ padding: 24 }}>Loading...</div>
    if (!auth.me) return <Navigate to="/login" replace />

    return <>{children}</>
}
