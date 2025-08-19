'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { UserCheck, UserPlus, Clock, Loader2 } from 'lucide-react'
import { theme } from '../../config/theme';

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const supabase = createSupabaseClient()

  // Check if email exists with proper debouncing
  useEffect(() => {
    const checkEmail = async () => {
      if (!email || !email.includes('@') || email.length < 5) {
        setIsExistingUser(null)
        return
      }

      setCheckingEmail(true)
      setIsExistingUser(null)

      try {
        // Use our API endpoint to check if email exists
        const response = await fetch('/api/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (response.ok) {
          setIsExistingUser(data.exists)
        } else {
          console.error('Email check failed:', data.error)
          setIsExistingUser(null) // Don't show indicator on error
        }
      } catch (error) {
        console.error('Email check error:', error)
        setIsExistingUser(null) // Don't show indicator on error
      } finally {
        setCheckingEmail(false)
      }
    }

    // Debounce the email check - wait 1.5 seconds after user stops typing
    const timeoutId = setTimeout(checkEmail, 1500)
    return () => clearTimeout(timeoutId)
  }, [email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isExistingUser === true) {
        // We know this is an existing user, try to sign in
        const { error } = await signIn(email, password)
        if (error) {
          setError(error instanceof Error ? error.message : 'Sign in failed')
        } else {
          router.push('/dashboard')
        }
      } else if (isExistingUser === false) {
        // We know this is a new user, try to sign up
        if (!fullName.trim()) {
          setError('Please enter your full name to create an account')
          setLoading(false)
          return
        }

        const { error } = await signUp(email, password, fullName)
        if (error) {
          setError(error instanceof Error ? error.message : 'Sign up failed')
        } else {
          router.push('/dashboard')
        }
      } else {
        // Unknown status, try sign in first, then sign up
        const { error: signInError } = await signIn(email, password)

        if (signInError) {
          // If sign in fails, try sign up
          const errorMessage = (signInError instanceof Error)
            ? signInError.message
            : typeof signInError === 'object' && signInError !== null && 'message' in signInError
              ? (signInError as any).message
              : '';
          if (errorMessage.includes('Invalid login credentials')) {
            if (!fullName.trim()) {
              setIsExistingUser(false) // Show the full name field
              setError('Please enter your full name to create an account')
              setLoading(false)
              return
            }

            const { error: signUpError } = await signUp(email, password, fullName)
            if (signUpError) {
              setError(signUpError instanceof Error ? signUpError.message : 'Sign up failed')
            } else {
              router.push('/dashboard')
            }
          } else {
            setError(errorMessage || 'Sign in failed')
          }
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = () => {
    // Store guest session in localStorage
    localStorage.setItem('guest-session', JSON.stringify({
      id: 'guest-' + Date.now(),
      isGuest: true,
      createdAt: new Date().toISOString()
    }))
    router.push('/guest-upload')
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* Main Auth Card */}
        <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardHeader>
            <h1 className="text-2xl font-bold text-center" style={{ color: theme.grayscale.foreground }}>
              {isExistingUser === true ? 'Welcome Back' :
               isExistingUser === false ? 'Create Account' :
               'Sign In or Sign Up'}
            </h1>
            <p className="text-center mt-2" style={{ color: theme.grayscale.muted }}>
              {isExistingUser === true ? 'Sign in to your account' :
               isExistingUser === false ? 'Create your new account' :
               'Enter your email to get started'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="relative">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
                {/* Live Email Status Indicator */}
                {email && email.includes('@') && email.length >= 5 && (
                  <div className="absolute right-3 top-9 flex items-center">
                    {checkingEmail ? (
                      <div className="flex items-center text-gray-500">
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        <span className="text-xs">Checking...</span>
                      </div>
                    ) : isExistingUser === true ? (
                      <div className="flex items-center text-green-600">
                        <UserCheck className="h-4 w-4 mr-1" />
                        <span className="text-xs">Existing user</span>
                      </div>
                    ) : isExistingUser === false ? (
                      <div className="flex items-center text-blue-600">
                        <UserPlus className="h-4 w-4 mr-1" />
                        <span className="text-xs">New account</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Show full name field for new users */}
              {isExistingUser === false && (
                <Input
                  label="Full Name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              )}
              
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={isExistingUser === true ? "Enter your password" : "Create a password"}
                helperText={isExistingUser === false ? "Password must be at least 6 characters" : undefined}
              />

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={!email || !password || (isExistingUser === false && password.length < 6)}
                style={{
                  background: theme.accent.blue,
                  color: theme.grayscale.background,
                  border: `1px solid ${theme.accent.blue}`,
                  fontWeight: 600,
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = theme.accent.purple;
                  e.currentTarget.style.borderColor = theme.accent.purple;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = theme.accent.blue;
                  e.currentTarget.style.borderColor = theme.accent.blue;
                }}
              >
                {isExistingUser === true ? 'Sign In' :
                 isExistingUser === false ? 'Create Account' :
                 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Guest Upload Option */}
        <Card style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-3" style={{ color: theme.accent.blue }} />
            <h3 className="font-medium mb-2" style={{ color: theme.grayscale.foreground }}>Quick Guest Upload</h3>
            <p className="text-sm mb-4" style={{ color: theme.grayscale.muted }}>
              Upload images temporarily without creating an account. Files auto-delete after your chosen time.
            </p>
            <Button
              variant="outline"
              onClick={handleGuestLogin}
              className="w-full"
              style={{
                background: theme.grayscale.surface,
                color: theme.accent.blue,
                border: `1px solid ${theme.accent.blue}`,
                fontWeight: 600,
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = theme.accent.blue;
                e.currentTarget.style.color = theme.grayscale.background;
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = theme.grayscale.surface;
                e.currentTarget.style.color = theme.accent.blue;
              }}
            >
              Continue as Guest
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
