import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    email: String,
    name: String,
    preferences: {
      units: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
      narrativeStyle: { type: String, enum: ['casual', 'formal'], default: 'casual' },
    },
    locations: {
      home: { city: String, lat: Number, lon: Number },
      work: { city: String, lat: Number, lon: Number },
    },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
