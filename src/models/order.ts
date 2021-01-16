import { Schema, model, Document } from "mongoose"

interface Order {
  table: string
  // waiter: string
  imageUrls: string[]
  additionalInfo?: string
  // shift: number
  closed: boolean
}

interface OrderDocument extends Order, Document {}

const OrderSchema = new Schema(
  {
    // MAYBEDO new collection for tables
    table: {
      type: String,
      required: true,
    },
    // TODO
    waiter: {
      type: String,
      // required: true,
    },
    imageUrls: {
      type: [String],
      required: true,
    },
    additionalInfo: {
      type: String,
    },
    // Can exist only with a table collection
    // shift: {
    //   type: Number,
    //   default: 0,
    // },
    closed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

const OrderModel = model<OrderDocument>("order", OrderSchema)

export { Order, OrderDocument, OrderModel }
