import { arg, idArg, list, mutationField, nonNull, objectType, queryField, stringArg, unionType } from "nexus"

import { OrderModel } from "../models/order"
import { Upload } from "../typings"
import { getFileUrl, INewFile, saveFile, saveStringFile } from "../utils/file"

const Order = objectType({
  name: "Order",
  description: "An order object",
  definition(t) {
    t.id("id", { description: "The order's unique ID" })
    t.string("table", { description: "The table of the order" })
    t.string("waiter", { description: "The waiter that made the order" })
    t.string("imageUrl", { description: "Uploaded image url" })
    t.string("additionalInfo", { description: "The order's additional info" })
    t.int("shift", { description: "The order's table shift" })
  },
})

const ordersQuery = queryField("orders", {
  type: list(nonNull(Order)),
  description: "Returns the current orders",
  args: {
    table: stringArg({ description: "The order's table" }),
    waiter: stringArg({ description: "The order's waiter" }),
  },
  resolve: async (_root, { table, waiter }, _context) => {
    let query = {}
    if (table) {
      query = { ...query, table }
    }
    if (waiter) {
      query = { ...query, waiter }
    }

    return await OrderModel.find(query)
  },
})

const newOrderMutation = mutationField("newOrder", {
  type: nonNull(Order),
  description: "Creates a new order",
  args: {
    table: nonNull(stringArg({ description: "The new order's table" })),
    waiter: stringArg({ description: "The new order's waiter" }),
    additionalInfo: stringArg({ description: "The new order's optional additional informations" }),
    image: arg({ description: "The new order's image, this or svgImage must be provided", type: Upload }),
    svgImage: stringArg({ description: "The new order's svg image, this or image must be provided" }),
  },
  resolve: async (_root, { svgImage, image, table, waiter, additionalInfo }, _context) => {
    if (!svgImage && !image) {
      throw new Error("Must have image or svgImage")
    }
    let saveFileResult!: INewFile
    if (image) {
      saveFileResult = await saveFile(image)
    } else if (svgImage) {
      saveFileResult = await saveStringFile(svgImage, "svg")
    }
    const imageUrl = getFileUrl(saveFileResult.filename)

    const newOrder = new OrderModel({ table, waiter, imageUrl, additionalInfo })
    return await newOrder.save()
  },
})

const closeOrderShiftMutation = mutationField("closeOrderShift", {
  type: nonNull(Order),
  description: "Closes the current order, freing the table for the next shift",
  args: {
    orderId: nonNull(idArg({ description: "The order's ID" })),
    // table: nonNull(stringArg({ description: "The table that needs to be closed" })),
  },
  resolve: async (_root, { orderId }, _context) => {
    const order = await OrderModel.findById(orderId)
    if (!order) {
      throw new Error("Could not find order")
    }
    order.shift++
    await order.save()
    return order
  },
})

const OrderQuery = [ordersQuery]

const OrderMutation = [newOrderMutation, closeOrderShiftMutation]

export { OrderQuery, OrderMutation }
