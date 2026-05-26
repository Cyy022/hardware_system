import React, { useEffect, useMemo, useState } from 'react'

import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  BadgeCheck,
  Pencil,
  Save,
  X,
  Home,
  Landmark
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import {
  getUserByEmail,
  getUserProfile,
  updateUserProfile
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
  birthday: '',
  country: 'Philippines',
  province: 'Cavite',
  city: 'General Trias',
  barangay: '',
  houseNumber: '',
  street: '',
  landmark: '',
  postalCode: '',
  deliveryNotes: ''
}

const buildAddressText = (data) => {
  if (!data) return ''

  if (data.addressDetails) {
    const details = data.addressDetails

    return [
      details.houseNumber,
      details.street,
      details.barangay,
      details.city,
      details.province,
      details.country || 'Philippines',
      details.postalCode
    ]
      .filter(Boolean)
      .join(', ')
  }

  return data.address || ''
}

const getInitialForm = (profile) => {
  const addressDetails = profile?.addressDetails || {}

  return {
    ...emptyForm,
    fullName: profile?.fullName || '',
    phone: profile?.phone || '',
    birthday: profile?.birthday || '',
    country: addressDetails.country || 'Philippines',
    province: addressDetails.province || 'Cavite',
    city: addressDetails.city || 'General Trias',
    barangay: addressDetails.barangay || '',
    houseNumber: addressDetails.houseNumber || '',
    street: addressDetails.street || '',
    landmark: addressDetails.landmark || '',
    postalCode: addressDetails.postalCode || '',
    deliveryNotes: addressDetails.deliveryNotes || ''
  }
}

