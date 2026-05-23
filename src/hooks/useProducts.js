import { useState, useEffect } from 'react'
import { subscribeToProducts, subscribeToAllVariants } from '../firebase/services'

export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)

    const unsubProducts = subscribeToProducts((data) => {
      setProducts(data)
    })

    const unsubVariants = subscribeToAllVariants((data) => {
      setVariants(data)
      setLoading(false)
    })

    return () => {
      unsubProducts()
      unsubVariants()
    }
  }, [])

  // Combine products with their variants
  const productsWithVariants = products.map(product => ({
    ...product,
    variants: variants.filter(v => v.productId === product.id)
  }))

  // Get all categories
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean)

  return { 
    products: productsWithVariants, 
    allVariants: variants,
    categories, 
    loading, 
    error 
  }
}
