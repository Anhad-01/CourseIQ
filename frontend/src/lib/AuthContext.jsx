import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { auth } from './mockBase44'

const AuthContext = createContext(null)

function FullScreenState({ title, description }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel max-w-md p-8 text-center">
        <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary">
          <LoaderCircle className="size-6 animate-spin" />
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function UserNotRegisteredError() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel max-w-md p-8 text-center">
        <h1 className="text-2xl font-semibold">User not registered</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your authentication succeeded, but there is no registered CourseIQ profile yet.
        </p>
      </div>
    </div>
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [setupRequired, setSetupRequired] = useState(false)

  useEffect(() => {
    let active = true

    auth
      .me()
      .then(async (result) => {
        if (!active) return

        if (result) {
          const setupComplete = await base44.entities.UserPreference.isSetupComplete()
          if (!setupComplete) {
            setUser(result)
            setSetupRequired(true)
            setError(null)
            return
          }
        }

        setUser(result)
        setError(null)
        setSetupRequired(false)
      })
      .catch((err) => {
        if (!active) return
        setUser(null)
        setError(err?.message || 'auth_required')
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const login = async (credentials) => {
    const user = await auth.login(credentials)
    const setupComplete = await base44.entities.UserPreference.isSetupComplete()

    setUser(user)
    setError(null)
    setSetupRequired(!setupComplete)

    return { user, setupRequired: !setupComplete }
  }

  const register = async (userData) => {
    const user = await auth.register(userData)
    setUser(user)
    setError(null)
    setSetupRequired(true)

    return user
  }

  const completePreferences = async (preferences = {}) => {
    await base44.entities.UserPreference.upsert(preferences)
    setSetupRequired(false)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      setupRequired,
      login,
      register,
      completePreferences,
      logout: async () => {
        await auth.logout()
        toast.success('Signed out of CourseIQ')
        setUser(null)
        setSetupRequired(false)
      },
    }),
    [user, loading, error, setupRequired],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

export function ProtectedRoute({ children }) {
  const { loading, error, setupRequired } = useAuth()

  if (loading) {
    return (
      <FullScreenState
        title="Checking your workspace"
        description="Loading your CourseIQ profile and preferences."
      />
    )
  }

  if (error === 'user_not_registered') {
    return <UserNotRegisteredError />
  }

  if (error === 'auth_required') {
    return <Navigate to="/" replace />
  }

  if (setupRequired) {
    return <Navigate to="/register" replace />
  }

  return children
}
