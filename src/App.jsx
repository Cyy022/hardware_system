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
import Accounts from './pages/admin/Accounts'
import Orders from './pages/admin/Orders'

import Home from './pages/ecommerce/Home'
import Categories from './pages/ecommerce/Categories'
import Products from './pages/ecommerce/Products'
import About from './pages/ecommerce/About'
import Cart from './pages/ecommerce/Cart'
import Checkout from './pages/ecommerce/Checkout'
import SignIn from './pages/ecommerce/SignIn'
import Profile from './pages/ecommerce/Profile'
import MyOrders from './pages/ecommerce/MyOrders'

function App() {
  return (
    <Routes>

      {/* ADMIN LOGIN */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ADMIN ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>

          <Route
            path="/admin/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/admin/inventory"
            element={<Inventory />}
          />

          <Route
            path="/admin/stock-in"
            element={<StockIn />}
          />

          <Route
            path="/admin/stock-out"
            element={<StockOut />}
          />

          <Route
            path="/admin/sales-reports"
            element={<SalesReports />}
          />

          <Route
            path="/admin/suppliers"
            element={<Suppliers />}
          />

          <Route
            path="/admin/accounts"
            element={<Accounts />}
          />

          <Route
            path="/admin/orders"
            element={<Orders />}
          />

        </Route>
      </Route>

      {/* ECOMMERCE */}
      <Route element={<EcommerceLayout />}>

        <Route path="/" element={<Home />} />

        <Route
          path="/categories"
          element={<Categories />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route path="/profile" 
        element={<Profile />} />

        <Route
          path="/my-orders"
          element={<MyOrders />}
        />

      </Route>

      {/* AUTH */}
      <Route
        path="/signin"
        element={<SignIn />}
      />

      {/* ADMIN ROOT */}
      <Route
        path="/admin"
        element={<AdminLogin />}
      />

    </Routes>
  )
}

export default App
