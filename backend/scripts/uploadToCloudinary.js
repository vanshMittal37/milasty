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

// Check credentials
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('\n[Error]: Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your backend/.env file first!');
  process.exit(1);
}

// Configure cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
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
  const result = await cloudinary.uploader.upload(videoPath, {
    resource_type: 'video',
    public_id: 'milasty-cookie',
    folder: 'milasty/videos',
  });

  console.log('\n--- Upload Successful! ---');
  console.log(`Public ID: ${result.public_id}`);
  console.log(`Format: ${result.format}`);
  console.log(`Secure URL: ${result.secure_url}`);
  console.log('\nCopy the Secure URL above and use it in your frontend code.');
} catch (error) {
  console.error('\nUpload failed with error:', error);
  process.exit(1);
}
