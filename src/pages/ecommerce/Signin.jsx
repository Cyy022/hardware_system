import React, { useState } from 'react'

import {
  Link,
  useNavigate
} from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

const SignIn = () => {

  const navigate = useNavigate()

  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // ================= SUBMIT =================

  const handleSubmit = async (e) => {

    e.preventDefault()

    setErrorMessage('')

    // VALIDATION
    if (!email || !password) {

      setErrorMessage('Please fill in all fields.')

      return

    }

    try {

      setLoading(true)

      // USER LOGIN ONLY
      await login(email, password, 'user')

      navigate('/')

    } catch (error) {

      console.log(error)

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {

        setErrorMessage('Invalid email or password.')

      } else if (
        error.code === 'auth/too-many-requests'
      ) {

        setErrorMessage(
          'Too many attempts. Please wait a few minutes.'
        )

      } else if (
        error.message === 'Admin blocked from ecommerce'
      ) {

        setErrorMessage(
          'Admin account is not allowed here.'
        )

      } else {

        setErrorMessage(
          'Something went wrong. Please try again.'
        )

      }

    } finally {

      setLoading(false)

    }

  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        {/* TITLE */}
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">

          Sign In

        </h1>

        <p className="text-center text-gray-500 mb-6">

          Login to your account

        </p>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* ERROR */}
          {errorMessage && (

            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">

              {errorMessage}

            </div>

          )}

          {/* EMAIL */}
          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">

              Email

            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="
                w-full border border-gray-300
                rounded-xl px-4 py-3
                focus:outline-none
                focus:ring-2
                focus:ring-green-500
              "
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

          </div>

          {/* PASSWORD */}
          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">

              Password

            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className="
                w-full border border-gray-300
                rounded-xl px-4 py-3
                focus:outline-none
                focus:ring-2
                focus:ring-green-500
              "
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full bg-green-600 text-white
              py-3 rounded-xl
              hover:bg-green-700
              transition-all
              disabled:opacity-50
            "
          >

            {loading ? 'Signing In...' : 'Sign In'}

          </button>

        </form>

        {/* SIGNUP */}
        <p className="text-center mt-6 text-sm text-gray-600">

          Don’t have an account?

          <Link
            to="/signup"
            className="text-green-600 font-semibold ml-1 hover:underline"
          >

            Create Account

          </Link>

        </p>

      </div>

    </div>

  )

}

export default SignIn