# WeatherWise

AI-powered weather intelligence platform. Live weather, forecasts, activity recommendations, and predictive analytics — built on the MERN stack.

## Overview

WeatherWise goes beyond a simple weather lookup. It combines real-time data from Open-Meteo with a lightweight prediction layer to estimate near-term temperature trends, suggests activities based on current conditions, and gives users a personalized dashboard with saved cities and search history, all secured behind JWT authentication with refresh tokens.

## Features

- User registration and login with JWT access + refresh token authentication
- Search weather by city with current conditions: temperature, humidity, wind speed, pressure, UV index
- Multi-day forecast with interactive charts
- Activity recommendations based on current weather conditions
- Save favourite cities
- Persistent search history per user
- Basic ML-based temperature prediction
- Dark / Light mode
- Fully responsive UI

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts, Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT (access + refresh tokens), bcrypt.js |
| Weather Data | Open-Meteo API |
| Optional Weather Data | OpenWeatherMap API |
| Machine Learning | TensorFlow.js (Linear Regression) |
| Client Hosting | Vercel |
| Server Hosting | Railway |

## Architecture

```
React (Vite) Frontend
      |
      v
Express Server (Railway)
      |
      |-- Open-Meteo API (primary weather source)
      |-- OpenWeatherMap API (optional, supplementary)
      |-- ML Prediction Layer (TensorFlow.js)
      |-- MongoDB Atlas (Users, History, Favourites)
```

## Folder Structure

```
weatherwise/
|
|-- client/
|   |-- src/
|   |   |-- pages/
|   |   |   |-- Login.jsx
|   |   |   |-- Register.jsx
|   |   |   |-- Dashboard.jsx
|   |   |-- services/
|   |   |   |-- api.js
|   |   |-- App.jsx
|   |-- .env.example
|   |-- package.json
|
|-- server/
|   |-- routes/
|   |   |-- auth.js
|   |   |-- weather.js
|   |-- models/
|   |   |-- User.js
|   |   |-- SearchHistory.js
|   |   |-- Favourite.js
|   |-- middleware/
|   |   |-- auth.js
|   |-- controllers/
|   |-- server.js
|   |-- package.json
|
|-- .env.example
|-- package.json (root, manages install:all and dev scripts)
|-- .gitignore
|-- README.md
```

## Database Collections

**Users**
```json
{
  "name": "String",
  "email": "String",
  "password": "String (hashed)",
  "refreshToken": "String"
}
```

**Search History**
```json
{
  "userId": "ObjectId",
  "city": "String",
  "date": "Date",
  "weather": "Object"
}
```

**Favourites**
```json
{
  "userId": "ObjectId",
  "city": "String"
}
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free M0 tier works)
- Open-Meteo requires no API key
- Optional: OpenWeatherMap API key for supplementary data

### Quick Start

```bash
# Install all dependencies (root, client, server)
npm run install:all

# Start backend
npm run dev:server   # terminal 1

# Start frontend
npm run dev:client   # terminal 2
```

### Environment Setup

Copy `.env.example` to `.env` in the project root and fill in:

```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=generate_with_command_below
JWT_REFRESH_SECRET=generate_with_command_below
OWM_API_KEY=optional_openweathermap_key
PORT=5000
```

Generate strong secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice — once for `JWT_SECRET`, once for `JWT_REFRESH_SECRET`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns access + refresh tokens |
| POST | `/api/auth/refresh` | Issue a new access token using refresh token |
| POST | `/api/auth/logout` | Invalidate refresh token |
| GET | `/api/weather?city=` | Get current weather for a city |
| GET | `/api/forecast?city=` | Get multi-day forecast |
| GET | `/api/activities?city=` | Get activity suggestions based on conditions |
| POST | `/api/history` | Save a search to history |
| GET | `/api/history` | Get a user's search history |
| POST | `/api/favourites` | Save a city to favourites |
| GET | `/api/favourites` | Get a user's favourite cities |
| DELETE | `/api/favourites/:id` | Remove a favourite city |

## Authentication Flow

WeatherWise uses a short-lived access token paired with a longer-lived refresh token:

1. On login, the server issues a short-lived JWT access token and a long-lived refresh token.
2. The access token authenticates each API request via the `Authorization` header.
3. When the access token expires, the client calls `/api/auth/refresh` using the refresh token to get a new access token without forcing the user to log in again.
4. Logout invalidates the stored refresh token server-side.

This avoids forcing users to repeatedly log in while keeping access tokens short-lived for better security.

## Machine Learning Approach

A lightweight linear regression model, trained client-side with TensorFlow.js, uses the last several days of temperature data to estimate near-term temperature trends. This was chosen over heavier models (Decision Tree, Random Forest, LSTM) because it trains quickly without a dedicated ML backend, making it well suited for fast, single-variable short-term predictions running directly in the browser.

## Activity Recommendations

Based on the current weather conditions returned by Open-Meteo (temperature, precipitation probability, wind speed, UV index), the app suggests suitable activities — for example recommending indoor activities during high precipitation probability, or flagging high UV conditions for outdoor plans.

## Deployment

**Client (Vercel)**
1. Connect the GitHub repository to Vercel
2. Set the root directory to `client`
3. Set environment variable `VITE_API_URL` to your deployed Railway server URL

**Server (Railway)**
1. Connect the GitHub repository to Railway
2. Set the root directory to `server`
3. Add all environment variables (`MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `OWM_API_KEY`) in the Railway dashboard

**Database (MongoDB Atlas)**
1. Create a free M0 cluster
2. Whitelist `0.0.0.0/0` in Network Access to allow Railway's dynamic IPs to connect
3. Copy the connection string into `MONGODB_URI`

## Future Improvements

- LSTM-based multi-day forecasting via a dedicated Python microservice
- Email notifications for severe weather alerts
- GPS-based automatic location detection
- Side-by-side weather comparison between two cities
- Air Quality Index (AQI) integration
- Hourly forecast breakdown

## Skills Demonstrated

- REST API integration with multiple external data sources
- JWT authentication with access and refresh token rotation
- MongoDB CRUD operations with Mongoose
- React Hooks and component architecture
- Data visualization with interactive charts
- Client-side machine learning integration
- Full-stack MERN development and cloud deployment

## License

This project was built as a university mini-project for educational purposes.
