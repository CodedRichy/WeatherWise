# WeatherWise MVP — Implementation Plan
**Date:** 2026-06-29  
**Branch:** main  
**Deadline:** College submission, same day

---

## Global Constraints

- Stack: React 18 + Vite 5 (client), Express 4 + Mongoose 8 + Node 20 (server)
- Primary data: Open-Meteo API (no key needed) — endpoints below
- OWM tiles: use `process.env.OWM_API_KEY` placeholder; app degrades gracefully without it
- Auth: JWT — 15 min access token (`JWT_SECRET`), 7-day refresh token (`JWT_REFRESH_SECRET`)
- Cache: in-memory Map (no Redis); key = `${lat.toFixed(2)},${lon.toFixed(2)}:${type}`; TTL 10min current / 60min forecast
- Prediction: rule-based in Node.js, returns same JSON shape as real ML microservice
- No TypeScript — plain JS throughout
- No test framework unless task specifies; all code must be runnable with `node`
- Commit every task; one commit per logical unit
- No comments unless WHY is non-obvious

### Open-Meteo Endpoints
```
Current: https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover&wind_speed_unit=ms&timezone=auto
Forecast: https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,sunrise,sunset&timezone=auto&forecast_days=7
Hourly: https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,cloud_cover&timezone=auto&forecast_days=2
Historical: https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,relative_humidity_2m,surface_pressure,cloud_cover&past_days=7&forecast_days=0&timezone=auto
Geocoding: https://geocoding-api.open-meteo.com/v1/search?name={query}&count=5&language=en&format=json
```

### Temperature Gradient (hero card)
cold (#3b82f6) → mild (#10b981) → warm (#f59e0b) → hot (#ef4444)
Thresholds: <5°C=#3b82f6, 5-15°C=#10b981, 15-28°C=#f59e0b, >28°C=#ef4444

### Activity Scoring Weights
**Running:** temp(25%) humidity(20%) wind(20%) precip_prob(25%) aqi_proxy(10%)
Score formula: `100 - abs(temp-18)*2.5 - max(0,humidity-60)*0.5 - max(0,wind-5)*3 - precip_prob*0.8`

**Cycling:** temp(20%) wind(30%) precip_prob(30%) humidity(20%)
Score: `100 - abs(temp-20)*2 - max(0,wind-8)*4 - precip_prob*0.9 - max(0,humidity-70)*0.3`

**Stargazing:** cloud_cover(50%) precip_prob(30%) wind(10%) humidity(10%)
Score: `100 - cloud_cover*0.8 - precip_prob*0.6 - max(0,wind-10)*1 - max(0,humidity-80)*0.2`

**Photography (golden hour):** cloud_cover(40%) precip_prob(30%) wind(15%) temp(15%)
Score: `80 - cloud_cover*0.4 + (cloud_cover > 20 && cloud_cover < 70 ? 20 : 0) - precip_prob*0.5 - abs(temp-20)*1`

**Outdoor Dining:** temp(35%) precip_prob(35%) wind(20%) humidity(10%)
Score: `100 - abs(temp-22)*2 - precip_prob*0.9 - max(0,wind-6)*3 - max(0,humidity-65)*0.3`

All scores clamped to [0, 100].

### Prediction Weights
pressure_trend: 35%, humidity_trend: 25%, temp_trend: 25%, cloud_cover_avg: 15%
Confidence = ±(stdev_of_last_7_days_temps × 0.8)
Feature importance = weights ± random jitter in [-0.05, 0.05], renormalized to sum=1

---

## Task 1: Project Scaffold

Create full directory tree, all package.json files, vite config, .env files, .gitignore.

### Directory Structure
```
WeatherWise/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── map/
│   │   │   ├── weather/
│   │   │   ├── activities/
│   │   │   ├── prediction/
│   │   │   └── ui/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── config/
│   ├── controllers/
│   ├── jobs/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
├── docs/
├── .env.example
├── .gitignore
└── package.json (root — workspaces or just scripts)
```

### client/package.json
```json
{
  "name": "weatherwise-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "leaflet": "^1.9.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-leaflet": "^4.2.1",
    "react-router-dom": "^6.20.0",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

### server/package.json
```json
{
  "name": "weatherwise-server",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "dev": "node --watch server.js",
    "start": "node server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.3",
    "node-cron": "^3.0.3",
    "node-fetch": "^3.3.2"
  }
}
```

### client/vite.config.js
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

### .env.example (root)
```
# Server
MONGODB_URI=mongodb://localhost:27017/weatherwise
JWT_SECRET=changeme_jwt_secret_min32chars
JWT_REFRESH_SECRET=changeme_refresh_secret_min32chars
PORT=5000
NODE_ENV=development

