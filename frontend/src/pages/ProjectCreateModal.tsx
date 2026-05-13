import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getApiErrorMessage } from '../api/http'
import { projectsApi } from '../api/projects.api'
import type { Project } from '../api/types'
import { DEFAULT_PROJECT_EMOJI, PROJECT_EMOJI_OPTIONS } from './projectEmojiOptions'
import {
    PROJECT_DESCRIPTION_MAX_LENGTH,
    PROJECT_DESCRIPTION_SEGMENT_ERROR,
    getTodayDateInputValue,
    hasTooLongTextSegment,
    isPastDateInputValue,
} from './projectValidation'

type Props = {
    open: boolean
    onClose: () => void
    onCreated?: (project: Project) => void
}

export default function ProjectCreateModal({ open, onClose, onCreated }: Props) {
    const [name, setName] = useState('')
    const [emoji, setEmoji] = useState(DEFAULT_PROJECT_EMOJI)
    const [description, setDescription] = useState('')
    const [deadline, setDeadline] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const todayValue = getTodayDateInputValue()

    useEffect(() => {
        if (open) setError(null)
    }, [open])

    if (!open) return null

    const close = () => {
        if (loading) return
        setError(null)
        onClose()
    }

    const create = async () => {
        if (!name.trim()) return
        if (description.trim().length > PROJECT_DESCRIPTION_MAX_LENGTH) {
            setError(`Description must be ${PROJECT_DESCRIPTION_MAX_LENGTH} characters or less.`)
            return
        }
        if (hasTooLongTextSegment(description)) {
            setError(PROJECT_DESCRIPTION_SEGMENT_ERROR)
            return
        }
        if (isPastDateInputValue(deadline, todayValue)) {
            setError('Deadline cannot be earlier than today.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const project = await projectsApi.create({
                name: name.trim(),
                emoji,
                description: description.trim() ? description.trim() : null,
                deadline: deadline || null,
            })

            setName('')
            setEmoji(DEFAULT_PROJECT_EMOJI)
            setDescription('')
            setDeadline('')
            onCreated?.(project)
            onClose()
        } catch (error) {
            setError(getApiErrorMessage(error, 'Could not create the project.'))
        } finally {
            setLoading(false)
        }
    }

    return createPortal(
        <div className="tasko-modal-backdrop" onMouseDown={close}>
            <section className="tasko-modal" onMouseDown={(event) => event.stopPropagation()}>
                <div className="tasko-modal__header">
                    <div>
                        <div className="tasko-modal__eyebrow">New project</div>
                        <h2 className="tasko-modal__title">Create project</h2>
                    </div>

                    <button
                        type="button"
                        className="tasko-modal__close"
                        onClick={close}
                        aria-label="Close"
                    >
                        x
                    </button>
                </div>

                <div className="tasko-modal__body">
                    {error ? <div className="alert alert--error">{error}</div> : null}

                    <label className="tasko-field">
                        <span>Project name</span>
                        <input
                            className="inp"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="For example: Web Design Lab"
                        />
                    </label>

                    <div className="tasko-field">
                        <span>Project emoji</span>
                        <div className="project-emoji-picker" role="radiogroup" aria-label="Project emoji">
                            {PROJECT_EMOJI_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    className={option === emoji ? 'project-emoji-option project-emoji-option--active' : 'project-emoji-option'}
                                    onClick={() => setEmoji(option)}
                                    role="radio"
                                    aria-checked={option === emoji}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    <label className="tasko-field">
                        <span>Description</span>
                        <textarea
                            className="inp"
                            maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
                            value={description}
                            onChange={(event) => {
                                setDescription(event.target.value)
                                if (error === PROJECT_DESCRIPTION_SEGMENT_ERROR) {
                                    setError(null)
                                }
                            }}
                            onBlur={(event) => {
                                if (hasTooLongTextSegment(event.target.value)) {
                                    setError(PROJECT_DESCRIPTION_SEGMENT_ERROR)
                                }
                            }}
                            placeholder="Briefly describe what this project is about"
                        />
                        <span className="tasko-field-meta">
                            {description.length}/{PROJECT_DESCRIPTION_MAX_LENGTH}
                        </span>
                    </label>

                    <label className="tasko-field">
                        <span>Deadline</span>
                        <input
                            className="inp"
                            type="date"
                            min={todayValue}
                            value={deadline}
                            onChange={(event) => {
                                setDeadline(event.target.value)
                                if (error === 'Deadline cannot be earlier than today.') {
                                    setError(null)
                                }
                            }}
                            onBlur={(event) => {
                                if (isPastDateInputValue(event.target.value, todayValue)) {
                                    setError('Deadline cannot be earlier than today.')
                                }
                            }}
                        />
                    </label>
                </div>

                <div className="tasko-modal__footer">
                    <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={close}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="btn btn--primary"
                        onClick={create}
                        disabled={
                            loading
                            || !name.trim()
                            || description.trim().length > PROJECT_DESCRIPTION_MAX_LENGTH
                        }
                    >
                        {loading ? 'Creating...' : 'Create project'}
                    </button>
                </div>
            </section>
        </div>,
        document.body
    )
}
