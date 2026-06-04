import React, { useEffect, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams
} from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  KeyRound,
  Mail,
  RefreshCw,
  ShieldCheck
} from 'lucide-react'
import emailjs from '@emailjs/browser'
import {
  arrayUnion,
  doc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../firebase/config'
import { getUserByEmail } from '../../firebase/services'

const CAPTCHA_THRESHOLD = 3
const LOCKOUT_THRESHOLD = 5
const LOCKOUT_MINUTES = 10
const OTP_EXPIRY_MINUTES = 5

const createCaptcha = () => {
  const firstNumber = Math.floor(Math.random() * 8) + 2
  const secondNumber = Math.floor(Math.random() * 8) + 2

  return {
    question: `${firstNumber} + ${secondNumber}`,
    answer: String(firstNumber + secondNumber)
  }
}

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000))

const getSecurityKey = (email) =>
  `ecommerce-login-security:${email.trim().toLowerCase()}`

const getStoredSecurity = (email) => {
  if (!email.trim()) {
    return {
      failedAttempts: 0,
      lockedUntil: 0
    }
  }

  try {
    return JSON.parse(localStorage.getItem(getSecurityKey(email))) || {
      failedAttempts: 0,
      lockedUntil: 0
    }
  } catch {
    return {
      failedAttempts: 0,
      lockedUntil: 0
    }
  }
}

const setStoredSecurity = (email, value) => {
  if (!email.trim()) return

  localStorage.setItem(
    getSecurityKey(email),
    JSON.stringify(value)
  )
}

const clearStoredSecurity = (email) => {
  if (!email.trim()) return

  localStorage.removeItem(getSecurityKey(email))
}

