import React, { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { Users } from 'lucide-react'

const Accounts = () => {

  const [users, setUsers] = useState([])

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

    })

    return () => unsubscribe()

  }, [])

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          User Accounts
        </h1>

        <p className="text-gray-500 mt-1">
          List of registered ecommerce users
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full md:w-80">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">
              Total Users
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-1">
              {users.length}
            </h2>
          </div>

          <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
            <Users className="w-7 h-7 text-primary-700" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-gray-50 border-b border-gray-100">

              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Email
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Phone
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Address
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Role
                </th>
              </tr>

            </thead>

            <tbody>

              {users.length > 0 ? (

                users.map((user) => (

                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >

                    <td className="px-6 py-4">
                      {user.firstName} {user.lastName}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {user.email}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {user.phone || 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {user.address || 'N/A'}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                        {user.role}
                      </span>
                    </td>

                  </tr>

                ))

              ) : (

                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-10 text-gray-500"
                  >
                    No users found
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}

export default Accounts