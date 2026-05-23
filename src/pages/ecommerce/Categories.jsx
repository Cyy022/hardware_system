import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Package } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useAccessibility } from '../../context/AccessibilityContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const Categories = () => {
  const { products, categories, loading } = useProducts()
  const { speak } = useAccessibility()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-500 mt-2">Browse our wide range of hardware categories</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => {
          const categoryProducts = products.filter(p => p.category === category)
          const totalVariants = categoryProducts.reduce((sum, p) => sum + (p.variants?.length || 0), 0)

          return (
            <Link
              key={index}
              to={`/products?category=${encodeURIComponent(category)}`}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
              onMouseEnter={() => speak(`${category} category with ${categoryProducts.length} products`)}
            >
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                  <Package className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mt-4 group-hover:text-primary-600 transition-colors">
                {category}
              </h3>

              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>{categoryProducts.length} products</span>
                <span>•</span>
                <span>{totalVariants} variants</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default Categories
