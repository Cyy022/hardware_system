import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  increment,
  Timestamp
} from 'firebase/firestore'

import { db } from '../firebase/config'

// Collection references
const productsRef = collection(db, 'products')
const variantsRef = collection(db, 'variants')
const salesRef = collection(db, 'sales')
const suppliersRef = collection(db, 'suppliers')
const stockInRef = collection(db, 'stockin')
const usersRef = collection(db, 'users')
const purchaseOrdersRef = collection(db, 'purchaseOrders')
const stockInHistoryRef = collection(db, 'stockInHistory')
const ordersRef = collection(db, 'orders')

// ==================== PRODUCTS ====================

export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(productsRef, {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return { id: docRef.id, ...productData }
  } catch (error) {
    throw new Error(`Failed to add product: ${error.message}`)
  }
}

export const updateProduct = async (productId, productData) => {
  try {
    const productRef = doc(db, 'products', productId)
    await updateDoc(productRef, {
      ...productData,
      updatedAt: serverTimestamp()
    })
    return { id: productId, ...productData }
  } catch (error) {
    throw new Error(`Failed to update product: ${error.message}`)
  }
}

export const deleteProduct = async (productId) => {
  try {
    // Delete all variants first
    const variantsQuery = query(variantsRef, where('productId', '==', productId))
    const variantsSnapshot = await getDocs(variantsQuery)
    const batch = writeBatch(db)

    variantsSnapshot.docs.forEach(variantDoc => {
      batch.delete(doc(db, 'variants', variantDoc.id))
    })

    batch.delete(doc(db, 'products', productId))
    await batch.commit()
    return true
  } catch (error) {
    throw new Error(`Failed to delete product: ${error.message}`)
  }
}

export const getProducts = async () => {
  try {
    const q = query(productsRef, orderBy('name'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    throw new Error(`Failed to get products: ${error.message}`)
  }
}

export const subscribeToProducts = (callback) => {
  const q = query(productsRef, orderBy('name'))
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(products)
  })
}

// ==================== VARIANTS ====================

