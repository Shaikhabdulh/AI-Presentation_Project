import apiClient from './api'
import { Vendor, VendorContactRequest } from '../types'

export const vendorService = {
  register: async (vendor: Omit<Vendor, 'id' | 'rating' | 'isActive'>) => {
    const { data } = await apiClient.post<Vendor>('/vendors/register', vendor)
    return data
  },

  getAll: async () => {
    const { data } = await apiClient.get<Vendor[]>('/vendors')
    return data
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<Vendor>(`/vendors/${id}`)
    return data
  },

  getByCategory: async (category: string) => {
    const { data } = await apiClient.get<Vendor[]>(`/vendors/category/${category}`)
    return data
  },

  contactVendor: async (vendorId: string, request: Omit<VendorContactRequest, 'id' | 'createdAt' | 'status'>) => {
    const { data } = await apiClient.post<VendorContactRequest>(`/vendors/${vendorId}/contact`, request)
    return data
  },

  getContactRequests: async () => {
    const { data } = await apiClient.get<VendorContactRequest[]>('/vendors/requests')
    return data
  }
}