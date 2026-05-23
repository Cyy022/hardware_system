import { useState, useEffect } from 'react'
import { subscribeToSuppliers } from '../firebase/services'

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToSuppliers((data) => {
      setSuppliers(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const totalSuppliers = suppliers.length
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length
  const inactiveSuppliers = suppliers.filter(s => s.status === 'inactive').length

  return {
    suppliers,
    loading,
    totalSuppliers,
    activeSuppliers,
    inactiveSuppliers
  }
}
