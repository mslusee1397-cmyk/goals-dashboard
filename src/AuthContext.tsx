import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, AuthContextType } from './types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize user from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('focus-point-user')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    }
    setIsInitialized(true)
  }, [])

  const login = (username: string, password: string): boolean => {
    try {
      const users = JSON.parse(localStorage.getItem('focus-point-users') || '{}') as Record<string, User>
      const user = Object.values(users).find(u => u.username === username)

      if (!user || user.password !== password) {
        return false
      }

      setUser(user)
      localStorage.setItem('focus-point-user', JSON.stringify(user))
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const register = (username: string, password: string): boolean => {
    try {
      if (!username || !password) return false
      if (password.length < 4) return false

      const users = JSON.parse(localStorage.getItem('focus-point-users') || '{}') as Record<string, User>

      // Check if username already exists
      if (Object.values(users).some(u => u.username === username)) {
        return false
      }

      const newUser: User = {
        id: Date.now().toString(),
        username,
        password, // Note: in production, this should be hashed!
        createdAt: Date.now()
      }

      users[newUser.id] = newUser
      localStorage.setItem('focus-point-users', JSON.stringify(users))

      setUser(newUser)
      localStorage.setItem('focus-point-user', JSON.stringify(newUser))
      return true
    } catch (error) {
      console.error('Registration error:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('focus-point-user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {isInitialized && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
