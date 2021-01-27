import {
  arg,
  booleanArg,
  enumType,
  idArg,
  inputObjectType,
  intArg,
  list,
  mutationField,
  nonNull,
  objectType,
  queryField,
  stringArg,
  subscriptionField,
} from "nexus"

import { OrderDocument, OrderModel, IOrder, IOrderInfo } from "../models/order"
import { Upload } from "../typings"
import { getFileUrl, INewFile, saveImage } from "../utils/file"

enum ChangeTypes {
  ALL = "ALL",
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  DELETED = "DELETED",
}

/**
 * Gets the order, throws if not found
 * @param orderId the order ID
 * @throws Will throw if order is not found
 */
const getRequiredOrder = async (orderId: string): Promise<OrderDocument> => {
  const order = await OrderModel.findById(orderId)
  if (!order) {
    throw new Error("Could not find order")
  }
  return order
}

/**
 * Checks if a table has an active order
 * @param table The table to find
 * @throws Will throw if the table is occupied
 */
const requireAvailableTable = async (table: number) => {
  const activeOrder = await OrderModel.findOne({ table, closed: false })
  if (activeOrder !== null) {
    throw new Error("The table already has an active order, close it")
  }
}

/**
 * @param changeType The channel to publish to
 * @param pubsub The pubsub client
 * @param order The order to push
 */
const publishOrderChange = async (changeType: ChangeTypes, pubsub: any, order: OrderDocument) => {
  await pubsub.publish({
    topic: `ORDERS_CHANGED_${changeType}`,
    payload: order,
  })
  await pubsub.publish({
    topic: `ORDERS_CHANGED_${ChangeTypes.ALL}`,
    payload: order,
  })
}

const ChangeType = enumType({
  name: "ChangeType",
  description: "The type of change to an object",
  members: Object.values(ChangeTypes),
})

const OrderInfo = objectType({
  name: "OrderInfo",
  description: "The order's info",
  definition(t) {
    t.string("additionalInfo", { description: "The order's additional info" })
    t.nonNull.boolean("completed", { description: "If the current order info has been served" })
    t.nonNull.string("imageUrl", { description: "The order's uploaded image, actually contains all the order info" })
    t.field("createdAt", { type: "DateTime", description: "When the order info has been created" })
    t.field("updatedAt", { type: "DateTime", description: "When the order info has been last updated" })
  },
})

const OrderInfoInput = inputObjectType({
  name: "OrderInfoInput",
  description: "The order's info input",
  definition(t) {
    t.string("additionalInfo", { description: "The order's additional info" })
    t.boolean("completed", { description: "If the current order info has been served" })
    t.nonNull.string("imageUrl", { description: "The order's uploaded image, actually contains all the order info" })
  },
})

const Order = objectType({
  name: "Order",
  description: "An order object",
  definition(t) {
    t.id("id", { description: "The order's unique ID" })
    t.nonNull.int("table", { description: "The table of the order" })
    // t.string("waiter", { description: "The waiter that made the order" })
    // t.list.string("imageUrls", { description: "Uploaded image urls" })
    // t.string("additionalInfo", { description: "The order's additional info" })
    // t.int("shift", { description: "The order's table shift" })
    t.nonNull.boolean("closed", { description: "If the order has been closed" })
    t.nonNull.field("orderInfoList", { type: list(nonNull(OrderInfo)), description: "All the order infos" })
    t.field("createdAt", { type: "DateTime", description: "When the order has been created" })
    t.field("updatedAt", { type: "DateTime", description: "When the order has been last updated" })
  },
})

const ordersQuery = queryField("orders", {
  type: list(nonNull(Order)),
  description: "Returns the current orders",
  args: {
    table: intArg({ description: "The order's table" }),
    // waiter: stringArg({ description: "The order's waiter" }),
    closed: booleanArg({
      description: "Wether or not we should filter only open orders, defaults on false getting only the active orders",
      default: false,
    }),
  },
  resolve: async (_root, { table, closed }, _context) => {
    let query: any = { closed }
    if (table) {
      query = { ...query, table }
    }
    // if (waiter) {
    //   query = { ...query, waiter }
    // }

    return await OrderModel.find(query)
  },
})

const orderQuery = queryField("order", {
  type: nonNull(Order),
  description: "Returns an order by its ID",
  args: {
    id: nonNull(idArg({ description: "The order's ID" })),
  },
  resolve: async (_root, { id }, _context) => await getRequiredOrder(id),
})

