import { nanoid } from "nanoid"
import { extension as getExtension } from "mime-types"
import { createWriteStream, promises, ReadStream } from "fs"
import path from "path"
import { pipeline } from "stream/promises"

import config from "../config"
import { optimizeSvg } from "./optimizeSvg"

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
 * Creates a random file name and gets the full path to the upload directory
 * @param fileExtension The file's extension
 */
const getFilepathAndFilename = (fileExtension: string) => {
  const randomId = nanoid()
  const filename = `${randomId}.${fileExtension}`

  const uploadsDir = config.app.uploads.path
  const filepath = path.join(uploadsDir, filename)
  return { filepath, filename }
}

/**
 * Saves a file of a form-url-upload field
 * @param image the raw binary image data
 * @throws Will throw if the image file has no suitable file extension
 */
export const saveFile = async (image: Promise<IUpload>): Promise<INewFile> => {
  const { createReadStream, mimetype } = await image

  const readStream = createReadStream()

  const fileExtension = getExtension(mimetype)
  if (!fileExtension) {
    throw new Error("Could not find a suitable file extension")
  }

  const { filepath, filename } = getFilepathAndFilename(fileExtension)

  const writeStream = createWriteStream(filepath)

  await pipeline(readStream, writeStream)

  return { filepath, filename }
}

/**
 * Saves a string content as a file
 * @param fileContent The string with the file contents
 * @param fileExtension The file extension
 */
export const saveStringFile = async (fileContent: string, fileExtension: string): Promise<INewFile> => {
  const { filepath, filename } = getFilepathAndFilename(fileExtension)

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
    const optimized = await optimizeSvg(svgImage)
    saveFileResult = await saveStringFile(optimized, "svg")
  }
  return saveFileResult
}

export const saveBase64Image = async (base64Image: string): Promise<INewFile> => {
  // const base64Data = base64Image.replace(/^data:image\/png;base64,/, "")
  return await saveStringFile(base64Image, "png")
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
