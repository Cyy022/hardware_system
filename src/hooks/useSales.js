import { useState, useEffect } from 'react'
import { subscribeToSales } from '../firebase/services'

export const useSales = () => {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToSales((data) => {
      setSales(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Calculate today's sales
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todaySales = sales.filter(sale => {
    if (!sale.createdAt) return false
    const saleDate = sale.createdAt.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt)
    return saleDate >= today
  })

  const totalSalesToday = todaySales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0)
  const totalTransactionsToday = todaySales.length

  // Calculate monthly sales
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlySales = sales.filter(sale => {
    if (!sale.createdAt) return false
    const saleDate = sale.createdAt.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt)
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
