import React, { useState } from 'react'
import { Search, Calendar, Eye, FileText, TrendingUp, ShoppingBag, Package, DollarSign } from 'lucide-react'
import { useSales } from '../../hooks/useSales'
import { useAccessibility } from '../../context/AccessibilityContext'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const SalesReports = () => {
  const { sales, loading, todaySales, totalSalesToday, totalTransactionsToday } = useSales()
  const { speak } = useAccessibility()
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedSale, setSelectedSale] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Filter sales
  const filterSalesByDate = (salesList, filter) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return salesList.filter(sale => {
      if (!sale.createdAt) return false
      const saleDate = sale.createdAt.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt)

      switch (filter) {
        case 'today':
          return saleDate >= today
        case 'week':
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return saleDate >= weekAgo
        case 'month':
          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
  }

  const filteredSales = filterSalesByDate(
    sales.filter(sale => 
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    dateFilter
  )

  // Calculate stats
  const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0)
  const totalTransactions = filteredSales.length
  const totalQuantity = filteredSales.reduce((sum, sale) => 
    sum + (sale.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0), 0
  )

  const viewReceipt = (sale) => {
    setSelectedSale(sale)
    setShowReceiptModal(true)
    speak(`Viewing receipt for ${sale.customerName}`)
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
        <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
        <p className="text-gray-500 text-sm mt-1">View and analyze sales transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₱{totalSales.toLocaleString()}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalTransactions}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalQuantity}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Today's Date</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Date & Time</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Items</th>
                <th className="table-header">Total</th>
                <th className="table-header">Payment</th>
                <th className="table-header">Cashier</th>
                <th className="table-header">Status</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No sales found</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt)
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-900">
                            {saleDate.toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {saleDate.toLocaleTimeString()}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell font-medium text-gray-900">
                        {sale.customerName}
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-info">
                          {sale.items?.length || 0} items
                        </span>
                      </td>
                      <td className="table-cell font-semibold text-primary-600">
                        ₱{sale.grandTotal?.toLocaleString()}
                      </td>
                      <td className="table-cell">
                        <span className="capitalize">{sale.paymentMethod}</span>
                      </td>
                      <td className="table-cell">{sale.cashier}</td>
                      <td className="table-cell">
                        <span className="badge badge-success">{sale.status}</span>
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => viewReceipt(sale)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Receipt Details"
        size="md"
      >
        {selectedSale && (
          <div className="space-y-4">
            <div className="text-center pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Batang Gapan Mini Hardware</h3>
              <p className="text-sm text-gray-500">Official Receipt</p>
              <p className="text-xs text-gray-400 mt-1">
                {selectedSale.createdAt?.toDate?.().toLocaleString() || new Date().toLocaleString()}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-medium">{selectedSale.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium">{selectedSale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-medium capitalize">{selectedSale.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cashier</span>
                <span className="font-medium">{selectedSale.cashier}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
              <div className="space-y-2">
                {selectedSale.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-2 border-b border-gray-50">
                    <div>
                      <p className="font-medium">{item.variantName}</p>
                      <p className="text-xs text-gray-500">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p>{item.quantity} x ₱{item.unitPrice?.toLocaleString()}</p>
                      <p className="font-semibold">₱{item.subtotal?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>₱{selectedSale.subtotal?.toLocaleString()}</span>
              </div>
              {selectedSale.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({selectedSale.discount}%)</span>
                  <span>-₱{selectedSale.discountAmount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2">
                <span>Grand Total</span>
                <span className="text-primary-700">₱{selectedSale.grandTotal?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SalesReports
