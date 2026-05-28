import React, { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Save,
  Search,
  PackageCheck,
  Eye,
  Ban,
  CheckCircle2
} from 'lucide-react'

import { useProducts } from '../../hooks/useProducts'
import { useSuppliers } from '../../hooks/useSuppliers'

import {
  createPurchaseOrder,
  generatePONumber,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  subscribeToPurchaseOrders,
  subscribeToStockHistory,
  updatePurchaseOrderItemStatus
} from '../../firebase/services'

import { useAccessibility } from '../../context/AccessibilityContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'
import emailjs from '@emailjs/browser'

const formatCurrency = (amount) =>
  `PHP ${Number(amount || 0).toLocaleString()}`

const itemStatusClass = (status) => {
  if (status === 'Received') return 'bg-green-100 text-green-700'
  if (status === 'Partial' || status === 'Partially Cancelled') {
    return 'bg-blue-100 text-blue-700'
  }
  if (status === 'Cancelled') return 'bg-red-100 text-red-700'

  return 'bg-yellow-100 text-yellow-700'
}

const orderStatusClass = (status) => {
  if (status === 'Received' || status === 'Completed') {
    return 'bg-green-100 text-green-700'
  }

  if (status === 'Partially Received') {
    return 'bg-blue-100 text-blue-700'
  }

  if (status === 'Cancelled') return 'bg-red-100 text-red-700'

  return 'bg-yellow-100 text-yellow-700'
}

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
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedHistory, setSelectedHistory] = useState(null)
  const [partialQuantities, setPartialQuantities] = useState({})
  const [updatingItem, setUpdatingItem] = useState('')

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
if (email && email.trim() !== '') {
  try {
    await emailjs.send(
      'service_daso4rv',
      'template_a41se2f',
      {
        to_email: email.trim(),
        email: email.trim(),
        name: purchaseData.supplierName,

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

  const handleItemAction = async (
    order,
    itemIndex,
    action
  ) => {
    try {
      setUpdatingItem(`${order.id}-${itemIndex}-${action}`)

      await updatePurchaseOrderItemStatus({
        purchaseOrderId: order.id,
        itemIndex,
        action,
        receivedQuantity:
          action === 'partial'
            ? partialQuantities[`${order.id}-${itemIndex}`]
            : 0
      })

      setPartialQuantities((prev) => ({
        ...prev,
        [`${order.id}-${itemIndex}`]: ''
      }))

      toast.success('Purchase item updated')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUpdatingItem('')
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

  const currentSelectedOrder = selectedOrder
    ? purchaseOrders.find((po) => po.id === selectedOrder.id) || selectedOrder
    : null

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
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${orderStatusClass(po.status)}`}
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

                        <button
                          type="button"
                          onClick={() => setSelectedOrder(po)}
                          className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
                          title="View details"
                        >
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

                  <th className="table-header">
                    ACTIONS
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
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${orderStatusClass(history.status)}`}>
                        {history.status || 'Completed'}
                      </span>
                    </td>

                    <td className="table-cell">
                      <button
                        type="button"
                        onClick={() => setSelectedHistory(history)}
                        className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(currentSelectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Purchase Order ${currentSelectedOrder?.poNumber || ''}`}
        size="xl"
      >
        {currentSelectedOrder && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 rounded-2xl bg-gray-50 p-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">
                  Supplier
                </p>
                <p className="font-bold text-gray-900 break-words">
                  {currentSelectedOrder.supplierName || '-'}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">
                  Expected
                </p>
                <p className="font-bold text-gray-900 break-words">
                  {currentSelectedOrder.expectedDate || '-'}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">
                  Amount
                </p>
                <p className="font-bold text-gray-900 whitespace-nowrap">
                  {formatCurrency(currentSelectedOrder.totalAmount)}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">
                  Status
                </p>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${orderStatusClass(currentSelectedOrder.status)}`}>
                  {currentSelectedOrder.status}
                </span>
              </div>
            </div>

            {currentSelectedOrder.notes && (
              <div className="rounded-2xl border border-gray-100 p-4 text-sm text-gray-600">
                {currentSelectedOrder.notes}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="table-header">ITEM</th>
                    <th className="table-header">ORDERED</th>
                    <th className="table-header">RECEIVED</th>
                    <th className="table-header">REMAINING</th>
                    <th className="table-header">STATUS</th>
                    <th className="table-header">PARTIAL QTY</th>
                    <th className="table-header">ACTIONS</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {currentSelectedOrder.items?.map((item, index) => {
                    const orderedQuantity = Number(item.quantity || 0)
                    const receivedQuantity = Number(item.receivedQuantity || 0)
                    const remainingQuantity = Math.max(
                      orderedQuantity - receivedQuantity,
                      0
                    )
                    const itemStatus = item.itemStatus || 'Pending'
                    const actionKey = `${currentSelectedOrder.id}-${index}`
                    const isClosed =
                      ['Received', 'Cancelled', 'Partially Cancelled'].includes(itemStatus) ||
                      remainingQuantity <= 0

                    return (
                      <tr key={`${item.variantId}-${index}`}>
                        <td className="table-cell min-w-[220px]">
                          <p className="font-semibold text-gray-900">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.variantName || 'Default'} / {item.sku || 'No SKU'}
                          </p>
                        </td>

                        <td className="table-cell">
                          {orderedQuantity}
                        </td>

                        <td className="table-cell">
                          {receivedQuantity}
                        </td>

                        <td className="table-cell">
                          {remainingQuantity}
                        </td>

                        <td className="table-cell">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${itemStatusClass(itemStatus)}`}>
                            {itemStatus}
                          </span>
                        </td>

                        <td className="table-cell">
                          <input
                            type="number"
                            min="1"
                            max={remainingQuantity}
                            value={partialQuantities[actionKey] || ''}
                            onChange={(event) =>
                              setPartialQuantities((prev) => ({
                                ...prev,
                                [actionKey]: event.target.value
                              }))
                            }
                            disabled={isClosed}
                            className="input-field w-24"
                            placeholder="Qty"
                          />
                        </td>

                        <td className="table-cell">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleItemAction(
                                  currentSelectedOrder,
                                  index,
                                  'receive'
                                )
                              }
                              disabled={isClosed || updatingItem.startsWith(actionKey)}
                              className="p-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Confirm received item"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleItemAction(
                                  currentSelectedOrder,
                                  index,
                                  'partial'
                                )
                              }
                              disabled={isClosed || updatingItem.startsWith(actionKey)}
                              className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Partial
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleItemAction(
                                  currentSelectedOrder,
                                  index,
                                  'cancel'
                                )
                              }
                              disabled={isClosed || updatingItem.startsWith(actionKey)}
                              className="p-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Cancel item"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(selectedHistory)}
        onClose={() => setSelectedHistory(null)}
        title={`Stock-In Details ${selectedHistory?.poNumber || ''}`}
        size="xl"
      >
        {selectedHistory && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 rounded-2xl bg-gray-50 p-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">
                  Supplier
                </p>
                <p className="font-bold text-gray-900 break-words">
                  {selectedHistory.supplierName || '-'}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">
                  Received By
                </p>
                <p className="font-bold text-gray-900 break-all leading-snug">
                  {selectedHistory.receivedBy || '-'}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">
                  Received Value
                </p>
                <p className="font-bold text-gray-900 whitespace-nowrap">
                  {formatCurrency(
                    selectedHistory.totalReceivedAmount ||
                    selectedHistory.totalAmount
                  )}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">
                  Status
                </p>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${orderStatusClass(selectedHistory.status)}`}>
                  {selectedHistory.status || 'Completed'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="table-header">ITEM</th>
                    <th className="table-header">ORDERED</th>
                    <th className="table-header">RECEIVED</th>
                    <th className="table-header">CANCELLED</th>
                    <th className="table-header">COST</th>
                    <th className="table-header">STATUS</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {selectedHistory.items?.map((item, index) => (
                    <tr key={`${item.variantId}-${index}`}>
                      <td className="table-cell min-w-[220px]">
                        <p className="font-semibold text-gray-900">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.variantName || 'Default'} / {item.sku || 'No SKU'}
                        </p>
                      </td>

                      <td className="table-cell">
                        {item.orderedQuantity || item.quantity || 0}
                      </td>

                      <td className="table-cell">
                        {item.receivedQuantity || 0}
                      </td>

                      <td className="table-cell">
                        {item.cancelledQuantity || 0}
                      </td>

                      <td className="table-cell">
                        {formatCurrency(item.costPrice)}
                      </td>

                      <td className="table-cell">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${itemStatusClass(item.itemStatus)}`}>
                          {item.itemStatus || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default StockIn
