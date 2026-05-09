import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ProjectsHubPage from './pages/ProjectsHubPage'
import MyProjectsPage from './pages/MyProjectsPage'
import EnrolledProjectsPage from './pages/EnrolledProjectsPage'
import MySubmissionsOverviewPage from './pages/MySubmissionsOverviewPage'
import ProjectPage from './pages/ProjectPage'
import TaskPage from './pages/TaskPage'
import MySubmissionPage from './pages/MySubmissionPage'
import TaskSubmissionsPage from './pages/TaskSubmissionsPage'
import GradeSubmissionPage from './pages/GradeSubmissionPage'
import ProfilePage from './pages/ProfilePage'
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
                    <Route path="/" element={<Navigate to="/projects" replace />} />
                    <Route path="/projects" element={<ProjectsHubPage />} />
                    <Route path="/projects/mine" element={<MyProjectsPage />} />
                    <Route path="/projects/enrolled" element={<EnrolledProjectsPage />} />
                    <Route path="/my-submissions" element={<MySubmissionsOverviewPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/projects/:projectId" element={<ProjectPage />} />
                    <Route path="/projects/:projectId/tasks/:taskId" element={<TaskPage />} />
                    <Route path="/projects/:projectId/tasks/:taskId/submission" element={<MySubmissionPage />} />
                    <Route path="/projects/:projectId/tasks/:taskId/submissions" element={<TaskSubmissionsPage />} />
                    <Route path="/projects/:projectId/tasks/:taskId/submissions/:submissionId" element={<GradeSubmissionPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}