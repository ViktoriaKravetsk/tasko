export type Me = {
    id: number
    email: string
    name: string
    avatarUrl: string | null
}
export type Project = {
    id: number
    name: string
    emoji?: string | null
    description?: string | null
    deadline?: string | null
    joinCode?: string | null
    createdAt?: string
}

export type Task = {
    id: number
    projectId: number
    title: string
    description?: string | null
    deadline?: string | null
    maxScore: number
    allowResubmissionAfterGrade: boolean
    createdAt?: string
}

export type Submission = {
    id: number
    taskId: number
    studentId: number
    studentName?: string
    textAnswer?: string | null
    fileLink?: string | null
    submittedAt?: string | null
    teacherScore?: number | null
    teacherComment?: string | null
    gradedAt?: string | null
    aiScore?: number | null
    aiComment?: string | null
    aiEvaluatedAt?: string | null
    aiStatus?: 'PENDING' | 'DONE' | 'FAILED' | 'DISABLED'
    aiErrorMessage?: string | null
    late?: boolean
    status?: 'SUBMITTED' | 'GRADED' | 'NOT_SUBMITTED'
}

export type SubmissionShort = {
    id: number | null
    taskId: number
    studentId: number
    studentName?: string
    submittedAt?: string | null
    late?: boolean
    teacherScore?: number | null
    gradedAt?: string | null
    aiScore?: number | null
    aiStatus?: 'PENDING' | 'DONE' | 'FAILED' | 'DISABLED' | null
    status?: 'SUBMITTED' | 'GRADED' | 'NOT_SUBMITTED'
}

export type ProjectProgress = {
    earned: number
    total: number
}
