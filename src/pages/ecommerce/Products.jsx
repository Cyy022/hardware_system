import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Filter, Package, ShoppingCart, Plus, Minus } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useAuth } from '../../context/AuthContext'
import { useAccessibility } from '../../context/AccessibilityContext'
import { getStockStatus } from '../../firebase/services'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const formatCurrency = (amount) =>
  `PHP ${Number(amount || 0).toLocaleString()}`

const Products = () => {
  const { products, categories, loading } = useProducts()
  const { user } = useAuth()
  const { speak } = useAccessibility()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedBuyProduct, setSelectedBuyProduct] = useState(null)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const productParam = searchParams.get('product')

    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }

    if (productParam) {
      const product = products.find((item) => item.id === productParam)

      if (product) {
        setSelectedProduct(product)
        setShowProductModal(true)
      }
    }
  }, [searchParams, products])

  const getAvailableVariants = (product) =>
    product?.variants?.filter(
      (variant) => Number(variant.quantity || 0) > 0
    ) || []

  const selectedBuyVariant = getAvailableVariants(selectedBuyProduct).find(
    (variant) => variant.id === selectedVariantId
  )

  const selectedStock = Number(selectedBuyVariant?.quantity || 0)

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const openProductModal = (product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
    speak(`Viewing ${product.name}`)
  }

  const openBuyModal = (product) => {
    const variants = getAvailableVariants(product)

    if (variants.length === 0) {
      toast.error('This product is out of stock.')
      return
    }

    setSelectedBuyProduct(product)
    setSelectedVariantId(variants[0]?.id || '')
    setQuantity(1)
    setShowBuyModal(true)
    speak(`Choose variant and quantity for ${product.name}`)
  }

  const updateBuyQuantity = (nextQuantity) => {
    const boundedQuantity = Math.min(
      Math.max(Number(nextQuantity) || 1, 1),
      Math.max(selectedStock, 1)
    )

    setQuantity(boundedQuantity)
  }

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please sign in first before adding products to your cart.')

      navigate('/signin', {
        state: {
          from: '/products',
          message: 'Please sign in first before adding products to your cart.'
        }
      })

      return
    }

    if (!selectedBuyProduct || !selectedBuyVariant) {
      toast.error('Please choose a variant first.')
      return
    }

    const requestedQuantity = Number(quantity || 1)

    if (requestedQuantity > selectedStock) {
      toast.error(`Only ${selectedStock} stock available for ${selectedBuyVariant.name}.`)
      return
    }

    const existingCart = JSON.parse(localStorage.getItem('cart')) || []
    const cartId = `${selectedBuyProduct.id}-${selectedBuyVariant.id}`
    const existingItem = existingCart.find(
      (item) =>
        item.cartId === cartId ||
        (
          (item.productId || item.id) === selectedBuyProduct.id &&
          item.variantId === selectedBuyVariant.id
        )
    )

    if (existingItem) {
      const nextQuantity =
        Number(existingItem.quantity || 1) + requestedQuantity

      if (nextQuantity > selectedStock) {
        toast.error(`Only ${selectedStock} stock available for ${selectedBuyVariant.name}.`)
        return
      }

      existingItem.quantity = nextQuantity
      existingItem.stock = selectedStock
      existingItem.price = Number(selectedBuyVariant.price || 0)
    } else {
      existingCart.push({
        id: selectedBuyProduct.id,
        cartId,
        productId: selectedBuyProduct.id,
        name: selectedBuyProduct.name,
        productName: selectedBuyProduct.name,
        category: selectedBuyProduct.category,
        image: selectedBuyProduct.image || '',
        variantId: selectedBuyVariant.id,
        variantName: selectedBuyVariant.name || 'Default',
        sku: selectedBuyVariant.sku || '',
        size: selectedBuyVariant.size || '',
        unit: selectedBuyVariant.unit || '',
        stock: selectedStock,
        quantity: requestedQuantity,
        price: Number(selectedBuyVariant.price || 0)
      })
    }

    localStorage.setItem('cart', JSON.stringify(existingCart))
    setShowBuyModal(false)
    speak(`${selectedBuyVariant.name} added to cart.`)

    toast.success('Added to cart.', {
      duration: 3000,
      style: {
        borderRadius: '16px',
        background: '#16a34a',
        color: '#fff',
        padding: '14px 18px',
        fontWeight: '600'
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#16a34a'
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500 mt-2">Browse our complete product catalog</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="input-field"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No products found</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const totalStock =
              product.variants?.reduce(
                (sum, variant) => sum + Number(variant.quantity || 0),
                0
              ) || 0
            const prices = product.variants?.map(
              (variant) => Number(variant.price || 0)
            ) || [0]
            const minPrice = Math.min(...prices)
            const maxPrice = Math.max(...prices)

            return (
              <div
                key={product.id}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
                onMouseEnter={() => speak(product.name)}
              >
                <div className="h-48 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-primary-300" />
                  )}
                  {totalStock <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                    {product.category}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {product.variants?.length || 0} variants
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-lg font-bold text-primary-700">
                      {minPrice === maxPrice
                        ? formatCurrency(minPrice)
                        : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        totalStock > 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {totalStock > 0 ? 'Available' : 'Out of Stock'}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openProductModal(product)}
                      className="flex-1 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition text-sm font-medium"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openBuyModal(product)}
                      disabled={totalStock <= 0}
                      className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Add
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={selectedProduct?.name}
        size="lg"
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="badge badge-info">{selectedProduct.category}</span>
            </div>

            <div className="h-64 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden flex items-center justify-center">
              {selectedProduct.image ? (
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-20 h-20 text-primary-300" />
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Available Variants</h4>
              <div className="space-y-3">
                {selectedProduct.variants?.length === 0 ? (
                  <p className="text-gray-500">No variants available</p>
                ) : (
                  selectedProduct.variants?.map((variant) => {
                    const status = getStockStatus(variant.quantity, variant.reorderLevel)
                    const isAvailable = Number(variant.quantity || 0) > 0

                    return (
                      <div
                        key={variant.id}
                        className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow"
                        onMouseEnter={() => speak(`${variant.name}, ${status.status}, ${variant.quantity} in stock, ${variant.price} pesos`)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h5 className="font-semibold text-gray-900">{variant.name}</h5>
                            <p className="text-sm text-gray-500">SKU: {variant.sku}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                              <span>Size: {variant.size || 'N/A'}</span>
                              <span>Unit: {variant.unit || 'pcs'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary-700">
                              {formatCurrency(variant.price)}
                            </p>
                            <span className={`badge ${status.color} mt-1`}>{status.status}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          Stock: {variant.quantity} units (Reorder at: {variant.reorderLevel})
                        </div>
                        {!isAvailable && (
                          <p className="mt-3 text-sm font-semibold text-red-600">
                            Currently unavailable
                          </p>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        title="Choose Variant"
        size="lg"
      >
        {selectedBuyProduct && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-2xl bg-primary-50 overflow-hidden flex items-center justify-center shrink-0">
                {selectedBuyProduct.image ? (
                  <img
                    src={selectedBuyProduct.image}
                    alt={selectedBuyProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-10 h-10 text-primary-300" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary-600">
                  {selectedBuyProduct.category}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 break-words">
                  {selectedBuyProduct.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select the exact variant and quantity before adding to cart.
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Variants</h4>
              <div className="grid gap-3">
                {getAvailableVariants(selectedBuyProduct).map((variant) => {
                  const isSelected = variant.id === selectedVariantId

                  return (
                    <button
                      type="button"
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariantId(variant.id)
                        setQuantity(1)
                      }}
                      className={`
                        w-full text-left rounded-2xl border p-4 transition
                        ${isSelected
                          ? 'border-green-600 bg-green-50 ring-2 ring-green-100'
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {variant.name || 'Default'}
                          </p>
                          <p className="text-sm text-gray-500">
                            SKU: {variant.sku || 'N/A'}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                            <span className="rounded-full bg-white px-2 py-1 border border-gray-200">
                              Size: {variant.size || 'N/A'}
                            </span>
                            <span className="rounded-full bg-white px-2 py-1 border border-gray-200">
                              Unit: {variant.unit || 'pcs'}
                            </span>
                            <span className="rounded-full bg-white px-2 py-1 border border-gray-200">
                              {variant.quantity} left
                            </span>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-primary-700">
                          {formatCurrency(variant.price)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Quantity</p>
                  <p className="text-sm text-gray-500">
                    {selectedBuyVariant
                      ? `${selectedStock} stock available`
                      : 'Choose a variant first'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateBuyQuantity(quantity - 1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max={selectedStock || 1}
                    value={quantity}
                    onChange={(event) => updateBuyQuantity(event.target.value)}
                    className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-center font-bold outline-none focus:border-green-500"
                  />

                  <button
                    type="button"
                    onClick={() => updateBuyQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="font-semibold text-gray-700">Subtotal</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(Number(selectedBuyVariant?.price || 0) * Number(quantity || 1))}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedBuyVariant || selectedStock <= 0}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 text-base font-semibold text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Products
