import { createContext, useContext, useState, useEffect } from 'react'

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  inMemoryPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth'

import {
  doc,
  setDoc
} from 'firebase/firestore'

import { auth, db } from '../firebase/config'

import toast from 'react-hot-toast'

const AuthContext = createContext()
const ECOMMERCE_SESSION_TIMEOUT_MS = 15 * 60 * 1000

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // ADMIN EMAIL
  const ADMIN_EMAIL = 'cyruscabanes@gmail.com'

  // ================= AUTH STATE =================

  useEffect(() => {

    let unsubscribe = () => {}
    let isMounted = true

    const initializeAuth = async () => {

      try {

        await setPersistence(auth, inMemoryPersistence)
        await signOut(auth)

      } catch (error) {

        console.error(error)

      }

      if (!isMounted) return

      unsubscribe = onAuthStateChanged(
        auth,
        (currentUser) => {

          if (currentUser) {

            setUser(currentUser)

            // ADMIN CHECK
            setIsAdmin(
              currentUser.email === ADMIN_EMAIL
            )

          } else {

            setUser(null)
            setIsAdmin(false)

          }

          setLoading(false)

        }
      )

    }

    initializeAuth()

    return () => {
      isMounted = false
      unsubscribe()
    }

  }, [])

  // ================= REGISTER =================

  const register = async (formData) => {

    try {

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        )

      const firebaseUser = userCredential.user

      // SAVE USER DATA
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          uid: firebaseUser.uid,
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          email: formData.email || '',
          phone: formData.phone || '',
          address: formData.address || '',
          role:
            formData.email === ADMIN_EMAIL
              ? 'admin'
              : 'customer',
          createdAt: new Date()
        }
      )

      toast.success('Account created successfully!')

      return firebaseUser

    } catch (error) {

      console.error(error)

      if (error.code === 'auth/email-already-in-use') {

        toast.error('Email already exists.')

      } else if (error.code === 'auth/weak-password') {

        toast.error('Password should be at least 6 characters.')

      } else {

        toast.error('Registration failed.')

      }

      throw error

    }

  }

  // ================= LOGIN =================
const login = async (
  email,
  password,
  loginType = 'user',
  options = {}
) => {

  try {

    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

    const loggedInUser = userCredential.user

    // ADMIN LOGIN CHECK
    if (
      loginType === 'admin' &&
      loggedInUser.email !== ADMIN_EMAIL
    ) {

      await signOut(auth)

      toast.error('Access denied. Admin only.')

      throw new Error('Not admin')

    }

    // ECOMMERCE LOGIN CHECK
    if (
      loginType === 'user' &&
      loggedInUser.email === ADMIN_EMAIL
    ) {

      await signOut(auth)

      toast.error(
        'Admin account is not allowed in ecommerce login.'
      )

      throw new Error('Admin blocked from ecommerce')

    }

    if (
      loginType === 'user' &&
      !loggedInUser.emailVerified
    ) {

      await signOut(auth)

      toast.error(
        'Please verify your email before signing in.'
      )

      throw new Error('Email not verified')

    }

    if (options.endSessionAfterCheck) {

      await signOut(auth)

      return loggedInUser

    }

    toast.success('Login successful!')

    return loggedInUser

  } catch (error) {

    console.error(error)

    if (
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/user-not-found'
    ) {

      toast.error('Invalid email or password.')

    } else if (
      error.code === 'auth/too-many-requests'
    ) {

      toast.error(
        'Too many login attempts. Please wait a few minutes.'
      )

    } else if (
      error.message !== 'Not admin' &&
      error.message !== 'Admin blocked from ecommerce' &&
      error.message !== 'Email not verified'
    ) {

      toast.error('Login failed.')

    }

    throw error

  }

}

  // ================= PASSWORD RESET =================

  const sendResetEmail = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/signin`
      })

      toast.success('Code is sent to your email.')
    } catch (error) {
      console.error(error)

      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email.')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Please enter a valid email.')
      } else {
        toast.error('Unable to send reset email.')
      }

      throw error
    }
  }

  const verifyResetCode = async (code) => {
    return verifyPasswordResetCode(auth, code)
  }

  const updatePasswordWithCode = async (code, newPassword) => {
    try {
      await confirmPasswordReset(auth, code, newPassword)
      toast.success('Password updated. Please sign in.')
    } catch (error) {
      console.error(error)

      if (error.code === 'auth/expired-action-code') {
        toast.error('Reset code expired. Please request a new one.')
      } else if (error.code === 'auth/invalid-action-code') {
        toast.error('Invalid reset code. Please request a new one.')
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password should be at least 6 characters.')
      } else {
        toast.error('Unable to update password.')
      }

      throw error
    }
  }
  // ================= LOGOUT =================

  const logout = async () => {

    try {

      await signOut(auth)

      setUser(null)
      setIsAdmin(false)

      toast.success('Logged out successfully.')

    } catch (error) {

      console.error(error)

      toast.error('Logout failed.')

      throw error

    }

  }

  useEffect(() => {
    if (!user || isAdmin) return undefined

    let timeoutId

    const resetTimeout = () => {
      window.clearTimeout(timeoutId)

      timeoutId = window.setTimeout(async () => {
        await signOut(auth)
        setUser(null)
        setIsAdmin(false)
        toast.error('Session expired due to inactivity.')
      }, ECOMMERCE_SESSION_TIMEOUT_MS)
    }

    const events = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart'
    ]

    events.forEach((eventName) => {
      window.addEventListener(eventName, resetTimeout)
    })

    resetTimeout()

    return () => {
      window.clearTimeout(timeoutId)

      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimeout)
      })
    }
  }, [user, isAdmin])

  const value = {
    user,
    loading,
    isAdmin,
    login,
    logout,
    register,
    sendResetEmail,
    verifyResetCode,
    updatePasswordWithCode
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )

}
