import React, { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Save,
  Search,
  PackageCheck,
  Eye,
  Ban
} from 'lucide-react'

import { useProducts } from '../../hooks/useProducts'
import { useSuppliers } from '../../hooks/useSuppliers'

import {
  createPurchaseOrder,
  generatePONumber,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  subscribeToPurchaseOrders,
  subscribeToStockHistory
} from '../../firebase/services'

import { useAccessibility } from '../../context/AccessibilityContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import emailjs from '@emailjs/browser'

const StockIn = () => {
  const { products, loading } = useProducts()
  const { suppliers } = useSuppliers()
  const { speak } = useAccessibility()

  const [activeTab, setActiveTab] = useState('purchaseOrders')

  const [email, setEmail] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState([])

  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [stockHistory, setStockHistory] = useState([])

  const [search, setSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // =========================
  // USE EFFECTS
  // =========================

  useEffect(() => {
    const unsubscribePO =
      subscribeToPurchaseOrders(setPurchaseOrders)

    const unsubscribeHistory =
      subscribeToStockHistory(setStockHistory)

    return () => {
      unsubscribePO()
      unsubscribeHistory()
    }
  }, [])

  // =========================
  // ITEM FUNCTIONS
  // =========================

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        variantId: '',
        quantity: '',
        costPrice: 0
      }
    ])
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]

    newItems[index] = {
      ...newItems[index],
      [field]: value
    }

    if (field === 'productId') {
      newItems[index].variantId = ''
    }

    setItems(newItems)
  }

  // =========================
  // HELPERS
  // =========================

  const getProductVariants = (productId) => {
    const product = products.find(
      (p) => p.id === productId
    )

    return product?.variants || []
  }

  const getVariantDetails = (variantId) => {
    for (const product of products) {
      const variant = product.variants?.find(
        (v) => v.id === variantId
      )

      if (variant) {
        return {
          ...variant,
          productName: product.name
        }
      }
    }

    return null
  }

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedSupplier) {
      toast.error('Please select supplier')
      return
    }

    if (items.length === 0) {
      toast.error('Please add items')
      return
    }

    for (const item of items) {
      if (
        !item.productId ||
        !item.variantId ||
        !item.quantity
      ) {
        toast.error('Please complete all item fields')
        return
      }
    }

    try {
      setIsSubmitting(true)

      const supplier = suppliers.find(
        (s) => s.id === selectedSupplier
      )

   const formattedItems = items.map((item) => {
  const variant = getVariantDetails(
    item.variantId
  )

  return {
    ...item,
    quantity: parseInt(item.quantity),
    costPrice: Number(item.costPrice || 0),

    productName: variant?.productName || '',
    variantName: variant?.name || '',
    sku: variant?.sku || '',
    size: variant?.size || '',
    unit: variant?.unit || ''
  }
})

const totalAmount = formattedItems.reduce(
  (sum, item) => {
    return (
      sum +
      (
        Number(item.costPrice || 0) *
        Number(item.quantity || 0)
      )
    )
  },
  0
)

      const purchaseData = {
        poNumber: generatePONumber(),
        email: email || '',

        supplierId: selectedSupplier,
        supplierName: supplier?.companyName || '',

        expectedDate,
        notes,

        items: formattedItems,

        totalAmount,

        status: 'Pending',
        receivedBy: 'Admin'
      }
await createPurchaseOrder(purchaseData)

// EMAIL VALIDATION
if (email) {
  try {
    await emailjs.send(
      'service_daso4rv',
      'template_a41se2f',
      {
        to_email: email,
        po_number: purchaseData.poNumber,
        supplier: purchaseData.supplierName,
        total_amount: totalAmount
      },
      '1pMNRxW60at4SEuYJ'
    )

    toast.success('Email sent successfully')
  } catch (emailError) {
    console.log(emailError)

    toast.error(
      emailError?.text ||
      emailError?.message ||
      'Email failed to send'
    )
  }
}

toast.success(
  'Purchase order created successfully'
)

speak(
  'Purchase order created successfully'
)
      setItems([])
      setEmail('')
      setExpectedDate('')
      setNotes('')
      setSelectedSupplier('')
    } catch (error) {
  console.log(error)

    toast.error(
      error?.text ||
      error?.message ||
      'Something went wrong'
    )

    } finally {
      setIsSubmitting(false)
    }
  }

  // =========================
  // RECEIVE ORDER
  // =========================

  const handleReceive = async (orderId) => {
    try {
      await receivePurchaseOrder(orderId)

      toast.success(
        'Purchase order received successfully'
      )
    } catch (error) {
      toast.error(error.message)
    }
  }

  // =========================
  // CANCEL ORDER
  // =========================

  const handleCancel = async (orderId) => {
    try {
      await cancelPurchaseOrder(orderId)

      toast.success(
        'Purchase order cancelled'
      )
    } catch (error) {
      toast.error(error.message)
    }
  }

  // =========================
  // FILTERED DATA
  // =========================

  const filteredPO = purchaseOrders.filter((po) =>
    po.poNumber
      ?.toLowerCase()
      .includes(search.toLowerCase())
  )

  const filteredHistory = stockHistory.filter(
    (history) =>
      history.poNumber
        ?.toLowerCase()
        .includes(search.toLowerCase())
  )

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}

      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h1 className="text-3xl font-bold text-gray-900">
          Stock-In / Purchase Entry
        </h1>

        <p className="text-gray-500 mt-1">
          Manage incoming inventory and
          purchase orders
        </p>
      </div>

      {/* MAIN CARD */}

      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        {/* TOP NAV */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                setActiveTab('purchaseOrders')
              }
              className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
                activeTab === 'purchaseOrders'
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Purchase Orders
            </button>

            <button
              onClick={() =>
                setActiveTab('newEntry')
              }
              className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
                activeTab === 'newEntry'
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              New Entry
            </button>

            <button
              onClick={() =>
                setActiveTab('history')
              }
              className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Stock-In History
            </button>
          </div>

          <div className="relative w-full lg:w-96">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search purchase orders..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full pl-12 pr-4 py-3 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* PURCHASE ORDERS */}

        {activeTab === 'purchaseOrders' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="table-header">
                    PO NUMBER
                  </th>
                  <th className="table-header">
                    SUPPLIER
                  </th>
                  <th className="table-header">
                    ITEMS
                  </th>
                  <th className="table-header">
                    AMOUNT
                  </th>
                  <th className="table-header">
                    STATUS
                  </th>
                  <th className="table-header">
                    ACTIONS
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredPO.map((po) => (
                  <tr key={po.id}>
                    <td className="table-cell">
                      {po.poNumber}
                    </td>

                    <td className="table-cell">
                      {po.supplierName}
                    </td>

                    <td className="table-cell">
                      {po.items?.length || 0}
                    </td>

                    <td className="table-cell">
                      ₱
                      {Number(
                        po.totalAmount || 0
                      ).toLocaleString()}
                    </td>

                    <td className="table-cell">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          po.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : po.status === 'Received'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>

                    <td className="table-cell">
                      <div className="flex gap-2">
                        {po.status === 'Pending' && (
                          <>
                            <button
                              onClick={() =>
                                handleReceive(po.id)
                              }
                              className="p-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200"
                            >
                              <PackageCheck className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                handleCancel(po.id)
                              }
                              className="p-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* NEW ENTRY */}

        {activeTab === 'newEntry' && (
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="input-field"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Supplier *
                </label>

                <select
                  value={selectedSupplier}
                  onChange={(e) =>
                    setSelectedSupplier(
                      e.target.value
                    )
                  }
                  className="input-field"
                  required
                >
                  <option value="">
                    Select Supplier
                  </option>

                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplier.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Expected Date
                </label>

                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) =>
                    setExpectedDate(
                      e.target.value
                    )
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Notes
                </label>

                <input
                  type="text"
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  className="input-field"
                  placeholder="Enter notes..."
                />
              </div>
            </div>

            {/* ITEMS */}

            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  Stocks & Variants
                </h3>

                <button
                  type="button"
                  onClick={addItem}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No items added
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white">
                      <tr>
                        <th className="table-header">
                          PRODUCT
                        </th>

                        <th className="table-header">
                          VARIANT
                        </th>

                        <th className="table-header">
                          SKU
                        </th>

                        <th className="table-header">
                          SIZE
                        </th>

                        <th className="table-header">
                          UNIT
                        </th>

                        <th className="table-header">
                          QTY
                        </th>

                        <th className="table-header">
                          COST
                        </th>

                        <th className="table-header">
                          ACTION
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {items.map((item, index) => {
                        const variant =
                          getVariantDetails(
                            item.variantId
                          )

                        return (
                          <tr key={index}>
                            <td className="table-cell">
                              <select
                                value={
                                  item.productId
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'productId',
                                    e.target.value
                                  )
                                }
                                className="input-field"
                              >
                                <option value="">
                                  Select Product
                                </option>

                                {products.map(
                                  (product) => (
                                    <option
                                      key={
                                        product.id
                                      }
                                      value={
                                        product.id
                                      }
                                    >
                                      {
                                        product.name
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </td>

                            <td className="table-cell">
                              <select
                                value={
                                  item.variantId
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'variantId',
                                    e.target.value
                                  )
                                }
                                className="input-field"
                              >
                                <option value="">
                                  Select Variant
                                </option>

                                {getProductVariants(
                                  item.productId
                                ).map(
                                  (variant) => (
                                    <option
                                      key={
                                        variant.id
                                      }
                                      value={
                                        variant.id
                                      }
                                    >
                                      {
                                        variant.name
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </td>

                            <td className="table-cell">
                              {variant?.sku ||
                                '-'}
                            </td>

                            <td className="table-cell">
                              {variant?.size ||
                                '-'}
                            </td>

                            <td className="table-cell">
                              {variant?.unit ||
                                '-'}
                            </td>

                            <td className="table-cell">
                              <input
                                type="number"
                                value={
                                  item.quantity
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'quantity',
                                    e.target.value
                                  )
                                }
                                className="input-field w-24"
                                min="1"
                              />
                            </td>

                            <td className="table-cell">
                              <input
                                type="number"
                                value={
                                  item.costPrice
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'costPrice',
                                    e.target.value
                                  )
                                }
                                className="input-field w-28"
                                min="0"
                              />
                            </td>

                            <td className="table-cell">
                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(
                                    index
                                  )
                                }
                                className="p-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200"
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

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  items.length === 0
                }
                className="btn-primary flex items-center gap-2"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="w-5 h-5" />
                )}

                Create Purchase Order
              </button>
            </div>
          </form>
        )}

        {/* HISTORY */}

        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="table-header">
                    STOCK-IN ID
                  </th>

                  <th className="table-header">
                    PO REFERENCE
                  </th>

                  <th className="table-header">
                    SUPPLIER
                  </th>

                  <th className="table-header">
                    ITEMS
                  </th>

                  <th className="table-header">
                    VALUE
                  </th>

                  <th className="table-header">
                    RECEIVED BY
                  </th>

                  <th className="table-header">
                    STATUS
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredHistory.map((history) => (
                  <tr key={history.id}>
                    <td className="table-cell">
                      {history.stockInId ||
                        '-'}
                    </td>

                    <td className="table-cell">
                      {history.poNumber}
                    </td>

                    <td className="table-cell">
                      {history.supplierName}
                    </td>

                    <td className="table-cell">
                      {history.items?.length ||
                        0}
                    </td>

                    <td className="table-cell">
                      ₱
                      {Number(
                        history.totalAmount ||
                          0
                      ).toLocaleString()}
                    </td>

                    <td className="table-cell">
                      {history.receivedBy}
                    </td>

                    <td className="table-cell">
                      <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                        COMPLETED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default StockIn