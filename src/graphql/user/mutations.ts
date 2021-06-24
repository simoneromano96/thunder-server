import { mutationField } from "nexus"
import { signToken } from "../../utils/jwt"

export const login = mutationField("login", {
  type: "String",
  resolve: async (_root, _args, _context) => {
    const token = await signToken("0", { test: "test" })
    return token
  },
})
