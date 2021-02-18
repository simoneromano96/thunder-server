import { nanoid } from "nanoid"
import {
  arg,
  booleanArg,
  enumType,
  idArg,
  inputObjectType,
  list,
  mutationField,
  nonNull,
  objectType,
  queryField,
  stringArg,
  subscriptionField,
} from "nexus"

import prisma from "../utils/db"
import { getFileUrl, INewFile, IUpload, saveImage } from "../utils/file"
import { OrderInfo, OrderInfoInput } from "./orderInfo"

enum ChangeTypes {
  ALL = "ALL",
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  DELETED = "DELETED",
}

enum Orderings {
  ASC = "ASC",
  DESC = "DESC",
}

// interface IOrderPublished extends IOrder {
//   changeType: ChangeTypes
// }

/**
 * Gets the order, throws if not found
 * @param orderId the order ID
 * @throws Will throw if order is not found
 */
// const getRequiredOrder = async (orderId: string): Promise<OrderDocument> => {
//   const order = await OrderModel.findById(orderId)
//   if (!order) {
//     throw new Error("Could not find order")
//   }
//   return order
// }

/**
 * Checks if a table has an active order
 * @param table The table to find
 * @throws Will throw if the table is occupied
 */
const requireAvailableTable = async (table: string) => {
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
 */
const publishOrderChange = async (pubsub: any, changeType: ChangeTypes, order: any) => {
  console.log("publishing order change")
  await pubsub.publish({
    topic: `ORDERS_CHANGED_${changeType}`,
    payload: { order },
  })
  await pubsub.publish({
    topic: `ORDERS_CHANGED_${ChangeTypes.ALL}`,
    payload: { order, changeType },
  })
}

const ChangeType = enumType({
  name: "ChangeType",
  description: "The type of change to an object",
  members: Object.values(ChangeTypes),
})

const Ordering = enumType({
  name: "Ordering",
  description: "How to order a specific field",
  members: Object.values(Orderings),
})

const Order = objectType({
  name: "Order",
  description: "An order object",
  definition(t) {
    t.id("id", { description: "The order's unique ID" })
    t.nonNull.string("table", { description: "The table of the order" })
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

const OrderPublished = objectType({
  name: "OrderPublished",
  description: "An order modification publication for the subscriptions",
  definition(t) {
    t.nonNull.field("order", { type: Order, description: "The affected order" })
    t.field("changeType", { type: ChangeType, description: "The type of change" })
  },
})

const CreateOrderInput = inputObjectType({
  name: "CreateOrderInput",
  description: "The create order's input",
  definition(t) {
    t.nonNull.string("table", { description: "The order's table" })
    t.boolean("closed", { description: "If the current order has been closed" })
    t.nonNull.field("orderInfo", { type: OrderInfoInput, description: "The order details" })
  },
})

const UpdateOrderInput = inputObjectType({
  name: "UpdateOrderInput",
  description: "The create order's input",
  definition(t) {
    t.nonNull.id("id", { description: "The order's ID" })
    t.string("table", { description: "The new order's table, should never be used" })
    t.boolean("closed", { description: "If the current order must be closed" })
    t.field("orderInfoList", { type: list(OrderInfoInput), description: "The new order details" })
  },
})

// Create
const createOrder = mutationField("createOrder", {
  type: nonNull(Order),
  description: "Creates a new order",
  args: {
    input: nonNull(arg({ type: nonNull(CreateOrderInput), description: "The new order input" })),
  },
  resolve: async (_root, { input }, { pubsub }) => {
    // Check for available table
    await requireAvailableTable(input.table)

    const { svgList, uploadImageList } = input.orderInfo
    if (!svgList && !uploadImageList) {
      throw new Error("Must have svgList or uploadImageList")
    }
    let saveImagePromises: Array<Promise<string>> = []
    if (svgList !== null && svgList !== undefined) {
      // Save Images to local disk
      saveImagePromises = svgList.map(async (svgImage: string) => {
        // Get image URL
        const saveFileResult: INewFile = await saveImage(svgImage)
        const imageUrl = getFileUrl(saveFileResult.filename)
        return imageUrl
      })
    }
    if (uploadImageList !== null && uploadImageList !== undefined) {
      // Save Images to local disk
      saveImagePromises = uploadImageList.map(async (image: Promise<IUpload>) => {
        // Get image URL
        const saveFileResult: INewFile = await saveImage(undefined, image)
        const imageUrl = getFileUrl(saveFileResult.filename)
        return imageUrl
      })
    }

    const imageUrls: string[] = await Promise.all(saveImagePromises)

    // Create Order
    const newOrder = await prisma.order.create({ data: { id: nanoid(32), table: input.table } })

    // Create Order Info
    await prisma.orderInfo.create({
      data: {
        id: nanoid(32),
        additionalInfo: input.orderInfo.additionalInfo,
        imageUrls,
        orderId: newOrder.id,
      },
    })

    // Return order
    const order = await prisma.order.findUnique({
      where: { id: newOrder.id },
      include: { orderInfoList: true },
      rejectOnNotFound: true,
    })

    await publishOrderChange(pubsub, ChangeTypes.CREATED, order)

    return order
  },
})

// Read
const readOrders = queryField("orders", {
  type: nonNull(list(Order)),
  description: "Returns all the current orders",
  args: {
    table: stringArg({ description: "The order's table" }),
    closed: booleanArg({
      description: "Wether or not we should filter only open orders, defaults on false getting only the active orders",
      default: false,
    }),
    orderByCreated: arg({
      type: Ordering,
      description: "Optionally order by createdAt field, cannot specify both orderByCreated and orderByUpdated",
      // default: Orderings.ASC,
    }),
    orderByUpdated: arg({
      type: Ordering,
      description: "Optionally order by updatedAt field, cannot specify both orderByCreated and orderByUpdated",
      // default: Orderings.ASC,
    }),
  },
  resolve: async (_root, { table, closed, orderByCreated, orderByUpdated }, _context) => {
    const orders = await prisma.order.findMany({
      where: { table: table ?? undefined, closed: closed ?? undefined },
      orderBy: {
        createdAt: (orderByCreated?.toLocaleLowerCase() as "asc" | "desc") ?? undefined,
        updatedAt: (orderByUpdated?.toLocaleLowerCase() as "asc" | "desc") ?? undefined,
      },
      include: { orderInfoList: true },
    })
    return orders
  },
})

const readOrder = queryField("order", {
  type: nonNull(Order),
  description: "Returns an order by its ID",
  args: {
    id: nonNull(idArg({ description: "The order's ID" })),
  },
  resolve: async (_root, { id }, _context) => {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderInfoList: true },
      rejectOnNotFound: true,
    })
    return order
  },
})

// Update
const updateOrder = mutationField("updateOrder", {
  type: nonNull(Order),
  description: "Updates an order",
  args: {
    input: nonNull(
      arg({
        type: UpdateOrderInput,
        description: "The update order input, note that currently the orderInfoList is ignored",
      }),
    ),
  },
  resolve: async (_root, { input }, { pubsub }) => {
    const { id, ...updateInfo } = input

    await prisma.order.update({
      where: {
        id,
      },
      data: {
        closed: updateInfo.closed ?? undefined,
        table: updateInfo.table ?? undefined,
      },
    })

    const order = await prisma.order.findUnique({
      where: { id: input.id },
      include: { orderInfoList: true },
      rejectOnNotFound: true,
    })

    await publishOrderChange(pubsub, ChangeTypes.UPDATED, order)

    return order
  },
})

const addOrderInfo = mutationField("addOrderInfo", {
  type: nonNull(Order),
  description: "Adds order info to an order",
  args: {
    id: nonNull(idArg({ description: "The ID of the order to edit" })),
    orderInfoInput: nonNull(arg({ type: OrderInfoInput, description: "The order info to add to the order" })),
  },
  resolve: async (_root, { id, orderInfoInput }, { pubsub }) => {
    const { svgList, uploadImageList, ...orderInfoList } = orderInfoInput
    if (!svgList && !uploadImageList) {
      throw new Error("Must have svgList or uploadImageList")
    }
    let saveImagePromises: Array<Promise<string>> = []
    if (svgList !== null && svgList !== undefined) {
      // Save Images to local disk
      saveImagePromises = svgList.map(async (svgImage: string) => {
        // Get image URL
        const saveFileResult: INewFile = await saveImage(svgImage)
        const imageUrl = getFileUrl(saveFileResult.filename)
        return imageUrl
      })
    }
    if (uploadImageList !== null && uploadImageList !== undefined) {
      // Save Images to local disk
      saveImagePromises = uploadImageList.map(async (image: Promise<IUpload>) => {
        // Get image URL
        const saveFileResult: INewFile = await saveImage(undefined, image)
        const imageUrl = getFileUrl(saveFileResult.filename)
        return imageUrl
      })
    }

    const imageUrls: string[] = await Promise.all(saveImagePromises)

    await prisma.orderInfo.create({
      data: {
        id: nanoid(32),
        orderId: id,
        additionalInfo: orderInfoList.additionalInfo ?? undefined,
        completed: orderInfoList.completed ?? undefined,
        imageUrls,
      },
    })

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderInfoList: true },
      rejectOnNotFound: true,
    })

    await publishOrderChange(pubsub, ChangeTypes.CREATED, order)

    return order
  },
})

