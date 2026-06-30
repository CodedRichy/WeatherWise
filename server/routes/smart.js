import { Router } from 'express'
import { getOracle, getUV, getSunset, getBioWeather } from '../controllers/smartController.js'

const router = Router()

router.get('/oracle', getOracle)
router.get('/uv', getUV)
router.get('/sunset', getSunset)
router.get('/bio', getBioWeather)

export default router
