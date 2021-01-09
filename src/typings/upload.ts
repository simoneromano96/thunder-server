import { GraphQLUpload } from "graphql-upload"
import { asNexusMethod } from "nexus"

export const Upload = asNexusMethod(GraphQLUpload, "upload")
