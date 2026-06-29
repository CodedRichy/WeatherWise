import mongoose from 'mongoose'

const { Schema } = mongoose

const searchHistorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  city: String,
  lat: Number,
  lon: Number,
  weatherSnapshot: Object,
  searchedAt: { type: Date, default: Date.now },
})

// Compound index for efficient per-user history queries (most recent first)
searchHistorySchema.index({ userId: 1, searchedAt: -1 })

// TTL index: auto-delete documents 30 days after searchedAt
searchHistorySchema.index({ searchedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

export default mongoose.model('SearchHistory', searchHistorySchema)
