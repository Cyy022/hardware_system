import React, { useState, useEffect } from 'react'

import { Link } from 'react-router-dom'

import {
  ShoppingCart,
  Lock,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

const Cart = () => {

  const { user } = useAuth()

  const [cart, setCart] = useState([])

  // ================= LOAD CART =================

  useEffect(() => {

    const storedCart =
      JSON.parse(localStorage.getItem('cart')) || []

    setCart(storedCart)

  }, [])

  // ================= UPDATE QUANTITY =================

  const updateQuantity = (id, type) => {

    const updatedCart = cart.map((item) => {

      if (item.id === id) {

        const newQuantity =
          type === 'increase'
            ? item.quantity + 1
            : item.quantity - 1

        return {
          ...item,
          quantity:
            newQuantity < 1 ? 1 : newQuantity
        }

      }

      return item

    })

    setCart(updatedCart)

    localStorage.setItem(
      'cart',
      JSON.stringify(updatedCart)
    )

  }

  // ================= REMOVE ITEM =================

  const removeItem = (id) => {

    const updatedCart =
      cart.filter((item) => item.id !== id)

    setCart(updatedCart)

    localStorage.setItem(
      'cart',
      JSON.stringify(updatedCart)
    )

  }

  // ================= TOTAL =================

  const subtotal = cart.reduce((acc, item) => {

    return acc + item.price * item.quantity

  }, 0)

  // ================= LOGIN REQUIRED =================

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
            Before accessing your shopping cart
            and checking out your items,
            you must sign in or create
            an account first.
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

  // ================= EMPTY CART =================

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
            Looks like you haven't added
            any products yet.
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

  // ================= CART =================

  return (

    <div className="min-h-screen bg-gray-50 py-10 px-4">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="mb-10">

          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Shopping Cart
          </h1>

          <p className="text-gray-500 text-lg">
            Review your selected products
            before checkout.
          </p>

        </div>

        {/* CONTENT */}

        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT */}

          <div className="lg:col-span-2 space-y-5">

            {cart.map((item) => (

              <div
                key={item.id}
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

                {/* PRODUCT INFO */}

                <div className="flex items-center gap-5">

                  <div className="
                    w-24 h-24 rounded-2xl
                    bg-green-100
                    flex items-center justify-center
                  ">

                    <ShoppingBag className="w-10 h-10 text-green-600" />

                  </div>

                  <div>

                    <h2 className="text-2xl font-bold text-gray-900">
                      {item.name}
                    </h2>

                    <p className="text-gray-500 mt-1">
                      Hardware Product
                    </p>

                    <p className="text-green-600 font-bold text-xl mt-3">
                      ₱{item.price}
                    </p>

                  </div>

                </div>

                {/* ACTIONS */}

                <div className="flex items-center justify-between sm:justify-end gap-4">

                  {/* QUANTITY */}

                  <div className="
                    flex items-center gap-4
                    bg-gray-100 rounded-2xl
                    px-4 py-3
                  ">

                    <button
                      onClick={() =>
                        updateQuantity(item.id, 'decrease')
                      }
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
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQuantity(item.id, 'increase')
                      }
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

                  {/* REMOVE */}

                  <button
                    onClick={() => removeItem(item.id)}
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

            ))}

          </div>

          {/* RIGHT */}

          <div>

            <div className="
              bg-white rounded-3xl
              border border-gray-200
              p-8 shadow-sm sticky top-24
            ">

              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Order Summary
              </h2>

              <div className="space-y-4 mb-8">

                <div className="flex items-center justify-between text-lg">

                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    ₱{subtotal}
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
                    ₱{subtotal}
                  </span>

                </div>

              </div>

              {/* CHECKOUT */}

              <Link
                to="/checkout"
                className="
                  w-full flex items-center justify-center gap-3
                  py-5 rounded-2xl
                  bg-green-600 hover:bg-green-700
                  text-white font-semibold text-lg
                  transition-all
                "
              >

                Proceed to Checkout

                <ArrowRight className="w-5 h-5" />

              </Link>

            </div>

          </div>

        </div>

      </div>

    </div>

  )

}

export default Cart