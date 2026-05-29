import React, { useEffect, useMemo, useState } from 'react'

import {
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  Truck,
  User
} from 'lucide-react'

import toast from 'react-hot-toast'

import {
  completeOrder,
  subscribeToOrders,
  updateOrderStatus,
  updateRefundRequestStatus
} from '../../firebase/services'

const formatCurrency = (amount) =>
  `PHP ${Number(amount || 0).toLocaleString()}`

const formatDate = (value) => {
  const date = value?.toDate?.() || null

  if (!date) return 'No date'

  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200'
}

const statusLabels = {
  pending: 'Waiting for confirmation',
  confirmed: 'In Transit',
  preparing: 'Preparing',
  completed: 'Completed'
}

const filters = [
  'all',
  'pending',
  'confirmed',
  'preparing',
  'completed'
]

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToOrders(setOrders)

    return () => unsubscribe()
  }, [])

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesFilter =
        activeFilter === 'all' ||
        order.orderStatus === activeFilter

      const matchesSearch =
        !keyword ||
        order.customerName?.toLowerCase().includes(keyword) ||
        order.email?.toLowerCase().includes(keyword) ||
        order.orderNumber?.toLowerCase().includes(keyword)

      return matchesFilter && matchesSearch
    })
  }, [activeFilter, orders, search])

  const counts = useMemo(() => filters.reduce((acc, status) => {
    acc[status] = status === 'all'
      ? orders.length
      : orders.filter(order => order.orderStatus === status).length

    return acc
  }, {}), [orders])

  const handleStatusUpdate = async (orderId, status) => {
    setUpdatingId(orderId)

    try {
      if (status === 'completed') {
        await completeOrder(orderId)
      } else {
        await updateOrderStatus(orderId, status)
      }

      toast.success('Order status updated.')
    } catch (error) {
      console.log(error)
      toast.error('Unable to update order.')
    } finally {
      setUpdatingId('')
    }
  }

  const handleRefundUpdate = async (order, status) => {
    setUpdatingId(`refund-${order.id}`)

    try {
      await updateRefundRequestStatus(
        order.id,
        order.refundRequest?.id,
        status
      )

      toast.success('Refund request updated.')
    } catch (error) {
      console.log(error)
      toast.error('Unable to update refund request.')
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ecommerce Orders
          </h1>

          <p className="text-gray-500">
            Confirm customer orders and monitor delivery progress.
          </p>
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, customer, email"
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 outline-none focus:border-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`
              rounded-2xl border px-4 py-3 text-left transition
              ${activeFilter === filter
                ? 'border-green-500 bg-green-50 text-green-800'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}
            `}
          >
            <span className="block text-xs font-semibold uppercase tracking-wide">
              {filter === 'confirmed' ? 'In Transit' : filter}
            </span>
            <span className="block text-2xl font-bold mt-1">
              {counts[filter] || 0}
            </span>
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center">
          <Package className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">
            No orders found
          </h2>
          <p className="text-gray-500 mt-2">
            New checkout orders will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200"
            >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h2 className="font-bold text-xl text-gray-900">
                      {order.orderNumber || order.id}
                    </h2>

                    <span
                      className={`
                        inline-flex items-center rounded-full border px-3 py-1
                        text-xs font-bold
                        ${statusStyles[order.orderStatus] || statusStyles.pending}
                      `}
                    >
                      {statusLabels[order.orderStatus] || order.orderStatus}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-gray-900">
                        {order.customerName || 'Customer'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 break-all">
                      <Mail className="w-4 h-4 text-green-600 shrink-0" />
                      {order.email || 'No email'}
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      {order.phone || 'No phone'}
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="xl:text-right">
                  <p className="text-sm text-gray-500">
                    Total Amount
                  </p>
                  <p className="font-bold text-2xl text-green-700">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <p className="text-sm capitalize text-gray-500 mt-1">
                    {order.paymentMethod === 'cod'
                      ? 'Cash on Delivery'
                      : order.paymentMethod}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-gray-900">
                      Items
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {order.items?.map((item, index) => (
                      <div
                        key={`${item.productName}-${index}`}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.productName}
                          </p>
                          <p className="text-gray-500">
                            {item.variantName || 'Default'} / Qty {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(
                            Number(item.price || 0) *
                            Number(item.quantity || 1)
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-gray-900">
                      Delivery Address
                    </h3>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {order.shippingAddress || 'No delivery address'}
                  </p>

                  {order.addressDetails?.landmark && (
                    <p className="text-sm text-gray-500 mt-3">
                      Landmark: {order.addressDetails.landmark}
                    </p>
                  )}

                  {order.deliveryNotes && (
                    <p className="text-sm text-gray-500 mt-3">
                      Notes: {order.deliveryNotes}
                    </p>
                  )}
                </div>
              </div>

              {order.refundStatus && (
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <p className="font-bold text-red-800">
                        Refund Request: {order.refundStatus}
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Reason: {order.refundRequest?.reason || 'No reason provided'}
                      </p>
                      {order.refundRequest?.details && (
                        <p className="text-sm text-red-700 mt-1">
                          Details: {order.refundRequest.details}
                        </p>
                      )}
                    </div>

                    {order.refundStatus === 'pending' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          disabled={updatingId === `refund-${order.id}`}
                          onClick={() => handleRefundUpdate(order, 'approved')}
                          className="
                            rounded-xl bg-green-600 px-4 py-2 text-sm
                            font-semibold text-white hover:bg-green-700
                            disabled:opacity-50 disabled:cursor-not-allowed
                          "
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={updatingId === `refund-${order.id}`}
                          onClick={() => handleRefundUpdate(order, 'rejected')}
                          className="
                            rounded-xl bg-red-600 px-4 py-2 text-sm
                            font-semibold text-white hover:bg-red-700
                            disabled:opacity-50 disabled:cursor-not-allowed
                          "
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <button
                  type="button"
                  disabled={updatingId === order.id || order.orderStatus !== 'pending'}
                  onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                  className="
                    flex items-center justify-center gap-2 rounded-xl
                    bg-blue-600 px-5 py-3 font-semibold text-white
                    hover:bg-blue-700 disabled:opacity-50
                    disabled:cursor-not-allowed transition
                  "
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Order
                </button>

                <button
                  type="button"
                  disabled={
                    updatingId === order.id ||
                    !['confirmed', 'pending'].includes(order.orderStatus)
                  }
                  onClick={() => handleStatusUpdate(order.id, 'preparing')}
                  className="
                    flex items-center justify-center gap-2 rounded-xl
                    border border-gray-200 bg-white px-5 py-3
                    font-semibold text-gray-700 hover:bg-gray-50
                    disabled:opacity-50 disabled:cursor-not-allowed transition
                  "
                >
                  <Package className="w-4 h-4" />
                  Preparing
                </button>

                <button
                  type="button"
                  disabled={
                    updatingId === order.id ||
                    order.orderStatus === 'completed'
                  }
                  onClick={() => handleStatusUpdate(order.id, 'completed')}
                  className="
                    flex items-center justify-center gap-2 rounded-xl
                    bg-green-600 px-5 py-3 font-semibold text-white
                    hover:bg-green-700 disabled:opacity-50
                    disabled:cursor-not-allowed transition
                  "
                >
                  <Truck className="w-4 h-4" />
                  Complete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders
