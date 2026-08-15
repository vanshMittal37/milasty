import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Trial Pack", "Regular Pack"
  weight: { type: String, required: true }, // e.g. "70g", "100g"
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  stock: { type: Number, default: 50 },
  sku: { type: String },
  inStock: { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    subtitle: { type: String },
    description: { type: String, required: true },
    category: { type: String, required: true }, // Category slug or name
    categoryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    price: { type: Number, required: true }, // Base price
    originalPrice: { type: Number },
    discountType: { type: String, enum: ['percentage', 'fixed', 'none'], default: 'none' },
    discountValue: { type: Number, default: 0 },
    finalPrice: { type: Number }, // Calculated price
    sku: { type: String, unique: true, sparse: true },
    stock: { type: Number, default: 100 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    image: { type: String, required: true },
    images: [{ type: String }], // Multi-image gallery support
    secondaryImage: { type: String },
    badges: [{ type: String }],
    variants: [variantSchema],
    ingredients: [{ type: String }],
    allergens: { type: String },
    benefits: [{ type: String }],
    targetAudience: { type: String },
    nutritionFacts: {
      energyKcal: String,
      proteinG: String,
      carbohydrateG: String,
      totalSugarsG: String,
      addedSugarsG: String,
      totalFatG: String,
      dietaryFiberG: String,
      sodiumMg: String,
    },
    labReportUrl: { type: String },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, default: 5.0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.pre('save', function (next) {
  if (this.discountType === 'percentage' && this.discountValue > 0) {
    this.finalPrice = Math.round(this.price * (1 - this.discountValue / 100));
  } else if (this.discountType === 'fixed' && this.discountValue > 0) {
    this.finalPrice = Math.max(0, this.price - this.discountValue);
  } else {
    this.finalPrice = this.price;
  }
  next();
});

export default mongoose.model('Product', productSchema);
