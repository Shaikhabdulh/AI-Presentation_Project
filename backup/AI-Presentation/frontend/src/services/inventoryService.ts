import apiClient from './api'
import { InventoryItem, PaginationParams } from '../types'

export const inventoryService = {
  getAll: async (params?: PaginationParams) => {
    const { data } = await apiClient.get<InventoryItem[]>('/inventory', { params })
    return data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<InventoryItem>(`/inventory/${id}`)
    return data
  },

  create: async (item: Omit<InventoryItem, 'id' | 'lastUpdated' | 'isLowStock'>) => {
    const { data } = await apiClient.post<InventoryItem>('/inventory', item)
    return data
  },

  update: async (id: string, updates: Partial<InventoryItem>) => {
    const { data } = await apiClient.patch<InventoryItem>(`/inventory/${id}`, updates)
    return data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/inventory/${id}`)
  },

  getLowStock: async () => {
    const { data } = await apiClient.get<InventoryItem[]>('/inventory/low-stock')
    return data
  }
}