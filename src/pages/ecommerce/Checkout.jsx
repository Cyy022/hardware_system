import React, { useEffect, useState } from 'react'

import {
  Link,
  useNavigate
} from 'react-router-dom'

import {
  ShoppingBag,
  ArrowLeft,
  CreditCard
} from 'lucide-react'

import toast from 'react-hot-toast'

import { useAuth } from '../../context/AuthContext'

import { createOrder } from '../../firebase/services'

const Checkout = () => {

  const { user } = useAuth()

  const navigate = useNavigate()

  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)

  // LOAD CART
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

  // TOTAL
  const totalAmount = cart.reduce(

    (acc, item) => {

      const price =
        Number(item?.price) || 0

      const quantity =
        Number(item?.quantity) || 1

      return acc + price * quantity

    },

    0

  )

  // CHECKOUT
  const handleCheckout = async () => {

    try {

      if (!user) {

        toast.error(
          'Please sign in first.'
        )

        return

      }

      if (cart.length === 0) {

        toast.error(
          'Your cart is empty.'
        )

        return

      }

      setLoading(true)

      // SAFE ITEMS
      const formattedItems = cart.map(item => ({

        productName:
          item?.name || 'Product',

        variantName:
          item?.variantName || 'Default',

        quantity:
          Number(item?.quantity) || 1,

        price:
          Number(item?.price) || 0,

        variantId:
          item?.variantId || '',

        image:
          item?.image || ''

      }))

      // CREATE ORDER
      await createOrder({

        customerName:
          user?.displayName || 'Customer',

        email:
          user?.email || '',

        phone: '',

        items: formattedItems,

        totalAmount,

        paymentMethod: 'cod'

      })

      toast.success(
        'Your order is processing!'
      )

      // CLEAR CART
      localStorage.removeItem('cart')

      setCart([])

      // REDIRECT
      setTimeout(() => {

        navigate('/')

      }, 1500)

    } catch (error) {

      console.log(error)

      toast.error(
        'Checkout failed.'
      )

    } finally {

      setLoading(false)

    }

  }

  // EMPTY CART
  if (cart.length === 0) {

    return (

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

        <div className="bg-white p-10 rounded-3xl border border-gray-200 text-center max-w-lg w-full">

          <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-6" />

          <h1 className="text-3xl font-bold text-gray-900 mb-4">

            Cart Empty

          </h1>

          <p className="text-gray-500 mb-8">

            Add some products before checkout.

          </p>

          <Link
            to="/products"
            className="
              inline-flex items-center gap-2
              px-6 py-4 rounded-2xl
              bg-green-600 text-white
              font-semibold
            "
          >

            <ArrowLeft className="w-5 h-5" />

            Continue Shopping

          </Link>

        </div>

      </div>

    )

  }

  return (

    <div className="min-h-screen bg-gray-50 py-10 px-4">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-5xl font-bold text-gray-900 mb-10">

          Checkout

        </h1>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-8">

            <h2 className="text-2xl font-bold mb-8">

              Order Items

            </h2>

            <div className="space-y-6">

              {cart.map((item, index) => (

                <div
                  key={index}
                  className="flex justify-between border-b pb-5"
                >

                  <div className="flex gap-4">

                    <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden">

                      <img
                        src={
                          item?.image ||
                          '/placeholder.png'
                        }
                        alt={item?.name || 'Product'}
                        className="w-full h-full object-cover"
                      />

                    </div>

                    <div>

                      <h3 className="font-bold text-lg">

                        {item?.name || 'Product'}

                      </h3>

                      <p className="text-gray-500">

                        Quantity:
                        {' '}
                        {item?.quantity || 1}

                      </p>

                    </div>

                  </div>

                  <p className="font-bold text-green-600 text-xl">

                    ₱
                    {(
                      (Number(item?.price) || 0) *
                      (Number(item?.quantity) || 1)
                    ).toLocaleString()}

                  </p>

                </div>

              ))}

            </div>

          </div>

          {/* RIGHT */}
          <div>

            <div className="bg-white rounded-3xl border border-gray-200 p-8 sticky top-24">

              <h2 className="text-2xl font-bold mb-8">

                Summary

              </h2>

              <div className="flex justify-between mb-6">

                <span className="text-gray-500">

                  Total

                </span>

                <span className="text-3xl font-bold text-green-600">

                  ₱
                  {totalAmount.toLocaleString()}

                </span>

              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="
                  w-full py-5 rounded-2xl
                  bg-green-600 hover:bg-green-700
                  disabled:opacity-50
                  text-white font-bold text-lg
                  transition
                  flex items-center justify-center gap-3
                "
              >

                <CreditCard className="w-5 h-5" />

                {loading
                  ? 'Processing...'
                  : 'Place Order'}

              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

  )

}

export default Checkout