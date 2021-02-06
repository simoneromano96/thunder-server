import { Schema, model, Document } from "mongoose"

interface IOrderInfo {
  // id?: string
  imageUrl: string[]
  completed: boolean
  waiter?: string
  additionalInfo?: string | undefined | null
  createdAt?: Date
  updatedAt?: Date
}

interface OrderInfoDocument extends IOrderInfo, Document {}

const OrderInfoSchema = new Schema(
  {
    // The image of the order
    imageUrls: {
      type: [String],
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
    // waiter: {
    //   type: String,
    //   // required: true,
    // },
    order: { type: Schema.Types.ObjectId, ref: "order" },
  },
  { timestamps: true },
)

const OrderInfoModel = model<OrderInfoDocument>("orderInfo", OrderInfoSchema)

export { IOrderInfo, OrderInfoDocument, OrderInfoModel }
