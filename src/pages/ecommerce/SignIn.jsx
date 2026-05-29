import React, { useEffect, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams
} from 'react-router-dom'
import {
  ArrowLeft,
  KeyRound,
  Mail
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const SignIn = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const {
    login,
    sendResetEmail,
    verifyResetCode,
    updatePasswordWithCode
  } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetCodeLoading, setResetCodeLoading] = useState(false)
  const [resetMode, setResetMode] = useState('signin')
  const [resetCode, setResetCode] = useState('')

  const loginMessage = location.state?.message || ''

  useEffect(() => {
    const mode = searchParams.get('mode')
    const code = searchParams.get('oobCode')

    if (mode !== 'resetPassword' || !code) return

    const preparePasswordReset = async () => {
      try {
        setResetCodeLoading(true)
        setErrorMessage('')

        const emailFromCode = await verifyResetCode(code)

        setResetCode(code)
        setResetEmail(emailFromCode)
        setResetMode('reset')
      } catch (error) {
        console.log(error)
        setResetMode('forgot')
        setErrorMessage('Reset code is invalid or expired. Please request a new code.')
      } finally {
        setResetCodeLoading(false)
      }
    }

    preparePasswordReset()
  }, [searchParams, verifyResetCode])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!email || !password) {
      setErrorMessage('Please fill in all fields.')
      return
    }

    try {
      setLoading(true)

      await login(email, password, 'user')
      navigate(location.state?.from || '/')
    } catch (error) {
      console.log(error)

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        setErrorMessage('Invalid email or password.')
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Too many attempts. Please wait a few minutes.')
      } else if (error.message === 'Admin blocked from ecommerce') {
        setErrorMessage('Admin account is not allowed here.')
      } else {
        setErrorMessage('Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!resetEmail) {
      setErrorMessage('Please enter your email.')
      return
    }

    try {
      setLoading(true)

      await sendResetEmail(resetEmail)
      setSuccessMessage('A password reset link has been sent to your email. Open the email to reset your password.')
    } catch (error) {
      console.log(error)

      if (error.code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email.')
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email.')
      } else {
        setErrorMessage('Unable to send reset email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please fill in all password fields.')
      return
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password should be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    try {
      setLoading(true)

      await updatePasswordWithCode(resetCode, newPassword)

      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setResetCode('')
      setResetMode('signin')

      navigate('/signin', {
        replace: true,
        state: {
          message: 'Password updated successfully. Please sign in.'
        }
      })
    } catch (error) {
      console.log(error)

      if (error.code === 'auth/expired-action-code') {
        setErrorMessage('Reset code expired. Please request a new one.')
      } else if (error.code === 'auth/invalid-action-code') {
        setErrorMessage('Invalid reset code. Please request a new one.')
      } else {
        setErrorMessage('Unable to update password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 mb-6 hover:text-green-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to shop
        </Link>

        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">
          {resetMode === 'forgot'
            ? 'Forgot Password'
            : resetMode === 'reset'
              ? 'Create New Password'
              : 'Sign In'}
        </h1>

        <p className="text-center text-gray-500 mb-6">
          {resetMode === 'forgot'
            ? 'Enter your email to receive a reset code'
            : resetMode === 'reset'
              ? 'Set a new password for your account'
              : 'Login to your account'}
        </p>

        {loginMessage && resetMode === 'signin' && (
          <div className="mb-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-xl text-sm">
            {loginMessage}
          </div>
        )}

        {resetCodeLoading ? (
          <div className="text-center py-10 text-gray-500">
            Checking reset code...
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="mb-4 bg-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 bg-green-100 text-green-700 px-4 py-3 rounded-xl text-sm">
                {successMessage}
              </div>
            )}

            {resetMode === 'signin' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode('forgot')
                      setResetEmail(email)
                      setErrorMessage('')
                      setSuccessMessage('')
                    }}
                    className="text-sm font-semibold text-green-600 hover:text-green-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            )}

            {resetMode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending Code...' : 'Send Code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResetMode('signin')
                    setErrorMessage('')
                    setSuccessMessage('')
                  }}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-100 transition-all"
                >
                  Back to Sign In
                </button>
              </form>
            )}

            {resetMode === 'reset' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                  Code verified for {resetEmail}.
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            )}
          </>
        )}

        {resetMode === 'signin' && (
          <p className="text-center mt-6 text-sm text-gray-600">
            Don&apos;t have an account?
            <Link
              to="/signup"
              className="text-green-600 font-semibold ml-1 hover:underline"
            >
              Create Account
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

export default SignIn
