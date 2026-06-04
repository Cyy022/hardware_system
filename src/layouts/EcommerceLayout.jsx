import React, { useEffect, useState } from 'react'
import logo from '../assets/BGMH.png'

import {
  ShoppingBag,
  Store,
  Home,
  Grid3X3,
  Package,
  Info,
  Menu,
  X,
  Accessibility,
  User,
  LogOut,
  ShoppingCart,
  ChevronDown,
  Settings,
  Package2
} from 'lucide-react'

import {
  Link,
  NavLink,
  Outlet,
  useNavigate
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useAccessibility } from '../context/AccessibilityContext'

import AccessibilityPanel from '../components/common/AccessibilityPanel'

const EcommerceLayout = () => {

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const { speak, registerVoiceCommands } = useAccessibility()
  const navigate = useNavigate()

  const {
    user,
    logout
  } = useAuth()

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: Home
    },
    {
      path: '/categories',
      label: 'Categories',
      icon: Grid3X3
    },
    {
      path: '/products',
      label: 'Products',
      icon: Package
    },
    {
      path: '/about',
      label: 'About',
      icon: Info
    },
  ]

  const handleNavClick = (label) => {

    speak(`Navigating to ${label}`)

    setMobileMenuOpen(false)

  }

  const handleLogout = async () => {

    try {

      localStorage.removeItem('cart')

      await logout()

      setShowLogoutModal(false)

      speak('Logged out successfully')

    } catch (error) {

      console.log(error)

      speak('Logout failed')

    }

  }

  useEffect(() => {
    const routeItems = [
      ...navItems,
      {
        path: '/cart',
        label: 'Cart'
      },
      {
        path: '/checkout',
        label: 'Checkout'
      },
      {
        path: '/profile',
        label: 'Profile'
      },
      {
        path: '/my-orders',
        label: 'My Orders'
      },
      {
        path: '/signin',
        label: 'Sign In'
      }
    ]

    const routeCommands = routeItems.flatMap((item) => {
      const label = item.label.toLowerCase()

      return [
        {
          phrases: [
            label,
            `go to ${label}`,
            `open ${label}`,
            `navigate to ${label}`
          ],
          action: () => {
            navigate(item.path)
            setMobileMenuOpen(false)
            setAccessibilityOpen(false)
            setProfileOpen(false)
          },
          feedback: `Opening ${item.label}`
        }
      ]
    })

    registerVoiceCommands([
      ...routeCommands,
      {
        phrases: ['open menu', 'show menu'],
        action: () => setMobileMenuOpen(true),
        feedback: 'Opening menu'
      },
      {
        phrases: ['close menu', 'hide menu'],
        action: () => setMobileMenuOpen(false),
        feedback: 'Closing menu'
      },
      {
        phrases: ['open accessibility', 'show accessibility', 'accessibility'],
        action: () => setAccessibilityOpen(true),
        feedback: 'Opening accessibility panel'
      },
      {
        phrases: ['close accessibility', 'hide accessibility'],
        action: () => setAccessibilityOpen(false),
        feedback: 'Closing accessibility panel'
      },
      {
        phrases: ['open account', 'open profile menu', 'show account'],
        action: () => setProfileOpen(true),
        feedback: 'Opening account menu'
      },
      {
        phrases: ['close account', 'close profile menu', 'hide account'],
        action: () => setProfileOpen(false),
        feedback: 'Closing account menu'
      },
      {
        phrases: ['logout', 'log out', 'sign out'],
        action: () => setShowLogoutModal(true),
        feedback: 'Opening logout confirmation'
      },
      {
        phrases: ['cancel logout', 'close logout'],
        action: () => setShowLogoutModal(false),
        feedback: 'Logout cancelled'
      }
    ])

    return () => registerVoiceCommands([])
  }, [navigate, registerVoiceCommands])

  return (

    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ================= NAVIGATION ================= */}

      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between h-16">

            {/* ================= LOGO ================= */}

            <Link
              to="/"
              className="flex items-center gap-3"
            >

              <div className="w-11 h-11 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-gray-200 shadow-sm">

                <img
                  src={logo}
                  alt="Batang Gapan Mini Hardware Logo"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    e.target.src = '/fallback-logo.png'
                  }}
                />

              </div>

              <div className="hidden sm:block">

                <h1 className="text-base font-bold text-gray-900 leading-tight">
                  Batang Gapan
                </h1>

                <p className="text-xs text-gray-500">
                  Mini Hardware
                </p>

              </div>

            </Link>

            {/* ================= DESKTOP NAVIGATION ================= */}

            <div className="hidden md:flex items-center gap-2">

              {navItems.map((item) => (

                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => handleNavClick(item.label)}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>

              ))}

            </div>

            {/* ================= RIGHT ACTIONS ================= */}

            <div className="flex items-center gap-2">

              {/* ================= CART ================= */}

              <Link
                to="/cart"
                onClick={() => speak('Opening cart')}
                className="
                  p-2 rounded-xl
                  hover:bg-gray-100
                  transition
                "
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
              </Link>

              {/* ================= ACCESSIBILITY ================= */}

              <button
                onClick={() =>
                  setAccessibilityOpen(!accessibilityOpen)
                }
                className="p-2 rounded-xl hover:bg-gray-100 transition"
              >
                <Accessibility className="w-5 h-5 text-gray-700" />
              </button>

            {/* ================= USER ================= */}

            {user ? (

              <div className="relative hidden sm:block">

                {/* PROFILE BUTTON */}

                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="
                    flex items-center gap-3
                    px-3 py-2 rounded-2xl
                    hover:bg-gray-100
                    transition
                  "
                >

                  {/* PROFILE ICON */}

                  <div className="
                    w-11 h-11 rounded-full
                    bg-green-100
                    flex items-center justify-center
                  ">

                    <User className="w-5 h-5 text-green-700" />

                  </div>

                  {/* USER INFO */}

                  <div className="text-left">

                    <p className="text-sm font-semibold text-gray-900">
                      Welcome
                    </p>

                    <p className="text-xs text-gray-500 max-w-[150px] truncate">
                      {user.email}
                    </p>

                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition ${
                      profileOpen ? 'rotate-180' : ''
                    }`}
                  />

                </button>

                {/* DROPDOWN */}

                {profileOpen && (

                  <div
                    className="
                      absolute right-0 mt-3
                      w-72 bg-white
                      rounded-3xl shadow-2xl
                      border border-gray-100
                      overflow-hidden
                      z-50
                    "
                  >

                    {/* TOP USER INFO */}

                    <div className="p-5 border-b border-gray-100">

                      <div className="flex items-center gap-4">

                        <div className="
                          w-14 h-14 rounded-full
                          bg-green-100
                          flex items-center justify-center
                        ">

                          <User className="w-7 h-7 text-green-700" />

                        </div>

                        <div>

                          <h3 className="font-bold text-gray-900">
                            Customer Account
                          </h3>

                          <p className="text-sm text-gray-500 break-all">
                            {user.email}
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* MENU */}

                    <div className="p-3 space-y-2">

                      {/* PROFILE */}

                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="
                          flex items-center gap-3
                          px-4 py-3 rounded-2xl
                          hover:bg-gray-100
                          transition
                        "
                      >

                        <User className="w-5 h-5 text-gray-600" />

                        <div>

                          <p className="font-medium text-gray-900">
                            Profile
                          </p>

                          <p className="text-xs text-gray-500">
                            View account information
                          </p>

                        </div>

                      </Link>

                      {/* ORDERS */}

                      <Link
                        to="/my-orders"
                        onClick={() => setProfileOpen(false)}
                        className="
                          flex items-center gap-3
                          px-4 py-3 rounded-2xl
                          hover:bg-gray-100
                          transition
                        "
                      >

                        <Package2 className="w-5 h-5 text-gray-600" />

                        <div>

                          <p className="font-medium text-gray-900">
                            My Orders
                          </p>

                          <p className="text-xs text-gray-500">
                            Track your orders
                          </p>

                        </div>

                      </Link>

                      {/* SETTINGS */}

                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="
                          flex items-center gap-3
                          px-4 py-3 rounded-2xl
                          hover:bg-gray-100
                          transition
                        "
                      >

                        <Settings className="w-5 h-5 text-gray-600" />

                        <div>

                          <p className="font-medium text-gray-900">
                            Saved Address
                          </p>

                          <p className="text-xs text-gray-500">
                            Favorites and payments
                          </p>

                        </div>

                      </Link>

                    </div>

                    {/* LOGOUT */}

                    <div className="p-3 border-t border-gray-100">

                      <button
                        onClick={() => {
                          setProfileOpen(false)
                          setShowLogoutModal(true)
                        }}
                        className="
                          w-full flex items-center gap-3
                          px-4 py-3 rounded-2xl
                          text-red-600
                          hover:bg-red-50
                          transition
                        "
                      >

                        <LogOut className="w-5 h-5" />

                        <div className="text-left">

                          <p className="font-medium">
                            Logout
                          </p>

                          <p className="text-xs text-red-400">
                            Sign out this account
                          </p>

                        </div>

                      </button>

                    </div>

                  </div>

                )}

              </div>

            ) : (

              <Link
                to="/signin"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition"
              >
                <User className="w-4 h-4" />

                Sign In
              </Link>

            )}

              {/* ================= MOBILE MENU BUTTON ================= */}

              <button
                onClick={() =>
                  setMobileMenuOpen(!mobileMenuOpen)
                }
                className="md:hidden p-2 rounded-xl hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

            </div>

          </div>

        </div>

        {/* ================= MOBILE MENU ================= */}

        {mobileMenuOpen && (

          <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in">

            <div className="px-4 py-4 space-y-2">

              {navItems.map((item) => (

                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() =>
                    handleNavClick(item.label)
                  }
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >

                  <item.icon className="w-5 h-5" />

                  {item.label}

                </NavLink>

              ))}

              {/* MOBILE CART */}

              <Link
                to="/cart"
                onClick={() => {
                  speak('Opening cart')
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition"
              >
                <ShoppingCart className="w-5 h-5" />

                Cart
              </Link>

              {/* MOBILE AUTH */}

              {user ? (

                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-5 h-5" />

                  Logout
                </button>

              ) : (

                <Link
                  to="/signin"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-600 text-white"
                >
                  <User className="w-5 h-5" />

                  Sign In
                </Link>

              )}

            </div>

          </div>

        )}

      </nav>

      {/* ================= MAIN CONTENT ================= */}

      <main className="flex-1">

        <Outlet />

      </main>

      {/* ================= FOOTER ================= */}

      <footer className="bg-[#07132A] text-white mt-16">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

            {/* ABOUT */}

            <div>

              <div className="flex items-center gap-3 mb-4">

                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">

                  <Store className="w-5 h-5 text-white" />

                </div>

                <h3 className="text-xl font-bold">
                  Batang Gapan Mini Hardware
                </h3>

              </div>

              <p className="text-gray-400 text-sm leading-relaxed">
                Your trusted partner for all hardware needs.
                Quality products, competitive prices,
                and excellent customer service.
              </p>

            </div>

            {/* QUICK LINKS */}

            <div>

              <h4 className="font-semibold text-lg mb-4">
                Quick Links
              </h4>

              <ul className="space-y-3 text-sm text-gray-400">

                <li>
                  <Link to="/" className="hover:text-white transition">
                    Home
                  </Link>
                </li>

                <li>
                  <Link to="/products" className="hover:text-white transition">
                    Products
                  </Link>
                </li>

                <li>
                  <Link to="/categories" className="hover:text-white transition">
                    Categories
                  </Link>
                </li>

                <li>
                  <Link to="/about" className="hover:text-white transition">
                    About Us
                  </Link>
                </li>

              </ul>

            </div>

            {/* CONTACT */}

            <div>

              <h4 className="font-semibold text-lg mb-4">
                Contact
              </h4>

              <ul className="space-y-3 text-sm text-gray-400">

                <li>
                  Batang Gapan, General Trias Cavite
                </li>

                <li>
                  Philippines
                </li>

                <li>
                  Email: cyruscabanes@gmail.com
                </li>

              </ul>

            </div>

          </div>

          {/* ================= LOGOUT MODAL ================= */}

          {showLogoutModal && (

            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">

              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-fade-in">

                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">

                  <LogOut className="w-8 h-8 text-red-600" />

                </div>

                <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                  Logout Account
                </h2>

                <p className="text-gray-500 text-center mb-6">
                  Do you want to log out this account?
                </p>

                <div className="flex gap-3">

                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="
                      flex-1 py-3 rounded-2xl
                      border border-gray-200
                      text-gray-700 font-semibold
                      hover:bg-gray-100
                      transition
                    "
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleLogout}
                    className="
                      flex-1 py-3 rounded-2xl
                      bg-red-600 text-white
                      font-semibold
                      hover:bg-red-700
                      transition
                    "
                  >
                    Logout
                  </button>

                </div>

              </div>

            </div>

          )}

          {/* COPYRIGHT */}

          <div className="border-t border-gray-800 mt-10 pt-8 text-center text-sm text-gray-500">

            © 2024 Batang Gapan Mini Hardware.
            All rights reserved.

          </div>

        </div>

      </footer>

      {/* ================= ACCESSIBILITY PANEL ================= */}

      <AccessibilityPanel
        isOpen={accessibilityOpen}
        onClose={() => setAccessibilityOpen(false)}
      />

    </div>

  )

}

export default EcommerceLayout
