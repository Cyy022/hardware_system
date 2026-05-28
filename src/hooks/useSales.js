import { useState, useEffect } from 'react'
import { subscribeToOrders, subscribeToSales } from '../firebase/services'

const toMillis = (value) => (
  value?.toDate?.()?.getTime?.() ||
  new Date(value || 0).getTime() ||
  0
)

const getSaleDate = (sale) => {
  const value = sale.createdAt || sale.completedAt
  const date = value?.toDate ? value.toDate() : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

const normalizeCompletedOrder = (order) => {
  const items = (order.items || []).map(item => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.price || item.unitPrice) || 0

    return {
      productId: item.productId || '',
      variantId: item.variantId || '',
      productName: item.productName || '',
      variantName: item.variantName || 'Default',
      sku: item.sku || '',
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity
    }
  })

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  )

  return {
    ...order,
    id: `order-${order.id}`,
    orderId: order.id,
    source: 'ecommerce',
    paymentStatus: order.paymentStatus || 'paid',
    items,
    subtotal,
    discount: 0,
    discountAmount: 0,
    grandTotal: Number(order.totalAmount) || subtotal,
    totalItems: order.itemCount || items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    ),
    cashier: 'Ecommerce',
    status: 'completed',
    createdAt: order.completedAt || order.updatedAt || order.createdAt
  }
}

export const useSales = () => {
  const [sales, setSales] = useState([])
  const [salesRecords, setSalesRecords] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToSales((data) => {
      setSalesRecords(data)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToOrders((data) => {
      setOrders(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const orderIdsWithSales = new Set(
      salesRecords
        .map(sale => sale.orderId)
        .filter(Boolean)
    )

    const completedOrdersWithoutSale = orders
      .filter(order =>
        order.orderStatus === 'completed' &&
        !orderIdsWithSales.has(order.id)
      )
      .map(normalizeCompletedOrder)

    setSales(
      [...salesRecords, ...completedOrdersWithoutSale]
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    )
  }, [orders, salesRecords])

  // Calculate today's sales
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todaySales = sales.filter(sale => {
    const saleDate = getSaleDate(sale)
    if (!saleDate) return false
    return saleDate >= today
  })

  const totalSalesToday = todaySales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0)
  const totalTransactionsToday = todaySales.length

  // Calculate monthly sales
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlySales = sales.filter(sale => {
    const saleDate = getSaleDate(sale)
    if (!saleDate) return false
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
  })

  const totalMonthlySales = monthlySales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0)

  // Get most sold product
  const productSales = {}
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      const key = item.productName || item.variantName
      productSales[key] = (productSales[key] || 0) + item.quantity
    })
  })

  const mostSoldProduct = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])[0]

  return {
    sales,
    loading,
    todaySales,
    totalSalesToday,
    totalTransactionsToday,
    monthlySales,
    totalMonthlySales,
    mostSoldProduct
  }
}
