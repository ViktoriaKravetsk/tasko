import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
    const auth = useAuth()

    if (!auth.isReady) return <div className="page-wrap"><div className="panel"><div className="panel-body">Loading…</div></div></div>

    return (
        <>
            <div className="bg-layer" aria-hidden="true">
                <div className="cloud cl1" />
                <div className="cloud cl2" />
                <div className="cloud cl3" />
                <div className="sun" />
            </div>

            <div className="flowers" aria-hidden="true">
                <div className="flower f1"><div className="head" /><div className="stem" /></div>
                <div className="flower f2"><div className="head" /><div className="stem" /></div>
                <div className="flower f3"><div className="head" /><div className="stem" /></div>
                <div className="flower f4"><div className="head" /><div className="stem" /></div>
            </div>

            <div className="page-wrap" style={{ minHeight: 'calc(100vh - 40px)', display: 'grid', placeItems: 'center' }}>
                <div className="panel" style={{ width: 'min(420px, 92vw)' }}>
                    <div className="panel-header">
                        <div style={{ fontSize: 22 }}>✦</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h2 className="panel-title" style={{ margin: 0 }}>Привіт! 👋</h2>
                            <div className="panel-sub">Увійди, щоб продовжити пригоду</div>
                        </div>
                    </div>

                    <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
                        <button className="btn btn--primary" onClick={auth.loginWithGoogle} style={{ width: '100%' }}>
                            Увійти через Google
                        </button>

                        <div style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 700, fontSize: '.85rem' }}>
                            Реєструючись, ти погоджуєшся з Умовами та Приватністю
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}