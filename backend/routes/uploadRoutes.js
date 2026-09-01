import express from 'express';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const router = express.Router();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dmm8lfc3x';
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

router.post('/', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    // 1. Try SDK server-side upload if credentials are model configured
    if (cloudName && apiKey && apiSecret) {
      const uploadResult = await cloudinary.uploader.upload(image, {
        folder: 'milasty/products',
        resource_type: 'auto',
      });
      return res.json({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
    }

    // 2. Fallback to unsigned preset REST API upload
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'gdjzgrey';
    const formData = new URLSearchParams();
    formData.append('file', image);
    formData.append('upload_preset', uploadPreset);

    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await cloudRes.json();

    if (data.secure_url) {
      return res.json({ url: data.secure_url, public_id: data.public_id });
    } else {
      return res.status(500).json({ message: data.error?.message || 'Cloudinary upload failed' });
    }
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Error uploading image to Cloudinary', error: error.message });
  }
});

export default router;
