import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const need = (name: string): string => {
  const v = process.env[name]
  if (!v) throw new Error(`Variable d environnement manquante : ${name}`)
  return v
}

const isProd = process.env.NODE_ENV === "production"
const redisUrl = need("REDIS_URL")
const useS3 = Boolean(process.env.S3_BUCKET)
const useStripe = Boolean(process.env.STRIPE_API_KEY)
const useSmtp = Boolean(process.env.SMTP_HOST)

export default defineConfig({
  projectConfig: {
    databaseUrl: need("DATABASE_URL"),
    redisUrl,
    workerMode: (process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server") ?? "shared",
    http: {
      storeCors: need("STORE_CORS"),
      adminCors: need("ADMIN_CORS"),
      authCors: need("AUTH_CORS"),
      jwtSecret: need("JWT_SECRET"),
      cookieSecret: need("COOKIE_SECRET"),
    },
    // SSL base : en prod, fournir le CA du fournisseur (rejectUnauthorized: true) dès que possible
    databaseDriverOptions: isProd ? { connection: { ssl: { rejectUnauthorized: false } } } : {},
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [
    { resolve: "@medusajs/medusa/cache-redis", options: { redisUrl } },
    { resolve: "@medusajs/medusa/event-bus-redis", options: { redisUrl } },
    { resolve: "@medusajs/medusa/workflow-engine-redis", options: { redis: { redisUrl } } },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          { resolve: "@medusajs/medusa/locking-redis", id: "locking-redis", is_default: true, options: { redisUrl } },
        ],
      },
    },
    ...(useStripe
      ? [
          {
            resolve: "@medusajs/medusa/payment",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/payment-stripe",
                  id: "stripe",
                  options: { apiKey: need("STRIPE_API_KEY"), webhookSecret: need("STRIPE_WEBHOOK_SECRET"), capture: true },
                },
              ],
            },
          },
        ]
      : []),
    ...(useSmtp
      ? [
          {
            resolve: "@medusajs/medusa/notification",
            options: {
              providers: [
                {
                  resolve: "./src/modules/smtp-notification",
                  id: "smtp",
                  options: {
                    channels: ["email"],
                    host: need("SMTP_HOST"),
                    port: Number(need("SMTP_PORT")),
                    secure: process.env.SMTP_SECURE === "true",
                    user: process.env.SMTP_USER || undefined,
                    pass: process.env.SMTP_PASS || undefined,
                    from: need("MAIL_FROM"),
                  },
                },
              ],
            },
          },
        ]
      : []),
    ...(useS3
      ? [
          {
            resolve: "@medusajs/medusa/file",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/file-s3",
                  id: "s3",
                  options: {
                    file_url: need("S3_FILE_URL"),
                    access_key_id: need("S3_ACCESS_KEY_ID"),
                    secret_access_key: need("S3_SECRET_ACCESS_KEY"),
                    region: process.env.S3_REGION ?? "auto",
                    bucket: need("S3_BUCKET"),
                    endpoint: need("S3_ENDPOINT"),
                    additional_client_config: { forcePathStyle: true },
                  },
                },
              ],
            },
          },
        ]
      : []),
    { resolve: "./src/modules/withdrawal" },
    { resolve: "./src/modules/review" },
    { resolve: "./src/modules/size-guide" },
    { resolve: "./src/modules/supplier" },
  ],
})
