import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dmm8lfc3x';
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'gdjzgrey';

    // Direct Cloudinary REST API upload using unsigned upload preset
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
