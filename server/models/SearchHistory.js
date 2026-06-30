import mongoose from 'mongoose'

const { Schema } = mongoose

const searchHistorySchema = new Schema({
  userId: { type: String, required: true },
  city: String,
  lat: Number,
  lon: Number,
  weatherSnapshot: Object,
  searchedAt: { type: Date, default: Date.now },
})

searchHistorySchema.index({ userId: 1, searchedAt: -1 })
searchHistorySchema.index({ searchedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

export default mongoose.model('SearchHistory', searchHistorySchema)
