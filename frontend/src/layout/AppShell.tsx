import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { BackgroundDecor } from './BackgroundDecor'
import './shell-retro.css'

type Petal = {
    x: number
    y: number
    vx: number
    vy: number
    rot: number
    vrot: number
    life: number
    size: number
    color: string
    kind: 'petal' | 'flower'
}

const COLORS = ['#f3a8c8', '#f6d67a', '#bfa2f3', '#98d4ef', '#abd99b', '#f7c4a8']

export default function AppShell() {
    const auth = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const petalsRef = useRef<Petal[]>([])
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
            const ratio = window.devicePixelRatio || 1
            canvas.width = Math.floor(window.innerWidth * ratio)
            canvas.height = Math.floor(window.innerHeight * ratio)
            canvas.style.width = `${window.innerWidth}px`
            canvas.style.height = `${window.innerHeight}px`
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
        }

        resize()
        window.addEventListener('resize', resize)

        const spawnFlowers = (x: number, y: number, count: number) => {
            for (let i = 0; i < count; i += 1) {
                petalsRef.current.push({
                    x,
                    y,
                    vx: (Math.random() - 0.5) * 2.6,
                    vy: -1.5 - Math.random() * 2.2,
                    rot: Math.random() * Math.PI * 2,
                    vrot: (Math.random() - 0.5) * 0.18,
                    life: 1,
                    size: 5 + Math.random() * 7,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    kind: Math.random() > 0.7 ? 'flower' : 'petal',
                })
            }
        }

        const onPointer = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null
            if (!target) return
            if (target.closest('input,textarea,button,a,[role="button"],.drawer')) return
            spawnFlowers(e.clientX, e.clientY, 14)
        }

        window.addEventListener('click', onPointer)

        const drawPetal = (p: Petal) => {
            ctx.save()
            ctx.translate(p.x, p.y)
            ctx.rotate(p.rot)
            ctx.globalAlpha = p.life

            if (p.kind === 'flower') {
                for (let i = 0; i < 5; i += 1) {
                    ctx.save()
                    ctx.rotate((Math.PI * 2 * i) / 5)
                    ctx.fillStyle = p.color
                    ctx.beginPath()
                    ctx.ellipse(0, -p.size * 0.9, p.size * 0.55, p.size * 0.9, 0, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.restore()
                }

                ctx.fillStyle = '#f8e7a1'
                ctx.beginPath()
                ctx.arc(0, 0, p.size * 0.42, 0, Math.PI * 2)
                ctx.fill()
            } else {
                ctx.fillStyle = p.color
                ctx.beginPath()
                ctx.ellipse(0, 0, p.size * 0.65, p.size, 0, 0, Math.PI * 2)
                ctx.fill()
            }

            ctx.restore()
        }

        const render = () => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

            petalsRef.current = petalsRef.current.filter((p) => p.life > 0)

            for (const p of petalsRef.current) {
                drawPetal(p)
                p.x += p.vx
                p.y += p.vy
                p.vy += 0.045
                p.rot += p.vrot
                p.life -= 0.018
            }

            rafRef.current = window.requestAnimationFrame(render)
        }

        rafRef.current = window.requestAnimationFrame(render)

        return () => {
            window.removeEventListener('resize', resize)
            window.removeEventListener('click', onPointer)
            if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
        }
    }, [])

    const goToProfile = () => {
        setOpen(false)
        navigate('/profile')
    }

    return (
        <div className={open ? 'shell shell--open' : 'shell'}>
            <BackgroundDecor />
            <canvas ref={canvasRef} id="sparkleCanvas" />

            <header className="topbar">
                <div className="topbar__left">
                    <button className="iconbtn" onClick={() => setOpen(true)} aria-label="Open menu">
                        ☰
                    </button>

                    <div className="brand">
                        <div className="brand__logo">T</div>

                        <button
                            type="button"
                            className="brand__name brand__name-link"
                            onClick={() => {
                                setOpen(false)
                                navigate('/projects')
                            }}
                            aria-label="Go to home page"
                        >
                            Tasko
                        </button>
                    </div>
                </div>

                <div className="topbar__center" />

                <div className="user">
                    <button
                        type="button"
                        className="user__profile-link"
                        onClick={goToProfile}
                        aria-label="Редагувати профіль"
                    >
                        {auth.me?.avatarUrl ? (
                            <img className="user__avatar" src={auth.me.avatarUrl} alt="avatar" />
                        ) : (
                            <span className="user__avatar user__avatar--fallback">🙂</span>
                        )}

                        <span className="user__meta">
            <span className="user__name">{auth.me?.name ?? 'User'}</span>
            <span className="user__email">{auth.me?.email ?? ''}</span>
        </span>
                    </button>
                </div>
            </header>

            <div className="overlay" onClick={() => setOpen(false)} />

            <aside className="drawer" aria-label="Menu">
                <div className="drawer__head">
                    <div className="drawer__title">MENU</div>
                    <button className="iconbtn" onClick={() => setOpen(false)} aria-label="Close menu">
                        ✕
                    </button>
                </div>

                <NavLink
                    to="/projects"
                    className={({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')}
                    onClick={() => setOpen(false)}
                >
                    🏠 Projects
                </NavLink>

                <NavLink
                    to="/projects/mine"
                    className={({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')}
                    onClick={() => setOpen(false)}
                >
                    📁 My Projects
                </NavLink>

                <NavLink
                    to="/projects/enrolled"
                    className={({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')}
                    onClick={() => setOpen(false)}
                >
                    🎒 Participating Projects
                </NavLink>


                <NavLink
                    to="/profile"
                    className={({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')}
                    onClick={() => setOpen(false)}
                >
                    👤 Profile
                </NavLink>

                <button className="navlink" onClick={() => auth.logout()}>
                    🚪 Logout
                </button>
            </aside>

            <main className="content">
                <Outlet />
            </main>
        </div>
    )
}