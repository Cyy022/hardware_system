import React, { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { 
  Store, 
  Home, 
  Grid3X3, 
  Package, 
  Info, 
  Menu, 
  X,
  ShoppingCart,
  Search,
  Accessibility
} from 'lucide-react'
import { useAccessibility } from "../context/AccessibilityContext";
import AccessibilityPanel from "../components/common/AccessibilityPanel";

const EcommerceLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)
  const { speak } = useAccessibility()

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/categories', label: 'Categories', icon: Grid3X3 },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/about', label: 'About', icon: Info },
  ]

  const handleNavClick = (label) => {
    speak(`Navigating to ${label}`)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-gray-900 leading-tight">Batang Gapan</h1>
                <p className="text-xs text-gray-500 -mt-0.5">Mini Hardware</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => handleNavClick(item.label)}
                  className={({ isActive }) => 
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAccessibilityOpen(!accessibilityOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                aria-label="Accessibility options"
              >
                <Accessibility className="w-5 h-5" />
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => handleNavClick(item.label)}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold">Batang Gapan Mini Hardware</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Your trusted partner for all hardware needs. Quality products, competitive prices, excellent service.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/products" className="hover:text-white transition-colors">Products</Link></li>
                <li><Link to="/categories" className="hover:text-white transition-colors">Categories</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Batang Gapan, Nueva Ecija</li>
                <li>Philippines</li>
                <li>Email: cyruscabanes@gmail.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            © 2024 Batang Gapan Mini Hardware. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Accessibility Panel */}
      <AccessibilityPanel 
        isOpen={accessibilityOpen} 
        onClose={() => setAccessibilityOpen(false)} 
      />
    </div>
  )
}

export default EcommerceLayout
