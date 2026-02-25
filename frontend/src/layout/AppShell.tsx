import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './shell-retro.css'

function cx({ isActive }: { isActive: boolean }) {
    return isActive ? 'navlink navlink--active' : 'navlink'
}

export default function AppShell() {
    const auth = useAuth()

    return (
        <div className="shell">
            <header className="topbar">
                <div className="brand">
                    <div className="brand__logo">T</div>
                    <div>
                        <div className="brand__name">Tasko</div>
                        <div className="brand__tag">place where your projects live</div>
                    </div>
                </div>

                <div className="user">
                    {auth.me?.avatarUrl ? (
                        <img className="user__avatar" src={auth.me.avatarUrl} alt="avatar" />
                    ) : (
                        <div className="user__avatar user__avatar--fallback">
                            {(auth.me?.name?.[0] ?? auth.me?.email?.[0] ?? 'U').toUpperCase()}
                        </div>
                    )}
                    <div className="user__meta">
                        <div className="user__name">{auth.me?.name ?? 'User'}</div>
                        <div className="user__email">{auth.me?.email ?? ''}</div>
                    </div>

                    <button className="btn btn--ghost" onClick={() => void auth.logout()}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="body">
                <aside className="sidebar">
                    <div className="sidebar__block">
                        <div className="sidebar__title">Menu</div>
                        <NavLink to="/" className={cx}>Projects</NavLink>
                    </div>


                </aside>

                <main className="content">
                    <div className="page">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}