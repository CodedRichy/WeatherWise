import { Router } from 'express'
import {
  getCurrent,
  getForecast,
  getHourly,
  getCompare,
  getNarrative,
  geocode,
  getHistory,
} from '../controllers/weatherController.js'

const router = Router()

// All weather routes are public but will save history when req.user is present
router.get('/current', getCurrent)
router.get('/forecast', getForecast)
router.get('/hourly', getHourly)
router.get('/compare', getCompare)
router.get('/narrative', getNarrative)
router.get('/geocode', geocode)
router.get('/history', getHistory)

export default router
