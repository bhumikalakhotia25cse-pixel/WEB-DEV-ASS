import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import connectDB from './config/database.js';
import app from './app.js';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
try {
  const port = Number(process.env.PORT || process.env.port || 8000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Object.assign(new Error('PORT must be between 1 and 65535.'), { code: 'CONFIG' });
  await connectDB();
  const server = app.listen(port, () => console.log(`API running at http://localhost:${port}`));
  server.on('error', () => {
    console.error('Unable to start HTTP server. Check whether PORT is already in use.');
    mongoose.disconnect().finally(() => { process.exitCode = 1; });
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => server.close(() => mongoose.disconnect().finally(() => process.exit(0))));
  }
} catch (error) {
  console.error(error.code === 'CONFIG' ? error.message : 'Startup failed. Check MongoDB URI, database user credentials, network access, and Atlas IP access list.');
  await mongoose.disconnect();
  process.exitCode = 1;
}