const Profile = () => {
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.uid) {
          setLoading(false)

          return
        }

        const data = await getUserProfile(user.uid)

        if (!data && user.email) {
          const userData = await getUserByEmail(user.email)

          setProfile(userData)
          setForm(getInitialForm(userData))

          return
        }

        setProfile(data)
        setForm(getInitialForm(data))
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const authEmail = user?.email || ''
  const profileEmail = profile?.email || ''
  const displayEmail = authEmail || profileEmail || 'No Email'
  const displayName = profile?.fullName || 'No name added'
  const addressText = buildAddressText(profile)
  const cityOptions = ADDRESS_OPTIONS[form.province] || []

  const profileFields = useMemo(() => ([
    {
      icon: User,
      label: 'Full Name',
      value: displayName
    },
    {
      icon: Mail,
      label: 'Email Address',
      value: displayEmail,
      breakText: true
    },
    {
      icon: Phone,
      label: 'Phone Number',
      value: profile?.phone || 'No phone number'
    },
    {
      icon: MapPin,
      label: 'Address',
      value: addressText || 'No address added'
    },
    {
      icon: Calendar,
      label: 'Birthday',
      value: profile?.birthday || 'No birthday added'
    },
    {
      icon: ShieldCheck,
      label: 'Account Status',
      value: 'Active & Verified',
      strong: true
    }
  ]), [addressText, displayEmail, displayName, profile])

  const updateForm = (field, value) => {
    if (field === 'province') {
      const nextCities = ADDRESS_OPTIONS[value] || []

      setForm((prev) => ({
        ...prev,
        province: value,
        city: nextCities[0] || ''
      }))

      return
    }

    setForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const startEditing = () => {
    setForm(getInitialForm(profile))
    setMessage('')
    setEditing(true)
  }

  const cancelEditing = () => {
    setForm(getInitialForm(profile))
    setMessage('')
    setEditing(false)
  }

  const handleSave = async (event) => {
    event.preventDefault()

    if (!user?.uid) return

    setSaving(true)
    setMessage('')

    try {
      const addressDetails = {
        country: 'Philippines',
        province: form.province,
        city: form.city,
        barangay: form.barangay.trim(),
        houseNumber: form.houseNumber.trim(),
        street: form.street.trim(),
        landmark: form.landmark.trim(),
        postalCode: form.postalCode.trim(),
        deliveryNotes: form.deliveryNotes.trim()
      }

      const payload = {
        email: displayEmail,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        birthday: form.birthday,
        address: buildAddressText({ addressDetails }),
        addressDetails
      }

      const savedProfile = await updateUserProfile(user.uid, payload)

      setProfile((prev) => ({
        ...(prev || {}),
        ...savedProfile
      }))
      setEditing(false)
      setMessage('Profile updated successfully.')
    } catch (error) {
      console.log(error)
      setMessage('Unable to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="
            w-14 h-14 border-4
            border-green-600 border-t-transparent
            rounded-full animate-spin mx-auto
          " />

          <p className="mt-4 text-gray-600 font-medium">
            Loading Profile...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-5 sm:px-4 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <div className="
          bg-white rounded-2xl sm:rounded-3xl
          shadow-sm border border-gray-100
          overflow-hidden
        ">
          <div className="
            relative bg-gradient-to-r
            from-green-600 to-green-500
            px-4 py-6 sm:px-8 sm:py-10
          ">
            <div className="
              absolute inset-0 opacity-10
              bg-[radial-gradient(circle_at_top_right,white,transparent)]
            " />

            <div className="
              relative flex flex-col
              sm:flex-row sm:items-center sm:justify-between
              gap-5
            ">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left min-w-0">
                <div className="
                  w-20 h-20 sm:w-28 sm:h-28 rounded-full
                  bg-white/20 backdrop-blur
                  border-4 border-white/30
                  flex shrink-0 items-center justify-center
                  shadow-lg
                ">
                  <User className="w-10 h-10 sm:w-14 sm:h-14 text-white" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">
                    {displayName}
                  </h1>

                  <p className="text-green-100 mt-1 break-all text-sm sm:text-base">
                    {displayEmail}
                  </p>

                  <div className="
                    mt-3 inline-flex items-center gap-2
                    bg-white/20 text-white
                    px-3 py-2 sm:px-4 rounded-full
                    text-xs sm:text-sm font-medium
                  ">
                    <BadgeCheck className="w-4 h-4" />
                    Verified Customer
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={editing ? cancelEditing : startEditing}
                className="
                  w-full sm:w-auto flex items-center justify-center gap-2
                  bg-white text-green-700
                  px-5 py-3 rounded-xl
                  font-semibold hover:bg-gray-100
                  transition
                "
              >
                {editing ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {message && (
              <div className="
                mb-5 rounded-xl border border-green-100
                bg-green-50 px-4 py-3 text-sm font-medium text-green-700
              ">
                {message}
              </div>
            )}

            {editing && (
              <form
                onSubmit={handleSave}
                className="
                  mb-6 rounded-2xl border border-green-100
                  bg-green-50/50 p-4 sm:p-5
                "
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Full Name
                    </span>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(event) => updateForm('fullName', event.target.value)}
                      placeholder="Enter full name"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
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
                      placeholder="09XXXXXXXXX"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Birthday
                    </span>
                    <input
                      type="date"
                      value={form.birthday}
                      onChange={(event) => updateForm('birthday', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
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
                      placeholder="Barangay"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
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
                      placeholder="House no., lot, block, unit"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
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
                      placeholder="Street, subdivision, village"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
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
                      placeholder="Postal code"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
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
                      placeholder="Near church, school, store, etc."
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Delivery Notes
                    </span>
                    <input
                      type="text"
                      value={form.deliveryNotes}
                      onChange={(event) => updateForm('deliveryNotes', event.target.value)}
                      placeholder="Gate color, best delivery time, special instructions"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="
                      w-full sm:w-auto flex items-center justify-center gap-2
                      rounded-xl border border-gray-200 bg-white
                      px-5 py-3 font-semibold text-gray-700
                      hover:bg-gray-50 transition
                    "
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="
                      w-full sm:w-auto flex items-center justify-center gap-2
                      rounded-xl bg-green-600 px-5 py-3
                      font-semibold text-white hover:bg-green-700
                      disabled:cursor-not-allowed disabled:opacity-70
                      transition
                    "
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {profileFields.map((field) => {
                const Icon = field.icon

                return (
                  <div
                    key={field.label}
                    className="border border-gray-200 rounded-2xl p-4 sm:p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-5 h-5 text-green-600 shrink-0" />
                      <h2 className="font-semibold text-gray-900">
                        {field.label}
                      </h2>
                    </div>

                    <p className={`
                      text-base sm:text-lg
                      ${field.strong ? 'text-green-600 font-semibold' : 'text-gray-600'}
                      ${field.breakText ? 'break-all' : 'break-words'}
                    `}>
                      {field.value}
                    </p>
                  </div>
                )
              })}

              {profile?.addressDetails?.landmark && (
                <div className="border border-gray-200 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Landmark className="w-5 h-5 text-green-600 shrink-0" />
                    <h2 className="font-semibold text-gray-900">
                      Landmark
                    </h2>
                  </div>

                  <p className="text-base sm:text-lg text-gray-600 break-words">
                    {profile.addressDetails.landmark}
                  </p>
                </div>
              )}

              {profile?.addressDetails?.deliveryNotes && (
                <div className="border border-gray-200 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Home className="w-5 h-5 text-green-600 shrink-0" />
                    <h2 className="font-semibold text-gray-900">
                      Delivery Notes
                    </h2>
                  </div>

                  <p className="text-base sm:text-lg text-gray-600 break-words">
                    {profile.addressDetails.deliveryNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
