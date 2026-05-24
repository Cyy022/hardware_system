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
  setDoc,
  getDoc
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

  const ADMIN_EMAIL = 'cyruscabanes@gmail.com'

  useEffect(() => {

    setPersistence(auth, browserLocalPersistence)

    const unsubscribe = onAuthStateChanged(auth, async(currentUser) => {

      if (currentUser) {

        setUser(currentUser)

        setIsAdmin(currentUser.email === ADMIN_EMAIL)

      } else {

        setUser(null)
        setIsAdmin(false)

      }

      setLoading(false)

    })

    return () => unsubscribe()

  }, [])

  // ================= REGISTER =================

  const register = async(formData) => {

    try {

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      const firebaseUser = userCredential.user

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: 'customer',
        createdAt: new Date()
      })

      toast.success('Account created successfully!')

      return firebaseUser

    } catch (error) {

      toast.error(error.message)
      throw error

    }

  }

  // ================= LOGIN =================

const login = async (email, password) => {

  try {

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )

    return userCredential.user

  } catch (error) {

    if (
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/user-not-found'
    ) {

      toast.error('Invalid email or password.')

    } else if (error.code === 'auth/too-many-requests') {

      toast.error('Too many login attempts. Try again later.')

    } else {

      toast.error('Login failed.')

    }

    throw error

  }

}
  // ================= LOGOUT =================

  const logout = async() => {

    try {

      await signOut(auth)

      toast.success('Logged out successfully')

    } catch (error) {

      toast.error(error.message)
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
      {children}
    </AuthContext.Provider>
  )
}