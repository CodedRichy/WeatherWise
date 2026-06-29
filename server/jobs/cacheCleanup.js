import cron from 'node-cron'
import { weatherCache } from '../middleware/cache.js'

export function startCacheCleanup() {
  // Run at the top of every hour
  cron.schedule('0 * * * *', () => {
    const now = Date.now()
    let removed = 0
    for (const [key, entry] of weatherCache.entries()) {
      if (now - entry.fetchedAt > entry.ttl) {
        weatherCache.delete(key)
        removed++
      }
    }
    if (removed > 0) {
      console.log(`Cache cleanup: removed ${removed} stale entr${removed === 1 ? 'y' : 'ies'}`)
    }
  })
  console.log('Cache cleanup cron registered (hourly)')
}
