import { milliseconds } from "date-fns"
import { createDecoder, createSigner, createVerifier } from "fast-jwt"

interface IPayload {
  iat: number
  aud: string
  sub: string
  [key: string]: any
}

export const signToken = (userId: string, payload: any): Promise<string> => {
  const signer = createSigner({
    key: "secret",
    expiresIn: milliseconds({ months: 1 }),
    aud: "Thunder",
    iss: "Thunder API",
    sub: userId,
  })
  return signer({ payload })
}

export const decodeToken = (token: string): Promise<IPayload> => {
  const decoder = createDecoder({ complete: true })
  return decoder(token)
}

export const verifyToken = (token: string): Promise<IPayload> => {
  const verifier = createVerifier({ key: "secret", allowedAud: "Thunder", allowedIss: "Thunder API" })
  return verifier(token)
}
