import React, { useEffect, useMemo, useState } from 'react'

import {
  Link,
  useNavigate
} from 'react-router-dom'

import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Home,
  MapPin,
  PackageCheck,
  Phone,
  ShoppingBag,
  User
} from 'lucide-react'

import toast from 'react-hot-toast'

import { useAuth } from '../../context/AuthContext'

import {
  createOrder,
  getUserByEmail,
  getUserProfile
} from '../../firebase/services'

const ADDRESS_OPTIONS = {
  Cavite: [
    'Bacoor',
    'Carmona',
    'Dasmarinas',
    'General Trias',
    'Imus',
    'Kawit',
    'Silang',
    'Tagaytay',
    'Tanza',
    'Trece Martires'
  ],
  'Nueva Ecija': [
    'Cabanatuan',
    'Gapan',
    'General Tinio',
    'Jaen',
    'San Isidro',
    'San Leonardo',
    'Santa Rosa'
  ],
  Bulacan: [
    'Baliwag',
    'Malolos',
    'Marilao',
    'Meycauayan',
    'San Jose del Monte',
    'Santa Maria'
  ],
  Laguna: [
    'Binan',
    'Calamba',
    'Santa Rosa',
    'San Pedro',
    'Los Banos'
  ],
  Pampanga: [
    'Angeles',
    'Mabalacat',
    'San Fernando',
    'Mexico',
    'Porac'
  ],
  'Metro Manila': [
    'Caloocan',
    'Las Pinas',
    'Makati',
    'Manila',
    'Pasig',
    'Quezon City',
    'Taguig'
  ]
}

const emptyForm = {
  fullName: '',
  phone: '',
  province: 'Cavite',
  city: 'General Trias',
  barangay: '',
  houseNumber: '',
  street: '',
  landmark: '',
  postalCode: '',
  deliveryNotes: '',
  paymentMethod: 'cod'
}

const formatCurrency = (amount) =>
  `PHP ${Number(amount || 0).toLocaleString()}`

const buildAddressText = (form) => [
  form.houseNumber,
  form.street,
  form.barangay,
  form.city,
  form.province,
  'Philippines',
  form.postalCode
]
  .filter(Boolean)
  .join(', ')

