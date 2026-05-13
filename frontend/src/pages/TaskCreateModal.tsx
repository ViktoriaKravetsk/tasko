import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getApiErrorMessage } from '../api/http'
import { tasksApi } from '../api/tasks.api'
import type { Task } from '../api/types'
import { getTodayDateInputValue, isPastDateInputValue } from './projectValidation'

type Props = {
    open: boolean
    projectId: number
    onClose: () => void
    onCreated?: (task: Task) => void
}

export default function TaskCreateModal({ open, projectId, onClose, onCreated }: Props) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [deadline, setDeadline] = useState('')
    const [maxScore, setMaxScore] = useState(10)
    const [allowResubmissionAfterGrade, setAllowResubmissionAfterGrade] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const todayValue = getTodayDateInputValue()

    useEffect(() => {
        if (!open) return

        setTitle('')
        setDescription('')
        setDeadline('')
        setMaxScore(10)
        setAllowResubmissionAfterGrade(true)
        setError(null)
    }, [open])

    if (!open) return null

    const close = () => {
        if (loading) return
        setError(null)
        onClose()
    }

    const create = async () => {
        if (!title.trim()) return

        if (maxScore < 1) {
            setError('Max score must be at least 1.')
            return
        }

        if (isPastDateInputValue(deadline, todayValue)) {
            setError('Deadline cannot be earlier than today.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const task = await tasksApi.create(projectId, {
                title: title.trim(),
                description: description.trim() || null,
                deadline: deadline || null,
                maxScore,
                allowResubmissionAfterGrade,
            })

            onCreated?.(task)
            onClose()
        } catch (error) {
            setError(getApiErrorMessage(error, 'Could not create the task.'))
        } finally {
            setLoading(false)
        }
    }

    return createPortal(
        <div className="tasko-modal-backdrop" onMouseDown={close}>
            <section className="tasko-modal" onMouseDown={(event) => event.stopPropagation()}>
                <div className="tasko-modal__header">
                    <div>
                        <div className="tasko-modal__eyebrow">Task setup</div>
                        <h2 className="tasko-modal__title">Create task</h2>
                    </div>

                    <button type="button" className="tasko-modal__close" onClick={close} aria-label="Close">
                        x
                    </button>
                </div>

                <div className="tasko-modal__body">
                    {error ? <div className="alert alert--error">{error}</div> : null}

                    <label className="tasko-field">
                        <span>Task title</span>
                        <input
                            className="inp"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Task title"
                        />
                    </label>

                    <label className="tasko-field">
                        <span>Description</span>
                        <textarea
                            className="inp"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Description (optional)"
                        />
                    </label>

                    <div className="row2">
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
                            />
                        </label>

                        <label className="tasko-field">
                            <span>Max score</span>
                            <input
                                className="inp"
                                type="number"
                                min={1}
                                max={1000}
                                value={maxScore}
                                onChange={(event) => setMaxScore(Number(event.target.value))}
                            />
                        </label>
                    </div>

                    <label className="task-create-checkbox">
                        <input
                            type="checkbox"
                            checked={allowResubmissionAfterGrade}
                            onChange={(event) => setAllowResubmissionAfterGrade(event.target.checked)}
                        />
                        <span>Allow resubmission after grading</span>
                    </label>
                </div>

                <div className="tasko-modal__footer">
                    <button type="button" className="btn btn--ghost" onClick={close} disabled={loading}>
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="btn btn--primary"
                        onClick={create}
                        disabled={loading || !title.trim() || maxScore < 1}
                    >
                        {loading ? 'Creating...' : 'Create task'}
                    </button>
                </div>
            </section>
        </div>,
        document.body
    )
}
