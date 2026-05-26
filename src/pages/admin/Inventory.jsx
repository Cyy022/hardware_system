import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, Package, AlertTriangle, Image as ImageIcon, Upload, X } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useAccessibility } from '../../context/AccessibilityContext'
import { addProduct, updateProduct, deleteProduct, addVariant, updateVariant, deleteVariant, getStockStatus } from '../../firebase/services'
import Modal from '../../components/common/Modal'
import ConfirmModal from '../../components/common/ConfirmModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Inventory = () => {
  const { products, categories, loading } = useProducts()
  const { speak } = useAccessibility()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingVariant, setEditingVariant] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState('product')

  const itemsPerPage = 10

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Product form state
  const emptyProductForm = { name: '', category: '', image: '' }
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [variantForm, setVariantForm] = useState({
    name: '', sku: '', size: '', unit: 'pcs', price: '', quantity: '', reorderLevel: ''
  })

  const handleAddProduct = async (e) => {
    e.preventDefault()
    try {
      await addProduct(productForm)
      toast.success('Product added successfully')
      setShowProductModal(false)
      setProductForm(emptyProductForm)
      speak('Product added successfully')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    try {
      await updateProduct(editingProduct.id, productForm)
      toast.success('Product updated successfully')
      setShowProductModal(false)
      setEditingProduct(null)
      setProductForm(emptyProductForm)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAddVariant = async (e) => {
    e.preventDefault()
    try {
      await addVariant({
        ...variantForm,
        productId: selectedProduct.id,
        price: parseFloat(variantForm.price),
        quantity: parseInt(variantForm.quantity),
        reorderLevel: parseInt(variantForm.reorderLevel)
      })
      toast.success('Variant added successfully')
      setShowVariantModal(false)
      setVariantForm({ name: '', sku: '', size: '', unit: 'pcs', price: '', quantity: '', reorderLevel: '' })
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleUpdateVariant = async (e) => {
    e.preventDefault()
    try {
      await updateVariant(editingVariant.id, {
        ...variantForm,
        price: parseFloat(variantForm.price),
        quantity: parseInt(variantForm.quantity),
        reorderLevel: parseInt(variantForm.reorderLevel)
      })
      toast.success('Variant updated successfully')
      setShowVariantModal(false)
      setEditingVariant(null)
      setVariantForm({ name: '', sku: '', size: '', unit: 'pcs', price: '', quantity: '', reorderLevel: '' })
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDelete = async () => {
    try {
      if (deleteType === 'product') {
        await deleteProduct(itemToDelete.id)
        toast.success('Product deleted successfully')
      } else {
        await deleteVariant(itemToDelete.id)
        toast.success('Variant deleted successfully')
      }
      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const openEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name || '',
      category: product.category || '',
      image: product.image || ''
    })
    setShowProductModal(true)
  }

  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        const image = new Image()

        image.onload = () => {
          const canvas = document.createElement('canvas')
          const maxSize = 900
          const ratio = Math.min(
            maxSize / image.width,
            maxSize / image.height,
            1
          )

          canvas.width = Math.round(image.width * ratio)
          canvas.height = Math.round(image.height * ratio)

          const context = canvas.getContext('2d')
          context.drawImage(image, 0, 0, canvas.width, canvas.height)

          resolve(canvas.toDataURL('image/jpeg', 0.82))
        }

        image.onerror = reject
        image.src = reader.result
      }

      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleProductImageChange = async (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')

      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller')

      return
    }

    try {
      const image = await resizeImage(file)

      setProductForm((prev) => ({
        ...prev,
        image
      }))

      toast.success('Product image imported')
    } catch (error) {
      console.log(error)
      toast.error('Unable to import image')
    } finally {
      event.target.value = ''
    }
  }

  const openAddVariant = (product) => {
    setSelectedProduct(product)
    setEditingVariant(null)
    setVariantForm({ name: '', sku: '', size: '', unit: 'pcs', price: '', quantity: '', reorderLevel: '' })
    setShowVariantModal(true)
  }

  const openEditVariant = (variant) => {
    setEditingVariant(variant)
    setVariantForm({
      name: variant.name,
      sku: variant.sku,
      size: variant.size || '',
      unit: variant.unit || 'pcs',
      price: variant.price,
      quantity: variant.quantity,
      reorderLevel: variant.reorderLevel
    })
    setShowVariantModal(true)
  }

  const openViewVariants = (product) => {
    setSelectedProduct(product)
    setShowViewModal(true)
  }

  const confirmDelete = (item, type) => {
    setItemToDelete(item)
    setDeleteType(type)
    setShowDeleteModal(true)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your products and variants</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null)
            setProductForm(emptyProductForm)
            setShowProductModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
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
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Product</th>
                <th className="table-header">Category</th>
                <th className="table-header">Total Stock</th>
                <th className="table-header">Variants</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No products found</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(product => {
                  const totalStock = product.variants?.reduce((sum, v) => sum + (v.quantity || 0), 0) || 0
                  const hasLowStock = product.variants?.some(v => (v.quantity || 0) <= (v.reorderLevel || 10))

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary-50 overflow-hidden flex items-center justify-center shrink-0">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-primary-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {hasLowStock && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                              <span className="font-medium text-gray-900 break-words">{product.name}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {product.image ? 'Image added' : 'No image'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-info">{product.category}</span>
                      </td>
                      <td className="table-cell">
                        <span className={`font-semibold ${totalStock <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {totalStock}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-success">{product.variants?.length || 0}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openViewVariants(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Variants"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openAddVariant(product)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Add Variant"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditProduct(product)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(product, 'product')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
      >
        <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
            <div className="rounded-2xl border border-dashed border-gray-300 p-4">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="w-full sm:w-36 aspect-square rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center">
                  {productForm.image ? (
                    <img
                      src={productForm.image}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-gray-400" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-3">
                    Import a product photo. It will be compressed and shown in the ecommerce product list.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 cursor-pointer transition">
                      <Upload className="w-4 h-4" />
                      Import Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageChange}
                        className="hidden"
                      />
                    </label>

                    {productForm.image && (
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, image: '' })}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="input-field"
              required
              placeholder="Enter product name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <input
              type="text"
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              className="input-field"
              required
              placeholder="Enter category (e.g., Electrical, Plumbing)"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowProductModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {editingProduct ? 'Update' : 'Add'} Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Variant Modal */}
      <Modal
        isOpen={showVariantModal}
        onClose={() => setShowVariantModal(false)}
        title={editingVariant ? 'Edit Variant' : 'Add Variant'}
      >
        <form onSubmit={editingVariant ? handleUpdateVariant : handleAddVariant} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name *</label>
            <input
              type="text"
              value={variantForm.name}
              onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
              className="input-field"
              required
              placeholder="e.g., LED Bulb Warm White"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
            <input
              type="text"
              value={variantForm.sku}
              onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
              className="input-field"
              required
              placeholder="e.g., BULB-LED-WW"
              disabled={!!editingVariant}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <input
                type="text"
                value={variantForm.size}
                onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                className="input-field"
                placeholder="e.g., 10W"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <select
                value={variantForm.unit}
                onChange={(e) => setVariantForm({ ...variantForm, unit: e.target.value })}
                className="input-field"
                required
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="box">Box</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="m">Meter (m)</option>
                <option value="set">Set</option>
                <option value="roll">Roll</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱) *</label>
              <input
                type="number"
                value={variantForm.price}
                onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                className="input-field"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity *</label>
              <input
                type="number"
                value={variantForm.quantity}
                onChange={(e) => setVariantForm({ ...variantForm, quantity: e.target.value })}
                className="input-field"
                required
                min="0"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level *</label>
            <input
              type="number"
              value={variantForm.reorderLevel}
              onChange={(e) => setVariantForm({ ...variantForm, reorderLevel: e.target.value })}
              className="input-field"
              required
              min="1"
              placeholder="10"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowVariantModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {editingVariant ? 'Update' : 'Add'} Variant
            </button>
          </div>
        </form>
      </Modal>

      {/* View Variants Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`Variants: ${selectedProduct?.name}`}
        size="lg"
      >
        <div className="space-y-3">
          {selectedProduct?.variants?.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No variants added yet</p>
          ) : (
            selectedProduct?.variants?.map(variant => {
              const status = getStockStatus(variant.quantity, variant.reorderLevel)
              return (
                <div key={variant.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{variant.name}</h4>
                      <p className="text-sm text-gray-500">SKU: {variant.sku}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span>Size: {variant.size || 'N/A'}</span>
                        <span>Unit: {variant.unit}</span>
                        <span className="font-semibold text-primary-600">₱{variant.price?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${status.color}`}>{status.status}</span>
                      <p className="text-sm font-semibold mt-1">{variant.quantity} in stock</p>
                      <p className="text-xs text-gray-500">Reorder: {variant.reorderLevel}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => {
                        setShowViewModal(false)
                        openEditVariant(variant)
                      }}
                      className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false)
                        confirmDelete(variant, 'variant')
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${deleteType === 'product' ? 'Product' : 'Variant'}`}
        message={`Are you sure you want to delete "${itemToDelete?.name || itemToDelete?.sku}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  )
}

export default Inventory
