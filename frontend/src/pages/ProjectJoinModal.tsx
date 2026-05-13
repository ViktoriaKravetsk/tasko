import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getApiErrorMessage } from '../api/http'
import { projectsApi } from '../api/projects.api'
import type { Project } from '../api/types'

type Props = {
    open: boolean
    onClose: () => void
    onJoined?: (project: Project) => void
}

export default function ProjectJoinModal({ open, onClose, onJoined }: Props) {
    const [joinCode, setJoinCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!open) return

        setJoinCode('')
        setError(null)
    }, [open])

    if (!open) return null

    const close = () => {
        if (loading) return
        setError(null)
        onClose()
    }

    const join = async () => {
        if (!joinCode.trim()) return

        setLoading(true)
        setError(null)

        try {
            const project = await projectsApi.joinByCode({ joinCode: joinCode.trim() })
            onJoined?.(project)
            onClose()
        } catch (error) {
            setError(getApiErrorMessage(error, 'Could not join the project.'))
        } finally {
            setLoading(false)
        }
    }

    return createPortal(
        <div className="tasko-modal-backdrop" onMouseDown={close}>
            <section className="tasko-modal tasko-modal--small" onMouseDown={(event) => event.stopPropagation()}>
                <div className="tasko-modal__header">
                    <div>
                        <div className="tasko-modal__eyebrow">Invite code</div>
                        <h2 className="tasko-modal__title">Join project</h2>
                    </div>

                    <button type="button" className="tasko-modal__close" onClick={close} aria-label="Close">
                        x
                    </button>
                </div>

                <div className="tasko-modal__body">
                    {error ? <div className="alert alert--error">{error}</div> : null}

                    <label className="tasko-field">
                        <span>Project code</span>
                        <input
                            className="inp"
                            value={joinCode}
                            onChange={(event) => setJoinCode(event.target.value)}
                            placeholder="Enter the project code"
                            autoFocus
                        />
                    </label>

                    <div className="hint-box">
                        <div className="hint-title">Hint</div>
                        <div className="hint-text">
                            Ask your teacher or project owner for the invite code.
                        </div>
                    </div>
                </div>

                <div className="tasko-modal__footer">
                    <button type="button" className="btn btn--ghost" onClick={close} disabled={loading}>
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="btn btn--primary green"
                        onClick={join}
                        disabled={loading || !joinCode.trim()}
                    >
                        {loading ? 'Joining...' : 'Join project'}
                    </button>
                </div>
            </section>
        </div>,
        document.body
    )
}
