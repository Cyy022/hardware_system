import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const SignIn = () => {

  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {

    e.preventDefault()

    setErrorMessage('')

    try {

      await login(email, password)

      navigate('/')

    } catch (error) {

      console.log(error)

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {

        setErrorMessage('Invalid email or password.')

      } else if (error.code === 'auth/too-many-requests') {

        setErrorMessage('Too many attempts. Try again later.')

      } else {

        setErrorMessage('Something went wrong.')

      }

    }

  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        <h1 className="text-3xl font-bold mb-6 text-center">
          Sign In
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ERROR MESSAGE */}

          {errorMessage && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
              {errorMessage}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded-xl px-4 py-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-xl px-4 py-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-xl"
          >
            Sign In
          </button>

        </form>

        <p className="text-center mt-4 text-sm">
          Don’t have account?
          <Link
            to="/signup"
            className="text-green-600 font-semibold ml-1"
          >
            Create Account
          </Link>
        </p>

      </div>

    </div>
  )
}

export default SignIn