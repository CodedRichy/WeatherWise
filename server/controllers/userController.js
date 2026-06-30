import Favorite from '../models/Favorite.js'
import SearchHistory from '../models/SearchHistory.js'

export async function getFavorites(req, res, next) {
  try {
    const favorites = await Favorite.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json(favorites)
  } catch (err) {
    next(err)
  }
}

export async function addFavorite(req, res, next) {
  try {
    const { city, lat, lon } = req.body
    if (!city) return res.status(400).json({ message: 'city is required' })

    const favorite = await Favorite.create({ userId: req.user.id, city, lat, lon })
    res.status(201).json(favorite)
  } catch (err) {
    next(err)
  }
}

export async function removeFavorite(req, res, next) {
  try {
    const favorite = await Favorite.findById(req.params.id)
    if (!favorite) return res.status(404).json({ message: 'Favorite not found' })
    if (String(favorite.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    await favorite.deleteOne()
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function getHistory(req, res, next) {
  try {
    const history = await SearchHistory.find({ userId: req.user.id })
      .sort({ searchedAt: -1 })
      .limit(20)
    res.json(history)
  } catch (err) {
    next(err)
  }
}
