export function fail(status, message) { throw Object.assign(new Error(message), { status }); }
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 11000) return res.status(409).json({ message: 'User already exists' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'Validation failed', errors: Object.values(error.errors).map(e => e.message) });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid value or ID' });
  const status = error.status || 500;
  res.status(status).json({ message: status === 500 ? 'Internal server error' : error.type === 'entity.parse.failed' ? 'Invalid JSON body' : error.message });
}
