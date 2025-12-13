import apiClient from './api'
import { User } from '../types'

interface LoginResponse {
  user: User
  token: string
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password
    })
    return data
  },

  register: async (name: string, email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/register', {
      name,
      email,
      password
    })
    return data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  verifyToken: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/verify')
    return data
  }
}