# APIs
OWM_API_KEY=your_openweathermap_key_here

# Client (prefix VITE_)
VITE_API_URL=http://localhost:5000
```

### server/.env (create from example — dev defaults)
Same as .env.example but with actual dev values filled in.

### .gitignore
```
node_modules/
.env
.env.local
dist/
.DS_Store
*.log
.superpowers/
```

### root package.json
```json
{
  "name": "weatherwise",
  "version": "1.0.0",
  "scripts": {
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "install:all": "cd client && npm install && cd ../server && npm install",
    "build": "cd client && npm run build"
  }
}
```

### Deliverables
- All directories created
- All package.json files in place
- vite.config.js
- .env.example and server/.env (with dev defaults, not committed)
- .gitignore covering node_modules, .env, dist
- `npm install` runnable in both client/ and server/ without errors
- Commit: "scaffold: project structure, package.json, vite config"

---

## Task 2: Backend Models + Server Skeleton

Create server entry point, DB connection, all Mongoose models, middleware files.

### server/server.js
```js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import { errorHandler } from './middleware/errorHandler.js'
import { rateLimiter } from './middleware/rateLimiter.js'
import authRoutes from './routes/auth.js'
import weatherRoutes from './routes/weather.js'
import predictionRoutes from './routes/predictions.js'
import activityRoutes from './routes/activities.js'
import userRoutes from './routes/user.js'

