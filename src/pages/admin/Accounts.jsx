import React, { useEffect, useMemo, useState } from 'react'

import {
  collection,
  onSnapshot,
  orderBy,
  query
} from 'firebase/firestore'

import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  User,
  Users,
  X
} from 'lucide-react'

import { db } from '../../firebase/config'

const formatDate = (value) => {
  const date =
    value?.toDate?.() ||
    (value instanceof Date ? value : null)

  if (!date) return 'No date'

  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getFullName = (account) => {
  const name =
    account.fullName ||
    [account.firstName, account.lastName].filter(Boolean).join(' ')

  return name || 'No name added'
}

const getAddress = (account) => {
  if (account.addressDetails) {
    const details = account.addressDetails

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

  return account.address || ''
}

const getProfileStatus = (account) => {
  const hasName = Boolean(getFullName(account) !== 'No name added')
  const hasPhone = Boolean(account.phone)
  const hasAddress = Boolean(getAddress(account))
  const hasBirthday = Boolean(account.birthday)

  const completed = [
    hasName,
    hasPhone,
    hasAddress,
    hasBirthday
  ].filter(Boolean).length

  return {
    completed,
    total: 4,
    complete: completed === 4,
    percent: Math.round((completed / 4) * 100)
  }
}

const roleStyles = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  customer: 'bg-green-100 text-green-700 border-green-200'
}

const Accounts = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [profileFilter, setProfileFilter] = useState('all')
  const [selectedAccount, setSelectedAccount] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setUsers(usersData)
      setLoading(false)
    }, (error) => {
      console.log(error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const stats = useMemo(() => {
    const customers =
      users.filter(user => user.role !== 'admin').length

    const admins =
      users.filter(user => user.role === 'admin').length

    const completeProfiles =
      users.filter(user => getProfileStatus(user).complete).length

    const missingDetails =
      users.length - completeProfiles

    return {
      total: users.length,
      customers,
      admins,
      completeProfiles,
      missingDetails
    }
  }, [users])

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return users.filter((account) => {
      const profile = getProfileStatus(account)
      const role = account.role || 'customer'

      const matchesRole =
        roleFilter === 'all' ||
        role === roleFilter

      const matchesProfile =
        profileFilter === 'all' ||
        (profileFilter === 'complete' && profile.complete) ||
        (profileFilter === 'incomplete' && !profile.complete)

      const matchesSearch =
        !keyword ||
        getFullName(account).toLowerCase().includes(keyword) ||
        account.email?.toLowerCase().includes(keyword) ||
        account.phone?.toLowerCase().includes(keyword) ||
        getAddress(account).toLowerCase().includes(keyword)

      return matchesRole && matchesProfile && matchesSearch
    })
  }, [profileFilter, roleFilter, search, users])

  const selectedProfile =
    selectedAccount ? getProfileStatus(selectedAccount) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            User Accounts
          </h1>

          <p className="text-gray-500 mt-1">
            View registered ecommerce customers and profile completion.
          </p>
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone, address"
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 outline-none focus:border-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                Total Accounts
              </p>
              <h2 className="text-3xl font-bold text-gray-900 mt-1">
                {stats.total}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                Customers
              </p>
              <h2 className="text-3xl font-bold text-gray-900 mt-1">
                {stats.customers}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                Complete Profiles
              </p>
              <h2 className="text-3xl font-bold text-gray-900 mt-1">
                {stats.completeProfiles}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                Need Details
              </p>
              <h2 className="text-3xl font-bold text-gray-900 mt-1">
                {stats.missingDetails}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {['all', 'customer', 'admin'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`
                  rounded-xl px-4 py-2 text-sm font-semibold capitalize transition
                  ${roleFilter === role
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                `}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ['all', 'All Profiles'],
              ['complete', 'Complete'],
              ['incomplete', 'Need Details']
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setProfileFilter(value)}
                className={`
                  rounded-xl px-4 py-2 text-sm font-semibold transition
                  ${profileFilter === value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="hidden xl:block overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Profile
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Joined
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-10 text-gray-500"
                  >
                    Loading accounts...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((account) => {
                  const profile = getProfileStatus(account)
                  const role = account.role || 'customer'

                  return (
                    <tr
                      key={account.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-green-700" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {getFullName(account)}
                            </p>
                            <span
                              className={`
                                inline-flex mt-1 rounded-full border px-2 py-0.5
                                text-xs font-semibold capitalize
                                ${roleStyles[role] || roleStyles.customer}
                              `}
                            >
                              {role}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        <p className="font-medium text-gray-900 break-all">
                          {account.email || 'No email'}
                        </p>
                        <p className="text-sm mt-1">
                          {account.phone || 'No phone'}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-gray-600 max-w-xs">
                        <p className="line-clamp-2">
                          {getAddress(account) || 'No address added'}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-40">
                          <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                            <span>
                              {profile.completed}/{profile.total} details
                            </span>
                            <span>
                              {profile.percent}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-600"
                              style={{ width: `${profile.percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(account.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedAccount(account)}
                          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-10 text-gray-500"
                  >
                    No accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="xl:hidden p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading accounts...
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((account) => {
              const profile = getProfileStatus(account)
              const role = account.role || 'customer'

              return (
                <div
                  key={account.id}
                  className="rounded-2xl border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-green-100 flex shrink-0 items-center justify-center">
                        <User className="w-5 h-5 text-green-700" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="font-bold text-gray-900 break-words">
                          {getFullName(account)}
                        </h2>
                        <p className="text-sm text-gray-500 break-all">
                          {account.email || 'No email'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`
                        rounded-full border px-2 py-1 text-xs font-semibold capitalize
                        ${roleStyles[role] || roleStyles.customer}
                      `}
                    >
                      {role}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      {account.phone || 'No phone'}
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="break-words">
                        {getAddress(account) || 'No address added'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                      <span>
                        Profile completion
                      </span>
                      <span>
                        {profile.percent}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-600"
                        style={{ width: `${profile.percent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedAccount(account)}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              No accounts found
            </div>
          )}
        </div>
      </div>

      {selectedAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Account Details
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedAccount.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="rounded-2xl bg-green-50 border border-green-100 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {getFullName(selectedAccount)}
                      </h3>
                      <p className="text-gray-600 break-all">
                        {selectedAccount.email || 'No email'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`
                      rounded-full border px-4 py-2 text-sm font-bold capitalize
                      ${roleStyles[selectedAccount.role || 'customer'] || roleStyles.customer}
                    `}
                  >
                    {selectedAccount.role || 'customer'}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-sm font-semibold text-gray-600 mb-2">
                    <span>
                      Profile completion
                    </span>
                    <span>
                      {selectedProfile?.completed}/{selectedProfile?.total} details
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-white overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-600"
                      style={{ width: `${selectedProfile?.percent || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <DetailItem
                  icon={Mail}
                  label="Email Address"
                  value={selectedAccount.email || 'No email'}
                />

                <DetailItem
                  icon={Phone}
                  label="Phone Number"
                  value={selectedAccount.phone || 'No phone'}
                />

                <DetailItem
                  icon={Calendar}
                  label="Birthday"
                  value={selectedAccount.birthday || 'No birthday'}
                />

                <DetailItem
                  icon={Clock}
                  label="Date Registered"
                  value={formatDate(selectedAccount.createdAt)}
                />

                <DetailItem
                  icon={ShieldCheck}
                  label="Account Role"
                  value={selectedAccount.role || 'customer'}
                />

                <DetailItem
                  icon={CheckCircle2}
                  label="Profile Status"
                  value={
                    selectedProfile?.complete
                      ? 'Complete'
                      : 'Needs more details'
                  }
                />
              </div>

              <div className="rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-gray-900">
                    Delivery Address
                  </h3>
                </div>

                <p className="text-gray-600 leading-relaxed">
                  {getAddress(selectedAccount) || 'No address added'}
                </p>

                {selectedAccount.addressDetails?.landmark && (
                  <p className="text-sm text-gray-500 mt-3">
                    Landmark: {selectedAccount.addressDetails.landmark}
                  </p>
                )}

                {selectedAccount.addressDetails?.deliveryNotes && (
                  <p className="text-sm text-gray-500 mt-2">
                    Delivery Notes: {selectedAccount.addressDetails.deliveryNotes}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-gray-100 p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-5 h-5 text-green-600" />
      <p className="font-semibold text-gray-900">
        {label}
      </p>
    </div>
    <p className="text-gray-600 break-words">
      {value}
    </p>
  </div>
)

export default Accounts
