import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Resolve current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Clean and trim loaded credentials to avoid Windows \r or whitespace issues
const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = (process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || '').trim();
const apiSecret = (process.env.CLOUDINARY_API_SECRET || process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET || '').trim();
const uploadPreset = (process.env.CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '').trim();

console.log('--- Configuration Loaded ---');
console.log(`Cloud Name   : ${cloudName || '(Not provided)'}`);
console.log(`API Key      : ${apiKey ? `${apiKey.substring(0, 4)}...${apiKey.slice(-4)}` : '(Not provided)'}`);
console.log(`API Secret   : ${apiSecret ? '(Provided, masked)' : '(Not provided)'}`);
console.log(`Upload Preset: ${uploadPreset || '(Not provided)'}`);
console.log('----------------------------\n');

if (!cloudName) {
  console.error('\n[Error]: CLOUDINARY_CLOUD_NAME is required!');
  process.exit(1);
}

// Configure cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey || undefined,
  api_secret: apiSecret || undefined,
  secure: true
});

// Path to the video file
const videoPath = path.resolve(__dirname, '../../frontend/public/videos/milasty-cookie.mp4');

if (!fs.existsSync(videoPath)) {
  console.error(`\n[Error]: Video file not found at: ${videoPath}`);
  process.exit(1);
}

console.log('Uploading milasty-cookie.mp4 to Cloudinary...');
console.log('This may take a moment depending on your upload speed...');

try {
  let result;
  
  if (apiKey && apiSecret) {
    console.log('Attempting signed upload...');
    result = await cloudinary.uploader.upload(videoPath, {
      resource_type: 'video',
      public_id: 'milasty-cookie',
      folder: 'milasty/videos',
    });
  } else if (uploadPreset) {
    console.log('Attempting unsigned upload using preset...');
    result = await cloudinary.uploader.unsigned_upload(videoPath, uploadPreset, {
      resource_type: 'video',
      public_id: 'milasty-cookie',
      folder: 'milasty/videos',
    });
  } else {
    console.error('\n[Error]: You must provide either (API Key + Secret) OR (Upload Preset) to upload.');
    process.exit(1);
  }

  console.log('\n--- Upload Successful! ---');
  console.log(`Public ID: ${result.public_id}`);
  console.log(`Format: ${result.format}`);
  console.log(`Secure URL: ${result.secure_url}`);
  console.log('\nCopy the Secure URL above and use it in your frontend code.');
} catch (error) {
  console.error('\nSigned upload failed with error:', error.message || error);
  
  if (uploadPreset) {
    console.log('\nRetrying using unsigned upload with the preset...');
    try {
      const result = await cloudinary.uploader.unsigned_upload(videoPath, uploadPreset, {
        resource_type: 'video',
        public_id: 'milasty-cookie',
        folder: 'milasty/videos',
      });
      console.log('\n--- Upload Successful via Unsigned Preset! ---');
      console.log(`Public ID: ${result.public_id}`);
      console.log(`Format: ${result.format}`);
      console.log(`Secure URL: ${result.secure_url}`);
      console.log('\nCopy the Secure URL above and use it in your frontend code.');
    } catch (presetError) {
      console.error('\nUnsigned upload also failed with error:', presetError.message || presetError);
      process.exit(1);
    }
  } else {
    process.exit(1);
  }
}