export const addVariant = async (variantData) => {
  try {
    // Check for duplicate SKU
    const skuQuery = query(variantsRef, where('sku', '==', variantData.sku))
    const skuSnapshot = await getDocs(skuQuery)

    if (!skuSnapshot.empty) {
      throw new Error('SKU already exists. Please use a unique SKU.')
    }

    const docRef = await addDoc(variantsRef, {
      ...variantData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return { id: docRef.id, ...variantData }
  } catch (error) {
    throw new Error(`Failed to add variant: ${error.message}`)
  }
}

export const updateVariant = async (variantId, variantData) => {
  try {
    const variantRef = doc(db, 'variants', variantId)
    await updateDoc(variantRef, {
      ...variantData,
      updatedAt: serverTimestamp()
    })
    return { id: variantId, ...variantData }
  } catch (error) {
    throw new Error(`Failed to update variant: ${error.message}`)
  }
}

export const deleteVariant = async (variantId) => {
  try {
    await deleteDoc(doc(db, 'variants', variantId))
    return true
  } catch (error) {
    throw new Error(`Failed to delete variant: ${error.message}`)
  }
}

export const getVariantsByProduct = async (productId) => {
  try {
    const q = query(variantsRef, where('productId', '==', productId), orderBy('name'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    throw new Error(`Failed to get variants: ${error.message}`)
  }
}

export const subscribeToVariants = (productId, callback) => {
  const q = query(variantsRef, where('productId', '==', productId), orderBy('name'))
  return onSnapshot(q, (snapshot) => {
    const variants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(variants)
  })
}

export const subscribeToAllVariants = (callback) => {
  const q = query(variantsRef, orderBy('name'))
  return onSnapshot(q, (snapshot) => {
    const variants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(variants)
  })
}

// ==================== STOCK IN ====================

export const addStockIn = async (stockInData) => {
  try {
    const batch = writeBatch(db)

    // Add stock in record
    const stockInDoc = await addDoc(stockInRef, {
      ...stockInData,
      createdAt: serverTimestamp()
    })

    // Update variant quantity
    const variantRef = doc(db, 'variants', stockInData.variantId)
    batch.update(variantRef, {
      quantity: increment(stockInData.quantity),
      updatedAt: serverTimestamp()
    })

    await batch.commit()
    return { id: stockInDoc.id, ...stockInData }
  } catch (error) {
    throw new Error(`Failed to add stock: ${error.message}`)
  }
}

export const getStockInHistory = async () => {
  try {
    const q = query(stockInRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    throw new Error(`Failed to get stock in history: ${error.message}`)
  }
}

export const subscribeToStockIn = (callback) => {
  const q = query(stockInRef, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const stockIn = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(stockIn)
  })
}

export const generatePONumber = () => {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  const random = Math.floor(1000 + Math.random() * 9000)

  return `PO-${year}${month}${day}-${random}`
}

export const createPurchaseOrder = async (purchaseData) => {
  try {
    const docRef = await addDoc(purchaseOrdersRef, {
      ...purchaseData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return {
      id: docRef.id,
      ...purchaseData
    }
  } catch (error) {
    throw new Error(`Failed to create purchase order: ${error.message}`)
  }
}

export const getPurchaseOrders = async () => {
  try {
    const q = query(
      purchaseOrdersRef,
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    throw new Error(`Failed to get purchase orders: ${error.message}`)
  }
}

export const subscribeToPurchaseOrders = (callback) => {
  const q = query(
    purchaseOrdersRef,
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const purchaseOrders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    callback(purchaseOrders)
  })
}

export const receivePurchaseOrder = async (purchaseOrderId) => {
  try {
    const purchaseOrderRef = doc(db, 'purchaseOrders', purchaseOrderId)
    const purchaseOrderSnap = await getDoc(purchaseOrderRef)

    if (!purchaseOrderSnap.exists()) {
      throw new Error('Purchase order not found')
    }

    const purchaseOrder = purchaseOrderSnap.data()

    // CHECK ITEMS
    if (
      !purchaseOrder.items ||
      !Array.isArray(purchaseOrder.items)
    ) {
      throw new Error('Purchase order items are invalid')
    }

    const batch = writeBatch(db)

    // UPDATE VARIANT STOCKS
    for (const item of purchaseOrder.items) {
      const variantRef = doc(db, 'variants', item.variantId)

      batch.update(variantRef, {
        quantity: increment(Number(item.quantity)),
        updatedAt: serverTimestamp()
      })
    }

    // UPDATE PURCHASE ORDER STATUS
    batch.update(purchaseOrderRef, {
      status: 'Received',
      receivedAt: serverTimestamp()
    })

    // SAVE STOCK HISTORY
    const historyRef = doc(collection(db, 'stockHistory'))

    batch.set(historyRef, {
      poNumber: purchaseOrder.poNumber,
      supplierName: purchaseOrder.supplierName,
      items: purchaseOrder.items,
      totalAmount: purchaseOrder.totalAmount || 0,
      receivedBy: purchaseOrder.email || '',
      createdAt: serverTimestamp(),
      status: 'Completed'
    })

    await batch.commit()

    return true
  } catch (error) {
    throw new Error(
      `Failed to receive purchase order: ${error.message}`
    )
  }
}

export const cancelPurchaseOrder = async (purchaseOrderId) => {
  try {
    const poRef = doc(db, 'purchaseOrders', purchaseOrderId)

    await updateDoc(poRef, {
      status: 'Cancelled',
      updatedAt: serverTimestamp()
    })

    return true
  } catch (error) {
    throw new Error(`Failed to cancel purchase order: ${error.message}`)
  }
}

export const getStockInHistoryData = async () => {
  try {
    const q = query(
      stockInHistoryRef,
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    throw new Error(`Failed to get stock history: ${error.message}`)
  }
}

export const subscribeToStockHistory = (callback) => {
  const q = query(
    stockInHistoryRef,
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    callback(history)
  })
}

// ==================== SALES / STOCK OUT ====================

export const addSale = async (saleData) => {
  try {
    const batch = writeBatch(db)

    // Add sale record
    const saleDoc = await addDoc(salesRef, {
      ...saleData,
      createdAt: serverTimestamp()
    })

    // Update variant quantities
    for (const item of saleData.items) {
      const variantRef = doc(db, 'variants', item.variantId)
      batch.update(variantRef, {
        quantity: increment(-item.quantity),
        updatedAt: serverTimestamp()
      })
    }

    await batch.commit()
    return { id: saleDoc.id, ...saleData }
  } catch (error) {
    throw new Error(`Failed to process sale: ${error.message}`)
  }
}

export const getSales = async () => {
  try {
    const q = query(salesRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    throw new Error(`Failed to get sales: ${error.message}`)
  }
}

export const subscribeToSales = (callback) => {
  const q = query(salesRef, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(sales)
  })
}

export const getSalesByDate = async (startDate, endDate) => {
  try {
    const q = query(
      salesRef,
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    throw new Error(`Failed to get sales by date: ${error.message}`)
  }
}

// ==================== SUPPLIERS ====================

export const addSupplier = async (supplierData) => {
  try {
    const docRef = await addDoc(suppliersRef, {
      ...supplierData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return { id: docRef.id, ...supplierData }
  } catch (error) {
    throw new Error(`Failed to add supplier: ${error.message}`)
  }
}

export const updateSupplier = async (supplierId, supplierData) => {
  try {
    const supplierRef = doc(db, 'suppliers', supplierId)
    await updateDoc(supplierRef, {
      ...supplierData,
      updatedAt: serverTimestamp()
    })
    return { id: supplierId, ...supplierData }
  } catch (error) {
    throw new Error(`Failed to update supplier: ${error.message}`)
  }
}

export const deleteSupplier = async (supplierId) => {
  try {
    await deleteDoc(doc(db, 'suppliers', supplierId))
    return true
  } catch (error) {
    throw new Error(`Failed to delete supplier: ${error.message}`)
  }
}

export const getSuppliers = async () => {
  try {
    const q = query(suppliersRef, orderBy('companyName'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    throw new Error(`Failed to get suppliers: ${error.message}`)
  }
}

export const subscribeToSuppliers = (callback) => {
  const q = query(suppliersRef, orderBy('companyName'))
  return onSnapshot(q, (snapshot) => {
    const suppliers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(suppliers)
  })
}

// ==================== USERS ====================

export const addUser = async (userData) => {
  try {
    const docRef = await addDoc(usersRef, {
      ...userData,
      createdAt: serverTimestamp()
    })
    return { id: docRef.id, ...userData }
  } catch (error) {
    throw new Error(`Failed to add user: ${error.message}`)
  }
}

export const getUserByEmail = async (email) => {
  try {
    const q = query(usersRef, where('email', '==', email))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
  } catch (error) {
    throw new Error(`Failed to get user: ${error.message}`)
  }
}

// ==================== USER PROFILE ====================
export const getUserProfile = async (uid) => {

  try {

    const docRef = doc(db, 'users', uid)

    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {

      return {
        id: docSnap.id,
        ...docSnap.data()
      }

    }

    return null

  } catch (error) {

    console.log(error)

    return null

  }

}

export const updateUserProfile = async (uid, profileData) => {

  try {

    const docRef = doc(db, 'users', uid)

    await setDoc(docRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    }, { merge: true })

    return {
      id: uid,
      ...profileData
    }

  } catch (error) {

    throw new Error(`Failed to update profile: ${error.message}`)

  }

}
// ==================== UTILITY FUNCTIONS ====================

export const getProductWithVariants = async (productId) => {
  try {
    const productDoc = await getDoc(doc(db, 'products', productId))
    if (!productDoc.exists()) return null

    const variants = await getVariantsByProduct(productId)
    return {
      id: productDoc.id,
      ...productDoc.data(),
      variants
    }
  } catch (error) {
    throw new Error(`Failed to get product with variants: ${error.message}`)
  }
}


export const getAllProductsWithVariants = async () => {
  try {
    const products = await getProducts()
    const productsWithVariants = await Promise.all(
      products.map(async (product) => {
        const variants = await getVariantsByProduct(product.id)
        return { ...product, variants }
      })
    )
    return productsWithVariants
  } catch (error) {
    throw new Error(`Failed to get all products: ${error.message}`)
  }
}

export const getStockStatus = (quantity, reorderLevel) => {
  if (quantity <= 0) return { status: 'Out of Stock', color: 'badge-danger' }
  if (quantity <= reorderLevel * 0.5) return { status: 'Critical', color: 'badge-danger' }
  if (quantity <= reorderLevel) return { status: 'Low Stock', color: 'badge-warning' }
  return { status: 'In Stock', color: 'badge-success' }
}

// ==================== ECOMMERCE ORDERS ====================

export const createOrder = async (orderData) => {

  try {

    const formattedItems = orderData.items.map(item => ({
      productId: item.productId || item.id || '',
      productName: item.productName || item.name || '',
      variantId: item.variantId || '',
      variantName: item.variantName || 'Default',
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0
    }))

    const totalAmount = formattedItems.reduce(
      (acc, item) =>
        acc + item.price * item.quantity,
      0
    )

    const docRef = await addDoc(ordersRef, {

      userId:
        orderData.userId || '',

      orderNumber:
        orderData.orderNumber || `ORD-${Date.now()}`,

      customerName:
        orderData.customerName || 'Customer',

      email:
        orderData.email || '',

      phone:
        orderData.phone || '',

      shippingAddress:
        orderData.shippingAddress || '',

      addressDetails:
        orderData.addressDetails || {},

      deliveryNotes:
        orderData.deliveryNotes || '',

      items: formattedItems,

      totalAmount,

      itemCount:
        formattedItems.reduce(
          (acc, item) => acc + item.quantity,
          0
        ),

      paymentMethod:
        orderData.paymentMethod || 'cod',

      orderStatus: 'pending',

      paymentStatus: 'pending',

      createdAt: serverTimestamp(),

      updatedAt: serverTimestamp()

    })

    return {
      id: docRef.id
    }

  } catch (error) {

    console.log(error)

    throw new Error(
      `Failed to create order: ${error.message}`
    )

  }

}

export const subscribeToUserOrders = (
  uid,
  email,
  callback
) => {

  if (!uid && !email) {

    callback([])

    return () => {}

  }

  const q = uid
    ? query(ordersRef, where('userId', '==', uid))
    : query(ordersRef, where('email', '==', email))

  return onSnapshot(q, (snapshot) => {

    const orders = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => {
        const dateA =
          a.createdAt?.toDate?.()?.getTime?.() || 0

        const dateB =
          b.createdAt?.toDate?.()?.getTime?.() || 0

        return dateB - dateA
      })

    callback(orders)

  })

}

export const getOrders = async () => {

  try {

    const q = query(
      ordersRef,
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

  } catch (error) {

    throw new Error(
      `Failed to get orders: ${error.message}`
    )

  }

}

export const subscribeToOrders = (callback) => {

  const q = query(
    ordersRef,
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    callback(orders)

  })

}

export const updateOrderStatus = async (
  orderId,
  status
) => {

  try {

    const orderRef = doc(
      db,
      'orders',
      orderId
    )

    await updateDoc(orderRef, {

      orderStatus: status,

      updatedAt: serverTimestamp()

    })

    return true

  } catch (error) {

    throw new Error(
      `Failed to update order: ${error.message}`
    )

  }

}

export const completeOrder = async (
  orderId
) => {

  try {

    const orderRef = doc(
      db,
      'orders',
      orderId
    )

    const orderSnap = await getDoc(orderRef)

    if (!orderSnap.exists()) {

      throw new Error('Order not found')

    }

    const order = orderSnap.data()

    const batch = writeBatch(db)

    // ================= DEDUCT STOCK =================

    for (const item of order.items) {

      if (item.variantId) {

        const variantRef = doc(
          db,
          'variants',
          item.variantId
        )

        batch.update(variantRef, {

          quantity: increment(
            -Number(item.quantity)
          ),

          updatedAt: serverTimestamp()

        })

      }

    }

    // ================= UPDATE ORDER =================

    batch.update(orderRef, {

      orderStatus: 'completed',

      paymentStatus: 'paid',

      completedAt: serverTimestamp(),

      updatedAt: serverTimestamp()

    })

    await batch.commit()

    return true

  } catch (error) {

    throw new Error(
      `Failed to complete order: ${error.message}`
    )

  }

}

export { db }
