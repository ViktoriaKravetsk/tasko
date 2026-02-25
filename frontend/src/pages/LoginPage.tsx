import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
    const auth = useAuth()

    if (!auth.isReady) {
        return (
            <div className="card">
                <h1>Tasko</h1>
                <div className="small">Loading…</div>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: 520, margin: '0 auto', paddingTop: 40 }}>
            <div className="card">
                <h1>Tasko</h1>
                <div className="small" style={{ marginTop: 10 }}>
                    Login
                </div>

                <div className="card card--soft" style={{ marginTop: 14 }}>
                    <div className="small">
                        Sign in to view your projects, tasks, and courses.
                    </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn btn--primary" onClick={auth.loginWithGoogle}>
                        Login
                    </button>
                </div>
            </div>
        </div>
    )
}