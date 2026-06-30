import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  getHistory,
} from '../controllers/userController.js'

const router = Router()

router.get('/favorites', requireAuth, getFavorites)
router.post('/favorites', requireAuth, addFavorite)
router.delete('/favorites/:id', requireAuth, removeFavorite)
router.get('/history', requireAuth, getHistory)

export default router
