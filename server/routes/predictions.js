import { Router } from 'express'
import {
  getTemperaturePrediction,
  getRainPrediction,
  getExplain,
} from '../controllers/predictionController.js'

const router = Router()

// GET /api/predict/temperature?lat=&lon=
router.get('/temperature', getTemperaturePrediction)

// GET /api/predict/rain?lat=&lon=
router.get('/rain', getRainPrediction)

// GET /api/predict/explain?lat=&lon=
router.get('/explain', getExplain)

export default router
