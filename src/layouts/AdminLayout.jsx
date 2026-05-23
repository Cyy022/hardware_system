import React, { useState } from 'react'
import logo from '../assets/BGMH.png'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
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
  Accessibility
} from 'lucide-react'
import { useAuth } from "../context/AuthContext";
import { useAccessibility } from "../context/AccessibilityContext";
import AccessibilityPanel from "../components/common/AccessibilityPanel";
import toast from 'react-hot-toast'

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)
  const { logout } = useAuth()
  const { speak } = useAccessibility()
  const navigate = useNavigate()

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/inventory', label: 'Inventory', icon: Package },
    { path: '/admin/stock-in', label: 'Stock In', icon: ArrowDownLeft },
    { path: '/admin/stock-out', label: 'Stock Out', icon: ArrowUpRight },
    { path: '/admin/sales-reports', label: 'Sales Reports', icon: FileText },
    { path: '/admin/suppliers', label: 'Suppliers', icon: Truck },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/admin/login')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const handleNavClick = (label) => {
    speak(`Navigating to ${label}`)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Logo */}     
        <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden">
            <img
              src={logo}
              alt="Batang Gapan Logo"
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              Batang Gapan
            </h1>
            <p className="text-xs text-gray-500">
              Mini Hardware
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => handleNavClick(item.label)}
              className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              aria-label={item.label}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="px-4 py-4 border-t border-gray-100 space-y-2">
          <button
            onClick={() => setAccessibilityOpen(!accessibilityOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-all"
            aria-label="Accessibility options"
          >
            <Accessibility className="w-5 h-5" />
            <span className="font-medium">Accessibility</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-100 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">Admin</p>
                <p className="text-xs text-gray-500">cyruscabanes@gmail.com</p>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-semibold">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Accessibility Panel */}
      <AccessibilityPanel 
        isOpen={accessibilityOpen} 
        onClose={() => setAccessibilityOpen(false)} 
      />
    </div>
  )
}

export default AdminLayout
