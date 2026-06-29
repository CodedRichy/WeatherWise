import { Router } from 'express'
import { register, login, refresh, getMe, logout } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.get('/me', requireAuth, getMe)
router.post('/logout', requireAuth, logout)

export default router
