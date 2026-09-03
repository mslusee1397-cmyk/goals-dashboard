import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, AuthContextType } from './types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('focus-point-user')
      if (savedUser) setUser(JSON.parse(savedUser))
    } catch (error) {
      console.error('Failed to load user:', error)
    }
    setIsInitialized(true)
  }, [])

  const login = (username: string, password: string): boolean => {
    try {
      const users = JSON.parse(localStorage.getItem('focus-point-users') || '{}') as Record<string, User>
      const user = Object.values(users).find(u => u.username === username)
      if (!user || user.password !== password) return false
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
      if (!username || !password || password.length < 4) return false
      const users = JSON.parse(localStorage.getItem('focus-point-users') || '{}') as Record<string, User>
      if (Object.values(users).some(u => u.username === username)) return false

      const newUser: User = {
        id: Date.now().toString(),
        username,
        password,
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

  const resetPassword = (username: string, newPassword: string): boolean => {
    try {
      if (!username || newPassword.length < 4) return false
      const users = JSON.parse(localStorage.getItem('focus-point-users') || '{}') as Record<string, User>
      const entry = Object.entries(users).find(([, value]) => value.username === username)
      if (!entry) return false

      const [id, user] = entry
      const updatedUser = { ...user, password: newPassword }
      users[id] = updatedUser
      localStorage.setItem('focus-point-users', JSON.stringify(users))

      const currentUser = localStorage.getItem('focus-point-user')
      if (currentUser) {
        try {
          const parsedCurrent = JSON.parse(currentUser) as User
          if (parsedCurrent.id === id) localStorage.setItem('focus-point-user', JSON.stringify(updatedUser))
        } catch {
          // Ignore an invalid saved session; the password reset itself succeeded.
        }
      }
      return true
    } catch (error) {
      console.error('Password reset error:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('focus-point-user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, resetPassword, logout }}>
      {isInitialized && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
