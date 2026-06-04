import React, { useEffect, useState } from 'react'
import logo from '../assets/BGMH.png'
import { ShoppingCart } from 'lucide-react'

import {
  NavLink,
  useNavigate,
  Outlet
} from 'react-router-dom'

import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Truck,
  LogOut,
  Menu,
  X,
  Accessibility,
  Users,
  BarChart3
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { useAccessibility } from '../context/AccessibilityContext'

import AccessibilityPanel from '../components/common/AccessibilityPanel'

import toast from 'react-hot-toast'

const AdminLayout = () => {

const [sidebarOpen, setSidebarOpen] = useState(false)
const [accessibilityOpen, setAccessibilityOpen] = useState(false)
const [showLogoutModal, setShowLogoutModal] = useState(false)

  const { logout, user } = useAuth()

  const { speak, registerVoiceCommands } = useAccessibility()

  const navigate = useNavigate()

  // ================= MENU =================

  const menuItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      path: '/admin/inventory',
      label: 'Inventory',
      icon: Package
    },
    {
      path: '/admin/stock-in',
      label: 'Stock In',
      icon: ArrowDownLeft
    },
    {
      path: '/admin/stock-out',
      label: 'Stock Out',
      icon: ArrowUpRight
    },
    {
      path: '/admin/sales-reports',
      label: 'Sales Reports',
      icon: FileText
    },
    {
      path: '/admin/analytics',
      label: 'Analytics',
      icon: BarChart3
    },
    {
      path: '/admin/suppliers',
      label: 'Suppliers',
      icon: Truck
    },
    {
      path: '/admin/accounts',
      label: 'Accounts',
      icon: Users
    },
    {
  path: '/admin/orders',
  label: 'Orders',
  icon: ShoppingCart
    }
  ]

  // ================= LOGOUT =================

const handleLogout = async () => {

  try {

    await logout()

    setShowLogoutModal(false)

    navigate('/admin/login')

    speak('Logged out successfully')

  } catch (error) {

    toast.error('Failed to logout')

    speak('Logout failed')

  }

}

  // ================= NAVIGATION =================

  const handleNavClick = (label) => {

    speak(`Navigating to ${label}`)

    setSidebarOpen(false)

  }

  useEffect(() => {
    const routeCommands = menuItems.flatMap((item) => {
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
            setSidebarOpen(false)
            setAccessibilityOpen(false)
          },
          feedback: `Opening ${item.label}`
        }
      ]
    })

    registerVoiceCommands([
      ...routeCommands,
      {
        phrases: ['open menu', 'show menu', 'open sidebar'],
        action: () => setSidebarOpen(true),
        feedback: 'Opening menu'
      },
      {
        phrases: ['close menu', 'hide menu', 'close sidebar'],
        action: () => setSidebarOpen(false),
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

    <div className="min-h-screen bg-gray-50 flex">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-white shadow-xl
          transform transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >

        {/* LOGO */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">

          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-full overflow-hidden">

              <img
                src={logo}
                alt="Batang Gapan Logo"
                className="w-full h-full object-cover"
              />

            </div>

            <div>

              <h1 className="text-lg font-bold text-gray-900">
                Batang Gapan
              </h1>

              <p className="text-xs text-gray-500">
                Mini Hardware
              </p>

            </div>

          </div>

          {/* CLOSE BUTTON */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >

            <X className="w-5 h-5 text-gray-600" />

          </button>

        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">

          {menuItems.map((item) => (

            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => handleNavClick(item.label)}
              className={({ isActive }) =>
                `
                  flex items-center gap-3
                  px-4 py-3 rounded-xl
                  transition-all duration-200
                  font-medium
                  ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                  }
                `
              }
            >

              <item.icon className="w-5 h-5" />

              <span>{item.label}</span>

            </NavLink>

          ))}

        </nav>

        {/* BOTTOM ACTIONS */}
        <div className="px-4 py-4 border-t border-gray-100 space-y-2">

          {/* ACCESSIBILITY */}
          <button
            onClick={() => setAccessibilityOpen(!accessibilityOpen)}
            className="
              w-full flex items-center gap-3
              px-4 py-3 rounded-xl
              text-gray-600
              hover:bg-primary-50
              hover:text-primary-700
              transition-all
            "
          >

            <Accessibility className="w-5 h-5" />

            <span className="font-medium">
              Accessibility
            </span>

          </button>

          {/* LOGOUT */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="
              w-full flex items-center gap-3
              px-4 py-3 rounded-xl
              text-red-600
              hover:bg-red-50
              transition-all
            "
          >

            <LogOut className="w-5 h-5" />

            <span className="font-medium">
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="bg-white shadow-sm border-b border-gray-100 px-4 lg:px-8 py-4">

          <div className="flex items-center justify-between">

            {/* MOBILE MENU */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >

              <Menu className="w-6 h-6 text-gray-600" />

            </button>

            {/* USER INFO */}
            <div className="flex items-center gap-4 ml-auto">

              <div className="hidden sm:block text-right">

                <p className="text-sm font-medium text-gray-900">
                  Admin
                </p>

                <p className="text-xs text-gray-500">
                  {user?.email}
                </p>

              </div>

              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">

                <span className="text-primary-700 font-semibold">
                  A
                </span>

              </div>

            </div>

          </div>

        </header>

{/* ================= LOGOUT MODAL ================= */}

{showLogoutModal && (

  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">

    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-fade-in">

      {/* Icon */}

      <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">

        <LogOut className="w-8 h-8 text-red-600" />

      </div>

      {/* Title */}

      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">

        Logout Admin

      </h2>

      {/* Message */}

      <p className="text-gray-500 text-center mb-6">

        Are you sure you want to logout this admin account?

      </p>

      {/* Buttons */}

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

        {/* PAGE */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">

          <Outlet />

        </main>

      </div>

      {/* ACCESSIBILITY PANEL */}
      <AccessibilityPanel
        isOpen={accessibilityOpen}
        onClose={() => setAccessibilityOpen(false)}
      />

    </div>

  )

}

export default AdminLayout
