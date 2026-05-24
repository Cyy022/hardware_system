import { createContext, useContext, useState, useEffect } from 'react'

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword
} from 'firebase/auth'

import {
  doc,
  setDoc
} from 'firebase/firestore'

import { auth, db } from '../firebase/config'

import toast from 'react-hot-toast'

const AuthContext = createContext()

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

    setPersistence(auth, browserLocalPersistence)

    const unsubscribe = onAuthStateChanged(
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

    return () => unsubscribe()

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
const login = async (email, password, loginType = 'user') => {

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
      error.message !== 'Admin blocked from ecommerce'
    ) {

      toast.error('Login failed.')

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

  const value = {
    user,
    loading,
    isAdmin,
    login,
    logout,
    register
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )

}