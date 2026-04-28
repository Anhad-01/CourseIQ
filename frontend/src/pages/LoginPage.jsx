import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { PasswordInput } from '../components/ui/password-input'
import { useAuth } from '../lib/AuthContext'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName || !password) {
      toast.error('Please enter both name and password')
      return
    }

    setIsLoading(true)

    try {
      const result = await login({ full_name: trimmedName, password })

      if (result.setupRequired) {
        navigate('/register')
      } else {
        navigate('/')
      }
    } catch (error) {
      toast.error(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-md p-8 sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary">
            <Sparkles className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue to CourseIQ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <PasswordInput
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            fullWidth
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">
            Don&apos;t have an account?{' '}
          </span>
          <Link
            to="/register"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
