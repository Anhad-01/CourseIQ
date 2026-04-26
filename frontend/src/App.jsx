import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Recommendations from './pages/Recommendations'
import SavedCourses from './pages/SavedCourses'
import SearchPage from './pages/SearchPage'
import Settings from './pages/Settings'
import { ProtectedRoute } from './lib/AuthContext'
import PageNotFound from './lib/PageNotFound'

function App() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<SearchPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/saved" element={<SavedCourses />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  )
}

export default App
