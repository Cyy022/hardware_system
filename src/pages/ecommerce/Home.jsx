import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  Star, 
  Truck, 
  Shield, 
  Headphones, 
  ChevronLeft, 
  ChevronRight,
  Package
} from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useAccessibility } from '../../context/AccessibilityContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const Home = () => {
  const { products, loading } = useProducts()
  const { speak } = useAccessibility()
  const [currentBanner, setCurrentBanner] = useState(0)

  const banners = [
    {
      title: 'Quality Hardware Supplies',
      subtitle: 'Your trusted partner for all construction and home improvement needs',
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&h=400&fit=crop',
      cta: 'Shop Now'
    },
    {
      title: 'Professional Tools',
      subtitle: 'High-quality tools for professionals and DIY enthusiasts',
      image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1200&h=400&fit=crop',
      cta: 'View Tools'
    },
    {
      title: 'Electrical Supplies',
      subtitle: 'Complete range of electrical products at competitive prices',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&h=400&fit=crop',
      cta: 'Explore'
    }
  ]

  // Auto-rotate banners
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Get featured products (products with most variants)
  const featuredProducts = [...products]
    .sort((a, b) => (b.variants?.length || 0) - (a.variants?.length || 0))
    .slice(0, 6)

  const categories = [...new Set(products.map(p => p.category))].filter(Boolean)

  const features = [
    { icon: Truck, title: 'Fast Delivery', desc: 'Quick delivery to your location' },
    { icon: Shield, title: 'Quality Guaranteed', desc: 'Only genuine products' },
    { icon: Headphones, title: 'Expert Support', desc: 'Professional advice available' },
    { icon: Star, title: 'Best Prices', desc: 'Competitive pricing always' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Banner */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        {banners.map((banner, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentBanner ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40 z-10" />
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-xl">
                  <h1 
                    className="text-4xl md:text-5xl font-bold text-white mb-4"
                    onMouseEnter={() => speak(banner.title)}
                  >
                    {banner.title}
                  </h1>
                  <p className="text-lg text-gray-200 mb-8">{banner.subtitle}</p>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-xl transition-all hover:shadow-lg"
                  >
                    {banner.cta}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Banner Navigation */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentBanner ? 'bg-white w-8' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                onMouseEnter={() => speak(`${feature.title}: ${feature.desc}`)}
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <Link to="/categories" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((category, index) => (
              <Link
                key={index}
                to={`/products?category=${encodeURIComponent(category)}`}
                className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all text-center"
                onMouseEnter={() => speak(category)}
              >
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-600 transition-colors">
                  <Star className="w-8 h-8 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {category}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {products.filter(p => p.category === category).length} products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map(product => (
              <div 
                key={product.id} 
                className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
                onMouseEnter={() => speak(product.name)}
              >
                <div className="h-48 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                  <Package className="w-16 h-16 text-primary-300" />
                </div>
                <div className="p-5">
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                    {product.category}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-2 group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {product.variants?.length || 0} variants available
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary-700">
                      from ₱{Math.min(...(product.variants?.map(v => v.price) || [0]))?.toLocaleString()}
                    </span>
                    <Link
                      to={`/products?product=${product.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Need Help Finding the Right Product?
          </h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Our team of experts is ready to assist you with your hardware needs. 
            Contact us for professional advice and recommendations.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 transition-all"
          >
            Contact Us
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