dotenv.config()
const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(rateLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/predict', predictionRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api', userRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 5000
connectDB().then(() => app.listen(PORT, () => console.log(`Server running on ${PORT}`)))
```

### server/config/db.js
Mongoose connect with retry on failure. Export `connectDB()`.

### MongoDB Models

**User** (`server/models/User.js`):
```js
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  preferences: {
    units: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    narrativeStyle: { type: String, enum: ['casual', 'formal'], default: 'casual' }
  },
  locations: {
    home: { city: String, lat: Number, lon: Number },
    work: { city: String, lat: Number, lon: Number }
  },
  refreshToken: String
}
```

**Favorite** (`server/models/Favorite.js`):
```js
{
  userId: { type: ObjectId, ref: 'User', required: true },
  city: { type: String, required: true },
  lat: Number,
  lon: Number,
  createdAt: { type: Date, default: Date.now }
}
```

**SearchHistory** (`server/models/SearchHistory.js`):
```js
{
  userId: { type: ObjectId, ref: 'User', required: true },
  city: String,
  lat: Number,
  lon: Number,
  weatherSnapshot: Object,
  searchedAt: { type: Date, default: Date.now }
}
// Index: { userId: 1, searchedAt: -1 }
// TTL: expires after 30 days
```

### Middleware

**server/middleware/errorHandler.js**:
Express error middleware `(err, req, res, next)` returning `{ error: err.message, code: err.statusCode || 500 }`.

**server/middleware/rateLimiter.js**:
`express-rate-limit` — 100 req / 15 min per IP. Apply globally.

**server/middleware/auth.js**:
Verify JWT access token from `Authorization: Bearer <token>` header. Attach `req.user = { id, email }`. Export `requireAuth`.

### Route Stubs
Create all 5 route files with `Router()` and at least one placeholder route returning `{ ok: true }`:
- `server/routes/auth.js`
- `server/routes/weather.js`
- `server/routes/predictions.js`
- `server/routes/activities.js`
- `server/routes/user.js`

### server/jobs/cacheCleanup.js
`node-cron` job running hourly: iterates `weatherCache` Map (imported from cache middleware), deletes entries where `Date.now() - entry.fetchedAt > entry.ttl`. Export `startCacheCleanup()`, call from server.js.

### Deliverables
- `node server.js` starts without error (MongoDB connection may fail gracefully if no local DB — log warning, don't crash)
- All models importable
- All middleware files exist and export named functions
- All 5 route stubs mounted
- Cron job registered
- Commit: "backend: models, middleware, server skeleton"

---

## Task 3: Auth Backend

Full JWT auth flow: register, login, refresh, me, logout.

### server/controllers/authController.js

**POST /api/auth/register**
1. Validate name, email, password (min 6 chars) — return 400 if missing
2. Check duplicate email — return 409 if exists
3. `bcryptjs.hash(password, 12)`
4. Save User
5. Return `{ message: 'Account created' }` 201

**POST /api/auth/login**
1. Find user by email
2. `bcryptjs.compare(password, user.password)`
3. Generate access token: `jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '15m' })`
4. Generate refresh token: `jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: '7d' })`
5. Save refresh token to user document
6. Return `{ accessToken, refreshToken, user: { id, name, email, preferences } }`

**POST /api/auth/refresh**
1. Read `refreshToken` from request body
2. Verify with `JWT_REFRESH_SECRET`
3. Find user, confirm stored refreshToken matches
4. Issue new access token
5. Return `{ accessToken }`

**GET /api/auth/me** (requireAuth)
Return `req.user` populated from DB: `{ id, name, email, preferences, locations }`

**POST /api/auth/logout** (requireAuth)
Clear `user.refreshToken = null`, save. Return 204.

### server/routes/auth.js
Wire all 5 endpoints to controller. No rate limiting beyond global.

### Deliverables
- All 5 auth endpoints functional
- JWT tokens correctly generated and validated
- Passwords hashed, never returned in responses
- Commit: "auth: register, login, refresh, me, logout"

---

## Task 4: Weather Service

Fetch, cache, and serve weather data from Open-Meteo.

### server/services/weatherService.js

In-memory cache: `const cache = new Map()`. Export cache for cleanup job.

```js
// Cache helpers
function cacheGet(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > entry.ttl) { cache.delete(key); return null }
  return entry.data
}
function cacheSet(key, data, ttlMs) {
  cache.set(key, { data, fetchedAt: Date.now(), ttl: ttlMs })
}
function cacheKey(lat, lon, type) {
  return `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}:${type}`
}
```

**fetchCurrent(lat, lon)**: Call Open-Meteo current endpoint. TTL 10 min. Return normalized object:
```js
{
  temperature: current.temperature_2m,
  feelsLike: current.apparent_temperature,
  humidity: current.relative_humidity_2m,
  pressure: current.surface_pressure,
  windSpeed: current.wind_speed_10m,
  windDirection: current.wind_direction_10m,
  cloudCover: current.cloud_cover,
  precipitation: current.precipitation,
  weatherCode: current.weather_code,
  condition: weatherCodeToCondition(current.weather_code), // "Clear", "Cloudy", "Rain", etc.
  timestamp: current.time
}
```

**fetchForecast(lat, lon, days=7)**: Open-Meteo daily endpoint. TTL 60 min. Return array of day objects.

**fetchHourly(lat, lon, hours=48)**: Open-Meteo hourly endpoint. TTL 10 min. Return array of hour objects.

**fetchHistorical(lat, lon)**: past_days=7 hourly. TTL 60 min. Return raw arrays for prediction service.

**weatherCodeToCondition(code)**: Map WMO codes → string condition:
- 0: Clear, 1-3: Partly Cloudy, 45-48: Foggy, 51-67: Drizzle/Rain, 71-77: Snow, 80-82: Showers, 95-99: Thunderstorm

### server/services/geocodingService.js

**search(query)**: Open-Meteo geocoding API. Return array of `{ name, lat, lon, country, admin1 }`.

**reverseGeocode(lat, lon)**: Use Open-Meteo geocoding with a simple nearest-city approach or just return `{ lat, lon, city: "Unknown" }` if API doesn't support reverse (it doesn't — just return coords with label).

### server/controllers/weatherController.js

- `getCurrent`: parse lat/lon from query, call `weatherService.fetchCurrent`, save to SearchHistory if user authenticated, return data
- `getForecast`: parse lat/lon/days, call `fetchForecast`
- `getHourly`: parse lat/lon/hours, call `fetchHourly`
- `getCompare`: parse `cities` query string (comma-separated lat:lon pairs), fetch current for each in parallel via `Promise.all`, return array
- `getNarrative`: call weatherService then narrativeService, return `{ narrative, tone }`
- `geocode`: call geocodingService.search

### server/routes/weather.js
```
GET /api/weather/current?lat=&lon=
GET /api/weather/forecast?lat=&lon=&days=7
GET /api/weather/hourly?lat=&lon=&hours=48
GET /api/weather/compare?cities=lat:lon,lat:lon
GET /api/weather/narrative?lat=&lon=&style=casual
GET /api/weather/geocode?q=London
```

### Deliverables
- All weather endpoints returning real Open-Meteo data
- Cache working (second call faster, same data)
- weatherCodeToCondition covers all WMO code ranges
- Commit: "weather: Open-Meteo service, geocoding, caching, all endpoints"

---

## Task 5: Intelligence Services

Rule-based prediction, narrative generation, and activity scoring.

### server/services/narrativeService.js

Template banks:

```js
const TEMP_PHRASES = {
  freezing: ['bitterly cold', 'freezing conditions'],  // < 0°C
  cold: ['cold day', 'chilly weather'],                // 0-10
  cool: ['cool and refreshing', 'pleasantly cool'],    // 10-18
  mild: ['mild conditions', 'comfortable temperature'],// 18-24
  warm: ['warm day', 'pleasantly warm'],               // 24-30
  hot: ['hot day', 'sweltering heat'],                 // 30-38
  scorching: ['dangerously hot', 'extreme heat']       // >38
}
const HUMIDITY_PHRASES = {
  dry: ['low humidity'],          // <30%
  comfortable: ['comfortable humidity'], // 30-60%
  humid: ['humid conditions'],    // 60-80%
  oppressive: ['oppressive humidity'] // >80%
}
const WIND_PHRASES = {
  calm: ['calm winds'],           // <3 m/s
  breezy: ['a gentle breeze'],    // 3-8
  windy: ['strong winds'],        // 8-15
  strong: ['dangerous wind gusts'] // >15
}
const PRECIP_PHRASES = {
  low: ['little chance of rain'],     // <20%
  moderate: ['some chance of rain'],  // 20-50%
  high: ['likely to rain'],           // 50-80%
  certain: ['rain expected']          // >80%
}
```

**generateNarrative(weatherData, tone='casual')**: Select phrase from each bank by value range. Combine into 2-3 sentence paragraph. Formal tone = no contractions, full sentences. Casual tone = relaxed, short sentences.

Return: `{ narrative: string, tone, generatedAt: ISO }`

### server/services/predictionService.js

**predict(lat, lon)**: 
1. Fetch historical hourly data (7 days) via weatherService.fetchHistorical
2. Extract temperature, pressure, humidity, cloud_cover arrays
3. Compute linear trends (last value - first value over n points, normalized)
4. `nextDayTemp = lastTemp + (tempTrend*0.25 + pressureTrend*0.35 + humidityTrend*0.25 + cloudTrend*0.15)`
5. `variance = stdev(temps_last_7_days)`
6. `confidence = variance * 0.8`
7. Generate 3-day forecast: each day shifts trend slightly with jitter ±(variance*0.1)
8. Feature importance: jitter weights in [-0.05, 0.05], renormalize to sum=1

Return:
```js
{
  forecast: [
    { day: 0, tempMin, tempMax, tempMid, confidenceLow, confidenceHigh },
    // days 1, 2
  ],
  featureImportance: {
    pressure_trend: 0.35,
    humidity_trend: 0.25,
    temp_trend: 0.25,
    cloud_cover: 0.15
  },
  modelType: 'rule-based-weighted-linear',
  generatedAt: ISO
}
```

### server/controllers/activityController.js

**getScores(lat, lon)**: Fetch current weather + hourly. Score all 5 activities using formulas from Global Constraints. Return:
```js
{
  scores: {
    running: { score: 72, factors: { temp, humidity, wind, precip } },
    cycling: { score: 85, ... },
    stargazing: { score: 40, ... },
    photography: { score: 61, ... },
    outdoorDining: { score: 78, ... }
  },
  timestamp: ISO
}
```

**getBestWindow(activity, days, lat, lon)**: Fetch 7-day hourly. Score each hour. Return top 5 windows:
```js
{
  activity,
  windows: [
    { startTime: ISO, score: 88, duration: '2h', factors: {...} },
    // ...
  ]
}
```

### server/controllers/predictionController.js

- `getTemperaturePrediction`: call predictionService.predict, return forecast with confidence bands
- `getRainPrediction`: fetch hourly precip_probability, bucket into 3-hr averages for next 12 hrs
- `getExplain`: return featureImportance from predictionService.predict

### Route files (server/routes/predictions.js, server/routes/activities.js)
Wire all endpoints per spec.

### Deliverables
- Narrative generates readable text for all weather combinations
- Prediction returns forecast array + feature importance JSON
- Activity scores clamped to [0,100]
- Best-window returns ranked slots
- Commit: "intelligence: prediction, narrative, activity scoring"

---

## Task 6: React Shell

App.jsx with routing, AuthContext, ThemeContext, Navbar, page skeletons.

### client/src/main.jsx
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
```

