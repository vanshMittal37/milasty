import express from 'express';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dmm8lfc3x').trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();
    const uploadPreset = (process.env.CLOUDINARY_UPLOAD_PRESET || 'gdjzgrey').trim();

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey || undefined,
      api_secret: apiSecret || undefined,
      secure: true,
    });

    let uploadResult;
    if (apiKey && apiSecret) {
      uploadResult = await cloudinary.uploader.upload(image, {
        folder: 'milasty/products',
        resource_type: 'auto',
      });
    } else {
      uploadResult = await cloudinary.uploader.unsigned_upload(image, uploadPreset, {
        folder: 'milasty/products',
        resource_type: 'auto',
      });
    }

    if (uploadResult && uploadResult.secure_url) {
      return res.json({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
    }

    return res.status(400).json({ message: 'Cloudinary upload failed: No URL returned' });
  } catch (error) {
    console.error('Cloudinary Image Upload Error:', error);
    return res.status(400).json({ message: error.message || 'Error uploading image to Cloudinary' });
  }
});

export default router;
