import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  DollarSign,
  Package,
  TrendingUp
} from 'lucide-react'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { useProducts } from '../../hooks/useProducts'
import { useSales } from '../../hooks/useSales'
import { subscribeToPurchaseOrders } from '../../firebase/services'
import LoadingSpinner from '../../components/common/LoadingSpinner'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
)

const chartColors = {
  green: '#059669',
  blue: '#2563eb',
  amber: '#d97706',
  rose: '#e11d48',
  slate: '#475569',
  cyan: '#0891b2'
}

const formatCurrency = (amount) =>
  `PHP ${Number(amount || 0).toLocaleString('en-PH', {
    maximumFractionDigits: 0
  })}`

const getSaleDate = (sale) => {
  const value = sale.createdAt || sale.completedAt
  const date = value?.toDate ? value.toDate() : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

const getItemRevenue = (item) => {
  const quantity = Number(item.quantity || 0)
  const unitPrice = Number(item.unitPrice || item.price || 0)

  return Number(item.subtotal || 0) || unitPrice * quantity
}

const makeMoneyTick = (value) => {
  if (value >= 1000000) return `PHP ${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `PHP ${(value / 1000).toFixed(0)}K`
  return `PHP ${value}`
}

const emptyTrend = (label) => ({
  label,
  sales: 0,
  profit: 0
})

const Analytics = () => {
  const { sales, loading: salesLoading } = useSales()
  const { products, allVariants, loading: productsLoading } = useProducts()
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [trendRange, setTrendRange] = useState('month')

  useEffect(() => {
    const unsubscribe = subscribeToPurchaseOrders(setPurchaseOrders)

    return () => unsubscribe()
  }, [])

  const productMap = useMemo(() => {
    const map = new Map()

    products.forEach((product) => {
      map.set(product.id, product)
    })

    return map
  }, [products])

  const variantMap = useMemo(() => {
    const map = new Map()

    products.forEach((product) => {
      product.variants?.forEach((variant) => {
        map.set(variant.id, {
          ...variant,
          productName: product.name,
          category: product.category || 'Uncategorized'
        })
      })
    })

    return map
  }, [products])

  const costMap = useMemo(() => {
    const totals = new Map()

    purchaseOrders.forEach((po) => {
      po.items?.forEach((item) => {
        if (!item.variantId) return

        const quantity = Number(item.quantity || 0)
        const costPrice = Number(item.costPrice || 0)
        if (!quantity || !costPrice) return

        const current = totals.get(item.variantId) || {
          cost: 0,
          quantity: 0
        }

        totals.set(item.variantId, {
          cost: current.cost + costPrice * quantity,
          quantity: current.quantity + quantity
        })
      })
    })

    return new Map(
      [...totals.entries()].map(([variantId, value]) => [
        variantId,
        value.quantity ? value.cost / value.quantity : 0
      ])
    )
  }, [purchaseOrders])

  const getItemProfit = (item) => {
    const explicitProfit = Number(item.profit || item.totalProfit)
    if (explicitProfit) return explicitProfit

    const quantity = Number(item.quantity || 0)
    const unitCost =
      Number(item.costPrice || item.unitCost || item.cost || 0) ||
      Number(costMap.get(item.variantId) || 0)

    return getItemRevenue(item) - unitCost * quantity
  }

  const getSaleProfit = (sale) => {
    const explicitProfit = Number(sale.profit || sale.totalProfit)
    if (explicitProfit) return explicitProfit

    return (sale.items || []).reduce(
      (sum, item) => sum + getItemProfit(item),
      0
    )
  }

  const analytics = useMemo(() => {
    const totalSales = sales.reduce(
      (sum, sale) => sum + Number(sale.grandTotal || 0),
      0
    )
    const totalProfit = sales.reduce(
      (sum, sale) => sum + getSaleProfit(sale),
      0
    )

    const activeMonths = new Set()
    sales.forEach((sale) => {
      const date = getSaleDate(sale)
      if (date) activeMonths.add(`${date.getFullYear()}-${date.getMonth()}`)
    })

    return {
      totalSales,
      totalProfit,
      avgMonthlySales: totalSales / Math.max(activeMonths.size, 1),
      avgMonthlyProfit: totalProfit / Math.max(activeMonths.size, 1)
    }
  }, [sales, costMap])

  const salesProfitTrend = useMemo(() => {
    const now = new Date()
    const buckets = []

    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
      const key = `${date.getFullYear()}-${date.getMonth()}`

      buckets.push({
        key,
        ...emptyTrend(date.toLocaleString('en-PH', { month: 'short' }))
      })
    }

    sales.forEach((sale) => {
      const date = getSaleDate(sale)
      if (!date) return

      const key = `${date.getFullYear()}-${date.getMonth()}`
      const bucket = buckets.find((item) => item.key === key)
      if (!bucket) return

      bucket.sales += Number(sale.grandTotal || 0)
      bucket.profit += getSaleProfit(sale)
    })

    return buckets
  }, [sales, costMap])

  const categoryPerformance = useMemo(() => {
    const categoryMap = new Map()

    sales.forEach((sale) => {
      sale.items?.forEach((item) => {
        const product = productMap.get(item.productId)
        const variant = variantMap.get(item.variantId)
        const category =
          product?.category || variant?.category || 'Uncategorized'
        const current = categoryMap.get(category) || {
          sales: 0,
          quantity: 0
        }

        categoryMap.set(category, {
          sales: current.sales + getItemRevenue(item),
          quantity: current.quantity + Number(item.quantity || 0)
        })
      })
    })

    return [...categoryMap.entries()]
      .map(([category, value]) => ({ category, ...value }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6)
  }, [sales, productMap, variantMap])

  const weeklyTrend = useMemo(() => {
    const now = new Date()

    if (trendRange === 'week') {
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)

      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start)
        date.setDate(start.getDate() + index)

        return {
          label: date.toLocaleDateString('en-PH', { weekday: 'short' }),
          start: date,
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      })
    }

    if (trendRange === 'year') {
      return Array.from({ length: 12 }, (_, index) => ({
        label: new Date(now.getFullYear(), index, 1).toLocaleString('en-PH', {
          month: 'short'
        }),
        month: index
      }))
    }

    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate()
    const weekCount = Math.ceil(daysInMonth / 7)

    return Array.from({ length: weekCount }, (_, index) => ({
      label: `Week ${index + 1}`,
      startDay: index * 7 + 1,
      endDay: Math.min((index + 1) * 7, daysInMonth)
    }))
  }, [trendRange])

  const weeklySalesData = useMemo(() => {
    return weeklyTrend.map((bucket) => {
      const total = sales.reduce((sum, sale) => {
        const date = getSaleDate(sale)
        if (!date) return sum

        if (trendRange === 'week') {
          return date >= bucket.start && date < bucket.end
            ? sum + Number(sale.grandTotal || 0)
            : sum
        }

        if (trendRange === 'year') {
          return date.getFullYear() === new Date().getFullYear() &&
            date.getMonth() === bucket.month
            ? sum + Number(sale.grandTotal || 0)
            : sum
        }

        const now = new Date()
        return date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() >= bucket.startDay &&
          date.getDate() <= bucket.endDay
          ? sum + Number(sale.grandTotal || 0)
          : sum
      }, 0)

      return {
        label: bucket.label,
        total
      }
    })
  }, [sales, weeklyTrend, trendRange])

  const lowStockProducts = useMemo(() => {
    return allVariants
      .map((variant) => {
        const product = productMap.get(variant.productId)

        return {
          ...variant,
          productName: product?.name || 'Product',
          category: product?.category || 'Uncategorized',
          quantity: Number(variant.quantity || 0),
          reorderLevel: Number(variant.reorderLevel || 10)
        }
      })
      .filter((variant) => variant.quantity <= variant.reorderLevel)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 8)
  }, [allVariants, productMap])

  const commonLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 10,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: makeMoneyTick
        },
        grid: {
          color: '#eef2f7'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }

  const salesProfitData = {
    labels: salesProfitTrend.map((item) => item.label),
    datasets: [
      {
        label: 'Sales',
        data: salesProfitTrend.map((item) => item.sales),
        borderColor: chartColors.green,
        backgroundColor: 'rgba(5, 150, 105, 0.12)',
        fill: true,
        tension: 0.35
      },
      {
        label: 'Profit',
        data: salesProfitTrend.map((item) => item.profit),
        borderColor: chartColors.blue,
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        fill: true,
        tension: 0.35
      }
    ]
  }

  const categoryData = {
    labels: categoryPerformance.map((item) => item.category),
    datasets: [
      {
        label: 'Sales',
        data: categoryPerformance.map((item) => item.sales),
        backgroundColor: [
          chartColors.green,
          chartColors.blue,
          chartColors.amber,
          chartColors.rose,
          chartColors.cyan,
          chartColors.slate
        ],
        borderRadius: 8
      }
    ]
  }

  const weeklyData = {
    labels: weeklySalesData.map((item) => item.label),
    datasets: [
      {
        label: 'Sales',
        data: weeklySalesData.map((item) => item.total),
        backgroundColor: 'rgba(217, 119, 6, 0.82)',
        borderColor: chartColors.amber,
        borderRadius: 8
      }
    ]
  }

  const lowStockData = {
    labels: lowStockProducts.map((item) => item.name || item.sku || 'Item'),
    datasets: [
      {
        data: lowStockProducts.map((item) => Math.max(item.quantity, 0)),
        backgroundColor: [
          chartColors.rose,
          chartColors.amber,
          chartColors.green,
          chartColors.blue,
          chartColors.cyan,
          chartColors.slate,
          '#7c3aed',
          '#db2777'
        ],
        borderWidth: 0
      }
    ]
  }

  const statCards = [
    {
      title: 'Total Sales',
      value: formatCurrency(analytics.totalSales),
      note: `${sales.length} completed transaction(s)`,
      icon: DollarSign,
      color: 'bg-green-100 text-green-700'
    },
    {
      title: 'Total Profit',
      value: formatCurrency(analytics.totalProfit),
      note: 'Based on available cost price data',
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      title: 'Avg Monthly',
      value: formatCurrency(analytics.avgMonthlySales),
      note: `${formatCurrency(analytics.avgMonthlyProfit)} avg profit`,
      icon: CalendarDays,
      color: 'bg-amber-100 text-amber-700'
    },
    {
      title: 'Product Low Stock',
      value: lowStockProducts.length,
      note: 'Needs restock attention',
      icon: AlertTriangle,
      color:
        lowStockProducts.length > 0
          ? 'bg-rose-100 text-rose-700'
          : 'bg-green-100 text-green-700'
    }
  ]

  if (salesLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700 mb-3">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Business Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">
            Sales, profit, category, trend, and inventory performance.
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">
            Report Date
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {new Date().toLocaleDateString('en-PH', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.title} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 break-words">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-400 mt-2">{stat.note}</p>
              </div>
              <div className={`p-3 rounded-xl shrink-0 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Sales & Profit Trend
              </h2>
              <p className="text-sm text-gray-500">Last 6 months overview</p>
            </div>
          </div>
          <div className="h-80">
            <Line data={salesProfitData} options={commonLineOptions} />
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">
            Product Low Stock
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Variants at or below reorder level
          </p>
          <div className="h-56 mb-5">
            {lowStockProducts.length > 0 ? (
              <Doughnut
                data={lowStockData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  cutout: '62%'
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                <Package className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm">No low stock products</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {lowStockProducts.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {item.productName} / {item.category}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-rose-600">
                    {item.quantity}
                  </p>
                  <p className="text-xs text-gray-400">
                    Reorder {item.reorderLevel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">
            Category Performance
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Top categories by sales revenue
          </p>
          <div className="h-80">
            <Bar
              data={categoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => formatCurrency(context.parsed.x)
                    }
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    ticks: { callback: makeMoneyTick },
                    grid: { color: '#eef2f7' }
                  },
                  y: {
                    grid: { display: false }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Weekly Sales Trend
              </h2>
              <p className="text-sm text-gray-500">
                Switch view by week, month, or year
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTrendRange(range)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold capitalize transition ${
                    trendRange === range
                      ? 'bg-white text-green-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            <Bar data={weeklyData} options={commonLineOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
