import React, { useState } from 'react'
import logo from '../assets/BGMH.png'

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
  Users
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { useAccessibility } from '../context/AccessibilityContext'

import AccessibilityPanel from '../components/common/AccessibilityPanel'

import toast from 'react-hot-toast'

const AdminLayout = () => {

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)

  const { logout, user } = useAuth()

  const { speak } = useAccessibility()

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
      path: '/admin/suppliers',
      label: 'Suppliers',
      icon: Truck
    },
    {
      path: '/admin/accounts',
      label: 'Accounts',
      icon: Users
    }
  ]

  // ================= LOGOUT =================

  const handleLogout = async () => {

    try {

      await logout()

      navigate('/admin/login')

    } catch (error) {

      console.error(error)

      toast.error('Failed to logout')

    }

  }

  // ================= NAVIGATION =================

  const handleNavClick = (label) => {

    speak(`Navigating to ${label}`)

    setSidebarOpen(false)

  }

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
            onClick={handleLogout}
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