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