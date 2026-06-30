import rateLimit from 'express-rate-limit'

const isDev = process.env.NODE_ENV !== 'production'

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
})
