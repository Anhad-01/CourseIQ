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

  useEffect(() => {
    let active = true

    auth
      .me()
      .then((result) => {
        if (!active) return
        setUser(result)
        setError(null)
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

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      async logout() {
        await auth.logout()
        toast.success('Signed out of CourseIQ')
        setUser(null)
      },
    }),
    [user, loading, error],
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
  const { loading, error } = useAuth()

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

  return children
}
