import { Prisma } from "@prisma/client"
import { arg, idArg, inputObjectType, mutationField, nonNull, objectType, queryField } from "nexus"

const OrderInfoInput = inputObjectType({
  name: "OrderInfoInput",
  description: "The order's info input",
  definition(t) {
    t.string("additionalInfo", { description: "The order's additional info" })
    t.boolean("served", { description: "If the current order info has been served" })
    // t.string("imageUrl", { description: "The order's uploaded image, actually contains all the order info" })
    t.nonNull.list.nonNull.string("svgList", {
      description: "The order's vectors that actually contains all the order info",
    })
  },
})

const OrderInfo = objectType({
  name: "OrderInfo",
  description: "The order's info",
  definition(t) {
    t.id("id", { description: "The order info's unique ID" })
    t.string("additionalInfo", { description: "The order's additional info" })
    t.nonNull.boolean("served", { description: "If the current order info has been served" })
    t.nonNull.list.string("imageUrls", {
      description: "The order's uploaded image, actually contains all the order info",
    })
    t.field("createdAt", { type: "DateTime", description: "When the order info has been created" })
    t.field("updatedAt", { type: "DateTime", description: "When the order info has been last updated" })
  },
})

// Create
// const createOrderInfoMutation = mutationField("createOrderInfo", {
//   type: nonNull(OrderInfo),
//   args: {
//     input: arg({ type: OrderInfoInput, description: "The order info input" }),
//   },
//   resolve: async (_root, { input }, _context) => {
//     let orderInfo: Prisma.OrderInfoCreateInput
//   },
// })

// Read
// const readOrderInfoQuery = queryField("orderInfo", {
//   type: nonNull(OrderInfo),
//   args: {
//     id: idArg({ description: "The order info ID" }),
//   },
//   resolve: async (_root, { id }, _context) => {},
// })

// const OrderInfoQuery = []
// 
// const OrderInfoMutation = []
// 
// export { OrderInfoQuery, OrderInfoMutation, OrderInfo, OrderInfoInput }