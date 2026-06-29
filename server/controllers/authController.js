import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const hashed = await bcrypt.hash(password, 12)
    await User.create({ name, email, password: hashed })

    return res.status(201).json({ message: 'Account created' })
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    user.refreshToken = refreshToken
    await user.save()

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' })
    }

    let decoded
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    const user = await User.findById(decoded.id)
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Refresh token mismatch' })
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    return res.json({ accessToken })
  } catch (err) {
    next(err)
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.json(user)
  } catch (err) {
    next(err)
  }
}

export async function logout(req, res, next) {
  try {
    const user = await User.findById(req.user.id)
    if (user) {
      user.refreshToken = null
      await user.save()
    }
    return res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function updateMe(req, res, next) {
  try {
    const { units, theme, narrativeStyle } = req.body
    const update = {}
    if (units && ['metric', 'imperial'].includes(units)) update['preferences.units'] = units
    if (theme && ['light', 'dark', 'auto'].includes(theme)) update['preferences.theme'] = theme
    if (narrativeStyle && ['casual', 'formal'].includes(narrativeStyle)) update['preferences.narrativeStyle'] = narrativeStyle
    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true }).select('-password -refreshToken')
    res.json(user)
  } catch (err) {
    next(err)
  }
}
