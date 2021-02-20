import { Order, OrderInfo } from "@prisma/client"
import prisma from "../../utils/db"
import { ChangeTypes } from "./types"

type OrderWithInfo = Order & {
  orderInfoList: OrderInfo[]
}

/**
 * Gets the order, throws if not found
 * @param id the order ID
 * @throws Will throw if order is not found
 */
export const getRequiredOrder = (id: string): Promise<OrderWithInfo> =>
  prisma.order.findUnique({
    where: { id },
    include: { orderInfoList: true },
    rejectOnNotFound: true,
  })

/**
 * Checks if a table has an active order
 * @param table The table to find
 * @throws Will throw if the table is occupied
 */
export const requireAvailableTable = async (table: string): Promise<void> => {
  const activeOrder = await prisma.order.findFirst({ where: { table, closed: false } })
  // const activeOrder = await OrderModel.findOne({ table, closed: false })
  if (activeOrder !== null) {
    throw new Error("The table already has an active order, close it")
  }
}

/**
 * @param pubsub The pubsub client
 * @param changeType The channel to publish to
 * @param order The order to push
 * @throws Will throw if pubsub client failed to publish changes
 */
export const publishOrderChange = async (pubsub: any, changeType: ChangeTypes, order: OrderWithInfo): Promise<any> =>
  Promise.all([
    pubsub?.publish({
      topic: `ORDERS_CHANGED_${changeType}`,
      payload: { order },
    }),
    pubsub?.publish({
      topic: `ORDERS_CHANGED_${ChangeTypes.ALL}`,
      payload: { order, changeType },
    }),
  ])
