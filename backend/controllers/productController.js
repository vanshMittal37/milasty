import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { initialProducts } from '../data/seedData.js';

let memoryProducts = [...initialProducts];

export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      sort,
      featured,
      page = 1,
      limit = 12,
    } = req.query;

    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    let sortOptions = { createdAt: -1 }; // default newest
    if (sort === 'price_low_high') sortOptions = { price: 1 };
    if (sort === 'price_high_low') sortOptions = { price: -1 };
    if (sort === 'popular') sortOptions = { reviewCount: -1, rating: -1 };
    if (sort === 'discount') sortOptions = { discountValue: -1 };

    if (mongoose.connection.readyState === 1) {
      try {
        const skip = (Number(page) - 1) * Number(limit);
        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(Number(limit));

        if (products && products.length > 0) {
          return res.json({
            products,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)) || 1,
            total,
          });
        }
      } catch (e) {
        // Fallback
      }
    }

    // In-memory filter logic fallback
    let filtered = [...memoryProducts];
    if (category && category !== 'all') filtered = filtered.filter((p) => p.category === category);
    if (featured === 'true') filtered = filtered.filter((p) => p.isFeatured);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((p) => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    }
    if (sort === 'price_low_high') filtered.sort((a, b) => a.variants[0].price - b.variants[0].price);
    if (sort === 'price_high_low') filtered.sort((a, b) => b.variants[0].price - a.variants[0].price);

    res.json({
      products: filtered,
      page: 1,
      pages: 1,
      total: filtered.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

export const getProductBySlugOrId = async (req, res) => {
  try {
    const { identifier } = req.params;
    try {
      let product = await Product.findOne({
        $or: [{ slug: identifier }, { _id: identifier.match(/^[0-9a-fA-F]{24}$/) ? identifier : null }],
      });
      if (product) return res.json(product);
    } catch (e) {
      // Fallback
    }

    const product = memoryProducts.find((p) => p.slug === identifier || p._id === identifier);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    if (!productData.slug) {
      productData.slug = productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};
