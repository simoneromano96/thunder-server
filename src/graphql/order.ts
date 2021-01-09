import { arg, mutationField, nonNull, objectType, queryField } from "nexus"
import { createWriteStream } from "fs"
import path from "path"
import { pipeline } from "stream"
import { promisify } from "util"

// Promisify pipeline function
const pipelineAsync = promisify(pipeline)

import config from "../config"
import { Upload } from "../typings"

const Order = objectType({
  name: "Order",
  description: "An order object",
  definition(t) {
    t.string("table", { description: "The table of the order" })
    t.string("waiter", { description: "The waiter that made the order" })
    t.string("imageUrl", { description: "Uploaded image url" })
    t.string("additionalInfo", { description: "The order's additional info" })
  },
})

const emptyQuery = queryField("empty", {
  type: "Boolean",
  description: "Returns true",
  resolve: () => true,
})

const newOrderMutation = mutationField("newOrder", {
  type: Order,
  description: "Creates a new order",
  args: {
    image: nonNull(
      arg({
        type: Upload,
      }),
    ),
  },
  resolve: async (_root, { image }, _context) => {
    const { filename, createReadStream } = await image
    const readStream = createReadStream()

    const uploadsDir = config.app.uploads.path
    const writeStream = createWriteStream(path.join(uploadsDir, filename))

    await pipelineAsync(readStream, writeStream)

    return {
      table: "table 1",
      waiter: "waiter 1",
      imageUrl: "/app",
      additionalInfo: "example 1",
    }
  },
})

const OrderQuery = [emptyQuery]

const OrderMutation = [newOrderMutation]

export { OrderQuery, OrderMutation }
