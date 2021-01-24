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

/**
 * Saves a file of a form-url-upload field
 * @param image the raw binary image data
 */
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

/**
 * Saves a string content as a file
 * @param fileContent The string with the file contents
 * @param fileExtension The file extension
 */
export const saveStringFile = async (fileContent: string, fileExtension: string): Promise<INewFile> => {
  const randomId = nanoid()

  const uploadsDir = config.app.uploads.path

  const filename = `${randomId}.${fileExtension}`
  const filepath = path.join(uploadsDir, filename)

  await promises.writeFile(filepath, fileContent)

  return { filepath, filename }
}

/**
 * Saves an image to a file, gives back the internal filepath and generated name
 * @param svgImage A stringified svg image
 * @param image A raw image (or any file)
 */
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

/**
 * Gets this server's public prefix
 */
export const getPublicPrefix = (): string => `${config.app.apiPrefix ?? ""}${config.app.staticPrefix}`

/**
 * From the filename (including the extension) gives back the full URL of where to find the file
 * @param filename the file name (ex. something.jpeg)
 */
export const getFileUrl = (filename: string): string => `${config.app.hostname}${getPublicPrefix()}/${filename}`
