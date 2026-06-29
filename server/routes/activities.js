import { Router } from 'express'
import { getScores, getBestWindow } from '../controllers/activityController.js'

const router = Router()

// GET /api/activities/scores?lat=&lon=
router.get('/scores', getScores)

// GET /api/activities/best-window?activity=running&days=7&lat=&lon=
router.get('/best-window', getBestWindow)

export default router
