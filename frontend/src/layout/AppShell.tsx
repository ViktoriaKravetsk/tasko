import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { notificationsApi, type AppNotification } from '../api/notifications.api'
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
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [notificationsLoading, setNotificationsLoading] = useState(false)
    const [notificationsError, setNotificationsError] = useState<string | null>(null)

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const notificationsRef = useRef<HTMLDivElement | null>(null)
    const petalsRef = useRef<Petal[]>([])
    const rafRef = useRef<number | null>(null)

    const loadNotifications = useCallback(async () => {
        if (!auth.me) return

        setNotificationsLoading(true)
        setNotificationsError(null)

        try {
            const [items, count] = await Promise.all([
                notificationsApi.list(),
                notificationsApi.unreadCount(),
            ])

            setNotifications(items)
            setUnreadCount(count)
        } catch {
            setNotificationsError('Could not load notifications.')
        } finally {
            setNotificationsLoading(false)
        }
    }, [auth.me])

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
            if (event.key === 'Escape') setNotificationsOpen(false)
        }

        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    useEffect(() => {
        if (!auth.me) {
            setNotifications([])
            setUnreadCount(0)
            return
        }

        void loadNotifications()
        const interval = window.setInterval(() => void loadNotifications(), 30000)

        return () => window.clearInterval(interval)
    }, [auth.me, loadNotifications])

    useEffect(() => {
        if (!notificationsOpen) return

        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node | null
            if (!target || notificationsRef.current?.contains(target)) return
            setNotificationsOpen(false)
        }

        window.addEventListener('pointerdown', onPointerDown)
        return () => window.removeEventListener('pointerdown', onPointerDown)
    }, [notificationsOpen])

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
        setNotificationsOpen(false)
        navigate('/profile')
    }

    const toggleNotifications = () => {
        setOpen(false)
        setNotificationsOpen((current) => {
            const next = !current
            if (next) void loadNotifications()
            return next
        })
    }

    const openNotification = async (notification: AppNotification) => {
        setNotificationsOpen(false)

        if (!notification.readAt) {
            const readAt = new Date().toISOString()
            setNotifications((current) =>
                current.map((item) => item.id === notification.id ? { ...item, readAt } : item)
            )
            setUnreadCount((current) => Math.max(0, current - 1))
            await notificationsApi.markRead(notification.id).catch(() => undefined)
        }

        if (notification.href) {
            navigate(notification.href)
        }
    }

    const markAllNotificationsRead = async () => {
        await notificationsApi.markAllRead()
        const readAt = new Date().toISOString()
        setNotifications((current) => current.map((item) => ({ ...item, readAt })))
        setUnreadCount(0)
    }

    const deleteNotification = async (event: ReactMouseEvent<HTMLButtonElement>, notification: AppNotification) => {
        event.stopPropagation()

        setNotifications((current) => current.filter((item) => item.id !== notification.id))
        if (!notification.readAt) {
            setUnreadCount((current) => Math.max(0, current - 1))
        }

        await notificationsApi.delete(notification.id).catch(() => {
            void loadNotifications()
        })
    }

    const currentYear = new Date().getFullYear()

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

                <div className="topbar__right">
                    <div className="notifications" ref={notificationsRef}>
                        <button
                            type="button"
                            className={unreadCount > 0 ? 'notification-button notification-button--active' : 'notification-button'}
                            onClick={toggleNotifications}
                            aria-label="Notifications"
                            aria-expanded={notificationsOpen}
                        >
                            <svg
                                className="notification-button__icon"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path d="M18 9.5a6 6 0 0 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15.5 18 9.5Z" />
                                <path d="M9.5 20a2.8 2.8 0 0 0 5 0" />
                                <path d="M12 3.5V2" />
                            </svg>
                            {unreadCount > 0 ? (
                                <span className="notification-button__count">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            ) : null}
                        </button>

                        {notificationsOpen ? (
                            <div className="notifications-panel">
                                <div className="notifications-panel__head">
                                    <div>
                                        <div className="notifications-panel__title">Notifications</div>
                                        <div className="notifications-panel__sub">
                                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                                        </div>
                                    </div>

                                    {unreadCount > 0 ? (
                                        <button
                                            type="button"
                                            className="notifications-panel__mark"
                                            onClick={() => void markAllNotificationsRead()}
                                        >
                                            Mark all read
                                        </button>
                                    ) : null}
                                </div>

                                <div className="notifications-panel__body">
                                    {notificationsLoading ? (
                                        <div className="notifications-empty">Loading...</div>
                                    ) : notificationsError ? (
                                        <div className="notifications-empty">{notificationsError}</div>
                                    ) : notifications.length === 0 ? (
                                        <div className="notifications-empty">No notifications yet.</div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={notification.readAt ? 'notification-item' : 'notification-item notification-item--unread'}
                                            >
                                                <button
                                                    type="button"
                                                    className="notification-item__open"
                                                    onClick={() => void openNotification(notification)}
                                                >
                                                    <span className="notification-item__dot" aria-hidden="true" />
                                                    <span className="notification-item__content">
                                                        <span className="notification-item__title">{notification.title}</span>
                                                        <span className="notification-item__message">{notification.message}</span>
                                                        <span className="notification-item__time">
                                                            {formatNotificationTime(notification.createdAt)}
                                                        </span>
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="notification-item__delete"
                                                    onClick={(event) => void deleteNotification(event, notification)}
                                                    aria-label="Delete notification"
                                                    title="Delete"
                                                >
                                                    x
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>

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
                    <span className="app-footer__credit">Developed by Viktoriia Kravetska</span>
                    <span className="app-footer__meta">{currentYear}</span>
                </div>
            </footer>
        </div>
    )
}

function formatNotificationTime(value?: string | null) {
    if (!value) return ''

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    return new Intl.DateTimeFormat('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}
