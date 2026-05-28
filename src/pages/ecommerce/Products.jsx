import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Filter, Package, ShoppingCart } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useAuth } from '../../context/AuthContext'
import { useAccessibility } from '../../context/AccessibilityContext'
import { getStockStatus } from '../../firebase/services'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Products = () => {
  const { products, categories, loading } = useProducts()
  const { user } = useAuth()
  const { speak } = useAccessibility()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)

  // Handle URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const productParam = searchParams.get('product')

    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }

    if (productParam) {
      const product = products.find(p => p.id === productParam)
      if (product) {
        setSelectedProduct(product)
        setShowProductModal(true)
      }
    }
  }, [searchParams, products])

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const openProductModal = (product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
    speak(`Viewing ${product.name}`)
  }

  const handleAddToCart = (product) => {
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

    const totalStock =
      product.variants?.reduce(
        (sum, variant) => sum + Number(variant.quantity || 0),
        0
      ) || 0

    if (totalStock <= 0) {
      toast.error('This product is out of stock.')

      return
    }

    const existingCart =
      JSON.parse(localStorage.getItem('cart')) || []

    const cartId = `${product.id}-pending`

    const existingItem = existingCart.find(
      item => item.cartId === cartId ||
        (
          (item.productId || item.id) === product.id &&
          !item.variantId
        )
    )

    if (existingItem) {
      if (existingItem.quantity >= totalStock) {
        toast.error(`Only ${totalStock} stock available for ${product.name}.`)

        return
      }

      existingItem.quantity += 1
    } else {
      existingCart.push({
        id: product.id,
        cartId,
        productId: product.id,
        name: product.name,
        productName: product.name,
        category: product.category,
        image: product.image || '',
        variantId: '',
        variantName: '',
        sku: '',
        size: '',
        unit: '',
        stock: totalStock,
        quantity: 1,
        price: 0
      })
    }

    localStorage.setItem(
      'cart',
      JSON.stringify(existingCart)
    )

    speak(`${product.name} added to cart. Select a variant in your cart before checkout.`)

    toast.success('Added to cart. Select variant in cart.', {
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500 mt-2">Browse our complete product catalog</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No products found</p>
          </div>
        ) : (
          filteredProducts.map(product => {
            const totalStock = product.variants?.reduce((sum, v) => sum + (v.quantity || 0), 0) || 0
            const minPrice = Math.min(...(product.variants?.map(v => v.price) || [0]))
            const maxPrice = Math.max(...(product.variants?.map(v => v.price) || [0]))

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
                <div className="mt-3 flex items-center justify-between">
  <span className="text-lg font-bold text-primary-700">
    {minPrice === maxPrice 
      ? `₱${minPrice?.toLocaleString()}` 
      : `₱${minPrice?.toLocaleString()} - ₱${maxPrice?.toLocaleString()}`
    }
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

{/* BUTTONS */}

<div className="mt-4 flex gap-2">

  <button
    onClick={() => openProductModal(product)}
    className="
      flex-1 py-2 rounded-xl border border-gray-200
      hover:bg-gray-100 transition text-sm font-medium
    "
  >
    View
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation()
      handleAddToCart(product)
    }}
    disabled={totalStock <= 0}
    className="
      flex-1 py-2 rounded-xl bg-green-600
      hover:bg-green-700 text-white
      transition text-sm font-medium
      disabled:bg-gray-300 disabled:cursor-not-allowed
    "
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

      {/* Product Detail Modal */}
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
                  selectedProduct.variants?.map(variant => {
                    const status = getStockStatus(variant.quantity, variant.reorderLevel)
                    const isAvailable = Number(variant.quantity || 0) > 0
                    return (
                      <div 
                        key={variant.id} 
                        className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow"
                        onMouseEnter={() => speak(`${variant.name}, ${status.status}, ${variant.quantity} in stock, ${variant.price} pesos`)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-semibold text-gray-900">{variant.name}</h5>
                            <p className="text-sm text-gray-500">SKU: {variant.sku}</p>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                              <span>Size: {variant.size || 'N/A'}</span>
                              <span>Unit: {variant.unit}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary-700">₱{variant.price?.toLocaleString()}</p>
                            <span className={`badge ${status.color} mt-1`}>{status.status}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          Stock: {variant.quantity} units (Reorder at: {variant.reorderLevel})
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(selectedProduct)}
                          disabled={!isAvailable}
                          className="
                            mt-4 w-full inline-flex items-center justify-center gap-2
                            rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold
                            text-white hover:bg-green-700 disabled:bg-gray-300
                            disabled:cursor-not-allowed transition
                          "
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Products
