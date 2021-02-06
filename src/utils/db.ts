import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({ log: ["query", "info", `warn`, `error`] })

// SOFT DELETE MIDDLEWARE

// READ
prisma.$use(async (params, next) => {
  if (["Order", "OrderInfo"].includes(params.model ?? "")) {
    if (params.action == "findUnique") {
      // Change to findFirst - you cannot filter
      // by anything except ID / unique with findUnique
      params.action = "findFirst"
      // Add 'deleted' filter
      // ID filter maintained
      params.args.where["deleted"] = null
    }
    if (params.action == "findMany") {
      // Find many queries
      if (params.args.where != undefined) {
        if (params.args.where.deleted == undefined) {
          // Exclude deleted records if they have not been expicitly requested
          params.args.where["deleted"] = null
        }
      } else {
        params.args["where"] = { deleted: null }
      }
    }
  }
  return next(params)
})

// UPDATE
prisma.$use(async (params, next) => {
  if (["Order", "OrderInfo"].includes(params.model ?? "")) {
    if (params.action === "update") {
      // Change to updateMany - you cannot filter
      // by anything except ID / unique with findUnique
      params.action = "updateMany"
      // Add 'deleted' filter
      // ID filter maintained
      params.args.where["deleted"] = null
    }
    if (params.action == "updateMany") {
      if (params.args.where != undefined) {
        params.args.where["deleted"] = null
      } else {
        params.args["where"] = { deleted: null }
      }
    }
  }
  return next(params)
})

// DELETE
prisma.$use(async (params, next) => {
  // Check incoming query type
  if (["Order", "OrderInfo"].includes(params.model ?? "")) {
    if (params.action === "delete") {
      // Delete queries
      // Change action to an update
      params.action = "update"
      params.args["data"] = { deleted: new Date() }
    }
    if (params.action === "deleteMany") {
      // Delete many queries
      params.action = "updateMany"
      if (params.args.data !== undefined) {
        params.args.data["deleted"] = new Date()
      } else {
        params.args["data"] = { deleted: new Date() }
      }
    }
  }
  return next(params)
})

// END SOFT DELETE MIDDLEWARE

export default prisma
