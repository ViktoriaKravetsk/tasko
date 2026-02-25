export type Me = {
    id: number
    email: string
    name: string
    avatarUrl: string | null
}
export type Project = {
    id: number
    name: string
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
    createdAt?: string
}

export type Submission = {
    id: number
    taskId: number
    studentId: number
    textAnswer?: string | null
    fileLink?: string | null
    submittedAt?: string | null
    teacherScore?: number | null
    teacherComment?: string | null
    gradedAt?: string | null
    aiScore?: number | null
    aiComment?: string | null
    aiEvaluatedAt?: string | null
    late?: boolean
    status?: 'SUBMITTED' | 'GRADED' | 'NOT_SUBMITTED'
}

export type ProjectProgress = {
    earned: number
    total: number
}