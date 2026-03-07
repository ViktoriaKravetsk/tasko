import { useAuth } from '../auth/AuthContext'
import { BackgroundDecor } from '../layout/BackgroundDecor'

export default function LoginPage() {
    const auth = useAuth()

    if (!auth.isReady) {
        return (
            <div className="page-wrap login-screen">
                <div className="panel login-panel">
                    <div className="panel-body">Loading…</div>
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
                        <div className="login-panel__star">✦</div>
                        <div>
                            <h2 className="panel-title login-panel__title">Привіт! 👋</h2>
                            <div className="panel-sub">Увійди, щоб продовжити пригоду</div>
                        </div>
                    </div>

                    <div className="panel-body login-panel__body">
                        <button className="btn btn--primary login-panel__button" onClick={auth.loginWithGoogle}>
                            Увійти через Google
                        </button>


                    </div>
                </div>
            </div>
        </>
    )
}