### client/src/contexts/AuthContext.jsx
```jsx
// Provides: user, login(email,password), logout, register(name,email,password), isLoading
// Stores: accessToken in memory (not localStorage), refreshToken in localStorage
// On mount: try refresh if refreshToken exists
```

### client/src/contexts/ThemeContext.jsx
```jsx
// Provides: theme ('light'|'dark'|'auto'), setTheme
// 'auto' = check sunrise-sunset.org for user's coords; fallback to prefers-color-scheme
// Applies 'data-theme' attribute to document.documentElement
// Sunrise-Sunset.org: https://api.sunrise-sunset.org/json?lat={lat}&lng={lon}&formatted=0
```

### client/src/App.jsx
```jsx
// Wrap with AuthContext + ThemeContext providers
// Routes:
//   / → Home (lazy)
//   /compare → Compare (lazy)
//   /activities → Activities (lazy)
//   /profile → Profile (protected, redirect to / if not authed)
// Navbar always visible
// Suspense fallback: centered spinner
```

### client/src/components/ui/Navbar.jsx
- Logo "WeatherWise" left
- Nav links: Home, Compare, Activities (right)
- Auth: if logged in → avatar initials + logout; if not → Login / Register buttons (open modal)
- ThemeToggle button (icon button, cycles light→dark→auto)
- Location search input (triggers geocode on Enter/submit)

