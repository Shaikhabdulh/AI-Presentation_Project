import create from 'zustand'
import { User } from '../types'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    set({ user, token, isAuthenticated: true })
  },
  
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },
  
  setUser: (user) => set({ user })
}))