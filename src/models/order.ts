import { Schema, model, Document } from "mongoose"

interface Order {
  table: string
  waiter: string
  imageUrl: string
  additionalInfo?: string
}

interface OrderDocument extends Order, Document {}

const OrderSchema = new Schema(
  {
    table: {
      type: String,
      required: true,
    },
    waiter: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    additionalInfo: {
      type: String,
    },
  },
  { timestamps: true },
)

const OrderModel = model<OrderDocument>("order", OrderSchema)

export { Order, OrderDocument, OrderModel }
