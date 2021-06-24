import { nonNull, queryField } from "nexus"
import { User } from "./types"

export const currentUser = queryField("currentUser", {
  type: "String",
  resolve: async (_root, _args, { payload }) => {
    return JSON.stringify(payload)
  },
})
