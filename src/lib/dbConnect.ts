import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import '../models';

const projectRoot = path.resolve(__dirname, '../../');
const envPath = path.join(projectRoot, '.env.local');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: Cached | undefined;
}

const cached: Cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export default async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGODB_URI!, opts);
  }
  try {
    cached.conn = await cached.promise;
    console.log('Db connected');
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
