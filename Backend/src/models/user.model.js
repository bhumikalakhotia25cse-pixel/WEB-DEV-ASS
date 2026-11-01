import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { type: String, required: true, select: false },
}, { timestamps: true });
schema.set('toJSON', { transform(doc, result) { delete result.password; return result; } });
export const User = mongoose.model('User', schema);
