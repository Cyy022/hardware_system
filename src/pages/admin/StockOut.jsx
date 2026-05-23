import React, { useState } from 'react'
import { Plus, Trash2, ShoppingCart, Printer, XCircle, CreditCard, Banknote, Check } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { addSale } from '../../firebase/services'
import { useAccessibility } from '../../context/AccessibilityContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'

const StockOut = () => {
  const { products, loading } = useProducts()
  const { speak } = useAccessibility()
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState(0)
  const [cartItems, setCartItems] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState(null)

  // Add item to cart
  const addToCart = () => {
    setCartItems([...cartItems, { productId: '', variantId: '', quantity: 1 }])
  }

  // Remove from cart
  const removeFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  // Update cart item
  const updateCartItem = (index, field, value) => {
    const newItems = [...cartItems]
    newItems[index] = { ...newItems[index], [field]: value }

    if (field === 'productId') {
      newItems[index].variantId = ''
    }

    setCartItems(newItems)
  }

  // Get variants for product
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

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    const variant = getVariantDetails(item.variantId)
    return sum + (variant?.price || 0) * (parseInt(item.quantity) || 0)
  }, 0)

  const discountAmount = subtotal * (discount / 100)
  const grandTotal = subtotal - discountAmount
  const totalItems = cartItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)

  // Validate stock
  const validateStock = () => {
    for (const item of cartItems) {
      const variant = getVariantDetails(item.variantId)
      if (variant && (parseInt(item.quantity) || 0) > variant.quantity) {
        toast.error(`Insufficient stock for ${variant.name}. Available: ${variant.quantity}`)
        return false
      }
    }
    return true
  }

  const handleConfirmSale = async () => {
    if (cartItems.length === 0) {
      toast.error('Please add items to the cart')
      return
    }

    if (!customerName.trim()) {
      toast.error('Please enter customer name')
      return
    }

    if (!validateStock()) return

    setIsSubmitting(true)

    try {
      const items = cartItems.map(item => {
        const variant = getVariantDetails(item.variantId)
        return {
          productId: item.productId,
          variantId: item.variantId,
          productName: variant?.productName,
          variantName: variant?.name,
          sku: variant?.sku,
          quantity: parseInt(item.quantity),
          unitPrice: variant?.price,
          subtotal: variant?.price * parseInt(item.quantity)
        }
      })

      const saleData = {
        customerName,
        paymentMethod,
        items,
        subtotal,
        discount,
        discountAmount,
        grandTotal,
        totalItems,
        cashier: 'Admin',
        status: 'completed'
      }

      const result = await addSale(saleData)
      setLastSale({ id: result.id, ...saleData, createdAt: new Date() })

      toast.success('Sale completed successfully')
      speak('Sale completed successfully')
      setShowReceipt(true)

      // Reset form
      setCartItems([])
      setCustomerName('')
      setDiscount(0)
      setPaymentMethod('cash')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this transaction?')) {
      setCartItems([])
      setCustomerName('')
      setDiscount(0)
      setPaymentMethod('cash')
      toast.info('Transaction cancelled')
    }
  }

  const handlePrint = () => {
    window.print()
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
        <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
        <p className="text-gray-500 text-sm mt-1">Process sales and stock out</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input-field"
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                      paymentMethod === 'cash' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                      paymentMethod === 'card' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Card
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Items</h3>
              <button
                onClick={addToCart}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No items in cart</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Product</th>
                      <th className="table-header">Variant</th>
                      <th className="table-header">Available</th>
                      <th className="table-header">Qty</th>
                      <th className="table-header">Price</th>
                      <th className="table-header">Subtotal</th>
                      <th className="table-header"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cartItems.map((item, index) => {
                      const variant = getVariantDetails(item.variantId)
                      const itemSubtotal = (variant?.price || 0) * (parseInt(item.quantity) || 0)
                      const isOverStock = variant && (parseInt(item.quantity) || 0) > variant.quantity

                      return (
                        <tr key={index}>
                          <td className="table-cell">
                            <select
                              value={item.productId}
                              onChange={(e) => updateCartItem(index, 'productId', e.target.value)}
                              className="input-field text-sm py-1.5"
                              required
                            >
                              <option value="">Select</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>{product.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="table-cell">
                            <select
                              value={item.variantId}
                              onChange={(e) => updateCartItem(index, 'variantId', e.target.value)}
                              className="input-field text-sm py-1.5"
                              required
                              disabled={!item.productId}
                            >
                              <option value="">Select</option>
                              {getProductVariants(item.productId).map(variant => (
                                <option key={variant.id} value={variant.id}>
                                  {variant.name} (₱{variant.price} - {variant.quantity} left)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="table-cell">
                            <span className={`text-sm font-medium ${isOverStock ? 'text-red-600' : 'text-gray-600'}`}>
                              {variant?.quantity || 0}
                            </span>
                          </td>
                          <td className="table-cell">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateCartItem(index, 'quantity', e.target.value)}
                              className={`input-field text-sm py-1.5 w-20 ${isOverStock ? 'border-red-500 bg-red-50' : ''}`}
                              min="1"
                              required
                            />
                          </td>
                          <td className="table-cell text-sm">
                            ₱{variant?.price?.toLocaleString() || 0}
                          </td>
                          <td className="table-cell font-semibold text-sm">
                            ₱{itemSubtotal.toLocaleString()}
                          </td>
                          <td className="table-cell">
                            <button
                              onClick={() => removeFromCart(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <div className="card bg-primary-50 border-primary-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Items</span>
                <span className="font-semibold">{totalItems}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₱{subtotal.toLocaleString()}</span>
              </div>

              <div className="pt-3 border-t border-primary-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="input-field"
                  min="0"
                  max="100"
                  placeholder="0"
                />
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₱{discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-3 border-t border-primary-200">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Grand Total</span>
                  <span className="text-2xl font-bold text-primary-700">₱{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleConfirmSale}
                disabled={isSubmitting || cartItems.length === 0}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : <Check className="w-5 h-5" />}
                Confirm Sale
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        title="Receipt"
        size="md"
      >
        {lastSale && (
          <div className="print-only">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Batang Gapan Mini Hardware</h2>
              <p className="text-sm text-gray-500">Official Receipt</p>
              <p className="text-xs text-gray-400 mt-1">
                {lastSale.createdAt?.toLocaleString?.() || new Date().toLocaleString()}
              </p>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p><span className="font-medium">Customer:</span> {lastSale.customerName}</p>
              <p><span className="font-medium">Payment:</span> {lastSale.paymentMethod}</p>
              <p><span className="font-medium">Cashier:</span> {lastSale.cashier}</p>
              <p><span className="font-medium">Transaction ID:</span> {lastSale.id?.slice(-8)}</p>
            </div>

            <table className="w-full text-sm mb-4">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {lastSale.items?.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2">{item.variantName}</td>
                    <td className="text-center py-2">{item.quantity}</td>
                    <td className="text-right py-2">₱{item.unitPrice?.toLocaleString()}</td>
                    <td className="text-right py-2">₱{item.subtotal?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-sm border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₱{lastSale.subtotal?.toLocaleString()}</span>
              </div>
              {lastSale.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({lastSale.discount}%)</span>
                  <span>-₱{lastSale.discountAmount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2">
                <span>Grand Total</span>
                <span>₱{lastSale.grandTotal?.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-gray-400">
              <p>Thank you for your purchase!</p>
              <p>Batang Gapan Mini Hardware</p>
            </div>

            <div className="mt-6 no-print">
              <button
                onClick={handlePrint}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Print Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default StockOut
