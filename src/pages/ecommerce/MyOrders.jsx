import React, { useEffect, useMemo, useState } from 'react'

import {
  Link,
  useLocation
} from 'react-router-dom'

import {
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

import { subscribeToUserOrders } from '../../firebase/services'

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

const statusDetails = {
  pending: {
    label: 'Waiting for confirmation',
    short: 'Pending',
    message: 'Your order was sent to admin and is waiting for confirmation.',
    icon: Clock,
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    progress: 25
  },
  confirmed: {
    label: 'Parating na ang order mo',
    short: 'Parating na',
    message: 'Admin confirmed your order. We are preparing it for delivery.',
    icon: Truck,
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    progress: 60
  },
  preparing: {
    label: 'Preparing your order',
    short: 'Preparing',
    message: 'Your items are being prepared and checked before delivery.',
    icon: Package,
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    progress: 80
  },
  completed: {
    label: 'Order completed',
    short: 'Completed',
    message: 'Your order has been completed.',
    icon: CheckCircle2,
    badge: 'bg-green-100 text-green-800 border-green-200',
    progress: 100
  }
}

const timeline = [
  {
    key: 'pending',
    label: 'Placed'
  },
  {
    key: 'confirmed',
    label: 'Confirmed'
  },
  {
    key: 'preparing',
    label: 'Preparing'
  },
  {
    key: 'completed',
    label: 'Completed'
  }
]

const getTimelineIndex = (status) => {
  const index = timeline.findIndex((item) => item.key === status)

  return index < 0 ? 0 : index
}

const MyOrders = () => {
  const { user } = useAuth()
  const location = useLocation()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    if (!user?.uid && !user?.email) {
      setLoading(false)

      return () => {}
    }

    const unsubscribe = subscribeToUserOrders(
      user.uid,
      user.email,
      (data) => {
        setOrders(data)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const highlightedOrderId = location.state?.orderId || ''

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return orders

    return orders.filter((order) => order.orderStatus === activeFilter)
  }, [activeFilter, orders])

  const counts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter(order => order.orderStatus === 'pending').length,
    confirmed: orders.filter(order => order.orderStatus === 'confirmed').length,
    preparing: orders.filter(order => order.orderStatus === 'preparing').length,
    completed: orders.filter(order => order.orderStatus === 'completed').length
  }), [orders])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 text-center max-w-lg w-full">
          <PackageCheck className="w-16 h-16 mx-auto text-green-600 mb-5" />

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Sign In Required
          </h1>

          <p className="text-gray-500 mb-8">
            Please sign in to view and track your orders.
          </p>

          <Link
            to="/signin"
            className="inline-flex rounded-2xl bg-green-600 px-6 py-4 font-semibold text-white"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-5 sm:px-4 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900">
            My Orders
          </h1>

          <p className="mt-2 text-gray-500">
            Track checkout orders after admin confirmation.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {['all', 'pending', 'confirmed', 'preparing', 'completed'].map((filter) => (
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
                {filter === 'confirmed' ? 'parating' : filter}
              </span>
              <span className="block text-2xl font-bold mt-1">
                {counts[filter] || 0}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 font-semibold text-gray-600">
              Loading orders...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-5" />

            <h2 className="text-2xl font-bold text-gray-900">
              No orders yet
            </h2>

            <p className="text-gray-500 mt-2 mb-8">
              Your checkout orders will appear here after placing an order.
            </p>

            <Link
              to="/products"
              className="inline-flex rounded-2xl bg-green-600 px-6 py-4 font-semibold text-white"
            >
              Shop Products
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order) => {
              const details =
                statusDetails[order.orderStatus] ||
                statusDetails.pending

              const StatusIcon = details.icon
              const activeIndex = getTimelineIndex(order.orderStatus)

              return (
                <article
                  key={order.id}
                  className={`
                    bg-white rounded-3xl border p-4 sm:p-6 shadow-sm
                    ${highlightedOrderId === order.id
                      ? 'border-green-500 ring-4 ring-green-100'
                      : 'border-gray-200'}
                  `}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h2 className="text-xl font-bold text-gray-900">
                          {order.orderNumber || order.id}
                        </h2>

                        <span
                          className={`
                            inline-flex items-center gap-2 rounded-full border
                            px-3 py-1 text-xs font-bold
                            ${details.badge}
                          `}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {details.short}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900">
                        {details.label}
                      </h3>

                      <p className="text-gray-500 mt-2">
                        {details.message}
                      </p>

                      <p className="text-sm text-gray-400 mt-3">
                        Ordered {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="lg:text-right">
                      <p className="text-sm text-gray-500">
                        Total
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.itemCount || order.items?.length || 0} item(s)
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-600 transition-all"
                        style={{ width: `${details.progress}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {timeline.map((step, index) => (
                        <div
                          key={step.key}
                          className={`
                            text-xs font-semibold
                            ${index <= activeIndex
                              ? 'text-green-700'
                              : 'text-gray-400'}
                          `}
                        >
                          {step.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-5 h-5 text-green-600" />
                        <h4 className="font-bold text-gray-900">
                          Items
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {order.items?.map((item, index) => (
                          <div
                            key={`${item.productName}-${index}`}
                            className="flex justify-between gap-4 text-sm"
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
                        <h4 className="font-bold text-gray-900">
                          Delivery
                        </h4>
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed">
                        {order.shippingAddress || 'No delivery address'}
                      </p>

                      {order.deliveryNotes && (
                        <p className="text-sm text-gray-500 mt-3">
                          Notes: {order.deliveryNotes}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyOrders
