import { nanoid } from "nanoid"
import { arg, idArg, list, mutationField, nonNull } from "nexus"

import { requireAvailableTable, publishOrderChange, getRequiredOrder } from "./api"
import { Order, CreateOrderInput, UpdateOrderInput, ChangeTypes } from "./types"

import { Upload } from "../../typings"
import prisma from "../../utils/db"
import { getFileUrl, INewFile, IUpload, saveImage } from "../../utils/file"
import { OrderInfoInput } from "../orderInfo"

// Create
export const createOrder = mutationField("createOrder", {
  type: nonNull(Order),
  description: "Creates a new order",
  args: {
    input: nonNull(arg({ type: nonNull(CreateOrderInput), description: "The new order input" })),
    uploadImageList: list(
      arg({
        type: Upload,
        description:
          "The order's images that actually contains all the order info, this or input.orderInfo.svgList must be defined",
      }),
    ),
  },
  resolve: async (_root, { input, uploadImageList }, { pubsub }) => {
    // Check for available table
    await requireAvailableTable(input.table)

    const { svgList } = input.orderInfo
    if (!svgList && !uploadImageList) {
      throw new Error("Must have svgList or uploadImageList")
    }
    let saveImagePromises: Array<Promise<string>> = []
    if (svgList !== null && svgList !== undefined) {
      // Save Images to local disk
      saveImagePromises = svgList.map(async (svgImage: string) => {
        // Get image URL
        const saveFileResult: INewFile = await saveImage(svgImage)
        const imageUrl = getFileUrl(saveFileResult.filename)
        return imageUrl
      })
    }
    if (uploadImageList !== null && uploadImageList !== undefined) {
      // Save Images to local disk
      saveImagePromises = uploadImageList.map(async (image: Promise<IUpload>) => {
        // Get image URL
        const saveFileResult: INewFile = await saveImage(undefined, image)
        const imageUrl = getFileUrl(saveFileResult.filename)
        return imageUrl
      })
    }

    const imageUrls: string[] = await Promise.all(saveImagePromises)

    // Create Order
    const newOrder = await prisma.order.create({ data: { id: nanoid(32), table: input.table } })

    // Create Order Info
    await prisma.orderInfo.create({
      data: {
        id: nanoid(32),
        additionalInfo: input.orderInfo.additionalInfo,
        imageUrls,
        orderId: newOrder.id,
      },
    })

    // Return order
    const order = await prisma.order.findUnique({
      where: { id: newOrder.id },
      include: { orderInfoList: true },
      rejectOnNotFound: true,
    })

    await publishOrderChange(pubsub, ChangeTypes.CREATED, order)

    return order
  },
})

// Update
export const updateOrder = mutationField("updateOrder", {
  type: nonNull(Order),
  description: "Updates an order",
  args: {
    input: nonNull(
      arg({
        type: UpdateOrderInput,
        description: "The update order input, note that currently the orderInfoList is ignored",
      }),
    ),
  },
  resolve: async (_root, { input }, { pubsub }) => {
    const { id, ...updateInfo } = input

    await prisma.order.update({
      where: {
        id,
      },
      data: {
        closed: updateInfo.closed ?? undefined,
        table: updateInfo.table ?? undefined,
      },
    })

    const order = await getRequiredOrder(input.id)

    await publishOrderChange(pubsub, ChangeTypes.UPDATED, order)

    return order
  },
})

export const addOrderInfo = mutationField("addOrderInfo", {
  type: nonNull(Order),
  description: "Adds order info to an order",
  args: {
    id: nonNull(idArg({ description: "The ID of the order to edit" })),
    orderInfoInput: nonNull(arg({ type: OrderInfoInput, description: "The order info to add to the order" })),
    uploadImageList: list(
      arg({
        type: Upload,
        description:
          "The order's images that actually contains all the order info, this or orderInfoInput.svgList must be defined",
      }),
    ),
  },
  resolve: async (_root, { id, orderInfoInput, uploadImageList }, { pubsub }) => {
    const { svgList, ...orderInfoList } = orderInfoInput
    if (!svgList && !uploadImageList) {
      throw new Error("Must have svgList or uploadImageList")
    }
    let saveImagePromises: Array<Promise<string>> = []
    if (svgList !== null && svgList !== undefined) {
      // Save Images to local disk
      saveImagePromises = svgList.map(async (svgImage: string) => {
        // Get image URL
        const saveFileResult: INewFile = await saveImage(svgImage)
        const imageUrl = getFileUrl(saveFileResult.filename)
        return imageUrl
      })
    }
    if (uploadImageList !== null && uploadImageList !== undefined) {
      // Save Images to local disk
      saveImagePromises = uploadImageList.map(async (image: Promise<IUpload>) => {
        // Get image URL
        const saveFileResult: INewFile = await saveImage(undefined, image)
        const imageUrl = getFileUrl(saveFileResult.filename)
        return imageUrl
      })
    }

    const imageUrls: string[] = await Promise.all(saveImagePromises)

    await prisma.orderInfo.create({
      data: {
        id: nanoid(32),
        orderId: id,
        additionalInfo: orderInfoList.additionalInfo ?? undefined,
        completed: orderInfoList.completed ?? undefined,
        imageUrls,
      },
    })

    const order = await getRequiredOrder(id)

    await publishOrderChange(pubsub, ChangeTypes.UPDATED, order)

    return order
  },
})

// Delete
export const deleteOrder = mutationField("deleteOrder", {
  type: nonNull(Order),
  description: "Deletes an order",
  args: {
    id: nonNull(idArg({ description: "The ID of the order to delete" })),
  },
  resolve: async (_root, { id }, { pubsub }) => {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderInfoList: true },
      rejectOnNotFound: true,
    })

    const deleteOrder = prisma.order.delete({ where: { id } })
    const deleteOrderInfos = prisma.orderInfo.deleteMany({ where: { orderId: id } })
    await prisma.$transaction([deleteOrderInfos, deleteOrder])

    await publishOrderChange(pubsub, ChangeTypes.DELETED, order)
    return order
  },
})
