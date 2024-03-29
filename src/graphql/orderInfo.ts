import { inputObjectType, objectType } from "nexus"
// import { Upload } from "../typings"

const OrderInfoInput = inputObjectType({
  name: "OrderInfoInput",
  description: "The order's info input",
  definition(t) {
    t.string("additionalInfo", { description: "The order's additional info" })
    t.boolean("completed", { description: "If the current order info has been served/completed" })
    // t.string("imageUrl", { description: "The order's uploaded image, actually contains all the order info" })
    t.list.nonNull.string("svgList", {
      description:
        "The order's vectors that actually contains all the order info, either this or uploadImageList or b64list must be defined",
    })
    t.list.nonNull.string("b64list", {
      description:
        "The order's base 64 encoded image list, either this or uploadImageList or svgList must be defined, avoid this if possible since it will be deprecated ASAP",
    })
    // t.list.nonNull.field("uploadImageList", {
    //   type: Upload,
    //   description: "The order's images that actually contains all the order info, this or svgList must be defined",
    // })
  },
})

const OrderInfo = objectType({
  name: "OrderInfo",
  description: "The order's info",
  definition(t) {
    t.id("id", { description: "The order info's unique ID" })
    t.string("additionalInfo", { description: "The order's additional info" })
    t.nonNull.boolean("completed", { description: "If the current order info has been served/completed" })
    t.nonNull.list.string("imageUrls", {
      description: "The order's uploaded images, actually contains all the order info",
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
export { OrderInfo, OrderInfoInput }
