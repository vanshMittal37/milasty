import express from 'express';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '../middleware/authMiddleware.js';

dotenv.config();

const router = express.Router();

// Images (admin catalogue + customer review photos) and PDF lab reports, as base64 data URLs
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Explicit preflight handler for OPTIONS /api/upload
router.options('/', (req, res) => {
  res.sendStatus(200);
});

// Logged-in users only: an open endpoint let anyone on the internet upload into the Cloudinary account
router.post('/', protect, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ code: 'NO_FILE', message: 'No image data provided' });
    }

    const header = image.match(/^data:([a-z0-9.+/-]+);base64,/i);
    if (!header) {
      return res.status(400).json({ code: 'INVALID_FORMAT', message: 'The file could not be read. Please choose the image again.' });
    }
    const mimeType = header[1].toLowerCase();
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(415).json({ code: 'INVALID_FORMAT', message: 'Only JPG, PNG or WEBP images (or PDF reports) can be uploaded.' });
    }
    const fileBytes = Math.floor(((image.length - header[0].length) * 3) / 4);
    if (fileBytes > MAX_FILE_BYTES) {
      return res.status(413).json({ code: 'TOO_LARGE', message: 'This file is larger than 10 MB. Please choose a smaller image.' });
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
    const isPdf = mimeType === 'application/pdf';
    const uploadOptions = isPdf
      ? { folder: 'milasty/products', resource_type: 'raw', public_id: `report_${Date.now()}.pdf` }
      : { folder: 'milasty/products', resource_type: 'auto' };

    let uploadResult;
    try {
      uploadResult = await cloudinary.uploader.upload(image, uploadOptions);
    } catch (signedErr) {
      // The configured API key's role currently lacks the "create" permission (Cloudinary 403), so
      // signed uploads fail and every upload goes through the unsigned preset.
      console.warn(`[UPLOAD] Signed upload failed (${signedErr?.http_code || ''} ${signedErr?.message}); using unsigned preset "${uploadPreset}"`);
      uploadResult = await cloudinary.uploader.unsigned_upload(image, uploadPreset, uploadOptions);
    }

    if (uploadResult && uploadResult.secure_url) {
      return res.json({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
    }

    return res.status(502).json({ code: 'STORAGE_ERROR', message: 'Image storage did not return a file URL. Please try again.' });
  } catch (error) {
    const httpCode = error?.http_code || error?.error?.http_code;
    console.error('[UPLOAD] Cloudinary upload error:', httpCode || '', error?.message || error?.error?.message || error);
    const detail = error?.message || error?.error?.message || 'Unknown error';
    if (httpCode === 401 || httpCode === 403) {
      return res.status(502).json({ code: 'STORAGE_PERMISSION', message: `Image storage refused the upload (permission error). Please contact the site administrator. (${detail})` });
    }
    if (httpCode === 400) {
      return res.status(400).json({ code: 'STORAGE_REJECTED', message: `Image storage rejected this file: ${detail}` });
    }
    return res.status(502).json({ code: 'STORAGE_ERROR', message: `Could not upload the image right now. Please try again. (${detail})` });
  }
});

export default router;
