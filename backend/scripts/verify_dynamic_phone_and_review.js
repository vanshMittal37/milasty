/**
 * Automated Verification Script: Favicon, Dynamic Phone Resolution & Order Review System
 * Run with: cd milasty; node backend/scripts/verify_dynamic_phone_and_review.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const frontendRoot = path.resolve(backendRoot, '../frontend');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runAllChecks() {
  console.log('\n======================================================');
  console.log('MILASTY FAVICON, DYNAMIC PHONE & REVIEW VERIFICATION');
  console.log('======================================================\n');

  // ─────────────────────────────────────────────────────────────────
  // PART 1: FAVICON FILES & GOOGLE SEARCH READINESS
  // ─────────────────────────────────────────────────────────────────
  console.log('--- TEST GROUP 1: Favicon Assets & Google Search Standards ---');
  
  const publicDir = path.join(frontendRoot, 'public');
  const requiredFaviconFiles = [
    'favicon.ico',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'favicon-48x48.png',
    'apple-touch-icon.png',
    'android-chrome-192x192.png',
    'android-chrome-512x512.png',
    'site.webmanifest',
    'robots.txt',
  ];

  for (const file of requiredFaviconFiles) {
    const fullPath = path.join(publicDir, file);
    const exists = fs.existsSync(fullPath);
    const stat = exists ? fs.statSync(fullPath) : null;
    assert(exists && stat.size > 0, `Favicon asset ${file} exists and is non-empty (${stat?.size || 0} bytes)`);
  }

  // Check manifest content
  const manifestPath = path.join(publicDir, 'site.webmanifest');
  if (fs.existsSync(manifestPath)) {
    const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert(manifestJson.name.includes('MILASTY') && manifestJson.short_name === 'MILASTY', 'site.webmanifest contains correct name and short_name: MILASTY');
    assert(manifestJson.theme_color === '#2A140D', 'site.webmanifest contains MILASTY brand theme_color (#2A140D)');
    assert(Array.isArray(manifestJson.icons) && manifestJson.icons.length >= 2, 'site.webmanifest defines icons array with multiple sizes');
  }

  // Check robots.txt accessibility
  const robotsPath = path.join(publicDir, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    assert(robotsContent.includes('Allow: /favicon') || robotsContent.includes('Allow: /'), 'robots.txt permits crawler access to favicons');
  }

  // Check frontend/index.html head tags
  const indexHtmlPath = path.join(frontendRoot, 'index.html');
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  assert(indexHtml.includes('href="/favicon.ico"'), 'index.html includes standard favicon.ico');
  assert(indexHtml.includes('href="/favicon-32x32.png"'), 'index.html includes favicon-32x32.png');
  assert(indexHtml.includes('href="/favicon-48x48.png"'), 'index.html includes favicon-48x48.png (Google Search standard size)');
  assert(indexHtml.includes('href="/apple-touch-icon.png"'), 'index.html includes apple-touch-icon.png');
  assert(indexHtml.includes('href="/site.webmanifest"'), 'index.html includes site.webmanifest');

  // ─────────────────────────────────────────────────────────────────
  // PART 2: DYNAMIC CUSTOMER PHONE RESOLUTION
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 2: Dynamic Customer Phone Resolution Priority ---');

  const { resolveCustomerMobile } = await import('../services/whatsappEventService.js');
  const { normalizeIndianMobile } = await import('../utils/phone.js');

  // Normalization tests
  assert(normalizeIndianMobile('+91 87913 83595') === '8791383595', 'normalizeIndianMobile handles +91 prefix and spaces');
  assert(normalizeIndianMobile('09876543210') === '9876543210', 'normalizeIndianMobile handles leading zero');
  assert(normalizeIndianMobile('919876543210') === '9876543210', 'normalizeIndianMobile handles 12-digit Indian prefix');
  assert(normalizeIndianMobile('12345') === null, 'normalizeIndianMobile rejects invalid length');
  assert(normalizeIndianMobile(null) === null, 'normalizeIndianMobile handles null gracefully');

  // Hierarchy Tier 1: Order contact phone takes top priority
  const tier1Payload = {
    customer_phone: '9876543210',
    recipient_phone: '8888888888',
    user: { phone: '7777777777' },
  };
  const resolvedTier1 = await resolveCustomerMobile(tier1Payload);
  assert(resolvedTier1 === '9876543210', `Tier 1: Order phone takes precedence (resolved: ${resolvedTier1})`);

  // Hierarchy Tier 2: Gift recipient phone if order contact phone missing
  const tier2Payload = {
    customer_phone: '',
    recipient_phone: '8888888888',
    user: { phone: '7777777777' },
  };
  const resolvedTier2 = await resolveCustomerMobile(tier2Payload);
  assert(resolvedTier2 === '8888888888', `Tier 2: Gift recipient phone used when order phone empty (resolved: ${resolvedTier2})`);

  // Hierarchy Tier 3: Customer profile phone if order and gift recipient phone missing
  const tier3Payload = {
    customer_phone: null,
    recipient_phone: null,
    user_phone: '7777777777',
  };
  const resolvedTier3 = await resolveCustomerMobile(tier3Payload);
  assert(resolvedTier3 === '7777777777', `Tier 3: Profile phone used when order/gift phones missing (resolved: ${resolvedTier3})`);

  // Hierarchy Tier 4: No phone available -> returns null without throwing
  const tier4Payload = {
    customer_phone: '',
    recipient_phone: null,
  };
  const resolvedTier4 = await resolveCustomerMobile(tier4Payload);
  assert(resolvedTier4 === null, `Tier 4: Missing phones returns null safely without throwing (resolved: ${resolvedTier4})`);

  // ─────────────────────────────────────────────────────────────────
  // PART 3: DELIVERED WHATSAPP REVIEW LINK & TEMPLATE
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 3: Delivered WhatsApp Review Link & Template ---');

  const { getCustomerOrderReviewUrl, customerOrderDelivered } = await import('../services/whatsappTemplates/orderTemplates.js');

  const reviewUrl = getCustomerOrderReviewUrl('ord_sample_999', 'ORD-999');
  assert(
    reviewUrl.includes('/account/orders/ord_sample_999/review'),
    `Review URL contains correct route path: ${reviewUrl}`
  );

  const sampleOrder = {
    order_number: 'ORD-999',
    customer_name: 'Priya Sharma',
    total_amount: 1499,
  };
  const deliveredTemplate = customerOrderDelivered({
    customerName: sampleOrder.customer_name,
    orderId: 'ord_sample_999',
    orderNumber: sampleOrder.order_number,
    reviewUrl,
  });
  assert(deliveredTemplate.includes('Namaste Priya Sharma'), 'Delivered template includes customer name greeting');
  assert(deliveredTemplate.includes('ORD-999'), 'Delivered template includes order number');
  assert(deliveredTemplate.includes('successfully delivered'), 'Delivered template confirms successful delivery');
  assert(deliveredTemplate.includes('Share your experience'), 'Delivered template includes review CTA headline');
  assert(deliveredTemplate.includes(reviewUrl), 'Delivered template contains dynamic review URL');

  // ─────────────────────────────────────────────────────────────────
  // PART 4: FRONTEND ROUTES & REVIEW PAGE MOUNTING
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 4: Frontend App Route Mounting & Review Page ---');

  const appJsxPath = path.join(frontendRoot, 'src', 'App.jsx');
  const appJsx = fs.readFileSync(appJsxPath, 'utf8');

  assert(appJsx.includes('import OrderReviewPage from \'./pages/OrderReviewPage\''), 'App.jsx imports OrderReviewPage');
  assert(appJsx.includes('path="/account/orders/:orderId/review"'), 'App.jsx defines /account/orders/:orderId/review route');

  const reviewPagePath = path.join(frontendRoot, 'src', 'pages', 'OrderReviewPage.jsx');
  assert(fs.existsSync(reviewPagePath), 'OrderReviewPage.jsx exists in frontend/src/pages');

  // ─────────────────────────────────────────────────────────────────
  // PART 5: BACKEND ROUTE & CONTROLLER REGISTRATION
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 5: Backend Review Routes & Security Architecture ---');

  const reviewRoutesPath = path.join(backendRoot, 'routes', 'reviewRoutes.js');
  const reviewRoutesContent = fs.readFileSync(reviewRoutesPath, 'utf8');

  assert(
    reviewRoutesContent.includes("router.get('/reviews/order/:orderId', protect, getOrderReviewDetails)"),
    'reviewRoutes mounts GET /reviews/order/:orderId protected with auth middleware'
  );

  const reviewControllerPath = path.join(backendRoot, 'controllers', 'reviewController.js');
  const reviewControllerContent = fs.readFileSync(reviewControllerPath, 'utf8');

  assert(reviewControllerContent.includes('export const getOrderReviewDetails = async'), 'reviewController exports getOrderReviewDetails');
  assert(reviewControllerContent.includes('export const createCustomerReview = async'), 'reviewController exports createCustomerReview');
  assert(reviewControllerContent.includes('isDelivered'), 'reviewController checks delivered status for reviews');
  assert(reviewControllerContent.includes('existingReviews'), 'reviewController prevents duplicate reviews');

  // ─────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────
  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllChecks().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
