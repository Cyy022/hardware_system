import React, { useState } from 'react'
import { Plus, Trash2, Save, Search } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useSuppliers } from '../../hooks/useSuppliers'
import { addStockIn } from '../../firebase/services'
import { useAccessibility } from '../../context/AccessibilityContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const StockIn = () => {
  const { products, loading } = useProducts()
  const { suppliers } = useSuppliers()
  const { speak } = useAccessibility()
  const [email, setEmail] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [items, setItems] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add new item row
  const addItem = () => {
    setItems([...items, { productId: '', variantId: '', quantity: '' }])
  }

  // Remove item row
  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Update item
  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // If product changed, reset variant
    if (field === 'productId') {
      newItems[index].variantId = ''
    }

    setItems(newItems)
  }

  // Get variants for selected product
  const getProductVariants = (productId) => {
    const product = products.find(p => p.id === productId)
    return product?.variants || []
  }

  // Get variant details
  const getVariantDetails = (variantId) => {
    for (const product of products) {
      const variant = product.variants?.find(v => v.id === variantId)
      if (variant) return { ...variant, productName: product.name }
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    if (!selectedSupplier) {
      toast.error('Please select a supplier')
      return
    }

    // Validate items
    for (const item of items) {
      if (!item.productId || !item.variantId || !item.quantity || parseInt(item.quantity) <= 0) {
        toast.error('Please fill in all item fields correctly')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const supplier = suppliers.find(s => s.id === selectedSupplier)

      for (const item of items) {
        const variant = getVariantDetails(item.variantId)
        await addStockIn({
          email,
          supplierId: selectedSupplier,
          supplierName: supplier?.companyName || 'Unknown',
          productId: item.productId,
          variantId: item.variantId,
          productName: variant?.productName,
          variantName: variant?.name,
          sku: variant?.sku,
          size: variant?.size,
          unit: variant?.unit,
          quantity: parseInt(item.quantity)
        })
      }

      toast.success('Stock in recorded successfully')
      speak('Stock in recorded successfully')
      setItems([])
      setEmail('')
      setSelectedSupplier('')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock In</h1>
        <p className="text-gray-500 text-sm mt-1">Record incoming inventory</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Info */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.companyName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No items added. Click "Add Item" to start.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Product</th>
                    <th className="table-header">Variant</th>
                    <th className="table-header">SKU</th>
                    <th className="table-header">Size</th>
                    <th className="table-header">Unit</th>
                    <th className="table-header">Quantity</th>
                    <th className="table-header">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => {
                    const variant = getVariantDetails(item.variantId)
                    return (
                      <tr key={index}>
                        <td className="table-cell">
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                            className="input-field text-sm py-1.5"
                            required
                          >
                            <option value="">Select Product</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>{product.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="table-cell">
                          <select
                            value={item.variantId}
                            onChange={(e) => updateItem(index, 'variantId', e.target.value)}
                            className="input-field text-sm py-1.5"
                            required
                            disabled={!item.productId}
                          >
                            <option value="">Select Variant</option>
                            {getProductVariants(item.productId).map(variant => (
                              <option key={variant.id} value={variant.id}>{variant.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="table-cell text-sm text-gray-500">
                          {variant?.sku || '-'}
                        </td>
                        <td className="table-cell text-sm text-gray-500">
                          {variant?.size || '-'}
                        </td>
                        <td className="table-cell text-sm text-gray-500">
                          {variant?.unit || '-'}
                        </td>
                        <td className="table-cell">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="input-field text-sm py-1.5 w-24"
                            min="1"
                            required
                            placeholder="0"
                          />
                        </td>
                        <td className="table-cell">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
            Record Stock In
          </button>
        </div>
      </form>
    </div>
  )
}

export default StockIn
