import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { submissionsApi } from "../api/submissions.api"
import type { Submission } from "../api/types"

export default function MySubmissionPage() {
    const { projectId, taskId } = useParams()

    const [submission, setSubmission] = useState<Submission | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadSubmission = async () => {
        if (!projectId || !taskId) return

        try {
            setLoading(true)

            const res = await submissionsApi.my(Number(projectId), Number(taskId))

            setSubmission(res)
            setError(null)

        } catch (e: any) {

            if (e?.response?.status === 404) {
                setSubmission(null)
                setError(null)
                return
            }

            setError(e?.response?.data?.message ?? "Failed to load submission")

        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadSubmission()
    }, [projectId, taskId])

    if (loading) {
        return <div className="page">Loading...</div>
    }

    return (
        <div className="page">

            <h1>My submission</h1>

            {error && (
                <div className="card-error">
                    {error}
                </div>
            )}

            {!submission && (
                <div className="card">
                    <div>Status: NOT_SUBMITTED</div>
                </div>
            )}

            {submission && (
                <div className="card">

                    <div>Submitted at: {submission.submittedAt}</div>

                    {submission.teacherScore !== null && (
                        <div>Teacher score: {submission.teacherScore}</div>
                    )}

                    {submission.aiScore !== null && (
                        <div>AI score: {submission.aiScore}</div>
                    )}

                </div>
            )}

        </div>
    )
}