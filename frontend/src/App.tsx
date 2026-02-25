import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectPage from './pages/ProjectPage'
import TaskPage from './pages/TaskPage'
import TaskSubmissionsPage from './pages/TaskSubmissionsPage'
import GradeSubmissionPage from './pages/GradeSubmissionPage'
import { RequireAuth } from './auth/RequireAuth'
import AppShell from './layout/AppShell'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route
                    element={
                        <RequireAuth>
                            <AppShell />
                        </RequireAuth>
                    }
                >
                    <Route path="/" element={<ProjectsPage />} />
                    <Route path="/projects/:projectId" element={<ProjectPage />} />
                    <Route path="/projects/:projectId/tasks/:taskId" element={<TaskPage />} />
                    <Route path="/projects/:projectId/tasks/:taskId/submissions" element={<TaskSubmissionsPage />} />
                    <Route path="/projects/:projectId/tasks/:taskId/submissions/:submissionId" element={<GradeSubmissionPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}