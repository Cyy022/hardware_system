import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  createUserWithEmailAndPassword
} from 'firebase/auth'

import {
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore'

import {
  auth,
  db
} from '../../firebase/config'

const SignUp = () => {

  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthday: '',
    password: ''
  })

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })

  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    try {

      setLoading(true)

      // CREATE AUTH ACCOUNT
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        )

      const user = userCredential.user

      // SAVE USER INFO TO FIRESTORE
      await setDoc(doc(db, 'users', user.uid), {

        uid: user.uid,

        firstName: formData.firstName,

        lastName: formData.lastName,

        fullName:
          `${formData.firstName} ${formData.lastName}`,

        email: formData.email,

        phone: formData.phone,

        address: formData.address,

        birthday: formData.birthday,

        role: 'customer',

        createdAt: serverTimestamp()

      })

      navigate('/profile')

    } catch (error) {

      console.log(error)

      alert(error.message)

    } finally {

      setLoading(false)

    }

  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">

        <h1 className="text-3xl font-bold mb-6 text-center">
          Create Account
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            className="w-full border rounded-xl px-4 py-3"
            value={formData.firstName}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            className="w-full border rounded-xl px-4 py-3"
            value={formData.lastName}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border rounded-xl px-4 py-3"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            className="w-full border rounded-xl px-4 py-3"
            value={formData.phone}
            onChange={handleChange}
          />

          <input
            type="text"
            name="address"
            placeholder="Address"
            className="w-full border rounded-xl px-4 py-3"
            value={formData.address}
            onChange={handleChange}
          />

          <input
            type="date"
            name="birthday"
            className="w-full border rounded-xl px-4 py-3"
            value={formData.birthday}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full border rounded-xl px-4 py-3"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="
              w-full bg-green-600
              hover:bg-green-700
              text-white py-3 rounded-xl
              font-semibold transition
            "
          >

            {loading
              ? 'Creating Account...'
              : 'Create Account'}

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