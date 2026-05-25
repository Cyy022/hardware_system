import React, { useEffect, useState } from 'react'

import {
  subscribeToOrders,
  updateOrderStatus,
  completeOrder
} from '../../firebase/services'

const Orders = () => {

  const [orders, setOrders] = useState([])

  useEffect(() => {

    const unsubscribe =
      subscribeToOrders(setOrders)

    return () => unsubscribe()

  }, [])

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-2xl font-bold">
          Ecommerce Orders
        </h1>

        <p className="text-gray-500">
          Manage customer orders and transactions
        </p>

      </div>

      <div className="grid gap-4">

        {orders.map(order => (

          <div
            key={order.id}
            className="bg-white rounded-2xl p-5 shadow-sm border"
          >

            <div className="flex justify-between">

              <div>

                <h2 className="font-bold text-lg">
                  {order.customerName}
                </h2>

                <p className="text-sm text-gray-500">
                  {order.email}
                </p>

                <p className="text-sm text-gray-500">
                  {order.phone}
                </p>

              </div>

              <div className="text-right">

                <p className="font-bold text-primary-700">
                  ₱{order.totalAmount?.toLocaleString()}
                </p>

                <div className="space-y-1">

                <p className="text-sm capitalize text-gray-500">
                  {order.paymentMethod}
                </p>

                <span
                  className={`
                    inline-block px-3 py-1 rounded-full text-xs font-semibold
                    ${
                      order.orderStatus === 'processing'
                        ? 'bg-yellow-100 text-yellow-700'
                        : order.orderStatus === 'confirmed'
                        ? 'bg-blue-100 text-blue-700'
                        : order.orderStatus === 'preparing'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }
                  `}
                >

                  {order.orderStatus}

                </span>

              </div>

              </div>

            </div>

            <div className="mt-4">

              {order.items?.map((item, index) => (

                <div
                  key={index}
                  className="flex justify-between text-sm py-1"
                >

                  <span>
                    {item.productName}
                    {' '}
                    ({item.variantName})
                  </span>

                  <span>
                    x{item.quantity}
                  </span>

                </div>

              ))}

            </div>

            <div className="mt-5 flex gap-3">

              <button
                onClick={() =>
                  updateOrderStatus(
                    order.id,
                    'confirmed'
                  )
                }
                className="btn-secondary"
              >
                Confirm
              </button>

              <button
                onClick={() =>
                  updateOrderStatus(
                    order.id,
                    'preparing'
                  )
                }
                className="btn-secondary"
              >
                Preparing
              </button>

              <button
                onClick={() =>
                  completeOrder(order.id)
                }
                className="btn-primary"
              >
                Complete
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  )

}

export default Orders