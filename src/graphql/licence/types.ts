import { objectType } from "nexus";

/*
model Licence {
  id  String @id
  key String @unique
  email String @unique
  remainingSeats Int?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
*/
export const Licence = objectType({
  name: "Licence",
  description: "The licence object",
  definition(t) {
    t.id("id", { description: "The licence's unique ID" })
    t.nonNull.string("key", { description: "The licence key" })
    t.nonNull.string("email", { description: "The email belonging to this licence" })
    t.int("remainingSeats", { description: "How many users can use this licence, if it is not defined it means infinite" })
    t.nonNull.field("createdAt", { type: "DateTime", description: "When the licence has been created" })
    t.nonNull.field("updatedAt", { type: "DateTime", description: "When the licence has been last updated" })
  }
})
