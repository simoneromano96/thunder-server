import { readOrders, readOrder } from "./queries"
import { createOrder, updateOrder, addOrderInfo, deleteOrder } from "./mutations"
import { ordersChanged } from "./subscriptions"

const OrderQuery = [readOrders, readOrder]

const OrderMutation = [createOrder, updateOrder, addOrderInfo, deleteOrder]

const OrderSubscription = [ordersChanged]

export { OrderQuery, OrderMutation, OrderSubscription }
