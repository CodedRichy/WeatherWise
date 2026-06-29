# WeatherWise

AI-powered weather intelligence platform. Live weather, forecasts, activity recommendations, and predictive analytics.

## Quick Start

```bash
# Install dependencies
npm run install:all

# Start development
npm run dev:server   # terminal 1
npm run dev:client   # terminal 2
```

## Environment Setup

Copy `.env.example` to `.env` in the root and fill in:
- `MONGODB_URI` — MongoDB Atlas connection string (free M0 at mongodb.com/atlas)
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — random 32+ char strings (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `OWM_API_KEY` — optional, from openweathermap.org (free tier)

## Deploy

- **Client** → Vercel: connect GitHub repo, set `VITE_API_URL` to Railway server URL
- **Server** → Railway: connect GitHub repo, set all env vars in Railway dashboard
- **Database** → MongoDB Atlas free M0, whitelist 0.0.0.0/0 for Railway IP

## Stack

React 18 + Vite · Express 4 · MongoDB/Mongoose · Open-Meteo API
