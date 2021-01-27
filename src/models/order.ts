import { Schema, model, Document } from "mongoose"

interface IOrderInfo {
  // id?: string
  imageUrl: string
  completed: boolean
  waiter?: string
  additionalInfo?: string | undefined | null
  createdAt?: Date
  updatedAt?: Date
}

interface IOrder {
  // id?: string
  table: number
  closed: boolean
  orderInfoList: IOrderInfo[]
  createdAt?: Date
  updatedAt?: Date
}

interface OrderDocument extends IOrder, Document {}

// interface OrderInfoDocument extends IOrderInfo, Document {}

const OrderInfoSchema = new Schema(
  {
    // The image of the order
    imageUrl: {
      type: String,
      required: true,
    },
    // If the order has been completed
    completed: {
      type: Boolean,
      default: false,
    },
    // Additional info from keyboard input
    additionalInfo: {
      type: String,
    },
    // TODO
    waiter: {
      type: String,
      // required: true,
    },
  },
  { timestamps: true },
)

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
    orderInfoList: {
      type: [OrderInfoSchema],
    },
  },
  { timestamps: true },
)

const OrderModel = model<OrderDocument>("order", OrderSchema)

export { IOrder, IOrderInfo, OrderDocument, OrderModel }
