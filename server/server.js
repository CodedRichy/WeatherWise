import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { clerkMiddleware } from '@clerk/express'
import { connectDB } from './config/db.js'
import { errorHandler } from './middleware/errorHandler.js'
import { rateLimiter } from './middleware/rateLimiter.js'
import authRoutes from './routes/auth.js'
import weatherRoutes from './routes/weather.js'
import predictionRoutes from './routes/predictions.js'
import activityRoutes from './routes/activities.js'
import userRoutes from './routes/user.js'
import smartRoutes from './routes/smart.js'
import { startCacheCleanup } from './jobs/cacheCleanup.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174').split(',')
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)), credentials: true }))
app.use(express.json())
app.use(clerkMiddleware())
app.use(rateLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/predict', predictionRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/smart', smartRoutes)
app.use('/api', userRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`))
  startCacheCleanup()
})
