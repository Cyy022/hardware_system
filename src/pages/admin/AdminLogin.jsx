import React, { useState, useEffect } from 'react'

import { useNavigate, Link } from 'react-router-dom'

import {
  Store,
  Eye,
  EyeOff,
  Lock,
  Mail
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { useAccessibility } from '../../context/AccessibilityContext'

import LoadingSpinner from '../../components/common/LoadingSpinner'

const AdminLogin = () => {

  const navigate = useNavigate()

  const {
    login,
    user,
    isAdmin
  } = useAuth()

  const { speak } = useAccessibility()

  // ================= STATES =================

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  // ================= AUTO REDIRECT =================

  useEffect(() => {

    if (user && isAdmin) {

      navigate('/admin/dashboard')

    }

  }, [user, isAdmin, navigate])

  // ================= LOGIN =================

  const handleSubmit = async (e) => {

    e.preventDefault()

    setErrorMessage('')

    // VALIDATION
    if (!email || !password) {

      setErrorMessage(
        'Please fill in all fields.'
      )

      return

    }

    try {

      setIsSubmitting(true)

      // ADMIN LOGIN ONLY
      await login(
        email,
        password,
        'admin'
      )

      speak(
        'Login successful. Redirecting to dashboard.'
      )

      navigate('/admin/dashboard')

    } catch (error) {

      console.log(error)

      speak(
        'Login failed. Please check your credentials.'
      )

      // FIREBASE ERRORS
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {

        setErrorMessage(
          'Invalid email or password.'
        )

      } else if (
        error.code === 'auth/too-many-requests'
      ) {

        setErrorMessage(
          'Too many login attempts. Please wait a few minutes.'
        )

      } else if (
        error.message === 'Not admin'
      ) {

        setErrorMessage(
          'Access denied. Admin only.'
        )

      } else {

        setErrorMessage(
          'Login failed. Please try again.'
        )

      }

    } finally {

      setIsSubmitting(false)

    }

  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">

      <div className="w-full max-w-md">

        {/* LOGO */}
        <div className="text-center mb-8">

          <div className="
            w-20 h-20
            bg-primary-600
            rounded-2xl
            flex items-center justify-center
            mx-auto mb-4
            shadow-lg
          ">

            <Store className="w-10 h-10 text-white" />

          </div>

          <h1 className="text-3xl font-bold text-gray-900">

            Batang Gapan

          </h1>

          <p className="text-gray-500 mt-1">

            Mini Hardware Admin Panel

          </p>

        </div>

        {/* LOGIN CARD */}
        <div className="
          bg-white rounded-2xl
          shadow-xl
          p-8
          border border-gray-100
        ">

          <h2 className="
            text-2xl font-semibold
            text-gray-900
            mb-6
            text-center
          ">

            Admin Login

          </h2>

          {/* ERROR MESSAGE */}
          {errorMessage && (

            <div className="
              bg-red-100
              text-red-700
              px-4 py-3
              rounded-xl
              text-sm
              mb-5
            ">

              {errorMessage}

            </div>

          )}

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* EMAIL */}
            <div>

              <label
                htmlFor="email"
                className="
                  block text-sm
                  font-medium
                  text-gray-700
                  mb-2
                "
              >

                Email Address

              </label>

              <div className="relative">

                <Mail className="
                  absolute left-3 top-1/2
                  -translate-y-1/2
                  w-5 h-5
                  text-gray-400
                " />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter admin email"
                  required
                  className="
                    w-full border border-gray-300
                    rounded-xl
                    py-3 pl-10 pr-4
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary-500
                  "
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div>

              <label
                htmlFor="password"
                className="
                  block text-sm
                  font-medium
                  text-gray-700
                  mb-2
                "
              >

                Password

              </label>

              <div className="relative">

                <Lock className="
                  absolute left-3 top-1/2
                  -translate-y-1/2
                  w-5 h-5
                  text-gray-400
                " />

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter password"
                  required
                  className="
                    w-full border border-gray-300
                    rounded-xl
                    py-3 pl-10 pr-12
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary-500
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="
                    absolute right-3 top-1/2
                    -translate-y-1/2
                    text-gray-400
                    hover:text-gray-600
                  "
                >

                  {showPassword ? (

                    <EyeOff className="w-5 h-5" />

                  ) : (

                    <Eye className="w-5 h-5" />

                  )}

                </button>

              </div>

            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full
                bg-primary-600
                hover:bg-primary-700
                text-white
                py-3
                rounded-xl
                transition-all
                font-medium
                disabled:opacity-50
                flex items-center justify-center
              "
            >

              {isSubmitting ? (

                <LoadingSpinner size="sm" />

              ) : (

                'Login'

              )}

            </button>

          </form>

          {/* FOOTER */}
          <div className="mt-6 text-center">

            <p className="text-xs text-gray-500">

              Only authorized admin can access this panel.

            </p>

          </div>

        </div>

        {/* BACK TO STORE */}
        <div className="text-center mt-6">

          <Link
            to="/"
            className="
              text-sm
              text-primary-600
              hover:text-primary-700
              font-medium
            "
          >

            ← Back to Store

          </Link>

        </div>

      </div>

    </div>

  )

}

export default AdminLogin