# WeatherWise — Design Spec (MVP)
**Date:** 2026-06-29  
**Approach:** A — Full MERN + Rule-Based ML  
**Deadline:** College submission, next day

---

## 1. Architecture

```
WeatherWise/
├── client/        React + Vite + react-leaflet + Recharts
└── server/        Express + Node.js + MongoDB/Mongoose + JWT
```

No Python ML microservice — prediction logic lives in `server/services/predictionService.js` as a rule-based weighted linear regression that returns confidence intervals and feature importance. Architecturally identical to the ML bridge pattern; swappable for real models later.

---

## 2. Data Sources

| Source | Purpose | Key Required |
|--------|---------|-------------|
| Open-Meteo | Current weather, forecast, historical, geocoding | No |
| OpenWeatherMap tile API | Map overlay layers (temp, rain, clouds, wind) | Yes — placeholder in .env |
| Sunrise-Sunset.org | Sunset/sunrise times for auto theme | No |

All OWM tile calls use `process.env.OWM_API_KEY` — app works without it (tiles fail gracefully), key is added before submission.

---

## 3. Frontend

**Stack:** React 18 + Vite, react-leaflet 4, Recharts, Axios, CSS custom properties

### Pages
- `Home.jsx` — 60/40 split: map left, dashboard panel right (mobile: map + bottom sheet)
- `Compare.jsx` — multi-city overlay charts
- `Activities.jsx` — activity score cards + best-window picker
- `Profile.jsx` — favorites, search history, preferences

### Key Components
- `WeatherMap.jsx` — Leaflet map, click-to-weather, OWM tile layer toggles
- `OverlayControls.jsx` — toggle temperature / precipitation / clouds / wind layers
- `CurrentWeather.jsx` — hero card, temperature-gradient background, animated condition icon
- `HourlyTimeline.jsx` — horizontal-scroll hourly forecast
- `WeeklyForecast.jsx` — 7-day with expandable rows
- `NarrativeSummary.jsx` — renders natural language weather text from server
- `ActivityScores.jsx` — 5 activity cards with radial gauge (0–100)
- `BestWindowPicker.jsx` — ranked time slots for chosen activity
- `MLForecast.jsx` — prediction fan chart with confidence bands
- `FeatureImportance.jsx` — bar chart showing why the model predicted X
- `ComparisonChart.jsx` — multi-city overlay (Recharts)
- `ThemeToggle.jsx` — light/dark/auto; auto switches at sunset for user's coords

### Theming
CSS custom properties, `prefers-color-scheme` baseline, overridden by user choice or sunset trigger. Temperature gradient on hero card: `#3b82f6` (cold) → `#10b981` → `#f59e0b` → `#ef4444` (hot).

---

## 4. Backend

**Stack:** Express 4, Mongoose 8, bcrypt, jsonwebtoken, node-cron, node-fetch

### Directory Structure
```
server/
├── config/         db.js, keys.js
├── models/         User, SearchHistory, Favorite, WeatherCache
├── controllers/    auth, weather, prediction, activity, analytics
├── middleware/     auth.js (JWT verify), rateLimiter.js, cache.js, errorHandler.js
├── services/       weatherService.js, geocodingService.js, narrativeService.js, predictionService.js
├── routes/         auth, weather, predictions, activities, analytics
├── jobs/           cacheCleanup.js (hourly cron)
└── server.js
```

### MongoDB Schemas
- **User** — name, email, hashedPassword, preferences (units, theme, activities, narrativeStyle), locations (home/work/custom[])
- **SearchHistory** — userId, coordinates, city, timestamp, weatherSnapshot
- **Favorite** — userId, city, coordinates
- **WeatherCache** — locationKey, data, fetchedAt, TTL (10 min current / 1 hr forecast)

### Caching Strategy
In-memory Map as L1 cache (no Redis dependency). Key = `${lat},${lon}:${type}`. TTL enforced on read. Reduces Open-Meteo calls, avoids rate limits.

---

## 5. Key Services

### weatherService.js
Aggregates Open-Meteo endpoints. Returns unified response shape regardless of data source, so swapping OWM in later requires only this file.

### narrativeService.js
Rule-based template bank. Selects phrases by value ranges:
- Temperature buckets: freezing / cold / cool / mild / warm / hot / scorching
- Humidity: dry / comfortable / humid / oppressive
- Wind: calm / breezy / windy / strong
- Precipitation probability: low / moderate / high / certain
Combines into 2–3 sentence paragraph. Supports `casual` and `formal` tone from user preferences.

### predictionService.js
Takes last 7 days of hourly data from Open-Meteo historical endpoint. Computes:
1. Next-day temp min/max via weighted linear formula (weights: pressure trend 35%, humidity trend 25%, temp trend 25%, cloud cover 15%)
2. Confidence interval = ±(historical variance × 0.8)
3. Feature importance = the four weights above, jittered ±5% per prediction
Returns JSON shaped identically to what a real ML microservice would return — fan chart and explainability UI work unchanged when real models are swapped in.

### activityService (in controller)
Scoring algorithms for 5 activities: Running, Cycling, Stargazing, Photography, Outdoor Dining. Each has weighted multi-factor formula. Best-window calculator scans 168 hourly slots (7 days), ranks by score.

---

## 6. API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → JWT pair |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user |

### Weather
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/weather/current` | `?lat=&lon=` |
| GET | `/api/weather/forecast` | `?lat=&lon=&days=7` |
| GET | `/api/weather/hourly` | `?lat=&lon=&hours=48` |
| GET | `/api/weather/compare` | `?cities=London,Paris` |
| GET | `/api/weather/narrative` | `?lat=&lon=&style=casual` |

### Predictions
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/predict/temperature` | `?lat=&lon=&days=3` — with confidence bands |
| GET | `/api/predict/rain` | `?lat=&lon=&hours=12` — 3-hr buckets |
| GET | `/api/predict/explain` | `?lat=&lon=` — feature importance |

### Activities
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/activities/scores` | `?lat=&lon=` |
| GET | `/api/activities/best-window` | `?activity=running&days=7&lat=&lon=` |
| PUT | `/api/activities/preferences` | Update user activity list |

### User
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST/DELETE | `/api/favorites` | Manage saved locations |
| GET | `/api/history` | Search history |

---

## 7. Error Handling

- Express `errorHandler.js` middleware catches all unhandled errors, returns `{ error: message, code }` JSON
- Open-Meteo failures → serve from WeatherCache if available, else 503 with cache-age metadata
- OWM tile failures (missing key) → tiles silently fail, overlay toggle shows "API key required" tooltip
- JWT expiry → 401 triggers client-side refresh flow, then retry original request

---

## 8. Deployment

| Service | Platform | Notes |
|---------|---------|-------|
| Client | Vercel | `vite build` output, env: `VITE_API_URL` |
| Server | Railway | Node 20, env vars via Railway dashboard |
| Database | MongoDB Atlas | Free M0 cluster, IP whitelist 0.0.0.0/0 for Railway |

---

## 9. Deferred Features

See `memory/project_deferred_features.md` — 15 features saved for future sessions including Time Machine, Weather Rooms, Crowd Reports, Mood Journal, Wind Animation, Route Weather, real Python ML microservice, PWA, Lightning Tracker, SMS/email alerts.