const newOrderMutation = mutationField("newOrder", {
  type: nonNull(Order),
  description: "Creates a new order",
  args: {
    table: nonNull(intArg({ description: "The new order's table, must not have a currently active order" })),
    // waiter: stringArg({ description: "The new order's waiter" }),
    additionalInfo: stringArg({ description: "The new order's optional additional informations" }),
    image: arg({ description: "The new order's image, this or svgImage must be provided", type: Upload }),
    svgImage: stringArg({ description: "The new order's svg image, this or image must be provided" }),
  },
  resolve: async (_root, { svgImage, image, table, additionalInfo }, { pubsub }) => {
    // Check that the table has no active orders
    await requireAvailableTable(table)
    // Get image URL
    const saveFileResult: INewFile = await saveImage(svgImage, image)
    const imageUrl = getFileUrl(saveFileResult.filename)
    // Create order info
    const orderInfo = {
      imageUrl,
      additionalInfo,
    }
    // Create and save the new order
    const order = new OrderModel({ table, orderInfo })
    const newOrder = await order.save()
    await publishOrderChange(ChangeTypes.CREATED, pubsub, order)
    return newOrder
  },
})

const editOrderMutation = mutationField("editOrder", {
  type: nonNull(Order),
  description: "Edits a order",
  args: {
    id: nonNull(idArg({ description: "The order's ID" })),
    closed: booleanArg({ description: "The new order's closed status" }),
    orderInfoList: arg({ type: list(nonNull(OrderInfoInput)), description: "The new order's info list" }),
    // waiter: stringArg({ description: "The new order's waiter" }),
    // additionalInfo: stringArg({ description: "The new order's optional additional informations" }),
    // image: arg({ description: "The new order's image, this or svgImage must be provided", type: Upload }),
    // svgImage: stringArg({ description: "The new order's svg image, this or image must be provided" }),
  },
  resolve: async (_root, { id, closed, orderInfoList }, { pubsub }) => {
    // Get the order or throw if not found
    const order = await getRequiredOrder(id)
    // Edit closed
    if (closed !== null && closed !== undefined) {
      order.closed = closed
    }
    // Edit orderInfoList
    if (orderInfoList !== null && orderInfoList !== undefined && orderInfoList.length > 0) {
      order.orderInfoList = orderInfoList as IOrderInfo[]
    }
    // Save edited order
    const editedOrder = await order.save()
    await publishOrderChange(ChangeTypes.UPDATED, pubsub, editedOrder)

    return editedOrder
  },
})

const addOrderInfoMutation = mutationField("addOrderInfo", {
  type: nonNull(Order),
  description: "Adds a new image to an order, creating a new order info",
  args: {
    id: nonNull(idArg({ description: "The order's ID" })),
    additionalInfo: stringArg({ description: "The new order info's additional info" }),
    image: arg({ description: "The new order's image, this or svgImage must be provided", type: Upload }),
    svgImage: stringArg({ description: "The new order's svg image, this or image must be provided" }),
  },
  resolve: async (_root, { id, svgImage, image }, { pubsub }) => {
    // Get the order or throw if not found
    const order = await getRequiredOrder(id)
    // Get image URL
    const saveFileResult: INewFile = await saveImage(svgImage, image)
    const imageUrl = getFileUrl(saveFileResult.filename)
    // New order info
    const newOrderInfo = { imageUrl } as IOrderInfo
    // Add a new order info
    order.orderInfoList.push(newOrderInfo)
    // Save and publish edit
    const editedOrder = await order.save()
    await publishOrderChange(ChangeTypes.UPDATED, pubsub, editedOrder)
    return editedOrder
  },
})

/*
const closeOrderShiftMutation = mutationField("closeOrderShift", {
  type: nonNull(Order),
  description: "Closes the current order, freing the table for the next shift",
  args: {
    orderId: nonNull(idArg({ description: "The order's ID" })),
    // table: nonNull(stringArg({ description: "The table that needs to be closed" })),
  },
  resolve: async (_root, { orderId }, _context) => {
    // Get the order or throw if not found
    const order = await getRequiredOrder(orderId)
    // Updates the shift
    order.shift++
    return await order.save()
  },
})
*/

const ordersChangedSubscription = subscriptionField("ordersChanged", {
  type: nonNull(Order),
  description: "React to orders change",
  args: {
    changeType: arg({ type: nonNull(ChangeType), description: "The type of change that needs to trigger the push" }),
  },
  subscribe: async (_root, { changeType }, { pubsub }) => await pubsub.subscribe(`ORDERS_CHANGED_${changeType}`),
  resolve: async (payload: IOrder) => payload,
})

const OrderQuery = [ordersQuery, orderQuery]

const OrderMutation = [newOrderMutation, editOrderMutation, addOrderInfoMutation]

const OrderSubscription = [ordersChangedSubscription]

export { OrderQuery, OrderMutation, OrderSubscription }
