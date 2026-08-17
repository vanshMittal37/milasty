import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

// Resolve current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('MONGO_URI is missing!');
  process.exit(1);
}

const updates = [
  {
    slug: 'cardamom-bajra-cookies',
    labReportUrl: 'https://res.cloudinary.com/dmm8lfc3x/raw/upload/fl_attachment/v1786967857/milasty/reports/Cardamom_Bajra.pdf'
  },
  {
    slug: 'coconut-jowar-cookies',
    labReportUrl: 'https://res.cloudinary.com/dmm8lfc3x/raw/upload/fl_attachment/v1786967895/milasty/reports/Coconut_Jowar.pdf'
  },
  {
    slug: 'cocoa-ragi-cookies',
    labReportUrl: 'https://res.cloudinary.com/dmm8lfc3x/raw/upload/fl_attachment/v1786967875/milasty/reports/Cocoa_Ragi.pdf'
  }
];

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    for (const update of updates) {
      const result = await Product.findOneAndUpdate(
        { slug: update.slug },
        { labReportUrl: update.labReportUrl },
        { new: true }
      );
      if (result) {
        console.log(`Updated ${update.slug} with new PDF link.`);
      } else {
        console.log(`Product with slug ${update.slug} not found in DB.`);
      }
    }
  } catch (err) {
    console.error('Error updating DB:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
