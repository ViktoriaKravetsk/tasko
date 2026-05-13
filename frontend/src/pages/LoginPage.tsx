import { useAuth } from '../auth/useAuth'
import { BackgroundDecor } from '../layout/BackgroundDecor'

export default function LoginPage() {
    const auth = useAuth()

    if (!auth.isReady) {
        return (
            <div className="page-wrap login-screen">
                <div className="panel login-panel">
                    <div className="panel-body">Loading...</div>
                </div>
            </div>
        )
    }

    return (
        <>
            <BackgroundDecor />

            <div className="page-wrap login-screen">
                <div className="panel login-panel">
                    <div className="panel-header login-panel__header">
                        <div className="login-panel__title-row">
                            <span className="login-panel__star">✦</span>
                            <h2 className="panel-title login-panel__title">Welcome! 👋</h2>
                        </div>

                        <div className="panel-sub login-panel__subtitle">
                            Sign in to continue work
                        </div>
                    </div>

                    <div className="panel-body login-panel__body">
                        <button
                            className="btn btn--primary login-panel__button"
                            onClick={auth.loginWithGoogle}
                        >
                            Sign in with Google
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
