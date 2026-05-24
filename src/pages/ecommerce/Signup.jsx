import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const SignUp = () => {

  const navigate = useNavigate()

  const { register } = useAuth()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  })

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })

  }

  const handleSubmit = async(e) => {

    e.preventDefault()

    try {

      await register(formData)

      navigate('/')

    } catch (error) {
      console.log(error)
    }

  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">

        <h1 className="text-3xl font-bold mb-6 text-center">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            className="w-full border rounded-xl px-4 py-3"
            onChange={handleChange}
          />

          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            className="w-full border rounded-xl px-4 py-3"
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border rounded-xl px-4 py-3"
            onChange={handleChange}
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            className="w-full border rounded-xl px-4 py-3"
            onChange={handleChange}
          />

          <input
            type="text"
            name="address"
            placeholder="Address"
            className="w-full border rounded-xl px-4 py-3"
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full border rounded-xl px-4 py-3"
            onChange={handleChange}
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-xl"
          >
            Create Account
          </button>

        </form>

        <p className="text-center mt-4 text-sm">
          Already have account?
          <Link
            to="/signin"
            className="text-green-600 font-semibold ml-1"
          >
            Sign In
          </Link>
        </p>

      </div>

    </div>
  )
}

export default SignUp