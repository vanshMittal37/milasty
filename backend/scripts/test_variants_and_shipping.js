import { calculatePackage, parseGramsFromWeightString } from '../controllers/shipratController.js';
import { canAccessOrder } from '../controllers/shipratController.js';

async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Discount Formulas
  console.log('\n[1] Testing Pricing and Discount Formulas');
  const computePrice = (mrp, type, val) => {
    const orig = parseFloat(mrp);
    if (isNaN(orig) || orig <= 0) return 0;
    const v = parseFloat(val) || 0;
    let finalPrice = orig;
    if (type === 'percentage' && v > 0) {
      finalPrice = orig - (orig * v / 100);
    } else if (type === 'fixed' && v > 0) {
      finalPrice = orig - v;
    }
    return Math.max(0, Math.round(finalPrice * 100) / 100);
  };

  assert(computePrice(100, 'percentage', 20) === 80, 'Percentage discount 20% on 100 = 80');
  assert(computePrice(169, 'percentage', 10) === 152.1, 'Percentage discount 10% on 169 = 152.1');
  assert(computePrice(99, 'fixed', 30) === 69, 'Fixed discount ₹30 on 99 = 69');
  assert(computePrice(50, 'fixed', 70) === 0, 'Fixed discount exceeding MRP does not become negative (floored at 0)');
  assert(computePrice(120, 'none', 50) === 120, 'No discount leaves price at MRP');

  // 2. Weight string parsing
  console.log('\n[2] Testing Weight Parsing');
  assert(parseGramsFromWeightString('70g') === 70, 'Parse 70g');
  assert(parseGramsFromWeightString('100g') === 100, 'Parse 100g');
  assert(parseGramsFromWeightString('180g') === 180, 'Parse 180g');
  assert(parseGramsFromWeightString('1.5kg') === 1500, 'Parse 1.5kg to 1500g');

  // 3. calculatePackage with shipping weight and quantities
  console.log('\n[3] Testing calculatePackage with Shipping Weight and Quantity');
  try {
    const items = [
      {
        title: 'Millet Cookies Mini Pack',
        shipping_weight: 90, // 90g per unit
        quantity: 3,          // total = 270g
      },
      {
        title: 'Millet Family Pack',
        shipping_weight: 220, // 220g per unit
        quantity: 2,          // total = 440g
      }
    ];

    const pkg = await calculatePackage(items);
    // 270g + 440g = 710g = 0.71 kg
    assert(pkg.productWeightKg === 0.71, `Total product weight is 0.71 kg (got ${pkg.productWeightKg})`);
    assert(pkg.totalWeightKg >= 0.71, `Total weight with packaging is >= 0.71 kg (got ${pkg.totalWeightKg})`);
    assert(pkg.dimensions && pkg.dimensions.length > 0 && pkg.dimensions.width > 0 && pkg.dimensions.height > 0, 'Dimensions selected correctly');
    console.log(`Package box dimensions: ${pkg.dimensions.length}x${pkg.dimensions.width}x${pkg.dimensions.height} cm`);
  } catch (err) {
    assert(false, `calculatePackage failed: ${err.message}`);
  }

  // 4. canAccessOrder Permissions
  console.log('\n[4] Testing canAccessOrder Permissions (Customer View)');
  const mockOrder = {
    id: 'ord-123',
    user_id: 'user-abc',
    customer_email: 'custoMER@Example.com',
    customer_phone: '+91 9876543210'
  };

  // Admin access
  assert(canAccessOrder({ role: 'admin', id: 'admin-1' }, mockOrder) === true, 'Admin can access any order');

  // Matching user_id
  assert(canAccessOrder({ role: 'user', id: 'user-abc' }, mockOrder) === true, 'Matching user ID can access order');

  // Matching email case-insensitive
  assert(canAccessOrder({ role: 'user', id: 'other', email: 'Customer@example.com' }, mockOrder) === true, 'Matching email case-insensitive');

  // Matching phone normalized
  assert(canAccessOrder({ role: 'user', id: 'other', phone: '9876543210' }, mockOrder) === true, 'Matching phone normalized (10-digit)');

  // Non-matching user
  assert(canAccessOrder({ role: 'user', id: 'other', email: 'intruder@test.com', phone: '9111111111' }, mockOrder) === false, 'Non-matching user cannot access order');

  console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
