import { resolve } from "path"
import { argon2id } from "argon2"

export default {
  app: {
    port: process.env.APP_PORT ?? 3001,
    db: process.env.APP_DB ?? "mongodb://root:example@localhost",
    apiPrefix: process.env.APP_API_PREFIX,
    staticPrefix: process.env.APP_STATIC_PREFIX ?? "/public",
    hostname: process.env.APP_HOSTNAME ?? "http://localhost:3001",
    easyRchPrintfUri: process.env.APP_EASY_RCH_PRINTF_URI ?? "https://easy-rch-printf.simoneromano.eu",
    session: {
      secret: process.env.APP_SESSION_SECRET ?? "CNLxr58XzCaZuodxfZxQsOCRxTRrCki5",
    },
    cookie: {
      domain: process.env.APP_SESSION_DOMAIN ?? "localhost",
      secure: process.env.APP_SESSION_SECURE === "true",
      httpOnly: process.env.APP_SESSION_HTTP_ONLY === "true",
    },
    redis: {
      host: process.env.APP_REDIS_HOST ?? "localhost",
      port: parseInt(process.env.APP_REDIS_PORT ?? "6379", 10),
    },
    cors: {
      origin: process.env.APP_CORS_ORIGIN ?? "http://localhost:3001",
    },
    hash: {
      type: argon2id,
    },
    uploads: {
      path: process.env.APP_UPLOADS_PATH ?? resolve(__dirname, "..", "uploads"),
    },
  },
}
