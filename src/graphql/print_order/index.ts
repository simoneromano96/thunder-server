import { arg, booleanArg, idArg, inputObjectType, list, nonNull, objectType, queryField, stringArg } from "nexus"
import got from "got"

import config from "../../config"

export const Product = objectType({
  name: "Product",
  description: "A product belongs to a new print order that will be sent to the rch printf server api",
  definition(t) {
    t.nonNull.string("name", { description: "The product name" })
    t.nonNull.float("price", { description: "The product's price" })
    t.nonNull.int("quantity", { description: "The product's quantity" })
    // name*	string
    // price*	number
    // quantity*	integer
  },
})

export const ProductInput = inputObjectType({
  name: "ProductInput",
  description: "A product belongs to a new print order that will be sent to the rch printf server api",
  definition(t) {
    t.nonNull.string("name", { description: "The product name" })
    t.nonNull.float("price", { description: "The product's price" })
    t.nonNull.int("quantity", { description: "The product's quantity" })
    // name*	string
    // price*	number
    // quantity*	integer
  },
})

export const NewPrintOrderInput = inputObjectType({
  name: "NewPrintOrderInput",
  description: "A new print order input",
  definition(t) {
    t.field("products", { type: nonNull(list(nonNull(ProductInput))), description: "The products to print" })
  },
})

export const newPrintOrder = queryField("newPrintOrder", {
  type: nonNull(list(nonNull(Product))),
  description: "Creates a new print order that will be sent to the rch printf server api",
  args: {
    printOrder: arg({ type: nonNull(NewPrintOrderInput), description: "The new print order details" }),
  },
  resolve: async (_root, { printOrder }, _context) => {
    await got.post(`${config.app.easyRchPrintfUri}/new-order`, {
      json: {
        products: printOrder.products ?? [],
      },
      responseType: "json",
    })

    return printOrder.products
  },
})

export const PrintOrderQuery = [newPrintOrder]
