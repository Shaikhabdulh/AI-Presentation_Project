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