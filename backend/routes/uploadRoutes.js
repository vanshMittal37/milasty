import express from 'express';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const router = express.Router();

// Explicit preflight handler for OPTIONS /api/upload
router.options('/', (req, res) => {
  res.sendStatus(200);
});

router.post('/', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dmm8lfc3x').trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || '439913678893597').trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET || 'wyCApTQ5Ir3A6Oi4fO94ughge8Q').trim();
    const uploadPreset = (process.env.CLOUDINARY_UPLOAD_PRESET || 'gdjzgrey').trim();

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    // PDFs (lab reports) go up as 'raw': with 'auto' they are stored as images, and Cloudinary
    // blocks PDF delivery from the image type by default (401 "deny or ACL failure").
    const isPdf = typeof image === 'string' && image.startsWith('data:application/pdf');
    const uploadOptions = isPdf
      ? { folder: 'milasty/products', resource_type: 'raw', public_id: `report_${Date.now()}.pdf` }
      : { folder: 'milasty/products', resource_type: 'auto' };

    let uploadResult;
    try {
      uploadResult = await cloudinary.uploader.upload(image, uploadOptions);
    } catch (signedErr) {
      console.warn('Signed upload failed, trying unsigned upload:', signedErr.message);
      uploadResult = await cloudinary.uploader.unsigned_upload(image, uploadPreset, uploadOptions);
    }

    if (uploadResult && uploadResult.secure_url) {
      return res.json({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
    }

    return res.status(400).json({ message: 'Cloudinary upload failed: No URL returned' });
  } catch (error) {
    console.error('Cloudinary Image Upload Error:', error?.response?.data || error?.message || error);
    const errorDetails = error?.response?.data?.error?.message || error?.message || 'Error uploading image to Cloudinary';
    return res.status(400).json({ message: errorDetails, error: error?.response?.data || error });
  }
});

export default router;
