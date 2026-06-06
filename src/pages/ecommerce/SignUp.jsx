import React, { useState } from 'react'

import {
  Link,
  useNavigate
} from 'react-router-dom'

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User
} from 'lucide-react'

import toast from 'react-hot-toast'

import {
  createUserWithEmailAndPassword
} from 'firebase/auth'

import {
  doc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'

import {
  auth,
  db
} from '../../firebase/config'

const ADMIN_EMAIL = 'cyruscabanes@gmail.com'

const SignUp = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthday: '',
    password: '',
    confirmPassword: ''
  })

  const fullName =
    `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }))
  }

  const validateForm = () => {
    setErrorMessage('')

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setErrorMessage('Please fill in all required fields.')

      return false
    }

    if (formData.email.trim().toLowerCase() === ADMIN_EMAIL) {
      setErrorMessage('Admin email cannot be used for ecommerce sign up.')

      return false
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')

      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.')

      return false
    }

    return true
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          formData.email.trim(),
          formData.password
        )

      const firebaseUser = userCredential.user

      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          uid: firebaseUser.uid,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          fullName,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          birthday: formData.birthday,
          address: '',
          addressDetails: {
            country: 'Philippines',
            province: 'Cavite',
            city: 'General Trias',
            barangay: '',
            houseNumber: '',
            street: '',
            landmark: '',
            postalCode: '',
            deliveryNotes: ''
          },
          role: 'customer',
          emailVerified: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      )

      toast.success('Account created successfully!')

      navigate('/', { replace: true })
    } catch (error) {
      console.log(error)

      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Email already exists.')
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address.')
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Use at least 6 characters.')
      } else {
        setErrorMessage('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-6 sm:px-4 flex items-center justify-center">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid lg:grid-cols-5">
          <div className="lg:col-span-2 bg-gradient-to-br from-green-700 to-green-500 p-6 sm:p-8 text-white">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-green-50 mb-10"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to shop
            </Link>

            <div className="max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                <User className="w-8 h-8" />
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold">
                Create Account
              </h1>

              <p className="mt-4 text-green-50 leading-relaxed">
                Sign up to checkout faster, save your profile, and track your hardware orders.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 p-5 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Customer Details
              </h2>

              <p className="text-gray-500 mt-1">
                Use your active email and phone number for order updates.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700">
                    First Name
                  </span>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-4 outline-none focus:border-green-500"
                  />
                </div>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Last Name
                  </span>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                  />
                </label>
              </div>

              <label className="space-y-2 block">
                <span className="text-sm font-semibold text-gray-700">
                  Email Address
                </span>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-4 outline-none focus:border-green-500"
                  />
                </div>
              </label>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Phone Number
                  </span>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="09XXXXXXXXX"
                      className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-4 outline-none focus:border-green-500"
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Birthday
                  </span>
                  <input
                    type="date"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                  />
                </label>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Password
                  </span>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-12 outline-none focus:border-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Confirm Password
                  </span>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-12 outline-none focus:border-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full rounded-xl bg-green-600 py-4
                  font-bold text-white hover:bg-green-700
                  disabled:cursor-not-allowed disabled:opacity-60
                  transition
                "
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-gray-600">
              Already have an account?
              <Link
                to="/signin"
                className="text-green-600 font-semibold ml-1 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