### client/src/styles/global.css
CSS custom properties:
```css
:root {
  --bg: #ffffff;
  --surface: #f8fafc;
  --text: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
  --danger: #ef4444;
  --success: #10b981;
}
[data-theme="dark"] {
  --bg: #0f172a;
  --surface: #1e293b;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --border: #334155;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; }
```

### Page stubs (client/src/pages/)
- `Home.jsx` — placeholder `<div>Home</div>`
- `Compare.jsx` — placeholder
- `Activities.jsx` — placeholder
- `Profile.jsx` — placeholder

### Deliverables
- `npm run dev` in client/ loads without errors
- All 4 routes navigate correctly
- Dark/light theme toggle works
- Navbar renders
- Commit: "frontend: React shell, routing, AuthContext, ThemeContext, Navbar"

---

## Task 7: API Client Layer

Axios instance with interceptors, typed API functions.

### client/src/api/apiClient.js
```js
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true
})

// Request interceptor: attach access token from memory
// Response interceptor: on 401, try POST /api/auth/refresh, retry original request once
// On refresh failure: clear tokens, redirect to home
```

Store access token in module-level variable (not localStorage):
```js
let accessToken = null
export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = () => accessToken
```

### client/src/api/weatherApi.js
```js
import client from './apiClient.js'

export const weatherApi = {
  getCurrent: (lat, lon) => client.get('/api/weather/current', { params: { lat, lon } }),
  getForecast: (lat, lon, days=7) => client.get('/api/weather/forecast', { params: { lat, lon, days } }),
  getHourly: (lat, lon, hours=48) => client.get('/api/weather/hourly', { params: { lat, lon, hours } }),
  getNarrative: (lat, lon, style='casual') => client.get('/api/weather/narrative', { params: { lat, lon, style } }),
  getCompare: (pairs) => client.get('/api/weather/compare', { params: { cities: pairs.join(',') } }),
  geocode: (q) => client.get('/api/weather/geocode', { params: { q } }),
  getScores: (lat, lon) => client.get('/api/activities/scores', { params: { lat, lon } }),
  getBestWindow: (activity, lat, lon, days=7) => client.get('/api/activities/best-window', { params: { activity, lat, lon, days } }),
  getPrediction: (lat, lon) => client.get('/api/predict/temperature', { params: { lat, lon } }),
  getExplain: (lat, lon) => client.get('/api/predict/explain', { params: { lat, lon } }),
}

export const authApi = {
  register: (name, email, password) => client.post('/api/auth/register', { name, email, password }),
  login: (email, password) => client.post('/api/auth/login', { email, password }),
  refresh: (refreshToken) => client.post('/api/auth/refresh', { refreshToken }),
  me: () => client.get('/api/auth/me'),
  logout: () => client.post('/api/auth/logout'),
}

export const userApi = {
  getFavorites: () => client.get('/api/favorites'),
  addFavorite: (city, lat, lon) => client.post('/api/favorites', { city, lat, lon }),
  removeFavorite: (id) => client.delete(`/api/favorites/${id}`),
  getHistory: () => client.get('/api/history'),
}
```

