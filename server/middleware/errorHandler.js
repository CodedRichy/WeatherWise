// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({ error: err.message, code: statusCode })
}
