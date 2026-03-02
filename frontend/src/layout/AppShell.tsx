import { Outlet, NavLink } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import './shell-retro.css'

type Particle = {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    emoji: string
    size: number
    rot: number
    rotv: number
}

const EMOJIS = ['⭐', '🌸', '✦', '★', '💛', '🌼', '✿', '🌿']

export default function AppShell() {
    const auth = useAuth()
    const [open, setOpen] = useState(false)

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const particlesRef = useRef<Particle[]>([])
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        const spawn = (x: number, y: number, n: number) => {
            for (let i = 0; i < n; i++) {
                const angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.7
                const speed = 2 + Math.random() * 4
                particlesRef.current.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    life: 1,
                    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
                    size: 12 + Math.random() * 10,
                    rot: Math.random() * Math.PI * 2,
                    rotv: (Math.random() - 0.5) * 0.22,
                })
            }
        }

        const onClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null
            if (!target) return
            if (target.closest('input,textarea,button,a,[role="button"],.drawer')) return
            spawn(e.clientX, e.clientY, 10)
        }
        window.addEventListener('click', onClick)

        const animate = () => {
            const w = canvas.width
            const h = canvas.height
            ctx.clearRect(0, 0, w, h)

            const ps = particlesRef.current.filter((p) => p.life > 0)
            particlesRef.current = ps

            for (const p of ps) {
                ctx.save()
                ctx.globalAlpha = p.life
                ctx.font = `${p.size}px serif`
                ctx.translate(p.x, p.y)
                ctx.rotate(p.rot)
                ctx.fillText(p.emoji, -p.size / 2, p.size / 2)
                ctx.restore()

                p.x += p.vx
                p.y += p.vy
                p.vy += 0.19
                p.life -= 0.026
                p.rot += p.rotv
            }

            rafRef.current = window.requestAnimationFrame(animate)
        }

        rafRef.current = window.requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('resize', resize)
            window.removeEventListener('click', onClick)
            if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
        }
    }, [])

    return (
        <div className={open ? 'shell shell--open' : 'shell'}>
            {/* background decor (хмарки/сонце) */}
            <div className="bg-layer" aria-hidden="true">
                <div className="cloud cl1" />
                <div className="cloud cl2" />
                <div className="cloud cl3" />
                <div className="cloud cl4" />
                <div className="sun" />
            </div>

            {/* flowers */}
            <div className="flowers" aria-hidden="true">
                <div className="flower f1">
                    <div className="head" />
                    <div className="stem" />
                </div>
                <div className="flower f2">
                    <div className="head" />
                    <div className="stem" />
                </div>
                <div className="flower f3">
                    <div className="head" />
                    <div className="stem" />
                </div>
                <div className="flower f4">
                    <div className="head" />
                    <div className="stem" />
                </div>
                <div className="flower f5">
                    <div className="head" />
                    <div className="stem" />
                </div>
                <div className="flower f6">
                    <div className="head" />
                    <div className="stem" />
                </div>
                <div className="flower f7">
                    <div className="head" />
                    <div className="stem" />
                </div>
                <div className="flower f8">
                    <div className="head" />
                    <div className="stem" />
                </div>
            </div>

            <canvas ref={canvasRef} id="sparkleCanvas" />

            <header className="topbar">
                <div className="topbar__left">
                    <button className="iconbtn" onClick={() => setOpen(true)} aria-label="Open menu">
                        ☰
                    </button>

                    <div className="brand">
                        <div className="brand__logo">T</div>
                        <div>
                            <div className="brand__name">Tasko</div>
                            <div className="brand__tag">place where your projects live</div>
                        </div>
                    </div>
                </div>

                <div className="user">
                    {auth.me?.avatarUrl ? (
                        <img className="user__avatar" src={auth.me.avatarUrl} alt="avatar" />
                    ) : (
                        <div className="user__avatar user__avatar--fallback">🙂</div>
                    )}
                    <div className="user__meta">
                        <div className="user__name">{auth.me?.name ?? 'User'}</div>
                        <div className="user__email">{auth.me?.email ?? ''}</div>
                    </div>

                    <button className="iconbtn" onClick={() => auth.logout()} aria-label="Logout">
                        ⎋
                    </button>
                </div>
            </header>

            <div className="overlay" onClick={() => setOpen(false)} />

            <aside className="drawer" aria-label="Menu">
                <div className="drawer__head">
                    <div className="drawer__title">MENU</div>
                    <button className="iconbtn" onClick={() => setOpen(false)} aria-label="Close menu">
                        ✖
                    </button>
                </div>

                <NavLink to="/" className={({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')} onClick={() => setOpen(false)}>
                    🏠 PROJECTS
                </NavLink>

                <NavLink
                    to="/profile"
                    className={({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')}
                    onClick={() => setOpen(false)}
                >
                    👤 PROFILE
                </NavLink>

                <button className="navlink" onClick={() => auth.logout()}>
                    🚪 LOGOUT
                </button>

                <div className="drawer__hint">Retro sky • flowers • sparkles</div>
            </aside>

            <main className="content">
                <Outlet />
            </main>
        </div>
    )
}