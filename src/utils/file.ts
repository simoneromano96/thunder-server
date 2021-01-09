import { nanoid } from "nanoid"
import { createWriteStream } from "fs"
import path from "path"

import { pipeline } from "stream"
import { promisify } from "util"

// Promisify pipeline function
const pipelineAsync = promisify(pipeline)

import config from "../config"

export const saveFile = async (image: any): Promise<{ filepath: string; filename: string }> => {
  const { createReadStream } = await image
  const readStream = createReadStream()

  const uploadsDir = config.app.uploads.path

  const filename = nanoid()

  const filepath = path.join(uploadsDir, filename)
  const writeStream = createWriteStream(filepath)

  await pipelineAsync(readStream, writeStream)

  return { filepath, filename }
}

export const getPublicPrefix = (): string => `${config.app.apiPrefix ?? ""}${config.app.staticPrefix}`

export const getFileUrl = (filename: string): string => `${getPublicPrefix()}/${filename}`
