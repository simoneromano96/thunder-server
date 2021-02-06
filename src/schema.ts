import { makeSchema } from "nexus"
import { join } from "path"

import { AuthMutation, AuthQuery } from "./graphql/auth"
import { OrderQuery, OrderMutation } from "./graphql/order"
// import { OrderInfoMutation, OrderInfoQuery } from "./graphql/orderInfo"
// import { OrderMutation, OrderQuery, OrderSubscription } from "./graphql/order"

import { GQLDateTime, Upload } from "./typings"

export const schema = makeSchema({
  types: [GQLDateTime, Upload, AuthQuery, AuthMutation, OrderQuery, OrderMutation],
  outputs: {
    typegen: join(__dirname, "generated", "typegen.ts"),
    schema: join(__dirname, "generated", "schema.graphql"),
  },
})
