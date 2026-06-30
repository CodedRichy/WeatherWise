import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
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

dotenv.config()

if ((process.env.JWT_SECRET || '').length < 32 || (process.env.JWT_REFRESH_SECRET || '').length < 32) {
  console.warn('WARNING: JWT_SECRET and JWT_REFRESH_SECRET must be at least 32 characters. Tokens will be weak.')
}

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())
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
