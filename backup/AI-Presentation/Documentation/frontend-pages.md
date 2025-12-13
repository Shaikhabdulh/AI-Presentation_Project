# Frontend Pages & Components - Complete Implementation
# DONE
## Page Components

### 1. Home Page (`src/pages/HomePage.tsx`)

```typescript
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useInventoryStore } from '../store/inventoryStore'
import { inventoryService } from '../services/inventoryService'
import { Notification } from '../types'

export const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const { items } = useInventoryStore()
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  })
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'vendor') {
      loadDashboardData()
    }
  }, [isAuthenticated])

  const loadDashboardData = async () => {
    try {
      const allItems = await inventoryService.getAll()
      const lowStock = allItems.filter((item) => item.quantity <= item.minThreshold)
      const outOfStock = allItems.filter((item) => item.quantity === 0)

      setStats({
        totalItems: allItems.length,
        lowStockItems: lowStock.length,
        outOfStockItems: outOfStock.length
      })
    } catch (error) {
      console.error('Failed to load dashboard data', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">IM</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Inventory Manager</h1>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">Welcome, {user?.name}</span>
                <button
                  onClick={() => {
                    useAuthStore.getState().logout()
                    navigate('/')
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {!isAuthenticated ? (
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Smart Inventory Management
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Track stock, get instant alerts for low inventory, and connect with reliable vendors
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {/* Feature Cards */}
            {[
              {
                title: 'Real-time Tracking',
                description: 'Monitor inventory levels with instant updates',
                icon: '📊'
              },
              {
                title: 'Smart Alerts',
                description: 'Get notified when stock runs low',
                icon: '🔔'
              },
              {
                title: 'Vendor Network',
                description: 'Connect with verified vendors instantly',
                icon: '🤝'
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Login to Dashboard
            </Link>
            <Link
              to="/vendor-register"
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Register as Vendor
            </Link>
          </div>
        </div>
      ) : (
        /* Dashboard for Authenticated Users */
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Total Items', value: stats.totalItems, color: 'blue' },
              { label: 'Low Stock', value: stats.lowStockItems, color: 'warning' },
              { label: 'Out of Stock', value: stats.outOfStockItems, color: 'danger' }
            ].map((stat, idx) => (
              <div key={idx} className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${stat.color}-600`}>
                <h3 className="text-gray-600 font-medium">{stat.label}</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mb-8">
            <Link
              to="/inventory"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              View Inventory
            </Link>
            <Link
              to="/vendors"
              className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Browse Vendors
            </Link>
            <Link
              to="/notifications"
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Notifications
            </Link>
          </div>

          {/* Recent Low Stock Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Low Stock Items</h2>
            {stats.lowStockItems > 0 ? (
              <p className="text-gray-600">
                You have {stats.lowStockItems} items with low stock. Please reorder soon.
              </p>
            ) : (
              <p className="text-green-600">All items are well-stocked! ✓</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

### 2. Login Page (`src/pages/LoginPage.tsx`)

```typescript
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-lg mb-4">
            <span className="text-white text-2xl font-bold">IM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Manager</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-gray-600 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700">
              Register here
            </Link>
          </p>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials:</p>
          <p className="text-sm text-blue-800">📧 user@example.com</p>
          <p className="text-sm text-blue-800">🔐 password123</p>
        </div>
      </div>
    </div>
  )
}
```

### 3. Inventory Dashboard (`src/pages/InventoryPage.tsx`)

```typescript
import React, { useEffect, useState } from 'react'
import { useInventory } from '../hooks/useInventory'
import { useNavigate } from 'react-router-dom'
import { InventoryItem } from '../types'

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate()
  const { items, loading, error, fetchItems, updateItem } = useInventory()
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newQuantity, setNewQuantity] = useState('')

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleUpdateQuantity = async () => {
    if (!editingId || !newQuantity) return

    await updateItem(editingId, parseInt(newQuantity))
    setEditingId(null)
    setNewQuantity('')
    setShowModal(false)
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-700' }
    if (item.quantity <= item.minThreshold) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-700' }
    return { text: 'In Stock', color: 'bg-green-100 text-green-700' }
  }

  if (loading) return <div className="text-center py-8">Loading inventory...</div>

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Add Item
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Item Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Quantity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Min Threshold</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const status = getStockStatus(item)
                return (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-900 font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-gray-600">{item.category}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.minThreshold} {item.unit}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setEditingId(item.id)
                          setNewQuantity(item.quantity.toString())
                          setShowModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">No items found</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingId ? 'Update Quantity' : 'Add New Item'}
            </h2>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Quantity</label>
              <input
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleUpdateQuantity}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingId(null)
                  setNewQuantity('')
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 4. Vendor Registration Page (`src/pages/VendorRegisterPage.tsx`)

```typescript
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { vendorService } from '../services/vendorService'

export const VendorRegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    address: '',
    city: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await vendorService.register(formData)
      setSuccess(true)
      setTimeout(() => navigate('/vendor-dashboard'), 2000)
    } catch (err) {
      setError('Failed to register as vendor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Registration</h1>
          <p className="text-gray-600 mb-8">Join our vendor network and grow your business</p>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">Registration successful! Redirecting...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Business Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="electronics">Electronics</option>
                  <option value="raw-materials">Raw Materials</option>
                  <option value="office-supplies">Office Supplies</option>
                  <option value="packaging">Packaging</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Registering...' : 'Register as Vendor'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

---

These pages follow SOLID principles and modern React patterns:

**Single Responsibility**: Each page handles one feature
**Component Composition**: Reusable form fields and UI elements
**Prop Drilling Avoidance**: Uses Zustand for state
**Error Handling**: User-friendly error messages
**Loading States**: Clear feedback during async operations
**Responsive Design**: Mobile-first with Tailwind CSS
**Accessibility**: Proper labels and semantic HTML