### client/src/hooks/useWeather.js
```js
// Custom hook: takes {lat, lon}
// Returns { current, forecast, hourly, narrative, loading, error }
// Fetches all 4 in parallel on lat/lon change
// Handles loading/error states
```

### Deliverables
- apiClient.js has working interceptors (manually testable: token refresh retries)
- weatherApi.js exports all functions
- useWeather hook fetches real data when lat/lon provided
- Commit: "frontend: Axios client, API functions, useWeather hook"

---

## Task 8: Interactive Map

Leaflet map with click-to-weather, geolocation, OWM overlay toggles.

### client/src/hooks/useGeolocation.js
```js
// Returns { lat, lon, loading, error }
// navigator.geolocation.getCurrentPosition on mount
// Error fallback: { lat: 51.5074, lon: -0.1278 } (London)
```

### client/src/components/map/WeatherMap.jsx
```jsx
// Props: { lat, lon, onLocationSelect(lat, lon) }
// react-leaflet MapContainer, TileLayer (OSM base)
// Click handler: e.latlng → call onLocationSelect
// LocationMarker: custom icon at current selected coords
// OWM overlay layer: conditionally render based on activeOverlay prop
//   URL: https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={OWM_API_KEY}
//   layers: temp_new, precipitation_new, clouds_new, wind_new
// import 'leaflet/dist/leaflet.css' in this file
// Fix Leaflet default icon (Webpack/Vite issue):
//   import L from 'leaflet'; delete L.Icon.Default.prototype._getIconUrl; L.Icon.Default.mergeOptions({...})
```

### client/src/components/map/OverlayControls.jsx
```jsx
// Props: { activeOverlay, onOverlayChange(layerName|null) }
// 4 toggle buttons: Temperature, Precipitation, Clouds, Wind
// Active = filled style, inactive = outline
// If OWM_API_KEY not set: show tooltip "API key required" on hover
```

### client/src/pages/Home.jsx
```jsx
// Layout: flex row on desktop (60% map, 40% panel), stack on mobile
// State: selectedCoords {lat, lon} — starts from geolocation
// Left: <WeatherMap lat lon onLocationSelect setSelectedCoords />
//        <OverlayControls activeOverlay onOverlayChange />
// Right: WeatherPanel (Task 9 stub for now — just show coords)
// Mobile: map full width, panel as bottom sheet (CSS)
```

