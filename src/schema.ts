import { makeSchema } from "nexus"
import { join } from "path"

// import { AuthMutation, AuthQuery } from "./graphql/auth"
import { OrderQuery, OrderMutation, OrderSubscription } from "./graphql/order"
import { UserMutation, UserQuery } from "./graphql/user"

import { GQLDateTime, Upload } from "./typings"

export const schema = makeSchema({
  types: [GQLDateTime, Upload, OrderQuery, OrderMutation, OrderSubscription, UserQuery, UserMutation],
  outputs: {
    typegen: join(__dirname, "generated", "typegen.ts"),
    schema: join(__dirname, "generated", "schema.graphql"),
  },
})