const Checkout = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [cart, setCart] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [profileLoading, setProfileLoading] = useState(true)
  const [loading, setLoading] = useState(false)

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

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) {
        setProfileLoading(false)

        return
      }

      try {
        const data =
          await getUserProfile(user.uid) ||
          await getUserByEmail(user.email)

        const details = data?.addressDetails || {}
        const province = details.province || emptyForm.province
        const cities = ADDRESS_OPTIONS[province] || []

        setForm((prev) => ({
          ...prev,
          fullName:
            data?.fullName ||
            [data?.firstName, data?.lastName].filter(Boolean).join(' ') ||
            user.displayName ||
            '',
          phone: data?.phone || '',
          province,
          city: details.city || cities[0] || emptyForm.city,
          barangay: details.barangay || '',
          houseNumber: details.houseNumber || '',
          street: details.street || '',
          landmark: details.landmark || '',
          postalCode: details.postalCode || '',
          deliveryNotes: details.deliveryNotes || ''
        }))
      } catch (error) {
        console.log(error)
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const subtotal = useMemo(() => cart.reduce(
    (acc, item) => {
      const price = Number(item?.price) || 0
      const quantity = Number(item?.quantity) || 1

      return acc + price * quantity
    },
    0
  ), [cart])

  const totalItems = useMemo(() => cart.reduce(
    (acc, item) => acc + (Number(item?.quantity) || 1),
    0
  ), [cart])

  const cityOptions = ADDRESS_OPTIONS[form.province] || []
  const hasUnselectedVariants = cart.some((item) => !item?.variantId)

  const updateForm = (field, value) => {
    if (field === 'province') {
      const cities = ADDRESS_OPTIONS[value] || []

      setForm((prev) => ({
        ...prev,
        province: value,
        city: cities[0] || ''
      }))

      return
    }

    setForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    const requiredFields = [
      ['fullName', 'Full name is required.'],
      ['phone', 'Phone number is required.'],
      ['barangay', 'Barangay is required.'],
      ['houseNumber', 'House or unit number is required.'],
      ['street', 'Street or subdivision is required.']
    ]

    for (const [field, errorMessage] of requiredFields) {
      if (!form[field]?.trim()) {
        toast.error(errorMessage)

        return false
      }
    }

    return true
  }

  const handleCheckout = async (event) => {
    event.preventDefault()

    try {
      if (!user) {
        toast.error('Please sign in first.')

        return
      }

      if (cart.length === 0) {
        toast.error('Your cart is empty.')

        return
      }

      if (hasUnselectedVariants) {
        toast.error('Please select variants in your cart before checkout.')

        navigate('/cart')

        return
      }

      if (!validateForm()) return

      setLoading(true)

      const formattedItems = cart.map(item => ({
        productId: item?.productId || item?.id || '',
        productName: item?.name || item?.productName || 'Product',
        variantName: item?.variantName || 'Default',
        quantity: Number(item?.quantity) || 1,
        price: Number(item?.price) || 0,
        variantId: item?.variantId || '',
        image: item?.image || ''
      }))

      const addressDetails = {
        country: 'Philippines',
        province: form.province,
        city: form.city,
        barangay: form.barangay.trim(),
        houseNumber: form.houseNumber.trim(),
        street: form.street.trim(),
        landmark: form.landmark.trim(),
        postalCode: form.postalCode.trim()
      }

      const order = await createOrder({
        userId: user.uid,
        customerName: form.fullName.trim(),
        email: user.email || '',
        phone: form.phone.trim(),
        shippingAddress: buildAddressText(form),
        addressDetails,
        deliveryNotes: form.deliveryNotes.trim(),
        items: formattedItems,
        paymentMethod: form.paymentMethod
      })

      toast.success('Order placed. Waiting for admin confirmation.')

      localStorage.removeItem('cart')
      setCart([])

      navigate('/my-orders', {
        state: {
          orderId: order.id
        }
      })
    } catch (error) {
      console.log(error)
      toast.error('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 text-center max-w-lg w-full">
          <User className="w-16 h-16 mx-auto text-green-600 mb-6" />

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Sign In Required
          </h1>

          <p className="text-gray-500 mb-8">
            Please sign in before placing an order.
          </p>

          <Link
            to="/signin"
            className="
              inline-flex items-center justify-center gap-2
              px-6 py-4 rounded-2xl
              bg-green-600 text-white
              font-semibold
            "
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 text-center max-w-lg w-full">
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

  if (hasUnselectedVariants) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 text-center max-w-lg w-full">
          <ShoppingBag className="w-16 h-16 mx-auto text-green-600 mb-6" />

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Select Variants First
          </h1>

          <p className="text-gray-500 mb-8">
            Choose a variant for every cart item before proceeding to checkout.
          </p>

          <Link
            to="/cart"
            className="
              inline-flex items-center gap-2
              px-6 py-4 rounded-2xl
              bg-green-600 text-white
              font-semibold
            "
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Cart
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-5 sm:px-4 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to cart
          </Link>

          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900">
            Checkout
          </h1>

          <p className="mt-2 text-gray-500">
            Review your items and complete your delivery details.
          </p>
        </div>

        <form
          onSubmit={handleCheckout}
          className="grid lg:grid-cols-3 gap-6 lg:gap-8"
        >
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <ClipboardList className="w-5 h-5 text-green-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Order Items
                </h2>
              </div>

              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div
                    key={`${item?.id || item?.name}-${index}`}
                    className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
                      {item?.image ? (
                        <img
                          src={item.image}
                          alt={item?.name || 'Product'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-green-600" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 break-words">
                        {item?.name || item?.productName || 'Product'}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {item?.variantName || 'Default'} / Qty {item?.quantity || 1}
                      </p>

                      <p className="font-bold text-green-600 mt-2">
                        {formatCurrency(
                          (Number(item?.price) || 0) *
                          (Number(item?.quantity) || 1)
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <MapPin className="w-5 h-5 text-green-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Delivery Details
                </h2>
              </div>

              {profileLoading ? (
                <div className="rounded-2xl bg-gray-50 p-5 text-gray-500">
                  Loading saved profile details...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Full Name
                    </span>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(event) => updateForm('fullName', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                      placeholder="Customer full name"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Phone Number
                    </span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) => updateForm('phone', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                      placeholder="09XXXXXXXXX"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Country
                    </span>
                    <input
                      type="text"
                      value="Philippines"
                      disabled
                      className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-600"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Province
                    </span>
                    <select
                      value={form.province}
                      onChange={(event) => updateForm('province', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-500"
                    >
                      {Object.keys(ADDRESS_OPTIONS).map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      City / Municipality
                    </span>
                    <select
                      value={form.city}
                      onChange={(event) => updateForm('city', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-green-500"
                    >
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Barangay
                    </span>
                    <input
                      type="text"
                      value={form.barangay}
                      onChange={(event) => updateForm('barangay', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                      placeholder="Barangay"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      House / Lot / Unit No.
                    </span>
                    <input
                      type="text"
                      value={form.houseNumber}
                      onChange={(event) => updateForm('houseNumber', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                      placeholder="House no., lot, block, unit"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Street / Subdivision
                    </span>
                    <input
                      type="text"
                      value={form.street}
                      onChange={(event) => updateForm('street', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                      placeholder="Street, subdivision, village"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Landmark
                    </span>
                    <input
                      type="text"
                      value={form.landmark}
                      onChange={(event) => updateForm('landmark', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                      placeholder="Near church, school, store"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Postal Code
                    </span>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(event) => updateForm('postalCode', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                      placeholder="Postal code"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Delivery Notes
                    </span>
                    <textarea
                      value={form.deliveryNotes}
                      onChange={(event) => updateForm('deliveryNotes', event.target.value)}
                      rows="3"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500 resize-none"
                      placeholder="Gate color, best delivery time, special instructions"
                    />
                  </label>
                </div>
              )}
            </section>
          </div>

          <aside>
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-5">
                <PackageCheck className="w-5 h-5 text-green-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Summary
                </h2>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Items</span>
                  <span className="font-semibold text-gray-900">
                    {totalItems}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="font-semibold text-green-600">
                    Free
                  </span>
                </div>

                <div className="border-t pt-4 flex justify-between items-end">
                  <span className="font-bold text-gray-900">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Payment Method
                </p>

                <label className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={form.paymentMethod === 'cod'}
                    onChange={(event) => updateForm('paymentMethod', event.target.value)}
                    className="accent-green-600"
                  />
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-800">
                    Cash on Delivery
                  </span>
                </label>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 mb-6 space-y-3 text-sm text-gray-600">
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  Admin will confirm your order first.
                </div>

                <div className="flex gap-2">
                  <Home className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  You can track the order in My Orders.
                </div>

                <div className="flex gap-2">
                  <Phone className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  Keep your phone reachable for updates.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || profileLoading}
                className="
                  w-full py-4 rounded-2xl
                  bg-green-600 hover:bg-green-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-white font-bold
                  transition flex items-center justify-center gap-3
                "
              >
                <CreditCard className="w-5 h-5" />
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </aside>
        </form>
      </div>
    </div>
  )
}

export default Checkout
