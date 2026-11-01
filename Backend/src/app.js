import express from 'express';
import mongoose from 'mongoose';
import userRouter from './routes/user.route.js';
import postRouter from './routes/post.route.js';
import { errorHandler } from './middleware/errors.js';
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'unavailable', database: connected ? 'connected' : 'disconnected' });
});
app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter);
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);
export default app;
