import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { authApi } from '../api/auth.api'
import { Link } from 'react-router-dom'

function errMsg(e: any): string {
    return e?.message ?? String(e)
}

export default function ProfilePage() {
    const auth = useAuth()

    const [name, setName] = useState(auth.me?.name ?? '')
    const [avatarUrl, setAvatarUrl] = useState(auth.me?.avatarUrl ?? '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    async function onSave() {
        setError('')
        setSuccess('')

        if (!name.trim()) {
            setError('Name is required')
            return
        }

        setSaving(true)
        try {
            const updated = await authApi.updateProfile({
                name: name.trim(),
                avatarUrl: avatarUrl.trim(),
            })

            setName(updated.name ?? '')
            setAvatarUrl(updated.avatarUrl ?? '')

            await auth.refresh()

            setSuccess('Profile updated successfully!')
        } catch (e) {
            setError(errMsg(e))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="card">
                <h1>Profile</h1>
                <div className="small">Edit your name and avatar</div>

                {error ? (
                    <div className="card card--soft" style={{ marginTop: 12 }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 11, color: 'red' }}>Error</div>
                        <div className="small">{error}</div>
                    </div>
                ) : null}

                {success ? (
                    <div className="card card--soft" style={{ marginTop: 12 }}>
                        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 11, color: 'green' }}>Success</div>
                        <div className="small">{success}</div>
                    </div>
                ) : null}

                <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                    <div>
                        <label className="small" style={{ display: 'block', marginBottom: 4 }}>
                            Email (cannot be changed)
                        </label>
                        <input className="input" value={auth.me?.email ?? ''} disabled />
                    </div>

                    <div>
                        <label className="small" style={{ display: 'block', marginBottom: 4 }}>
                            Name
                        </label>
                        <input
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                        />
                    </div>

                    <div>
                        <label className="small" style={{ display: 'block', marginBottom: 4 }}>
                            Avatar URL (optional, leave empty to use Google avatar)
                        </label>
                        <input
                            className="input"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://example.com/avatar.jpg"
                        />
                        <div className="small" style={{ marginTop: 4, opacity: 0.7 }}>
                            Current: {auth.me?.avatarUrl ? 'Custom avatar' : 'Google avatar'}
                        </div>
                    </div>

                    {avatarUrl ? (
                        <div>
                            <div className="small" style={{ marginBottom: 4 }}>
                                Preview:
                            </div>
                            <img
                                src={avatarUrl}
                                alt="avatar preview"
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 14,
                                    border: '2px solid var(--ink)',
                                    objectFit: 'cover',
                                }}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                }}
                            />
                        </div>
                    ) : null}

                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button className="btn btn--primary" onClick={onSave} disabled={saving}>
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                        <Link to="/" className="btn btn--ghost">
                            Cancel
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}