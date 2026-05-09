import { useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../api/projects.api'
import { useAuth } from '../auth/AuthContext'

type ActiveModal = 'create' | 'join' | null

export default function ProjectsHubPage() {
    const auth = useAuth()

    const [activeModal, setActiveModal] = useState<ActiveModal>(null)

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [deadline, setDeadline] = useState('')
    const [joinCode, setJoinCode] = useState('')

    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const firstName = auth.me?.name?.trim()?.split(' ')[0] || 'друже'

    const closeModal = () => {
        if (loading) return
        setActiveModal(null)
        setErr(null)
    }

    const openCreateModal = () => {
        setErr(null)
        setSuccess(null)
        setActiveModal('create')
    }

    const openJoinModal = () => {
        setErr(null)
        setSuccess(null)
        setActiveModal('join')
    }

    const create = async () => {
        if (!name.trim()) return

        setLoading(true)
        setErr(null)
        setSuccess(null)

        try {
            await projectsApi.create({
                name: name.trim(),
                description: description.trim() ? description.trim() : null,
                deadline: deadline || null,
            })

            setName('')
            setDescription('')
            setDeadline('')
            setActiveModal(null)
            setSuccess('Проєкт успішно створено.')
        } catch (error: any) {
            setErr(error?.response?.data?.message ?? 'Не вдалося створити проєкт.')
        } finally {
            setLoading(false)
        }
    }

    const join = async () => {
        if (!joinCode.trim()) return

        setLoading(true)
        setErr(null)
        setSuccess(null)

        try {
            await projectsApi.joinByCode({ joinCode: joinCode.trim() })
            setJoinCode('')
            setActiveModal(null)
            setSuccess('Ти успішно приєдналась до проєкту.')
        } catch (error: any) {
            setErr(error?.response?.data?.message ?? 'Не вдалося приєднатися до проєкту.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-wrap tasko-hub">
            <section className="tasko-hub__hero">
                <div className="tasko-hub__eyebrow">TASKO · ЦЕНТР ПРОЄКТІВ</div>

                <h1 className="tasko-hub__title">
                    Привіт, {firstName} 🌸
                </h1>

                <p className="tasko-hub__text">
                    Tasko допомагає організовувати навчальні проєкти, команди,
                    завдання та дедлайни — легко й у одному місці.
                </p>
            </section>

            {err ? <div className="alert alert--error tasko-hub__alert">{err}</div> : null}
            {success ? <div className="alert tasko-hub__alert">{success}</div> : null}

            <section className="tasko-hub__grid">
                <button
                    type="button"
                    className="tasko-action-card tasko-action-card--create"
                    onClick={openCreateModal}
                >
                    <span className="tasko-action-card__icon">✏️</span>

                    <span className="tasko-action-card__content">
                        <span className="tasko-action-card__title">Створити проєкт</span>
                        <span className="tasko-action-card__desc"></span>
                    </span>

                    <span className="tasko-action-card__arrow">→</span>
                </button>

                <button
                    type="button"
                    className="tasko-action-card tasko-action-card--join"
                    onClick={openJoinModal}
                >
                    <span className="tasko-action-card__icon">🔑</span>

                    <span className="tasko-action-card__content">
                        <span className="tasko-action-card__title">Приєднатись до проєкту</span>
                        <span className="tasko-action-card__desc"></span>
                    </span>

                    <span className="tasko-action-card__arrow">→</span>
                </button>

                <Link to="/projects/mine" className="tasko-action-card tasko-action-card--mine">
                    <span className="tasko-action-card__icon">📁</span>

                    <span className="tasko-action-card__content">
                        <span className="tasko-action-card__title">Мої проєкти</span>
                        <span className="tasko-action-card__desc">
                            Переглядай свої проєкти та керуй ними
                        </span>
                    </span>

                    <span className="tasko-action-card__arrow">→</span>
                </Link>

                <Link to="/projects/enrolled" className="tasko-action-card tasko-action-card--enrolled">
                    <span className="tasko-action-card__icon">🎒</span>

                    <span className="tasko-action-card__content">
                        <span className="tasko-action-card__title">Беру участь</span>
                        <span className="tasko-action-card__desc">
                            Переглядай проєкти, до яких ти приєдналась
                        </span>
                    </span>

                    <span className="tasko-action-card__arrow">→</span>
                </Link>
            </section>

            {activeModal === 'create' ? (
                <div className="tasko-modal-backdrop" onMouseDown={closeModal}>
                    <section className="tasko-modal" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="tasko-modal__header">
                            <div>
                                <div className="tasko-modal__eyebrow">Новий проєкт</div>
                                <h2 className="tasko-modal__title">Створити проєкт</h2>
                            </div>

                            <button
                                type="button"
                                className="tasko-modal__close"
                                onClick={closeModal}
                                aria-label="Закрити"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="tasko-modal__body">
                            <label className="tasko-field">
                                <span>Назва проєкту</span>
                                <input
                                    className="inp"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="Наприклад: Командний вебпроєкт"
                                />
                            </label>

                            <label className="tasko-field">
                                <span>Опис</span>
                                <textarea
                                    className="inp"
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    placeholder="Коротко опиши, над чим працюватиме команда"
                                />
                            </label>

                            <label className="tasko-field">
                                <span>Дедлайн</span>
                                <input
                                    className="inp"
                                    type="date"
                                    value={deadline}
                                    onChange={(event) => setDeadline(event.target.value)}
                                />
                            </label>
                        </div>

                        <div className="tasko-modal__footer">
                            <button
                                type="button"
                                className="btn btn--ghost"
                                onClick={closeModal}
                                disabled={loading}
                            >
                                Скасувати
                            </button>

                            <button
                                type="button"
                                className="btn btn--primary"
                                onClick={create}
                                disabled={loading || !name.trim()}
                            >
                                {loading ? 'Створення...' : 'Створити'}
                            </button>
                        </div>
                    </section>
                </div>
            ) : null}

            {activeModal === 'join' ? (
                <div className="tasko-modal-backdrop" onMouseDown={closeModal}>
                    <section className="tasko-modal tasko-modal--small" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="tasko-modal__header">
                            <div>
                                <div className="tasko-modal__eyebrow">Код доступу</div>
                                <h2 className="tasko-modal__title">Приєднатись до проєкту</h2>
                            </div>

                            <button
                                type="button"
                                className="tasko-modal__close"
                                onClick={closeModal}
                                aria-label="Закрити"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="tasko-modal__body">
                            <label className="tasko-field">
                                <span>Код проєкту</span>
                                <input
                                    className="inp"
                                    value={joinCode}
                                    onChange={(event) => setJoinCode(event.target.value)}
                                    placeholder="Введи код від власника проєкту"
                                />
                            </label>

                            <div className="hint-box">
                                <div className="hint-title">Підказка</div>
                                <div className="hint-text">
                                    Код можна отримати у викладача або власника проєкту.
                                </div>
                            </div>
                        </div>

                        <div className="tasko-modal__footer">
                            <button
                                type="button"
                                className="btn btn--ghost"
                                onClick={closeModal}
                                disabled={loading}
                            >
                                Скасувати
                            </button>

                            <button
                                type="button"
                                className="btn btn--primary green"
                                onClick={join}
                                disabled={loading || !joinCode.trim()}
                            >
                                {loading ? 'Приєднання...' : 'Приєднатись'}
                            </button>
                        </div>
                    </section>
                </div>
            ) : null}
        </div>
    )
}