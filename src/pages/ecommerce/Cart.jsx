import React, { useEffect, useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import {
  ShoppingCart,
  Lock,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag
} from 'lucide-react'

import toast from 'react-hot-toast'

import { useAuth } from '../../context/AuthContext'
import { useProducts } from '../../hooks/useProducts'

const formatCurrency = (amount) =>
  `PHP ${Number(amount || 0).toLocaleString()}`

const Cart = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { products, loading: productsLoading } = useProducts()

  const [cart, setCart] = useState([])

  useEffect(() => {
    try {
      const storedCart =
        JSON.parse(localStorage.getItem('cart')) || []

      setCart(storedCart)
    } catch (error) {
      console.log(error)
      setCart([])
    }
  }, [])

  const saveCart = (updatedCart) => {
    setCart(updatedCart)

    localStorage.setItem(
      'cart',
      JSON.stringify(updatedCart)
    )
  }

  const getProduct = (item) =>
    products.find(
      (product) =>
        product.id === (item.productId || item.id)
    )

  const getAvailableVariants = (item) =>
    getProduct(item)?.variants?.filter(
      (variant) => Number(variant.quantity || 0) > 0
    ) || []

  const getSelectedVariant = (item) =>
    getProduct(item)?.variants?.find(
      (variant) => variant.id === item.variantId
    )

  const isVariantReady = (item) => {
    const selectedVariant = getSelectedVariant(item)

    return (
      Boolean(item.variantId) &&
      Boolean(selectedVariant) &&
      Number(selectedVariant.quantity || 0) > 0 &&
      Number(item.quantity || 1) <= Number(selectedVariant.quantity || 0)
    )
  }

  const canProceedToCheckout =
    cart.length > 0 &&
    cart.every(isVariantReady)

  const updateQuantity = (index, type) => {
    const updatedCart = cart.map((item, itemIndex) => {
      if (itemIndex !== index) return item

      const selectedVariant = getSelectedVariant(item)
      const stock = Number(selectedVariant?.quantity || item.stock || 0)
      const newQuantity =
        type === 'increase'
          ? Number(item.quantity || 1) + 1
          : Number(item.quantity || 1) - 1

      if (
        type === 'increase' &&
        selectedVariant &&
        newQuantity > stock
      ) {
        toast.error(`Only ${stock} stock available for ${selectedVariant.name}.`)

        return item
      }

      return {
        ...item,
        quantity: newQuantity < 1 ? 1 : newQuantity
      }
    })

    saveCart(updatedCart)
  }

  const updateVariant = (index, variantId) => {
    const updatedCart = cart.map((item, itemIndex) => {
      if (itemIndex !== index) return item

      const selectedVariant = getAvailableVariants(item).find(
        (variant) => variant.id === variantId
      )

      if (!selectedVariant) {
        return {
          ...item,
          cartId: `${item.productId || item.id}-pending-${index}`,
          variantId: '',
          variantName: '',
          sku: '',
          size: '',
          unit: '',
          stock: 0,
          price: 0
        }
      }

      const product = getProduct(item)
      const stock = Number(selectedVariant.quantity || 0)
      const quantity = Math.min(
        Number(item.quantity || 1),
        stock
      )

      return {
        ...item,
        id: product?.id || item.id,
        productId: product?.id || item.productId || item.id,
        name: product?.name || item.name,
        productName: product?.name || item.productName || item.name,
        image: product?.image || item.image || '',
        category: product?.category || item.category || '',
        cartId: `${product?.id || item.productId || item.id}-${selectedVariant.id}`,
        variantId: selectedVariant.id,
        variantName: selectedVariant.name || 'Default',
        sku: selectedVariant.sku || '',
        size: selectedVariant.size || '',
        unit: selectedVariant.unit || '',
        stock,
        quantity,
        price: Number(selectedVariant.price || 0)
      }
    })

    saveCart(updatedCart)
  }

  const removeItem = (index) => {
    saveCart(
      cart.filter((_, itemIndex) => itemIndex !== index)
    )
  }

  const subtotal = cart.reduce((acc, item) => {
    return acc + Number(item.price || 0) * Number(item.quantity || 1)
  }, 0)

  const handleCheckout = () => {
    if (productsLoading) {
      toast.error('Loading product variants. Please wait.')

      return
    }

    if (cart.some((item) => !item.variantId)) {
      toast.error('Please select a variant for every product before checkout.')

      return
    }

    if (cart.some((item) => !isVariantReady(item))) {
      toast.error('Please update unavailable or over-stock items before checkout.')

      return
    }

    navigate('/checkout')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-sm border border-gray-200 p-10 text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
            <Lock className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sign In Required
          </h1>

          <p className="text-gray-500 text-lg leading-relaxed mb-8">
            Before accessing your shopping cart and checking out your items,
            you must sign in or create an account first.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signin"
              className="
                px-6 py-4 rounded-2xl
                bg-green-600 text-white
                font-semibold text-lg
                hover:bg-green-700
                transition-all
              "
            >
              Sign In
            </Link>

            <Link
              to="/signup"
              className="
                px-6 py-4 rounded-2xl
                border border-gray-300
                text-gray-700 font-semibold text-lg
                hover:bg-gray-100
                transition-all
              "
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-sm border border-gray-200 p-14 text-center">
          <div className="w-28 h-28 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-8">
            <ShoppingCart className="w-14 h-14 text-gray-400" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your cart is empty
          </h1>

          <p className="text-gray-500 text-lg mb-10">
            Looks like you haven't added any products yet.
          </p>

          <Link
            to="/products"
            className="
              inline-flex items-center gap-3
              px-8 py-4 rounded-2xl
              bg-green-600 text-white
              font-semibold text-lg
              hover:bg-green-700
              transition-all
            "
          >
            <ShoppingBag className="w-5 h-5" />
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Shopping Cart
          </h1>

          <p className="text-gray-500 text-lg">
            Review your selected items before checkout.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            {cart.map((item, index) => {
              const product = getProduct(item)
              const availableVariants = getAvailableVariants(item)
              const selectedVariant = getSelectedVariant(item)
              const hasVariantIssue =
                item.variantId &&
                (
                  !selectedVariant ||
                  Number(selectedVariant.quantity || 0) <= 0
                )
              const isOverStock =
                selectedVariant &&
                Number(item.quantity || 1) >
                  Number(selectedVariant.quantity || 0)

              return (
                <div
                  key={item.cartId || `${item.id}-${index}`}
                  className="
                    bg-white rounded-3xl
                    border border-gray-200
                    p-6
                    flex flex-col sm:flex-row
                    sm:items-center
                    justify-between
                    gap-6
                    shadow-sm
                  "
                >
                  <div className="flex items-start gap-5 min-w-0">
                    <div
                      className="
                        w-24 h-24 rounded-2xl
                        bg-green-100 overflow-hidden
                        flex items-center justify-center shrink-0
                      "
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={product?.name || item.name || 'Product'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-10 h-10 text-green-600" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 break-words">
                        {product?.name || item.name || item.productName || 'Product'}
                      </h2>

                      <p className="text-gray-500 mt-1">
                        Hardware Product
                      </p>

                      {item.variantId ? (
                        <div className="mt-4 flex flex-wrap gap-2 text-sm">
                          <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-green-700">
                            {item.variantName || selectedVariant?.name || 'Default'}
                          </span>
                          {item.sku && (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                              SKU: {item.sku}
                            </span>
                          )}
                          {item.size && (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                              Size: {item.size}
                            </span>
                          )}
                        </div>
                      ) : (
                        <label className="block mt-4 max-w-md">
                          <span className="text-sm font-semibold text-gray-700">
                            Variant
                          </span>
                          <select
                            value={item.variantId || ''}
                            onChange={(event) =>
                              updateVariant(index, event.target.value)
                            }
                            disabled={productsLoading || availableVariants.length === 0}
                            className="
                              mt-2 w-full rounded-xl border border-gray-200
                              bg-white px-4 py-3 text-sm outline-none
                              focus:border-green-500 disabled:bg-gray-100
                            "
                          >
                            <option value="">
                              {productsLoading
                                ? 'Loading variants...'
                                : 'Choose variant'}
                            </option>
                            {availableVariants.map((variant) => (
                              <option key={variant.id} value={variant.id}>
                                {variant.name} - {formatCurrency(variant.price)} ({variant.quantity} left)
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      {availableVariants.length === 0 && !productsLoading && (
                        <p className="text-sm font-semibold text-red-600 mt-2">
                          No available variants for this product.
                        </p>
                      )}

                      {hasVariantIssue && (
                        <p className="text-sm font-semibold text-red-600 mt-2">
                          Selected variant is no longer available.
                        </p>
                      )}

                      {isOverStock && (
                        <p className="text-sm font-semibold text-red-600 mt-2">
                          Only {selectedVariant.quantity} stock available.
                        </p>
                      )}

                      <p className="text-green-600 font-bold text-xl mt-3">
                        {item.variantId
                          ? formatCurrency(item.price)
                          : 'Select variant for price'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div
                      className="
                        flex items-center gap-4
                        bg-gray-100 rounded-2xl
                        px-4 py-3
                      "
                    >
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, 'decrease')}
                        className="
                          w-8 h-8 rounded-xl
                          bg-white hover:bg-gray-200
                          flex items-center justify-center
                          transition
                        "
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <span className="font-bold text-lg min-w-[20px] text-center">
                        {item.quantity || 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(index, 'increase')}
                        className="
                          w-8 h-8 rounded-xl
                          bg-white hover:bg-gray-200
                          flex items-center justify-center
                          transition
                        "
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="
                        p-4 rounded-2xl
                        bg-red-50 hover:bg-red-100
                        text-red-600
                        transition
                      "
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div>
            <div
              className="
                bg-white rounded-3xl
                border border-gray-200
                p-8 shadow-sm sticky top-24
              "
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Order Summary
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between text-lg">
                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-lg">
                  <span className="text-gray-500">
                    Shipping
                  </span>

                  <span className="font-semibold text-green-600">
                    Free
                  </span>
                </div>

                <div className="border-t pt-5 flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    Total
                  </span>

                  <span className="text-3xl font-bold text-green-600">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={!canProceedToCheckout || productsLoading}
                className="
                  w-full flex items-center justify-center gap-3
                  py-5 rounded-2xl
                  bg-green-600 hover:bg-green-700
                  disabled:bg-gray-300 disabled:cursor-not-allowed
                  text-white font-semibold text-lg
                  transition-all
                "
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </button>

              {!canProceedToCheckout && (
                <p className="mt-4 text-center text-sm font-semibold text-gray-500">
                  Update unavailable or over-stock items before checkout.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
