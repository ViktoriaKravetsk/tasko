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
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
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
            for (let index = 0; index < count; index += 1) {
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

        const onPointer = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null
            if (!target) return
            if (target.closest('input,textarea,button,a,[role="button"],.drawer')) return
            spawnFlowers(event.clientX, event.clientY, 14)
        }

        window.addEventListener('click', onPointer)

        const drawPetal = (petal: Petal) => {
            ctx.save()
            ctx.translate(petal.x, petal.y)
            ctx.rotate(petal.rot)
            ctx.globalAlpha = petal.life

            if (petal.kind === 'flower') {
                for (let index = 0; index < 5; index += 1) {
                    ctx.save()
                    ctx.rotate((Math.PI * 2 * index) / 5)
                    ctx.fillStyle = petal.color
                    ctx.beginPath()
                    ctx.ellipse(0, -petal.size * 0.9, petal.size * 0.55, petal.size * 0.9, 0, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.restore()
                }

                ctx.fillStyle = '#f8e7a1'
                ctx.beginPath()
                ctx.arc(0, 0, petal.size * 0.42, 0, Math.PI * 2)
                ctx.fill()
            } else {
                ctx.fillStyle = petal.color
                ctx.beginPath()
                ctx.ellipse(0, 0, petal.size * 0.65, petal.size, 0, 0, Math.PI * 2)
                ctx.fill()
            }

            ctx.restore()
        }

        const render = () => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

            petalsRef.current = petalsRef.current.filter((petal) => petal.life > 0)

            for (const petal of petalsRef.current) {
                drawPetal(petal)
                petal.x += petal.vx
                petal.y += petal.vy
                petal.vy += 0.045
                petal.rot += petal.vrot
                petal.life -= 0.018
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
                    <button
                        className="iconbtn iconbtn--text"
                        onClick={() => setOpen((current) => !current)}
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                    >
                        <span className="topbar-menu-icon" aria-hidden="true" />
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
                        aria-label="Edit profile"
                    >
                        {auth.me?.avatarUrl ? (
                            <img className="user__avatar" src={auth.me.avatarUrl} alt="avatar" />
                        ) : (
                            <span className="user__avatar user__avatar--fallback">U</span>
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
                    <div className="drawer__title">Menu</div>
                    <button className="iconbtn iconbtn--text" onClick={() => setOpen(false)} aria-label="Close menu">
                        Close
                    </button>
                </div>

                <NavLink
                    to="/projects"
                    className={({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')}
                    onClick={() => setOpen(false)}
                >
                    <span className="navlink__icon navlink__icon--projects" aria-hidden="true" />
                    <span>Projects</span>
                </NavLink>

                <NavLink
                    to="/projects/mine"
                    className={({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')}
                    onClick={() => setOpen(false)}
                >
                    <span className="navlink__icon navlink__icon--mine" aria-hidden="true" />
                    <span>My Projects</span>
                </NavLink>

                <NavLink
                    to="/projects/enrolled"
                    className={({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')}
                    onClick={() => setOpen(false)}
                >
                    <span className="navlink__icon navlink__icon--enrolled" aria-hidden="true" />
                    <span>Participating Projects</span>
                </NavLink>

                <NavLink
                    to="/profile"
                    className={({ isActive }) => (isActive ? 'navlink navlink--active' : 'navlink')}
                    onClick={() => setOpen(false)}
                >
                    <span className="navlink__icon navlink__icon--profile" aria-hidden="true" />
                    <span>Profile</span>
                </NavLink>

                <button className="navlink navlink--logout" onClick={() => auth.logout()}>
                    <span className="navlink__icon navlink__icon--logout" aria-hidden="true" />
                    <span>Logout</span>
                </button>
            </aside>

            <main className="content">
                <Outlet />
            </main>

            <footer className="app-footer">
                <div className="app-footer__inner">
                    <span className="app-footer__brand">Tasko</span>
                    <span>Learning projects, submissions, and feedback in one place.</span>
                    <span className="app-footer__meta">Built for focused classroom work.</span>
                </div>
            </footer>
        </div>
    )
}
