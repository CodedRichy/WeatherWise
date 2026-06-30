import mongoose from 'mongoose'

const { Schema } = mongoose

const favoriteSchema = new Schema({
  userId: { type: String, required: true },
  city: { type: String, required: true },
  lat: Number,
  lon: Number,
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('Favorite', favoriteSchema)