// Delete
const deleteOrder = mutationField("deleteOrder", {
  type: nonNull(Order),
  description: "Deletes an order",
  args: {
    id: nonNull(idArg({ description: "The ID of the order to delete" })),
  },
  resolve: async (_root, { id }, { pubsub }) => {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderInfoList: true },
      rejectOnNotFound: true,
    })

    const deleteOrder = prisma.order.delete({ where: { id } })
    const deleteOrderInfos = prisma.orderInfo.deleteMany({ where: { orderId: id } })
    await prisma.$transaction([deleteOrderInfos, deleteOrder])

    await publishOrderChange(pubsub, ChangeTypes.DELETED, order)
    return order
  },
})

/*
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
*/

/*
const addOrderInfoMutation = mutationField("addOrderInfo", {
  type: nonNull(Order),
  description: "Adds a new image to an order, creating a new order info",
  args: {
    id: nonNull(idArg({ description: "The order's ID" })),
    additionalInfo: stringArg({ description: "The new order info's additional info" }),
    image: arg({ description: "The new order's image, this or svgImage must be provided", type: Upload }),
    svgImage: stringArg({ description: "The new order's svg image, this or image must be provided" }),
  },
  resolve: async (_root, { id, svgImage, image, additionalInfo }, { pubsub }) => {
    // Get the order or throw if not found
    const order = await getRequiredOrder(id)
    // Get image URL
    const saveFileResult: INewFile = await saveImage(svgImage, image)
    const imageUrl = getFileUrl(saveFileResult.filename)
    // New order info
    const newOrderInfo = { imageUrl, additionalInfo } as IOrderInfo
    // Add a new order info
    order.orderInfoList.push(newOrderInfo)
    // Save and publish edit
    const editedOrder = await order.save()
    await publishOrderChange(ChangeTypes.UPDATED, pubsub, editedOrder)
    return editedOrder
  },
})
*/

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

const ordersChanged = subscriptionField("ordersChanged", {
  type: nonNull(OrderPublished),
  description: "React to orders change, will give back change type if subscribing to all changes",
  args: {
    changeType: arg({
      type: ChangeType,
      description: "The type of change that needs to trigger the push, defaults to all changes",
      default: ChangeTypes.ALL,
    }),
  },
  subscribe: async (_root, { changeType }, { pubsub }) => {
    return await pubsub.subscribe(`ORDERS_CHANGED_${changeType}`)
  },
  resolve: async (payload) => {
    return payload
  },
})

const OrderQuery = [readOrders, readOrder]

const OrderMutation = [createOrder, updateOrder, addOrderInfo, deleteOrder]

const OrderSubscription = [ordersChanged]

export { OrderQuery, OrderMutation, OrderSubscription }
