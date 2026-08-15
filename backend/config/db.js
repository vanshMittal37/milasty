import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/milasty';
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`MongoDB Connection Warning: ${error.message}. Running with in-memory fallback data.`);
    return false;
  }
};
