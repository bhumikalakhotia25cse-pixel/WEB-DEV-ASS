import { createHash } from 'node:crypto';
import { Session } from '../models/session.model.js';
import { fail } from './errors.js';
export const tokenHash = token => createHash('sha256').update(token).digest('hex');
export async function requireAuth(req, res, next) {
  const match = /^Bearer ([a-f0-9]{64})$/.exec(req.get('authorization') || '');
  if (!match) fail(401, 'A valid Bearer token is required');
  const session = await Session.findOne({ tokenHash: tokenHash(match[1]), expiresAt: { $gt: new Date() } });
  if (!session) fail(401, 'Session expired or invalid. Please log in.');
  req.userId = session.user;
  req.session = session;
  next();
}
