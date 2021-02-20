import { arg, nonNull, subscriptionField } from "nexus"
import { OrderPublished, ChangeType, ChangeTypes } from "./types"

export const ordersChanged = subscriptionField("ordersChanged", {
  type: nonNull(OrderPublished),
  description: "React to orders change, will give back change type if subscribing to all changes",
  args: {
    changeType: arg({
      type: ChangeType,
      description: "The type of change that needs to trigger the push, defaults to all changes",
      default: ChangeTypes.ALL,
    }),
  },
  subscribe: async (_root, { changeType }, { pubsub }) => {
    return await pubsub.subscribe(`ORDERS_CHANGED_${changeType}`)
  },
  resolve: (payload: any) => {
    return payload
  },
})
