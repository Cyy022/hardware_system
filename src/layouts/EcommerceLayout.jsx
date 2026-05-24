import React, { useState } from 'react'
import logo from '../assets/BGMH.png'

import {
  Link,
  NavLink,
  Outlet
} from 'react-router-dom'

import {
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
  ShoppingCart
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { useAccessibility } from '../context/AccessibilityContext'

import AccessibilityPanel from '../components/common/AccessibilityPanel'

const EcommerceLayout = () => {

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)

  const { speak } = useAccessibility()

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
    }
  ]

  const handleNavClick = (label) => {

    speak(`Navigating to ${label}`)

    setMobileMenuOpen(false)

  }

  const handleLogout = async () => {

    try {

      await logout()

    } catch (error) {

      console.log(error)

    }

  }

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

              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">

                <img
                  src={logo}
                  alt="Batang Gapan Mini Hardware"
                  className="w-full h-full object-cover"
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

              {/* Cart */}

              <button
                className="p-2 rounded-xl hover:bg-gray-100 transition"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
              </button>

              {/* Accessibility */}

              <button
                onClick={() =>
                  setAccessibilityOpen(!accessibilityOpen)
                }
                className="p-2 rounded-xl hover:bg-gray-100 transition"
              >
                <Accessibility className="w-5 h-5 text-gray-700" />
              </button>

              {/* User */}

              {user ? (

                <div className="hidden sm:flex items-center gap-3 ml-2">

                  <div className="text-right">

                    <p className="text-sm font-semibold text-gray-900">
                      Welcome
                    </p>

                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>

                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>

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

              {/* Mobile Menu Button */}

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

              {/* Mobile Auth */}

              {user ? (

                <button
                  onClick={handleLogout}
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

            {/* About */}

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

            {/* Quick Links */}

            <div>

              <h4 className="font-semibold text-lg mb-4">
                Quick Links
              </h4>

              <ul className="space-y-3 text-sm text-gray-400">

                <li>
                  <Link
                    to="/"
                    className="hover:text-white transition"
                  >
                    Home
                  </Link>
                </li>

                <li>
                  <Link
                    to="/products"
                    className="hover:text-white transition"
                  >
                    Products
                  </Link>
                </li>

                <li>
                  <Link
                    to="/categories"
                    className="hover:text-white transition"
                  >
                    Categories
                  </Link>
                </li>

                <li>
                  <Link
                    to="/about"
                    className="hover:text-white transition"
                  >
                    About Us
                  </Link>
                </li>

              </ul>

            </div>

            {/* Contact */}

            <div>

              <h4 className="font-semibold text-lg mb-4">
                Contact
              </h4>

              <ul className="space-y-3 text-sm text-gray-400">

                <li>
                  Batang Gapan, Nueva Ecija
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

          {/* Copyright */}

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