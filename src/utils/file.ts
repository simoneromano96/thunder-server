import { nanoid } from "nanoid"
import { extension as getExtension } from "mime-types"
import { createWriteStream, promises, ReadStream } from "fs"
import path from "path"

import { pipeline } from "stream"
import { promisify } from "util"

// Promisify pipeline function
const pipelineAsync = promisify(pipeline)

import config from "../config"

export interface INewFile {
  filepath: string
  filename: string
}

export interface IUpload {
  filename: string
  mimetype: string
  encoding: string
  createReadStream: () => ReadStream
}

export const saveFile = async (image: Promise<IUpload>): Promise<INewFile> => {
  const { createReadStream, mimetype } = await image

  const readStream = createReadStream()

  const uploadsDir = config.app.uploads.path

  const randomId = nanoid()
  const fileExtension = getExtension(mimetype)

  const filename = `${randomId}.${fileExtension}`
  const filepath = path.join(uploadsDir, filename)
  const writeStream = createWriteStream(filepath)

  await pipelineAsync(readStream, writeStream)

  return { filepath, filename }
}

export const saveStringFile = async (fileContent: string, fileExtension: string): Promise<INewFile> => {
  const randomId = nanoid()

  const uploadsDir = config.app.uploads.path

  const filename = `${randomId}.${fileExtension}`
  const filepath = path.join(uploadsDir, filename)

  await promises.writeFile(filepath, fileContent)

  return { filepath, filename }
}

export const saveImage = async (svgImage: string | null | undefined, image?: Promise<IUpload>): Promise<INewFile> => {
  if (!svgImage && !image) {
    throw new Error("Must have image or svgImage")
  }
  let saveFileResult!: INewFile
  if (image) {
    saveFileResult = await saveFile(image)
  } else if (svgImage) {
    saveFileResult = await saveStringFile(svgImage, "svg")
  }
  return saveFileResult
}

export const getPublicPrefix = (): string => `${config.app.apiPrefix ?? ""}${config.app.staticPrefix}`

export const getFileUrl = (filename: string): string => `${config.app.hostname}/${getPublicPrefix()}/${filename}`
