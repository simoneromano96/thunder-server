import { arg, booleanArg, idArg, list, nonNull, queryField, stringArg } from "nexus"
import prisma from "../../utils/db"
import { getRequiredOrder } from "./api"
import { Order, Ordering } from "./types"

// Read
export const readOrders = queryField("orders", {
  type: nonNull(list(Order)),
  description: "Returns all the current orders",
  args: {
    table: stringArg({ description: "The order's table" }),
    closed: booleanArg({
      description: "Wether or not we should filter only open orders, defaults on false getting only the active orders",
      default: false,
    }),
    orderByCreated: arg({
      type: Ordering,
      description: "Optionally order by createdAt field, cannot specify both orderByCreated and orderByUpdated",
      // default: Orderings.ASC,
    }),
    orderByUpdated: arg({
      type: Ordering,
      description: "Optionally order by updatedAt field, cannot specify both orderByCreated and orderByUpdated",
      // default: Orderings.ASC,
    }),
  },
  resolve: async (_root, { table, closed, orderByCreated, orderByUpdated }, _context) => {
    const orders = await prisma.order.findMany({
      where: { table: table ?? undefined, closed: closed ?? undefined },
      orderBy: {
        createdAt: (orderByCreated?.toLocaleLowerCase() as "asc" | "desc") ?? undefined,
        updatedAt: (orderByUpdated?.toLocaleLowerCase() as "asc" | "desc") ?? undefined,
      },
      include: { orderInfoList: true },
    })
    return orders
  },
})

export const readOrder = queryField("order", {
  type: nonNull(Order),
  description: "Returns an order by its ID",
  args: {
    id: nonNull(idArg({ description: "The order's ID" })),
  },
  resolve: async (_root, { id }, _context) => await getRequiredOrder(id),
})
