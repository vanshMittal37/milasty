import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import homeCmsRoutes from './routes/homeCmsRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import deliveryAreaRoutes from './routes/deliveryAreaRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import prebookingRoutes from './routes/prebookingRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import snackFinderRoutes from './routes/snackFinderRoutes.js';
import ingredientRoutes from './routes/ingredientRoutes.js';
import productDiscoveryRoutes from './routes/productDiscoveryRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard CORS Package Integration
app.use(cors({
  origin: true, // Echo request origin (allows https://milasty.vercel.app, localhost, etc.)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

// Fallback Explicit CORS Headers for all requests & preflights
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Increased Body Parser Limit for high-resolution base64 photo uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/home-cms', homeCmsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/delivery-areas', deliveryAreaRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/prebookings', prebookingRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/snack-finder', snackFinderRoutes);
app.use('/api/product-discovery', productDiscoveryRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api', reviewRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MILASTY API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Centralized Error Handling Middleware (Preserves CORS headers on errors)
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Uploaded image file size is too large. Please upload an image under 20MB.',
    });
  }

  res.status(err.status || err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 MILASTY API Server running on port ${PORT}`);
});
