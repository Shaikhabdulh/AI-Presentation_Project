import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'

export const useAuth = () => {
  const { user, isAuthenticated, login: setLogin, logout: setLogout } = useAuthStore()

  const login = async (email: string, password: string) => {
    try {
      const { user, token } = await authService.login(email, password)
      setLogin(user, token)
      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const { user, token } = await authService.register(name, email, password)
      setLogin(user, token)
      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  }

  const logout = () => {
    setLogout()
  }

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout
  }
}