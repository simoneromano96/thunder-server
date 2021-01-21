import {
  arg,
  booleanArg,
  enumType,
  idArg,
  list,
  mutationField,
  nonNull,
  objectType,
  queryField,
  stringArg,
  subscriptionField,
} from "nexus"

import { OrderDocument, OrderModel, IOrder } from "../models/order"
import { Upload } from "../typings"
import { getFileUrl, INewFile, saveImage } from "../utils/file"

enum ChangeTypes {
  // ALL = "ALL",
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  DELETED = "DELETED",
}

/**
 * Gets the order, throws if not found
 * @param orderId the order ID
 */
const getRequiredOrder = async (orderId: string): Promise<OrderDocument> => {
  const order = await OrderModel.findById(orderId)
  if (!order) {
    throw new Error("Could not find order")
  }
  return order
}

const ChangeType = enumType({
  name: "Change Type",
  description: "The type of change to an object",
  members: Object.values(ChangeTypes),
})

const Order = objectType({
  name: "Order",
  description: "An order object",
  definition(t) {
    t.id("id", { description: "The order's unique ID" })
    t.string("table", { description: "The table of the order" })
    // t.string("waiter", { description: "The waiter that made the order" })
    t.list.string("imageUrls", { description: "Uploaded image urls" })
    t.string("additionalInfo", { description: "The order's additional info" })
    // t.int("shift", { description: "The order's table shift" })
    t.boolean("closed", { description: "If the order has been closed" })
    t.field("createdAt", { type: "DateTime", description: "When the order has been created" })
    t.field("updatedAt", { type: "DateTime", description: "When the order has been last updated" })
  },
})

const ordersQuery = queryField("orders", {
  type: list(nonNull(Order)),
  description: "Returns the current orders",
  args: {
    table: stringArg({ description: "The order's table" }),
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
    table: nonNull(stringArg({ description: "The new order's table" })),
    // waiter: stringArg({ description: "The new order's waiter" }),
    additionalInfo: stringArg({ description: "The new order's optional additional informations" }),
    image: arg({ description: "The new order's image, this or svgImage must be provided", type: Upload }),
    svgImage: stringArg({ description: "The new order's svg image, this or image must be provided" }),
  },
  resolve: async (_root, { svgImage, image, table, additionalInfo }, { pubsub }) => {
    // Get image URL
    const saveFileResult: INewFile = await saveImage(svgImage, image)
    const imageUrl = getFileUrl(saveFileResult.filename)
    // Create and save the new order
    const order = new OrderModel({ table, imageUrls: [imageUrl], additionalInfo })
    const newOrder = await order.save()
    await pubsub.publish({
      topic: `ORDERS_CHANGED_${ChangeTypes.CREATED}`,
      payload: order,
    })
    return newOrder
  },
})

const editOrderMutation = mutationField("editOrder", {
  type: nonNull(Order),
  description: "Edits a order",
  args: {
    id: nonNull(idArg({ description: "The order's ID" })),
    closed: booleanArg({ description: "The new order's closed status" }),
    // waiter: stringArg({ description: "The new order's waiter" }),
    additionalInfo: stringArg({ description: "The new order's optional additional informations" }),
    image: arg({ description: "The new order's image, this or svgImage must be provided", type: Upload }),
    svgImage: stringArg({ description: "The new order's svg image, this or image must be provided" }),
  },
  resolve: async (_root, { id, closed, additionalInfo, image, svgImage }, { pubsub }) => {
    // Get the order or throw if not found
    const order = await getRequiredOrder(id)
    if (image || svgImage) {
      // Get image URL
      const saveFileResult: INewFile = await saveImage(svgImage, image)
      const imageUrl = getFileUrl(saveFileResult.filename)
      // Update the order with the new image
      order.imageUrls = [...order.imageUrls, imageUrl]
    }
    if (additionalInfo) {
      order.additionalInfo = additionalInfo
    }
    if (closed !== null && closed !== undefined) {
      order.closed = closed
    }
    const editedOrder = await order.save()
    await pubsub.publish({
      topic: `ORDERS_CHANGED_${ChangeTypes.UPDATED}`,
      payload: editedOrder,
    })
    return editedOrder
  },
})

const addImageToOrderMutation = mutationField("addImageToOrder", {
  type: nonNull(Order),
  description: "Adds a new image to an order, expanding it",
  args: {
    id: nonNull(idArg({ description: "The order's ID" })),
    image: arg({ description: "The new order's image, this or svgImage must be provided", type: Upload }),
    svgImage: stringArg({ description: "The new order's svg image, this or image must be provided" }),
  },
  resolve: async (_root, { id, svgImage, image }, { pubsub }) => {
    // Get the order or throw if not found
    const order = await getRequiredOrder(id)
    // Get image URL
    const saveFileResult: INewFile = await saveImage(svgImage, image)
    const imageUrl = getFileUrl(saveFileResult.filename)
    // Update the order with the new image
    order.imageUrls = [...order.imageUrls, imageUrl]
    const editedOrder = await order.save()
    await pubsub.publish({
      topic: `ORDERS_CHANGED_${ChangeTypes.UPDATED}`,
      payload: editedOrder,
    })
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
    changeType: arg({ type: ChangeType, description: "The type of change that needs to trigger the push" }),
  },
  subscribe: async (_root, { changeType }, { pubsub }) => await pubsub.subscribe(`ORDERS_CHANGED_${changeType}`),
  resolve: async (payload: IOrder) => payload,
})

const OrderQuery = [ordersQuery, orderQuery]

const OrderMutation = [newOrderMutation, editOrderMutation, addImageToOrderMutation]

const OrderSubscription = [ordersChangedSubscription]

export { OrderQuery, OrderMutation, OrderSubscription }
