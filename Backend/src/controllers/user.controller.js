import { randomBytes } from 'node:crypto';
import { User } from '../models/user.model.js';
import { Session } from '../models/session.model.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { tokenHash } from '../middleware/auth.js';
import { fail } from '../middleware/errors.js';
function credentials(body) {
  const { email, password } = body || {};
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password || password.length > 128) fail(400, 'Email and password (at most 128 characters) are required');
  return { email: email.trim().toLowerCase(), password };
}
const publicUser = user => ({ id: user._id, username: user.username, email: user.email });
export async function registerUser(req, res) {
  const { email, password } = credentials(req.body);
  const username = req.body.username;
  if (typeof username !== 'string' || username.trim().length < 2 || password.length < 8) fail(400, 'Username needs at least 2 characters and password at least 8');
  const user = await User.create({ username, email, password: await hashPassword(password) });
  res.status(201).json({ message: 'User registered', user: publicUser(user) });
}
export async function loginUser(req, res) {
  const { email, password } = credentials(req.body);
  const user = await User.findOne({ email }).select('+password');
  if (!user || !await verifyPassword(password, user.password)) fail(401, 'Invalid credentials');
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await Session.create({ user: user._id, tokenHash: tokenHash(token), expiresAt });
  res.json({ message: 'User logged in', user: publicUser(user), token, expiresAt });
}
export async function logoutUser(req, res) {
  await Session.deleteOne({ _id: req.session._id });
  res.json({ message: 'Logout successful' });
}
