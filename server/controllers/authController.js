import User from '../models/User.js'

export async function getMe(req, res, next) {
  try {
    const { userId } = req.auth
    let user = await User.findOne({ clerkId: userId })
    if (!user) {
      user = await User.create({ clerkId: userId })
    }
    return res.json(user)
  } catch (err) {
    next(err)
  }
}

export async function updateMe(req, res, next) {
  try {
    const { userId } = req.auth
    const { units, theme, narrativeStyle } = req.body
    const update = {}
    if (units && ['metric', 'imperial'].includes(units)) update['preferences.units'] = units
    if (theme && ['light', 'dark', 'auto'].includes(theme)) update['preferences.theme'] = theme
    if (narrativeStyle && ['casual', 'formal'].includes(narrativeStyle)) update['preferences.narrativeStyle'] = narrativeStyle
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { $set: update },
      { new: true, upsert: true }
    )
    res.json(user)
  } catch (err) {
    next(err)
  }
}
