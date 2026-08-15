import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import Review from '../models/Review.js';
import Faq from '../models/Faq.js';
import { initialProducts, initialReviews, initialFaqs } from '../data/seedData.js';

const router = express.Router();

router.post('/seed', async (req, res) => {
  try {
    await Product.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await Coupon.deleteMany({});
    await Review.deleteMany({});
    await Faq.deleteMany({});

    // 1. Create Default Admin & Customer Users
    const adminUser = await User.create({
      name: 'MILASTY Admin',
      email: 'admin@milasty.com',
      password: 'Admin@123456', // Hashed in pre-save hook
      phone: '+91 8927142056',
      role: 'admin',
    });

    const demoUser = await User.create({
      name: 'Ananya Roy',
      email: 'ananya@example.com',
      password: 'User@123456',
      phone: '+91 9876543210',
      role: 'customer',
      addresses: [
        {
          fullName: 'Ananya Roy',
          phone: '+91 9876543210',
          addressLine: 'Flat 402, Green Valley Apartments, Indirapuram',
          city: 'Ghaziabad',
          state: 'Uttar Pradesh',
          pincode: '201014',
          isDefault: true,
        },
      ],
    });

    // 2. Create Categories
    const categoriesData = [
      { name: 'Starter Favorites', slug: 'starter', description: 'Curated boxes for first-time millet snackers', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80' },
      { name: 'Daily Ritual Cookies', slug: 'daily', description: 'Wholesome daily millet bakes in Desi Ghee & Jaggery', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80' },
      { name: 'Gifting Hampers', slug: 'gifts', description: 'Festive & celebration luxury gift boxes', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80' },
    ];
    const seededCategories = await Category.insertMany(categoriesData);

    // Map category refs to products
    const preparedProducts = initialProducts.map((p, index) => {
      const matchedCat = seededCategories.find((c) => c.slug === p.category);
      return {
        ...p,
        price: p.variants[0].price,
        originalPrice: p.variants[0].originalPrice,
        sku: `MLS-PRD-00${index + 1}`,
        stock: 100,
        status: 'active',
        categoryRef: matchedCat ? matchedCat._id : null,
      };
    });
    const seededProducts = await Product.insertMany(preparedProducts);

    // 3. Create Coupons
    const couponsData = [
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 300,
        maxDiscountAmount: 200,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        usageLimit: 500,
        active: true,
      },
      {
        code: 'MILASTY100',
        discountType: 'fixed',
        discountValue: 100,
        minOrderAmount: 500,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        usageLimit: 300,
        active: true,
      },
    ];
    const seededCoupons = await Coupon.insertMany(couponsData);

    const seededReviews = await Review.insertMany(initialReviews);
    const seededFaqs = await Faq.insertMany(initialFaqs);

    res.json({
      message: 'Database fully seeded with Admin, Customer, Categories, Products, and Coupons',
      adminCredentials: { email: 'admin@milasty.com', password: 'Admin@123456' },
      productsCount: seededProducts.length,
      categoriesCount: seededCategories.length,
      couponsCount: seededCoupons.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding database', error: error.message });
  }
});

export default router;
