import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    preferences: {
      units: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
      narrativeStyle: { type: String, enum: ['casual', 'formal'], default: 'casual' },
    },
    locations: {
      home: { city: String, lat: Number, lon: Number },
      work: { city: String, lat: Number, lon: Number },
    },
    refreshToken: String,
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
