import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import EcommerceLayout from './layouts/EcommerceLayout'
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import Inventory from './pages/admin/Inventory'
import StockIn from './pages/admin/StockIn'
import StockOut from './pages/admin/StockOut'
import SalesReports from './pages/admin/SalesReports'
import Suppliers from './pages/admin/Suppliers'
import Home from './pages/ecommerce/Home'
import Categories from './pages/ecommerce/Categories'
import Products from './pages/ecommerce/Products'
import About from './pages/ecommerce/About'
import SignIn from './pages/ecommerce/SignIn'
import SignUp from './pages/ecommerce/SignUp'

function App() {
  return (
    <Routes>
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/stock-in" element={<StockIn />} />
          <Route path="/admin/stock-out" element={<StockOut />} />
          <Route path="/admin/sales-reports" element={<SalesReports />} />
          <Route path="/admin/suppliers" element={<Suppliers />} />
        </Route>
      </Route>

      {/* E-commerce Routes */}
      <Route element={<EcommerceLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/products" element={<Products />} />
        <Route path="/about" element={<About />} />
      </Route>

            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

      {/* Redirect root admin to login */}
      <Route path="/admin" element={<AdminLogin />} />
    </Routes>

    
  )
}

export default App
