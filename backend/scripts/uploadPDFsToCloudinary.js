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

const pdfs = [
  { name: 'Cardamom_Bajra.pdf', path: '../../frontend/public/Cardamom_Bajra.pdf' },
  { name: 'Cocoa_Ragi.pdf', path: '../../frontend/public/Cocoa_Ragi.pdf' },
  { name: 'Coconut_Jowar.pdf', path: '../../frontend/public/Coconut_Jowar.pdf' }
];

console.log('Starting PDF uploads to Cloudinary...\n');

for (const pdf of pdfs) {
  const filePath = path.resolve(__dirname, pdf.path);
  if (!fs.existsSync(filePath)) {
    console.error(`[Error]: PDF file not found at: ${filePath}`);
    continue;
  }

  console.log(`Uploading ${pdf.name}...`);
  try {
    let result;
    const options = {
      resource_type: 'raw',
      public_id: pdf.name.replace('.pdf', ''),
      folder: 'milasty/reports',
    };

    if (apiKey && apiSecret) {
      try {
        console.log(`Attempting signed upload for ${pdf.name}...`);
        result = await cloudinary.uploader.upload(filePath, options);
      } catch (signedError) {
        console.warn(`Signed upload failed for ${pdf.name}:`, signedError.message || signedError);
        if (uploadPreset) {
          console.log(`Attempting unsigned fallback upload with preset: ${uploadPreset}...`);
          result = await cloudinary.uploader.unsigned_upload(filePath, uploadPreset, options);
        } else {
          throw signedError;
        }
      }
    } else if (uploadPreset) {
      console.log(`Attempting unsigned upload with preset: ${uploadPreset}...`);
      result = await cloudinary.uploader.unsigned_upload(filePath, uploadPreset, options);
    } else {
      console.error('[Error]: You must provide either (API Key + Secret) OR (Upload Preset) to upload.');
      process.exit(1);
    }

    console.log(`\n--- ${pdf.name} Upload Successful! ---`);
    console.log(`Public ID : ${result.public_id}`);
    console.log(`Secure URL: ${result.secure_url}\n`);
  } catch (error) {
    console.error(`\n[Fatal Error] Failed to upload ${pdf.name}:`, error);
  }
}
