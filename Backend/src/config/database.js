import mongoose from 'mongoose';
export default async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri || !/^mongodb(\+srv)?:\/\//.test(uri) || /[<>]|your[_-]|example/i.test(uri)) {
    throw Object.assign(new Error('Set MONGODB_URI in the root .env to a real MongoDB connection string.'), { code: 'CONFIG' });
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected.');
}
