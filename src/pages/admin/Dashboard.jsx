import React, { useEffect, useState } from 'react'
import { 
  Package, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp,
  Clock,
  Calendar
} from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useSales } from '../../hooks/useSales'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useAccessibility } from '../../context/AccessibilityContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const Dashboard = () => {
  const { products, loading: productsLoading } = useProducts()
  const { sales, loading: salesLoading, todaySales, totalSalesToday, totalTransactionsToday, totalMonthlySales, mostSoldProduct } = useSales()
  const { totalSuppliers, activeSuppliers } = useSuppliers()
  const { speak } = useAccessibility()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate stats
  const totalProducts = products.length
  const allVariants = products.flatMap(p => p.variants || [])
  const lowStockItems = allVariants.filter(v => v.quantity <= (v.reorderLevel || 10)).length
  const criticalStock = allVariants.filter(v => v.quantity <= 0).length

  // Category distribution for chart
  const categoryData = {}
  products.forEach(product => {
    const cat = product.category || 'Uncategorized'
    const variantCount = product.variants?.length || 0
    categoryData[cat] = (categoryData[cat] || 0) + variantCount
  })

  const doughnutData = {
    labels: Object.keys(categoryData),
    datasets: [{
      data: Object.values(categoryData),
      backgroundColor: [
        '#10b981', '#059669', '#047857', '#065f46', '#34d399', '#6ee7b7'
      ],
      borderWidth: 0
    }]
  }

  // Monthly sales chart
  const monthlyData = {}
  sales.forEach(sale => {
    if (!sale.createdAt) return
    const date = sale.createdAt.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt)
    const monthKey = date.toLocaleString('default', { month: 'short' })
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (sale.grandTotal || 0)
  })

  const barData = {
    labels: Object.keys(monthlyData).slice(-6),
    datasets: [{
      label: 'Sales (₱)',
      data: Object.values(monthlyData).slice(-6),
      backgroundColor: '#10b981',
      borderRadius: 8,
    }]
  }

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' }
      },
      x: {
        grid: { display: false }
      }
    }
  }

  const statsCards = [
    { 
      title: 'Total Products', 
      value: totalProducts, 
      icon: Package, 
      color: 'bg-blue-500',
      description: 'Active products in inventory'
    },
    { 
      title: 'Low Stock Items', 
      value: lowStockItems, 
      icon: AlertTriangle, 
      color: lowStockItems > 0 ? 'bg-red-500' : 'bg-green-500',
      description: 'Items below reorder level'
    },
    { 
      title: 'Sales Today', 
      value: `₱${totalSalesToday.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'bg-primary-500',
      description: `${totalTransactionsToday} transactions`
    },
    { 
      title: 'Monthly Sales', 
      value: `₱${totalMonthlySales.toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'bg-purple-500',
      description: 'This month'
    },
  ]

  if (productsLoading || salesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, Admin!</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <Calendar className="w-5 h-5 text-primary-600" />
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {currentTime.toLocaleTimeString('en-US')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <div 
            key={index} 
            className="card hover:shadow-lg transition-all cursor-pointer"
            onMouseEnter={() => speak(`${stat.title}: ${stat.value}. ${stat.description}`)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales</h3>
          <div className="h-64">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Stock Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock by Category</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut 
              data={doughnutData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Most Sold Product & Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Sold Product</h3>
          {mostSoldProduct ? (
            <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{mostSoldProduct[0]}</p>
                <p className="text-sm text-gray-500">{mostSoldProduct[1]} units sold</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No sales data available yet</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-blue-600">{totalSuppliers}</p>
              <p className="text-sm text-gray-600">Total Suppliers</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-600">{activeSuppliers}</p>
              <p className="text-sm text-gray-600">Active Suppliers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems > 0 && (
        <div className="card border-l-4 border-l-red-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Low Stock Alerts
          </h3>
          <div className="space-y-2">
            {allVariants
              .filter(v => v.quantity <= (v.reorderLevel || 10))
              .slice(0, 5)
              .map((variant, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{variant.name}</p>
                    <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${variant.quantity <= 0 ? 'text-red-600' : 'text-orange-600'}`}>
                      {variant.quantity} left
                    </p>
                    <p className="text-xs text-gray-500">Reorder: {variant.reorderLevel || 10}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