const formatLoginTime = (value) => {
  const date =
    value?.toDate?.() ||
    (typeof value === 'string' ? new Date(value) : null)

  if (!date || Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

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
  const [captcha, setCaptcha] = useState(() => createCaptcha())
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [pendingLogin, setPendingLogin] = useState(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [lastLogin, setLastLogin] = useState('')

  const loginMessage = location.state?.message || ''
  const isLocked = lockedUntil > Date.now()
  const lockoutMinutesLeft = Math.ceil((lockedUntil - Date.now()) / 60000)
  const showCaptcha = failedAttempts >= CAPTCHA_THRESHOLD

  const refreshCaptcha = () => {
    setCaptcha(createCaptcha())
    setCaptchaAnswer('')
  }

  const syncSecurityState = (targetEmail) => {
    const security = getStoredSecurity(targetEmail)

    if (security.lockedUntil && security.lockedUntil <= Date.now()) {
      clearStoredSecurity(targetEmail)
      setFailedAttempts(0)
      setLockedUntil(0)
      return
    }

    setFailedAttempts(security.failedAttempts || 0)
    setLockedUntil(security.lockedUntil || 0)
  }

  const recordFailedAttempt = (targetEmail) => {
    const security = getStoredSecurity(targetEmail)
    const nextAttempts = (security.failedAttempts || 0) + 1
    const nextLockedUntil =
      nextAttempts >= LOCKOUT_THRESHOLD
        ? Date.now() + LOCKOUT_MINUTES * 60 * 1000
        : security.lockedUntil || 0

    setStoredSecurity(targetEmail, {
      failedAttempts: nextAttempts,
      lockedUntil: nextLockedUntil
    })

    setFailedAttempts(nextAttempts)
    setLockedUntil(nextLockedUntil)
    refreshCaptcha()
  }

  const sendTwoFactorEmail = async (targetEmail, code) => {
    await emailjs.send(
      'service_daso4rv',
      'template_a41se2f',
      {
        to_email: targetEmail,
        email: targetEmail,
        name: targetEmail,
        verification_code: code,
        code,
        expires_in: `${OTP_EXPIRY_MINUTES} minutes`
      },
      '1pMNRxW60at4SEuYJ'
    )
  }

  const recordLoginActivity = async (user) => {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        lastLoginAt: serverTimestamp(),
        loginActivity: arrayUnion({
          at: new Date().toISOString(),
          userAgent: navigator.userAgent || 'Unknown browser',
          method: 'password_email_2fa'
        }),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
  }

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

  useEffect(() => {
    syncSecurityState(email)

    if (!email.trim()) {
      setLastLogin('')
      return
    }

    const lookupTimer = setTimeout(async () => {
      try {
        const userProfile = await getUserByEmail(email.trim())

        setLastLogin(formatLoginTime(userProfile?.lastLoginAt))
      } catch (error) {
        console.log(error)
        setLastLogin('')
      }
    }, 500)

    return () => clearTimeout(lookupTimer)
  }, [email])

  useEffect(() => {
    if (!lockedUntil) return undefined

    const timer = setInterval(() => {
      if (lockedUntil <= Date.now()) {
        clearStoredSecurity(email)
        setFailedAttempts(0)
        setLockedUntil(0)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [email, lockedUntil])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!email || !password) {
      setErrorMessage('Please fill in all fields.')
      return
    }

    if (isLocked) {
      setErrorMessage(`Account temporarily locked. Try again in ${lockoutMinutesLeft} minute(s).`)
      return
    }

    if (showCaptcha && captchaAnswer.trim() !== captcha.answer) {
      setErrorMessage('Please complete the CAPTCHA correctly.')
      refreshCaptcha()
      return
    }

    try {
      setLoading(true)

      await login(email.trim(), password, 'user', {
        endSessionAfterCheck: true
      })

      const code = createOtp()

      await sendTwoFactorEmail(email.trim(), code)

      setPendingLogin({
        email: email.trim(),
        password,
        code,
        expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
      })
      setTwoFactorCode('')
      setResetMode('twoFactor')
      setSuccessMessage('Verification code sent to your email.')
    } catch (error) {
      console.log(error)

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        setErrorMessage('Invalid email or password.')
        recordFailedAttempt(email)
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Too many attempts. Please wait a few minutes.')
        recordFailedAttempt(email)
      } else if (error.message === 'Admin blocked from ecommerce') {
        setErrorMessage('Admin account is not allowed here.')
      } else if (error.message === 'Email not verified') {
        setErrorMessage('Please verify your email before signing in.')
      } else {
        setErrorMessage('Unable to send verification code. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTwoFactorSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!pendingLogin) {
      setResetMode('signin')
      setErrorMessage('Please sign in again.')
      return
    }

    if (Date.now() > pendingLogin.expiresAt) {
      setPendingLogin(null)
      setTwoFactorCode('')
      setResetMode('signin')
      setErrorMessage('Verification code expired. Please sign in again.')
      return
    }

    if (twoFactorCode.trim() !== pendingLogin.code) {
      setErrorMessage('Invalid verification code.')
      return
    }

    try {
      setLoading(true)

      const user = await login(
        pendingLogin.email,
        pendingLogin.password,
        'user'
      )

      await recordLoginActivity(user)
      clearStoredSecurity(pendingLogin.email)
      setFailedAttempts(0)
      setLockedUntil(0)
      setPendingLogin(null)
      setPassword('')
      setTwoFactorCode('')

      navigate(location.state?.from || '/')
    } catch (error) {
      console.log(error)
      setErrorMessage('Unable to complete sign in. Please try again.')
      setResetMode('signin')
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
              : resetMode === 'twoFactor'
                ? 'Verify Login'
                : 'Sign In'}
        </h1>

        <p className="text-center text-gray-500 mb-6">
          {resetMode === 'forgot'
            ? 'Enter your email to receive a reset code'
            : resetMode === 'reset'
              ? 'Set a new password for your account'
              : resetMode === 'twoFactor'
                ? 'Enter the security code sent to your email'
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
                {isLocked && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Account is temporarily locked. Try again in {lockoutMinutesLeft} minute(s).
                    </span>
                  </div>
                )}

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

                {lastLogin && (
                  <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span>
                      Last login: {lastLogin}
                    </span>
                  </div>
                )}

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

                {showCaptcha && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      CAPTCHA required after failed attempts
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-lg font-bold text-gray-900 sm:w-28">
                        {captcha.question}
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={captchaAnswer}
                        onChange={(event) => setCaptchaAnswer(event.target.value)}
                        placeholder="Answer"
                        className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-600 hover:text-green-700"
                        aria-label="Refresh CAPTCHA"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

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
                  disabled={loading || isLocked}
                  className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Checking...' : 'Sign In'}
                </button>
              </form>
            )}

            {resetMode === 'twoFactor' && (
              <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  We sent a {OTP_EXPIRY_MINUTES}-minute verification code to {pendingLogin?.email}.
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={twoFactorCode}
                      onChange={(event) => setTwoFactorCode(event.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-green-600 py-3 text-white transition-all hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify and Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPendingLogin(null)
                    setTwoFactorCode('')
                    setResetMode('signin')
                    setErrorMessage('')
                    setSuccessMessage('')
                  }}
                  className="w-full rounded-xl border border-gray-300 py-3 text-gray-700 transition-all hover:bg-gray-100"
                >
                  Back to Sign In
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
