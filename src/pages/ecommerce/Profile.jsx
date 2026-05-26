import React, { useEffect, useState } from 'react'

import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  BadgeCheck,
  Pencil
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import {
  getUserByEmail,
  getUserProfile
} from "../../firebase/services";

const Profile = () => {

  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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

          return

        }

        setProfile(data)

      } catch (error) {

        console.log(error)

      } finally {

        setLoading(false)

      }

    }

    fetchProfile()

  }, [user])

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

  const authEmail = user?.email || ''
  const profileEmail = profile?.email || ''
  const displayEmail = authEmail || profileEmail || 'No Email'

  return (

    <div className="min-h-screen bg-gray-50 py-10 px-4">

      <div className="max-w-5xl mx-auto">

        <div className="
          bg-white rounded-3xl
          shadow-sm border border-gray-100
          overflow-hidden
        ">

          {/* HEADER */}

          <div className="
            relative
            bg-gradient-to-r
            from-green-600
            to-green-500
            px-8 py-10
          ">

            <div className="
              absolute inset-0 opacity-10
              bg-[radial-gradient(circle_at_top_right,white,transparent)]
            " />

            <div className="
              relative
              flex flex-col md:flex-row
              md:items-center
              md:justify-between
              gap-6
            ">

              {/* LEFT */}

              <div className="flex items-center gap-5">

                <div className="
                  w-28 h-28 rounded-full
                  bg-white/20 backdrop-blur
                  border-4 border-white/30
                  flex items-center justify-center
                  shadow-lg
                ">

                  <User className="w-14 h-14 text-white" />

                </div>

                <div>

                  <h1 className="text-3xl font-bold text-white">
                    {displayEmail}
                  </h1>

                  <p className="text-green-100 mt-1 break-all">
                    {displayEmail}
                  </p>

                  <div className="
                    mt-3 inline-flex items-center gap-2
                    bg-white/20 text-white
                    px-4 py-2 rounded-full
                    text-sm font-medium
                  ">

                    <BadgeCheck className="w-4 h-4" />

                    Verified Customer

                  </div>

                </div>

              </div>

              {/* BUTTON */}

              <button
                className="
                  flex items-center justify-center gap-2
                  bg-white text-green-700
                  px-5 py-3 rounded-2xl
                  font-semibold
                  hover:bg-gray-100
                  transition
                "
              >

                <Pencil className="w-4 h-4" />

                Edit Profile

              </button>

            </div>

          </div>

          {/* BODY */}

          <div className="p-8">

            <div className="
              grid grid-cols-1
              md:grid-cols-2
              gap-6
            ">

              {/* FULL NAME */}

              <div className="
                border border-gray-200
                rounded-2xl p-5
              ">

                <div className="flex items-center gap-3 mb-3">

                  <User className="w-5 h-5 text-green-600" />

                  <h2 className="font-semibold text-gray-900">
                    Full Name
                  </h2>

                </div>

                <p className="text-gray-600 text-lg">
                  {profile?.fullName || 'No name added'}
                </p>

              </div>

              {/* EMAIL */}

              <div className="
                border border-gray-200
                rounded-2xl p-5
              ">

                <div className="flex items-center gap-3 mb-3">

                  <Mail className="w-5 h-5 text-green-600" />

                  <h2 className="font-semibold text-gray-900">
                    Email Address
                  </h2>

                </div>

                <p className="text-gray-600 text-lg break-all">
                  {displayEmail}
                </p>

              </div>

              {/* PHONE */}

              <div className="
                border border-gray-200
                rounded-2xl p-5
              ">

                <div className="flex items-center gap-3 mb-3">

                  <Phone className="w-5 h-5 text-green-600" />

                  <h2 className="font-semibold text-gray-900">
                    Phone Number
                  </h2>

                </div>

                <p className="text-gray-600 text-lg">
                  {profile?.phone || 'No phone number'}
                </p>

              </div>

              {/* ADDRESS */}

              <div className="
                border border-gray-200
                rounded-2xl p-5
              ">

                <div className="flex items-center gap-3 mb-3">

                  <MapPin className="w-5 h-5 text-green-600" />

                  <h2 className="font-semibold text-gray-900">
                    Address
                  </h2>

                </div>

                <p className="text-gray-600 text-lg">
                  {profile?.address || 'No address added'}
                </p>

              </div>

              {/* BIRTHDAY */}

              <div className="
                border border-gray-200
                rounded-2xl p-5
              ">

                <div className="flex items-center gap-3 mb-3">

                  <Calendar className="w-5 h-5 text-green-600" />

                  <h2 className="font-semibold text-gray-900">
                    Birthday
                  </h2>

                </div>

                <p className="text-gray-600 text-lg">
                  {profile?.birthday || 'No birthday added'}
                </p>

              </div>

              {/* ACCOUNT STATUS */}

              <div className="
                border border-gray-200
                rounded-2xl p-5
              ">

                <div className="flex items-center gap-3 mb-3">

                  <ShieldCheck className="w-5 h-5 text-green-600" />

                  <h2 className="font-semibold text-gray-900">
                    Account Status
                  </h2>

                </div>

                <p className="text-green-600 text-lg font-semibold">
                  Active & Verified
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  )

}

export default Profile
