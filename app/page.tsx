'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { APP_NAME, APP_TAGLINE, ADMIN_CREDENTIALS } from '@/lib/utils/constants'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [role, setRole] = useState<'customer' | 'admin'>('customer')
  const [showSignup, setShowSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [signupUsername, setSignupUsername] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')

  const handleGoogleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/customer` }
    })
    if (error) {
      setError('Google sign-in failed')
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (role === 'admin') {
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        localStorage.setItem('quickbite_session', JSON.stringify({ username, role: 'admin' }))
        router.push('/admin')
      } else {
        setError('Invalid admin credentials')
      }
    } else {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single()

      if (data) {
        localStorage.setItem('quickbite_session', JSON.stringify({ username, role: 'customer' }))
        router.push('/customer')
      } else {
        setError('Invalid credentials. Please sign up first.')
      }
    }
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (signupPassword.length < 4) {
      setError('Password must be at least 4 characters')
      setLoading(false)
      return
    }

    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from('users')
      .select('username')
      .ilike('username', signupUsername)
      .single()

    if (existing) {
      setError('Username already exists')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert([{ username: signupUsername, password: signupPassword, role: 'customer' }])

    if (insertError) {
      setError('Registration failed')
    } else {
      localStorage.setItem('quickbite_session', JSON.stringify({ username: signupUsername, role: 'customer' }))
      router.push('/customer')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 text-6xl animate-float opacity-50">🍔</div>
      <div className="absolute bottom-20 right-10 text-6xl animate-float opacity-50" style={{ animationDelay: '1s' }}>🍕</div>
      <div className="absolute top-40 right-20 text-4xl animate-float opacity-30" style={{ animationDelay: '2s' }}>🍟</div>
      <div className="absolute bottom-40 left-20 text-4xl animate-float opacity-30" style={{ animationDelay: '0.5s' }}>🥤</div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-cyan-500 rounded-3xl blur-xl opacity-30 animate-glow" />

        <div className="relative glass-strong rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
              <span className="text-4xl animate-bounce">⚡</span>
              <h1 className="text-4xl font-bold gradient-text">{APP_NAME}</h1>
            </div>
            <p className="text-gray-400">{APP_TAGLINE}</p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-white/5 rounded-2xl">
            {(['customer', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex flex-col items-center gap-1 p-4 rounded-xl transition-all duration-300 ${role === r
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                    : 'text-gray-400 hover:bg-white/10'
                  }`}
              >
                <span className="text-2xl">{r === 'customer' ? '👤' : '🛡️'}</span>
                <span className="text-sm font-medium capitalize">{r}</span>
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center animate-in fade-in">
              {error}
            </div>
          )}

          {!showSignup ? (
            <>
              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                  Sign In
                </Button>
              </form>

              {role === 'customer' && (
                <>
                  {/* Divider */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <span className="text-gray-500 text-sm">or</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>

                  {/* Google Sign In */}
                  <Button
                    variant="google"
                    className="w-full"
                    size="lg"
                    onClick={handleGoogleSignIn}
                    isLoading={loading}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </Button>

                  <p className="mt-6 text-center text-gray-400 text-sm">
                    Don&apos;t have an account?{' '}
                    <button onClick={() => setShowSignup(true)} className="text-orange-400 hover:underline font-medium">
                      Sign Up
                    </button>
                  </p>
                </>
              )}
            </>
          ) : (
            <>
              {/* Signup Form */}
              <form onSubmit={handleSignup} className="space-y-4">
                <Input
                  placeholder="Choose a username"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Create password (min 4 chars)"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  size="lg"
                  isLoading={loading}
                >
                  Create Account
                </Button>
              </form>

              <p className="mt-6 text-center text-gray-400 text-sm">
                Already have an account?{' '}
                <button onClick={() => setShowSignup(false)} className="text-orange-400 hover:underline font-medium">
                  Sign In
                </button>
              </p>
            </>
          )}

          {/* Admin hint */}
          <p className="mt-6 text-center text-gray-600 text-xs">
            Admin: {ADMIN_CREDENTIALS.username} / {ADMIN_CREDENTIALS.password}
          </p>
        </div>
      </div>
    </div>
  )
}