### Deliverables
- Map renders OSM tiles
- Click on map updates selected coordinates
- Overlay toggle buttons render (OWM tiles may not load without key — that's OK)
- Geolocation detects user position or falls back to London
- Commit: "frontend: Leaflet map, overlay controls, geolocation hook"

---

## Task 9: Weather Dashboard Panel

CurrentWeather hero card, HourlyTimeline, WeeklyForecast, NarrativeSummary.

All components live in `client/src/components/weather/`.
All accept weather data as props (no direct API calls inside components — data flows from Home.jsx via useWeather hook).

### CurrentWeather.jsx
```jsx
// Props: { current } — from weatherApi shape
// Hero card: temperature large (48px), condition icon + text
// Feels like, humidity, wind speed, pressure in a 2x2 grid
// Background gradient based on temperature:
//   <5°C: linear-gradient(135deg, #3b82f6, #1d4ed8)
//   5-15°C: linear-gradient(135deg, #10b981, #059669)
//   15-28°C: linear-gradient(135deg, #f59e0b, #d97706)
//   >28°C: linear-gradient(135deg, #ef4444, #dc2626)
// Condition icons: emoji map (⛅🌧️❄️☀️⛈️🌫️) keyed by condition string
```

### HourlyTimeline.jsx
```jsx
// Props: { hourly } — array of hour objects
// Horizontal scroll container, 48 items
// Each item: time (HH:mm), condition emoji, temperature
// Active hour highlighted
// Uses CSS overflow-x: auto, flex, no-wrap
```

### WeeklyForecast.jsx
```jsx
// Props: { forecast } — 7-day array
// 7 rows: day name, condition emoji, min/max temp bar
// Expandable: click row shows hourly mini-chart for that day (Recharts AreaChart)
```

### NarrativeSummary.jsx
```jsx
// Props: { narrative, generatedAt }
// Styled card with italic narrative text
// "Generated at HH:mm" subtitle
// Skeleton state when loading
```

### client/src/components/ui/SkeletonCard.jsx
Generic skeleton loader: grey pulsing block, accepts width/height props.

### Update Home.jsx
Replace coord display with actual WeatherPanel layout using useWeather hook result:
```jsx
const { current, forecast, hourly, narrative, loading } = useWeather(selectedCoords)
// Left col: map
// Right col: if loading: SkeletonCard x4 else: CurrentWeather, NarrativeSummary, HourlyTimeline, WeeklyForecast
```

### Deliverables
- WeatherWise shows real weather data for clicked/detected location
- Temperature gradient on hero card correct
- Hourly timeline scrollable
- Weekly forecast expandable
- Narrative text from backend
- Commit: "frontend: weather dashboard — CurrentWeather, Hourly, Weekly, Narrative"

---

## Task 10: Activity Scoring UI

ActivityScores card grid, BestWindowPicker.

### client/src/components/activities/ActivityScores.jsx
```jsx
// Props: { scores } — object from API
// 5 cards in a 2-column grid (3rd row: 1 centered)
// Each card: activity name, radial gauge (SVG circle), score number, top factors
// Radial gauge: SVG circle with stroke-dasharray based on score/100
//   circle r=45, cx=50, cy=50, stroke-width=8
//   circumference = 2 * Math.PI * 45 ≈ 282.7
//   filled = (score/100) * 282.7
// Color: 0-40 red, 40-70 yellow, 70-100 green
```

### client/src/components/activities/BestWindowPicker.jsx
```jsx
// Props: { windows, activity, loading }
// Dropdown to select activity (running, cycling, stargazing, photography, outdoorDining)
// On change: fetch new windows via weatherApi.getBestWindow
// List of top 5 windows: start time, score badge, duration, key factors
// Score badge color same as gauge color scheme
```

### client/src/pages/Activities.jsx
```jsx
// Fetches scores + initial best-window on load (use selectedCoords from URL params or localStorage)
// Renders ActivityScores + BestWindowPicker side by side (desktop), stacked (mobile)
// Loading skeletons while fetching
```

### Deliverables
- All 5 activity cards render with SVG gauge
- Gauge fills correctly for sample score
- Best-window list shows after activity selection
- Commit: "frontend: activity scores UI, radial gauges, best-window picker"

---

## Task 11: Prediction + Comparison UI

MLForecast fan chart, FeatureImportance bar chart, Compare page.

### client/src/components/prediction/MLForecast.jsx
```jsx
// Props: { forecast } — array from predictionService
// Recharts ComposedChart: Area for confidence band, Line for midpoint forecast
// X axis: day labels (Today, Tomorrow, Day 3)
// Two Area series for confidenceLow and confidenceHigh (fill, semi-transparent)
// Line series for tempMid
// Tooltip showing all three values
```

### client/src/components/prediction/FeatureImportance.jsx
```jsx
// Props: { featureImportance } — object from API
// Recharts BarChart, horizontal bars
// Labels: "Pressure Trend", "Humidity Trend", "Temperature Trend", "Cloud Cover"
// Values as percentages (multiply by 100)
// Color bars by contribution level
```

### client/src/pages/Compare.jsx
```jsx
// Multi-city weather comparison
// Search bar: add cities (up to 4), each triggers geocode then current weather fetch
// ComparisonChart: Recharts LineChart with one line per city
//   Metrics: temperature (default), also switch to humidity, wind
// City chips: remove individual cities
// Table below chart: current stats for each city side by side
```

### client/src/components/prediction/ComparisonChart.jsx
```jsx
// Props: { cities } — array of { name, data: currentWeatherObject }
// Recharts LineChart
// Each city = one colored Line
// Legend with city names
```

### Integrate prediction into Home.jsx
Below WeeklyForecast, add:
- `<MLForecast />` (collapsible section "AI Forecast")  
- `<FeatureImportance />` (collapsible section "Why this prediction")
Both fetch lazily on first expand.

### Deliverables
- Fan chart renders with confidence bands visible
- Feature importance bars display
- Compare page: add 2+ cities, see them on chart
- Commit: "frontend: prediction fan chart, feature importance, compare page"

---

## Task 12: Auth UI + Profile Page

Login/Register modals, Profile page with favorites and history.

### client/src/components/ui/AuthModal.jsx
```jsx
// Props: { mode: 'login'|'register', onClose, onSuccess }
// Modal overlay with backdrop click to close
// Login: email + password fields, submit → authApi.login → setAccessToken + update AuthContext
// Register: name + email + password + confirm password fields
// Toggle between login/register at bottom
// Error display (field-level and general)
// Loading state on submit button
```

### client/src/pages/Profile.jsx
```jsx
// Protected — redirect to / if not authenticated (check AuthContext)
// Sections:
//   1. Account info (name, email, preferences form — units, theme, narrative style)
//   2. Saved Locations (favorites list with remove button)
//   3. Search History (last 10 searches with timestamp and re-search button)
//   4. Logout button
// Preferences form: save via PUT /api/auth/me (add this endpoint or use existing user update)
```

### server/routes/user.js + server/controllers/userController.js
```
GET  /api/favorites        → list user's favorites (requireAuth)
POST /api/favorites        → add favorite { city, lat, lon } (requireAuth)
DELETE /api/favorites/:id  → remove (requireAuth, own only)
GET  /api/history          → last 20 search history entries (requireAuth)
```

### Deliverables
- Login/register modal works end-to-end (register → login → see name in navbar)
- Profile page shows favorites and history
- Add/remove favorite persists
- Commit: "frontend: auth modal, profile page, favorites, history"

---

## Task 13: Polish + Responsive Design

Error states, loading skeletons, mobile layout, finishing touches.

### Error States
- `client/src/components/ui/ErrorCard.jsx`: icon + message + retry button. Use when API calls fail.
- All API calls in hooks wrapped with try/catch, set error state, render ErrorCard
- Network offline detection: show banner "No internet connection — showing cached data"

### Loading Skeletons
Ensure every data-dependent component shows SkeletonCard (Task 9) while loading.
- CurrentWeather skeleton: large grey rect (temp) + 4 small rects (stats)
- HourlyTimeline skeleton: 8 small cards in a row
- WeeklyForecast skeleton: 7 grey rows
- ActivityScores skeleton: 5 grey circles

### Mobile Responsive CSS

Home page mobile (< 768px):
- Map takes full viewport height 50vh
- Weather panel slides up from bottom as a sheet (position fixed, bottom 0, height 55vh, overflow-y scroll)
- OverlayControls float over map bottom-left
- WeeklyForecast rows compact (no expand on mobile)

Navbar mobile:
- Hamburger menu (pure CSS checkbox trick or simple state toggle)
- Links collapse into dropdown

### 404 Page
Simple centered "404 — Page not found" with link back to Home.

### Favicon + Meta
- `client/index.html`: title "WeatherWise", meta description, theme-color
- Use emoji favicon: `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌤️</text></svg>">`

### Deliverables
- App works on 375px mobile width
- Error states visible on API failure (test by stopping server)
- All loading states show skeletons not blank screens
- Commit: "polish: responsive layout, error states, skeletons, mobile"

---

## Task 14: Deployment Config

Vercel, Railway, README.

### client/vercel.json
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "env": {
    "VITE_API_URL": "@vite_api_url"
  }
}
```

### server/Procfile (Railway uses this)
```
web: node server.js
```

### server/.railwayignore (if needed)
```
node_modules
```

### Environment documentation
In `.env.example`, add comments explaining each var and where to get it.

### README.md (update from "# WeatherWise")
```markdown
# WeatherWise

AI-powered weather intelligence platform. Live weather, forecasts, activity recommendations, and predictive analytics.

## Quick Start

\`\`\`bash
# Install dependencies
npm run install:all

# Start development
npm run dev:server   # terminal 1
npm run dev:client   # terminal 2
\`\`\`

## Environment Setup

Copy `.env.example` to `.env` in the root and fill in:
- `MONGODB_URI` — MongoDB Atlas connection string (free M0 at mongodb.com/atlas)
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — random 32+ char strings
- `OWM_API_KEY` — optional, from openweathermap.org (free tier)

## Deploy

- **Client** → Vercel: connect GitHub repo, set `VITE_API_URL` to Railway server URL
- **Server** → Railway: connect GitHub repo, set all env vars in Railway dashboard  
- **Database** → MongoDB Atlas free M0, whitelist 0.0.0.0/0 for Railway IP

## Stack

React 18 + Vite · Express 4 · MongoDB/Mongoose · Open-Meteo API
```

### Deliverables
- vercel.json in client/
- Procfile in server/
- README fully updated with setup instructions
- `npm run build` in client/ succeeds
- Commit: "deploy: vercel config, Procfile, README"
