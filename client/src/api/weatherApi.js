import client from './apiClient.js'

export const weatherApi = {
  getCurrent:    (lat, lon) =>
    client.get('/api/weather/current', { params: { lat, lon } }),

  getForecast:   (lat, lon, days = 7) =>
    client.get('/api/weather/forecast', { params: { lat, lon, days } }),

  getHourly:     (lat, lon, hours = 48) =>
    client.get('/api/weather/hourly', { params: { lat, lon, hours } }),

  getNarrative:  (lat, lon, style = 'casual') =>
    client.get('/api/weather/narrative', { params: { lat, lon, style } }),

  getCompare:    (pairs) =>
    client.get('/api/weather/compare', { params: { cities: pairs.join(',') } }),

  geocode:       (q) =>
    client.get('/api/weather/geocode', { params: { q } }),

  getScores:     (lat, lon) =>
    client.get('/api/activities/scores', { params: { lat, lon } }),

  getBestWindow: (activity, lat, lon, days = 7) =>
    client.get('/api/activities/best-window', { params: { activity, lat, lon, days } }),

  getPrediction: (lat, lon) =>
    client.get('/api/predict/temperature', { params: { lat, lon } }),

  getExplain:    (lat, lon) =>
    client.get('/api/predict/explain', { params: { lat, lon } }),

  getHistory:    (lat, lon, date) =>
    client.get('/api/weather/history', { params: { lat, lon, date } }),

  getOracle: (lat, lon) => client.get('/api/smart/oracle', { params: { lat, lon } }),
  getUV:     (lat, lon) => client.get('/api/smart/uv', { params: { lat, lon } }),
  getSunset: (lat, lon) => client.get('/api/smart/sunset', { params: { lat, lon } }),
  getBio:    (lat, lon) => client.get('/api/smart/bio', { params: { lat, lon } }),
}

export const authApi = {
  register: (name, email, password) =>
    client.post('/api/auth/register', { name, email, password }),

  login: (email, password) =>
    client.post('/api/auth/login', { email, password }),

  refresh: (refreshToken) =>
    client.post('/api/auth/refresh', { refreshToken }),

  me: () =>
    client.get('/api/auth/me'),

  logout: () =>
    client.post('/api/auth/logout'),
}

export const userApi = {
  getFavorites:   () =>
    client.get('/api/favorites'),

  addFavorite:    (city, lat, lon) =>
    client.post('/api/favorites', { city, lat, lon }),

  removeFavorite: (id) =>
    client.delete(`/api/favorites/${id}`),

  getHistory:     () =>
    client.get('/api/history'),
}
