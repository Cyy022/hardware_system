import { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth'
import { auth } from '../firebase/config'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Admin credentials
  const ADMIN_EMAIL = 'cyruscabanes@gmail.com'
  const ADMIN_PASSWORD = '551500'

  useEffect(() => {
    // Set persistence to local
    setPersistence(auth, browserLocalPersistence)

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
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

  const login = async (email, password) => {
    try {
      if (email !== ADMIN_EMAIL) {
        throw new Error('Unauthorized access. Only admin can login.')
      }

      if (password !== ADMIN_PASSWORD) {
        throw new Error('Invalid password.')
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      toast.success('Login successful! Welcome back, Admin.')
      return userCredential.user
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Failed to logout')
      throw error
    }
  }

  const value = {
    user,
    isAdmin,
    loading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
