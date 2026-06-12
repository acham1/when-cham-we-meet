import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type Auth,
} from 'firebase/auth'
import { getApp, USE_FIREBASE } from './firebase'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: () => Promise<User | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signIn: async () => null,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

let authInstance: Auth | null = null

function getAuthInstance(): Auth | null {
  if (!USE_FIREBASE) return null
  if (!authInstance) authInstance = getAuth(getApp())
  return authInstance
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(USE_FIREBASE)

  useEffect(() => {
    const auth = getAuthInstance()
    if (!auth) return
    return onAuthStateChanged(auth, u => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const signIn = async (): Promise<User | null> => {
    const auth = getAuthInstance()
    if (!auth) return null
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      return result.user
    } catch {
      return null
    }
  }

  const signOut = async () => {
    const auth = getAuthInstance()
    if (!auth) return
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
