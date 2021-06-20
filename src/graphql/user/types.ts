import { objectType } from "nexus"

import { Licence } from "../licence/types"

/*
model User {
  id  String @id
  username String @unique
  password String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  licence Licence @relation(fields: [licenceId], references: [id])
  licenceId String
}
*/
export const User = objectType({
  name: "User",
  description: "The user object",
  definition(t) {
    t.id("id", { description: "The user's unique ID" })
    t.nonNull.string("username", { description: "The user's username" })
    t.nonNull.field("createdAt", { type: "DateTime", description: "When the user has been created" })
    t.nonNull.field("updatedAt", { type: "DateTime", description: "When the user has been last updated" })
    t.field("licence", { type: Licence, description: "The user's activated licence" })
  },
})
