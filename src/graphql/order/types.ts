import { enumType, inputObjectType, list, nonNull, objectType } from "nexus"
import { OrderInfo, OrderInfoInput } from "../orderInfo"

export enum ChangeTypes {
  ALL = "ALL",
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  DELETED = "DELETED",
}

export enum Orderings {
  ASC = "ASC",
  DESC = "DESC",
}

export const ChangeType = enumType({
  name: "ChangeType",
  description: "The type of change to an object",
  members: Object.values(ChangeTypes),
})

export const Ordering = enumType({
  name: "Ordering",
  description: "How to order a specific field",
  members: Object.values(Orderings),
})

export const Order = objectType({
  name: "Order",
  description: "An order object",
  definition(t) {
    t.nonNull.id("id", { description: "The order's unique ID" })
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

export const OrderPublished = objectType({
  name: "OrderPublished",
  description: "An order modification publication for the subscriptions",
  definition(t) {
    t.nonNull.field("order", { type: Order, description: "The affected order" })
    t.field("changeType", { type: ChangeType, description: "The type of change" })
  },
})

export const CreateOrderInput = inputObjectType({
  name: "CreateOrderInput",
  description: "The create order's input",
  definition(t) {
    t.nonNull.string("table", { description: "The order's table" })
    t.boolean("closed", { description: "If the current order has been closed" })
    t.nonNull.field("orderInfo", { type: OrderInfoInput, description: "The order details" })
  },
})

export const UpdateOrderInput = inputObjectType({
  name: "UpdateOrderInput",
  description: "The create order's input",
  definition(t) {
    t.nonNull.id("id", { description: "The order's ID" })
    t.string("table", { description: "The new order's table, should never be used" })
    t.boolean("closed", { description: "If the current order must be closed" })
    t.field("orderInfoList", { type: list(OrderInfoInput), description: "The new order details" })
  },
})
