import { Schema, model, Document } from "mongoose"
import { IOrderInfo } from "./orderDetails"

interface IOrder {
  // id?: string
  table: number
  closed: boolean
  orderInfoList: IOrderInfo[]
  createdAt?: Date
  updatedAt?: Date
}

interface OrderDocument extends IOrder, Document {}

const OrderSchema = new Schema(
  {
    // MAYBEDO new collection for tables
    table: {
      type: Number,
      required: true,
    },
    // imageUrls: {
    //   type: [String],
    //   required: true,
    // },
    // Can exist only with a table collection
    // shift: {
    //   type: Number,
    //   default: 0,
    // },
    // If the whole order has been completed
    closed: {
      type: Boolean,
      default: false,
    },
    // All the order infos
    orderInfoList: [{ type: Schema.Types.ObjectId, ref: "orderInfo" }],
  },
  { timestamps: true },
)

const OrderModel = model<OrderDocument>("order", OrderSchema)

export { IOrder, OrderDocument, OrderModel }
