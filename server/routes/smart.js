import { Router } from 'express'
import { getOracle, getUV, getSunset } from '../controllers/smartController.js'

const router = Router()

router.get('/oracle', getOracle)
router.get('/uv', getUV)
router.get('/sunset', getSunset)

export default router
