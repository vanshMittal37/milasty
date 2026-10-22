import { supabase } from '../config/supabase.js';
import { safeUpdateOrder } from '../utils/safeOrderUpdate.js';

// ─── Shiprath B2C Constants ──────────────────────────────────────────────────
const SHIPRATH_BASE_URL = 'https://backend.shiprath.com/vendor/v1';
const WAREHOUSE_ADDRESS_ID = '1777118843112';
const WAREHOUSE_PINCODE = '201016';

// ─── Package configuration (single source of truth) ─────────────────────────
// Internally ALL weights are kilograms and ALL dimensions are centimetres.

// Extra weight of the box/wrapping. MILASTY has no packaging-weight business rule yet, so this
// defaults to 0 — set SHIPRATH_PACKAGING_WEIGHT_KG on Railway once the real box weight is known.
const PACKAGING_WEIGHT_KG = Number(process.env.SHIPRATH_PACKAGING_WEIGHT_KG || 0);

// Create Shipment weights are kilograms: the captured Shiprath dashboard request (order 750252,
// 0.20 kg) sent weight/total_weight/volumetric_weight = 0.2. The old grams option was removed so a
// leftover SHIPRATH_BOOKING_WEIGHT_UNIT=g on Railway can no longer turn 0.2 kg into 200.
const SHIPRATH_BOOKING_WEIGHT_UNIT = 'kg';

// carrier_type sent when the Rate API row does not include one. The captured dashboard request for
// Amazon Surface used carrier_type = 1.
const DEFAULT_CARRIER_TYPE = Number(process.env.SHIPRATH_DEFAULT_CARRIER_TYPE || 1);

// Log the outbound Create Shipment payload (contact details masked, no credentials).
// Temporary diagnostics — set SHIPRATH_LOG_PAYLOAD=false to turn off.
const SHIPRATH_LOG_PAYLOAD = String(process.env.SHIPRATH_LOG_PAYLOAD || 'true').toLowerCase() !== 'false';

// Upper sanity limit — anything above this is a calculation bug, not a real MILASTY parcel.
const MAX_PACKAGE_WEIGHT_KG = 30;

/**
 * MILASTY standard box sizes — MILASTY's own packaging defaults (not Shiprath-prescribed).
 * Each tier: the box used when total weight ≤ maxKg. The last tier (maxKg: null) covers anything heavier.
 *
 * Sized so volumetric weight (L×W×H ÷ 5000) stays at or below the actual weight of a typical order:
 * the old 20×15×10 box turned a 0.2 kg parcel into 0.6 kg applicable weight, exceeding the
 * 0.25 kg courier slabs ("TOTAL WEIGHT IS MAXIMUM THAN THE CARRIER WEIGHT LIMIT").
 *
 * The physical boxes MUST actually fit the products. Override without a code change by setting
 * SHIPRATH_BOX_SIZES on Railway to a JSON array in this same shape.
 */
const DEFAULT_BOX_SIZES = [
  { maxKg: 0.5, length: 20, width: 10, height: 5 },
  { maxKg: 1, length: 25, width: 15, height: 8 },
  { maxKg: 2, length: 30, width: 20, height: 10 },
  { maxKg: 3, length: 35, width: 25, height: 12 },
  // No size was specified above 3 kg — previous default kept until MILASTY confirms one
  { maxKg: null, length: 40, width: 30, height: 20 },
];

function loadBoxSizes() {
  const raw = process.env.SHIPRATH_BOX_SIZES;
  if (!raw) return DEFAULT_BOX_SIZES;
  try {
    const tiers = JSON.parse(raw);
    const valid = Array.isArray(tiers) && tiers.length > 0 && tiers.every((t) =>
      [t.length, t.width, t.height].every((v) => Number.isFinite(v) && v > 0) &&
      (t.maxKg === null || (Number.isFinite(t.maxKg) && t.maxKg > 0)));
    if (!valid) throw new Error('each tier needs positive length/width/height and maxKg (number or null)');
    return [...tiers].sort((a, b) => (a.maxKg ?? Infinity) - (b.maxKg ?? Infinity));
  } catch (e) {
    console.error(`[SHIPRATH CONFIG] Ignoring invalid SHIPRATH_BOX_SIZES (${e.message}) — using defaults`);
    return DEFAULT_BOX_SIZES;
  }
}
const BOX_SIZES = loadBoxSizes();

// Volumetric divisor confirmed with the Shiprath Rate Calculator:
// 20×15×10 cm → 0.60 kg volumetric  ⇒  L×W×H ÷ 5000.
const VOLUMETRIC_DIVISOR = Number(process.env.SHIPRATH_VOLUMETRIC_DIVISOR || 5000);

/**
 * The ONLY place box selection happens — rate quotes and bookings both call this.
 * @param {number} totalWeightKg  total shipment weight in kg
 * @returns {{ length: number, width: number, height: number }} centimetres
 */
export function getPackageDimensions(totalWeightKg) {
  const tier = BOX_SIZES.find((t) => t.maxKg === null || totalWeightKg <= t.maxKg) || BOX_SIZES[BOX_SIZES.length - 1];
  return { length: tier.length, width: tier.width, height: tier.height };
}

/** Volumetric and applicable (chargeable) weight, as Shiprath calculates them. */
export function getChargeableWeight(actualWeightKg, { length, width, height }) {
  const volumetricWeightKg = Math.round(((length * width * height) / VOLUMETRIC_DIVISOR) * 1000) / 1000;
  return { volumetricWeightKg, applicableWeightKg: Math.max(actualWeightKg, volumetricWeightKg) };
}

/** One log line with everything that determines the courier's weight check. */
export function logPackageWeights(label, actualWeightKg, dimensions) {
  const { volumetricWeightKg, applicableWeightKg } = getChargeableWeight(actualWeightKg, dimensions);
  console.log(`[SHIPRATH WEIGHT] ${label} | Actual: ${actualWeightKg} kg | Box: ${dimensions.length}×${dimensions.width}×${dimensions.height} cm | Volumetric (÷${VOLUMETRIC_DIVISOR}): ${volumetricWeightKg} kg | Applicable: ${applicableWeightKg} kg${volumetricWeightKg > actualWeightKg ? ' ⚠️ box is driving the charged weight' : ''}`);
  return { volumetricWeightKg, applicableWeightKg };
}

/** Convert the internal kg weight to the unit the Create Shipment API expects. */
export function toShiprathBookingWeight(weightKg) {
  return Math.round(weightKg * 1000) / 1000;
}

/** Copy of a Create Shipment payload that is safe to log: phone/email/street masked. */
export function sanitizeBookingPayload(payload) {
  const maskPhone = (v) => (v ? String(v).replace(/\d(?=\d{2})/g, '•') : v);
  const maskEmail = (v) => (v ? String(v).replace(/^(.).*(@.*)$/, '$1•••$2') : v);
  const out = { ...payload };
  for (const k of ['consignee_mobile', 'receiver_mobile', 'receiver_phone', 'mobile', 'phone']) out[k] = maskPhone(out[k]);
  for (const k of ['consignee_email', 'receiver_email', 'email']) out[k] = maskEmail(out[k]);
  for (const k of ['consignee_address', 'receiver_address', 'address']) out[k] = out[k] ? '[street masked]' : out[k];
  return out;
}

/** Throw before any Shiprath call if the package is not physically sensible. */
export function assertValidPackage(pkg) {
  const w = pkg?.totalWeightKg;
  if (!Number.isFinite(w) || w <= 0) throw new Error(`Invalid shipment weight: ${w}`);
  if (w > MAX_PACKAGE_WEIGHT_KG) throw new Error(`Shipment weight ${w} kg exceeds the ${MAX_PACKAGE_WEIGHT_KG} kg sanity limit — check product weights`);
  for (const k of ['length', 'width', 'height']) {
    const v = pkg?.dimensions?.[k];
    if (!Number.isFinite(v) || v <= 0 || v > 200) throw new Error(`Invalid package ${k}: ${v}`);
  }
}

/**
 * Build Shiprath request headers from env
 * NOTE: .trim() is critical — Railway sometimes injects trailing whitespace or \n
 */
function getShiprathHeaders() {
  const secretKey = (process.env.SHIPRATH_SECRET_KEY || '').trim();
  const customerId = (process.env.SHIPRATH_CUSTOMER_ID || '').trim();

  if (!secretKey || !customerId) {
    throw new Error(
      'Shiprath credentials not configured. Set SHIPRATH_SECRET_KEY and SHIPRATH_CUSTOMER_ID in environment variables.'
    );
  }

  return {
    'Content-Type': 'application/json',
    secretkey: secretKey,
    customerid: customerId,
  };
}


/**
 * Parse a weight string to grams. Product/variant weights are stored as text in grams
 * (e.g. "45g", "130g"); "0.5kg", "12.5 g", "3 x 100g", "(300g Total)" are also understood.
 * Returns null when no weight can be read — callers must NOT guess a default.
 */
export function parseGramsFromWeightString(weightStr) {
  if (weightStr === null || weightStr === undefined) return null;
  // Bare numbers are ambiguous (grams or kg?) — refuse rather than guess
  if (typeof weightStr === 'number') return null;

  const s = String(weightStr).trim().toLowerCase();
  const num = '(\\d+(?:\\.\\d+)?)';

  const totalMatch = s.match(new RegExp(`${num}\\s*g(?:m|ms|rams?)?\\s*total`)) || s.match(new RegExp(`\\(${num}\\s*g`));
  if (totalMatch) return Number(totalMatch[1]);

  const kgMatch = s.match(new RegExp(`${num}\\s*kg`));
  if (kgMatch) return Number(kgMatch[1]) * 1000;

  const multMatch = s.match(new RegExp(`(\\d+)\\s*[x×]\\s*${num}\\s*g`));
  if (multMatch) return Number(multMatch[1]) * Number(multMatch[2]);

  const gMatch = s.match(new RegExp(`${num}\\s*g(?:m|ms|rams?)?\\b`));
  if (gMatch) return Number(gMatch[1]);

  return null;
}

/**
 * Calculate the shipment package for a set of order/cart items.
 *  1. weight of each item (variant weight from the item, else from product_variants in Supabase)
 *  2. × quantity, summed over ALL items
 *  3. + PACKAGING_WEIGHT_KG
 *  4. box chosen from the TOTAL weight via getPackageDimensions()
 *
 * Throws if any item's weight cannot be determined — never ships with a guessed weight.
 * @returns {{ productWeightKg, packagingWeightKg, totalWeightKg, dimensions, items }}
 */
export async function calculatePackage(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cannot calculate shipment weight: order has no items');
  }

  // Accept both DB/order rows (snake_case) and raw cart items (camelCase)
  const norm = items.map((i) => ({
    title: i.product_title || i.title || i.name || 'Item',
    product_id: i.product_id || i.productId || null,
    variant_id: i.variant_id || i.variantId || null,
    variant_name: i.variant_name || i.variantName || i.variantWeight || i.variant_weight || null,
    weight: typeof i.weight === 'string' ? i.weight : null,
    shipping_weight: i.shipping_weight != null ? Number(i.shipping_weight) : (i.shippingWeight != null ? Number(i.shippingWeight) : null),
    quantity: Number(i.quantity ?? i.qty ?? 1),
  }));

  // Fetch authoritative DB variants and products
  const variantUuids = [...new Set(norm.map((i) => i.variant_id).filter((id) => id && /^[0-9a-fA-F-]{36}$/.test(String(id))))];
  const productUuids = [...new Set(norm.map((i) => i.product_id).filter((id) => id && /^[0-9a-fA-F-]{36}$/.test(String(id))))];

  const dbVariantsMap = new Map();
  const dbProductsMap = new Map();

  if (variantUuids.length > 0) {
    try {
      const { data: vRows, error: vErr } = await supabase
        .from('product_variants')
        .select('id, shipping_weight, weight, product_id')
        .in('id', variantUuids);
      if (!vErr && vRows) {
        vRows.forEach((r) => dbVariantsMap.set(String(r.id), r));
      }
    } catch (e) {
      console.warn('[SHIPRATH] Variant weight DB lookup notice:', e?.message);
    }
  }

  if (productUuids.length > 0) {
    try {
      const { data: pRows, error: pErr } = await supabase
        .from('products')
        .select('id, shipping_weight, weight')
        .in('id', productUuids);
      if (!pErr && pRows) {
        pRows.forEach((r) => dbProductsMap.set(String(r.id), r));
      }
    } catch (e) {
      console.warn('[SHIPRATH] Product weight DB lookup notice:', e?.message);
    }
  }

  let productGrams = 0;
  const breakdown = [];
  const unknown = [];

  for (const i of norm) {
    if (!Number.isInteger(i.quantity) || i.quantity < 1) {
      throw new Error(`Invalid quantity ${i.quantity} for "${i.title}"`);
    }

    let grams = null;
    let source = null;

    // 1. Authoritative DB variant shipping weight
    if (i.variant_id && dbVariantsMap.has(String(i.variant_id))) {
      const dbV = dbVariantsMap.get(String(i.variant_id));
      if (dbV.shipping_weight != null && Number(dbV.shipping_weight) > 0) {
        grams = Number(dbV.shipping_weight);
        source = 'variant_shipping_weight';
      } else if (dbV.weight) {
        const parsed = parseGramsFromWeightString(dbV.weight);
        if (parsed != null && parsed > 0) {
          grams = parsed;
          source = 'variant_weight_fallback';
        }
      }
    }

    // 2. Authoritative DB product shipping weight (for non-variant products or unconfigured variants)
    if (grams === null && i.product_id && dbProductsMap.has(String(i.product_id))) {
      const dbP = dbProductsMap.get(String(i.product_id));
      if (dbP.shipping_weight != null && Number(dbP.shipping_weight) > 0) {
        grams = Number(dbP.shipping_weight);
        source = 'product_shipping_weight';
      } else if (dbP.weight) {
        const parsed = parseGramsFromWeightString(dbP.weight);
        if (parsed != null && parsed > 0) {
          grams = parsed;
          source = 'product_weight_fallback';
        }
      }
    }

    // 3. Fallback to parsing weight string on the item itself
    if (grams === null) {
      const sources = [i.weight, i.variant_name];
      for (const src of sources) {
        const parsed = parseGramsFromWeightString(src);
        if (parsed != null && parsed > 0) {
          grams = parsed;
          source = 'item_weight_fallback';
          break;
        }
      }
    }

    // 4. Fallback if item itself has a valid positive numeric shipping_weight passed directly
    if (grams === null && i.shipping_weight != null && Number(i.shipping_weight) > 0) {
      grams = Number(i.shipping_weight);
      source = 'item_shipping_weight';
    }

    if (grams === null || grams <= 0) {
      unknown.push(`"${i.title}" (${i.variant_name || 'no variant'})`);
      continue;
    }

    productGrams += grams * i.quantity;
    breakdown.push({
      title: i.title,
      variant: i.variant_name,
      unit_grams: grams,
      quantity: i.quantity,
      source,
    });
  }

  if (unknown.length > 0) {
    throw new Error(`Shipping weight unknown for ${unknown.join(', ')} — please set Shipping Weight (g) in admin.`);
  }

  const productWeightKg = Math.round(productGrams) / 1000;
  const totalWeightKg = Math.round((productWeightKg + PACKAGING_WEIGHT_KG) * 1000) / 1000;
  const pkg = {
    productWeightKg,
    packagingWeightKg: PACKAGING_WEIGHT_KG,
    totalWeightKg,
    dimensions: getPackageDimensions(totalWeightKg),
    items: breakdown,
  };
  assertValidPackage(pkg);

  console.log(`[SHIPRATH PACKAGE] ${breakdown.map((b) => `${b.title} ${b.unit_grams}g×${b.quantity}`).join(' + ')} = ${productWeightKg}kg + packaging ${PACKAGING_WEIGHT_KG}kg = ${totalWeightKg}kg → box ${pkg.dimensions.length}×${pkg.dimensions.width}×${pkg.dimensions.height} cm`);
  return pkg;
}

/** Backward-compatible helper: total shipment weight in kg. */
export async function calculateItemsWeightKgAsync(items = []) {
  return (await calculatePackage(items)).totalWeightKg;
}

/**
 * Helper function for server-side dynamic shipping rate calculation
 */
export async function fetchLiveShiprathRate({
  pincode,
  items = [],
  weight = null,        // kg — used only when no items are given (e.g. pincode check, admin test)
  pkg = null,           // a package from calculatePackage(), when the caller already has one
  dimensions = null,    // admin test override { length, width, height } in cm
  declaredValue = 200,
}) {
  const cleanPincode = String(pincode || '').trim();
  if (!cleanPincode || !/^\d{6}$/.test(cleanPincode)) {
    throw new Error('Valid 6-digit destination pincode is required for shipping rate calculation.');
  }

  let shipPkg = pkg;
  if (!shipPkg) {
    if (Array.isArray(items) && items.length > 0) {
      shipPkg = await calculatePackage(items);
    } else {
      const w = Number(weight);
      shipPkg = { totalWeightKg: w, dimensions: getPackageDimensions(w) };
    }
  }
  if (dimensions) {
    shipPkg = {
      ...shipPkg,
      dimensions: { length: Number(dimensions.length), width: Number(dimensions.width), height: Number(dimensions.height) },
    };
  }
  assertValidPackage(shipPkg);
  const calculatedWeight = shipPkg.totalWeightKg;
  logPackageWeights(`Rate quote → ${cleanPincode}`, calculatedWeight, shipPkg.dimensions);

  // Rate API: weight in kg, dimensions in cm (matches Shiprath's public rate calculator)
  const payload = {
    from_postal_code: WAREHOUSE_PINCODE,
    from_country_code: 'IN',
    to_postal_code: cleanPincode,
    to_country_code: 'IN',
    weight: calculatedWeight,
    length: shipPkg.dimensions.length,
    height: shipPkg.dimensions.height,
    width: shipPkg.dimensions.width,
    parcel_type: 'Parcel',
    mode: 'Domestic',
    payment_mode: 'prepaid',
    cod_amount: 0,
  };

  const response = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_rate_time`, {
    method: 'POST',
    headers: getShiprathHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    console.error('[SHIPRATH API ERROR]', data);
    throw new Error(data.message || 'Failed to fetch shipping rates from Shiprath.');
  }

  const rawRates = data.rate_list || data.data || [];

  // DIAGNOSTIC: Log exactly what Shiprath returned before any filtering
  console.log(`[SHIPRATH RATE DIAGNOSTIC] pincode=${cleanPincode} weight=${calculatedWeight}kg → Shiprath returned ${rawRates.length} carrier(s):`);
  rawRates.forEach((r, i) => {
    console.log(`  [${i + 1}] service_name="${r.courier_name || r.carrier_name || r.service_name}" carrier_id="${r.carrier_id}" courier_id="${r.courier_id}" product_id="${r.product_id}" carrier_type="${r.carrier_type}" rate_price="${r.rate_price}" payment_mode="${r.payment_mode}" total_charge="${r.total_charge || r.total_charges || r.rate}" zone="${r.zone}"`);
  });

  if (!rawRates || rawRates.length === 0) {
    throw new Error(`No courier services available for pincode ${cleanPincode} from Shiprath.`);
  }

  const quotedAt = new Date().toISOString();
  const normalized = rawRates.map((r) => normalizeShiprathRate(r, quotedAt));

  const formattedRates = normalized.filter((r) => {
    const reason = rateInvalidReason(r);
    if (reason) console.warn(`[SHIPRATH RATE DIAGNOSTIC] Skipping rate "${r.service_name}" — ${reason}`);
    return !reason;
  });

  if (!formattedRates.length) {
    throw new Error(`Shiprath returned ${rawRates.length} rate(s) for pincode ${cleanPincode}, but none had the data needed to book a shipment.`);
  }

  // MILASTY ships with ONE courier (Delhivery by default). Only that courier's rates are kept, so the
  // checkout charge, the booked courier and the booking fallbacks are all that courier.
  // Set SHIPRATH_COURIER=all on Railway to allow every courier again (cheapest wins).
  const courierRates = filterToPreferredCourier(formattedRates);
  if (!courierRates.length) {
    console.warn(`[SHIPRATH RATE DIAGNOSTIC] No ${PREFERRED_COURIER} service for pincode ${cleanPincode} (available: ${formattedRates.map((r) => r.service_name).join(', ')})`);
    throw new Error(`No ${PREFERRED_COURIER} service available for pincode ${cleanPincode}.`);
  }

  // Cheapest rate of the chosen courier first — this order is also the fallback order at booking time
  courierRates.sort((a, b) => a.total_charges - b.total_charges);
  const selectedRate = courierRates[0];

  console.log(`[SHIPRATH RATE DIAGNOSTIC] After validation: ${formattedRates.length} valid carrier(s), ${courierRates.length} ${PREFERRED_COURIER}. Selected: "${selectedRate.service_name}" at ₹${selectedRate.total_charges}`);

  return {
    rateList: courierRates,
    allRates: formattedRates, // every valid option Shiprath returned (all couriers) — admin diagnostics only
    selectedRate,
    shippingCharge: selectedRate.total_charges,
    weight: calculatedWeight,
    dimensions: { ...shipPkg.dimensions },
    pincode: cleanPincode,
  };
}

// The only courier MILASTY books with. Matched (case-insensitive) against the courier / carrier /
// service names Shiprath returns, e.g. "Delhivery 0.250 KG", "Delhivery Surface".
const PREFERRED_COURIER = String(process.env.SHIPRATH_COURIER || 'delhivery').trim().toLowerCase();

export function filterToPreferredCourier(rates) {
  if (!PREFERRED_COURIER || PREFERRED_COURIER === 'all') return rates;
  return rates.filter((r) => [
    r.service_name, r.service_provider, r.product_type_name,
    r.raw?.courier_name, r.raw?.carrier_name, r.raw?.service_name, r.raw?.service_provider,
  ].some((v) => String(v || '').toLowerCase().includes(PREFERRED_COURIER)));
}

/**
 * Normalize one Shiprath rate row. Booking identifiers are copied through EXACTLY as Shiprath
 * returned them (as strings) — an empty courier_id stays "" and is never guessed or replaced.
 */
export function normalizeShiprathRate(r, quotedAt = new Date().toISOString()) {
  const totalCharges = Number(r.total_charge ?? r.total_charges ?? r.rate ?? r.freight_charge ?? NaN);
  const asId = (v) => (v === null || v === undefined ? '' : String(v));
  return {
    carrier_id: asId(r.carrier_id),
    courier_id: asId(r.courier_id),
    product_id: asId(r.product_id),
    service_name: r.courier_name || r.carrier_name || r.service_name || 'Standard Courier',
    service_provider: r.service_provider || r.carrier_name || r.courier_name || null,
    product_type_name: r.product_type_name || r.product_name || r.service_type || null,
    total_charges: totalCharges,
    total_charge: totalCharges,
    zone: r.zone_name || r.zone || r.courier_zone || null,
    cod_commission: 0,
    estimated_delivery: r.estimated_delivery || r.etd || null,
    payment_mode_raw: r.payment_mode || null,
    // Booking fields seen in the dashboard Create Shipment request. Kept outside `raw` so they
    // survive in orders.shipping_rate_options; null when the Rate API row does not have them.
    carrier_type: r.carrier_type ?? null,
    rate_price: r.rate_price ?? null,
    quoted_at: quotedAt,
    raw: r, // full original Shiprath rate object, preserved for booking/audit
  };
}

/**
 * A rate is bookable when it has a real positive price and the identifiers the Create Shipment
 * API needs. courier_id is deliberately NOT required: some carriers (e.g. Amazon) return "".
 */
export function rateInvalidReason(rate) {
  if (!rate) return 'missing rate';
  if (!Number.isFinite(rate.total_charges) || rate.total_charges <= 0) return `invalid total_charges (${rate.total_charges})`;
  if (!rate.carrier_id) return 'missing carrier_id';
  if (!rate.product_id) return 'missing product_id';
  return null;
}

/** Same carrier + courier + product = same shipping option. */
export function isSameRate(a, b) {
  return Boolean(a && b) &&
    String(a.carrier_id ?? '') === String(b.carrier_id ?? '') &&
    String(a.courier_id ?? '') === String(b.courier_id ?? '') &&
    String(a.product_id ?? '') === String(b.product_id ?? '');
}

// ─── Customer shipping quotes ────────────────────────────────────────────────
// The checkout shows a delivery charge before payment. The full rate list behind it never leaves
// the server: it is kept here under a quoteId, and create-session reuses that exact quote so the
// amount the customer saw is the amount Razorpay charges and the rate the shipment is booked with.
const QUOTE_TTL_MS = 30 * 60 * 1000;
const shippingQuotes = new Map();

export function saveShippingQuote(quote) {
  const now = Date.now();
  for (const [id, q] of shippingQuotes) {
    if (now - q.createdAt > QUOTE_TTL_MS) shippingQuotes.delete(id);
  }
  const quoteId = `q_${now.toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  shippingQuotes.set(quoteId, { ...quote, createdAt: now });
  return quoteId;
}

export function getShippingQuote(quoteId) {
  const q = quoteId ? shippingQuotes.get(quoteId) : null;
  if (!q) return null;
  if (Date.now() - q.createdAt > QUOTE_TTL_MS) {
    shippingQuotes.delete(quoteId);
    return null;
  }
  return q;
}

/**
 * POST /api/shipping/rates (and /api/shiprat/rates)
 * Dynamic Shiprath rate endpoint for Checkout & Admin Test
 */
export const getShiprathRates = async (req, res) => {
  try {
    const {
      pincode,
      destinationPincode,
      destination_pincode,
      weight,
      declaredValue = 200,
      items = [],
    } = req.body;

    const targetPincode = pincode || destinationPincode || destination_pincode;

    if (!targetPincode || !/^\d{6}$/.test(String(targetPincode).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Valid 6-digit destination pincode is required.',
      });
    }

    const hasItems = Array.isArray(items) && items.length > 0;

    // Weight comes from the items and the box from getPackageDimensions(), exactly as at booking
    // time, so the quote matches the shipment. Client-sent dimensions are ignored.
    const result = await fetchLiveShiprathRate({
      pincode: targetPincode,
      items,
      weight: hasItems ? null : weight,
      declaredValue,
    });

    // Only a cart-based quote can be reused at payment time
    const quoteId = hasItems
      ? saveShippingQuote({
          pincode: result.pincode,
          weightKg: result.weight,
          dimensions: result.dimensions,
          selectedRate: result.selectedRate,
          rateList: result.rateList,
        })
      : null;

    // CUSTOMER-SAFE RESPONSE: only the delivery charge. Courier names, IDs and the rate list
    // stay on the server.
    return res.json({
      success: true,
      shippingCharge: result.shippingCharge,
      deliveryFee: result.shippingCharge,
      quoteId,
      pincode: result.pincode,
    });
  } catch (error) {
    console.error('[SHIPRATH RATES] Exception:', error.message);
    const isPackageProblem = /weight unknown|invalid shipment weight|sanity limit|invalid quantity/i.test(error.message);
    return res.status(isPackageProblem ? 422 : 500).json({
      success: false,
      message: isPackageProblem
        ? 'We could not calculate delivery for an item in your cart. Please contact MILASTY support.'
        : 'Delivery is not available for this pincode right now. Please check the pincode or try again shortly.',
    });
  }
};

/**
 * GET /api/shipping/connection-status
 * Check Shiprath connection & credentials status for Admin Dashboard
 */
export const checkShiprathConnection = async (req, res) => {
  try {
    const secretKey = (process.env.SHIPRATH_SECRET_KEY || '').trim();
    const customerId = (process.env.SHIPRATH_CUSTOMER_ID || '').trim();

    const isPlaceholder = !secretKey || !customerId || 
      secretKey.includes('REPLACE_WITH') || 
      customerId.includes('REPLACE_WITH');

    if (isPlaceholder) {
      return res.json({
        success: true,
        connected: false,
        warehouse: 'MILASTY',
        warehouseId: WAREHOUSE_ADDRESS_ID,
        pickupPincode: WAREHOUSE_PINCODE,
        paymentMode: 'prepaid',
        codStatus: 'disabled',
        message: 'Shiprath API credentials not configured (SHIPRATH_SECRET_KEY, SHIPRATH_CUSTOMER_ID are set to placeholder values). Set real keys in Railway / .env file.',
      });
    }


    // Quick connectivity ping to Shiprath rate API
    try {
      const pingPayload = {
        from_postal_code: WAREHOUSE_PINCODE,
        from_country_code: 'IN',
        to_postal_code: '110001',
        to_country_code: 'IN',
        weight: 1,
        length: 10,
        height: 10,
        width: 10,
        parcel_type: 'Parcel',
        mode: 'Domestic',
        payment_mode: 'prepaid',
        cod_amount: 0,
      };

      const pingRes = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_rate_time`, {
        method: 'POST',
        headers: getShiprathHeaders(),
        body: JSON.stringify(pingPayload),
      });


      const pingData = await pingRes.json();
      console.log('[SHIPRATH PING RESPONSE]', pingRes.status, pingData);

      const isConnected = pingRes.ok && (pingData.status === true || (pingData.rate_list && pingData.rate_list.length > 0));


      let responseMsg = 'Connected to Shiprath B2C Shipping Network';
      if (!isConnected) {
        responseMsg = pingData.message ? `Shiprath API Error: ${pingData.message.trim()}` : 'Shiprath API returned authentication error';
      }

      return res.json({
        success: true,
        connected: !!isConnected,
        warehouse: 'MILASTY',
        warehouseId: WAREHOUSE_ADDRESS_ID,
        pickupPincode: WAREHOUSE_PINCODE,
        paymentMode: 'prepaid',
        codStatus: 'disabled',
        message: responseMsg,
        raw: pingData,
      });
    } catch (pingErr) {
      return res.json({
        success: true,
        connected: false,
        warehouse: 'MILASTY',
        warehouseId: WAREHOUSE_ADDRESS_ID,
        pickupPincode: WAREHOUSE_PINCODE,
        paymentMode: 'prepaid',
        codStatus: 'disabled',
        message: `Shiprath connection test failed: ${pingErr.message}`,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error checking Shiprath connection.', error: error.message });
  }
};

/**
 * POST /api/shipping/test-rate
 * Admin-only test endpoint (calculates rates without creating a shipment)
 */
export const adminTestRate = async (req, res) => {
  try {
    const { pincode, weight = 1, length, width, height } = req.body;

    if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit Indian PIN code.' });
    }

    // Admin may test a custom box; otherwise the standard box for this weight is used
    const hasCustomBox = [length, width, height].every((v) => Number(v) > 0);
    const result = await fetchLiveShiprathRate({
      pincode,
      weight: Number(weight),
      dimensions: hasCustomBox ? { length, width, height } : null,
      declaredValue: 300,
    });

    return res.json({
      success: true,
      serviceName: result.selectedRate.service_name,
      serviceProvider: result.selectedRate.service_provider,
      totalCharges: result.selectedRate.total_charges,
      carrierId: result.selectedRate.carrier_id,
      courierId: result.selectedRate.courier_id,
      productId: result.selectedRate.product_id,
      zone: result.selectedRate.zone,
      codCommission: 0,
      rateList: result.rateList,
      // Every option Shiprath returned (all couriers), with its raw price fields, for comparing with the dashboard
      allRates: (result.allRates || []).map((r) => ({
        serviceName: r.service_name,
        serviceProvider: r.service_provider,
        totalCharges: r.total_charges,
        usedForCheckout: r === result.selectedRate,
        priceFields: Object.fromEntries(
          Object.entries(r.raw || {}).filter(([k, v]) => /price|charge|amount|rate|gst|tax|fuel|total|cost|fee|freight/i.test(k) && v !== null && v !== '' && typeof v !== 'object')
        ),
      })),
      weightKg: result.weight,
      dimensions: result.dimensions,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Core Function: Book a Shiprath B2C shipment for a confirmed & payment-verified MILASTY order
 * Called ONLY AFTER Razorpay payment signature is verified.
 *
 * @param {Object} order  - Supabase order row (includes order_items)
 * @param {Object} [options]
 * @param {Object} [options.packageOverride] - admin manual box { weightKg, length, width, height }
 * @returns {Object}      - { awb, shipment_id, courier_name, tracking_url, raw }
 */
export const bookShiprathShipment = async (order, { packageOverride = null } = {}) => {
  try {
    if (!order) return null;

    // Idempotency Check: Don't re-book if AWB already exists for this order
    if (order.awb_number || order.awb) {
      console.log('[SHIPRATH BOOK] Shipment already booked for order:', order.order_number || order.id, 'AWB:', order.awb_number || order.awb);
      if (order.id) await safeUpdateOrder(order.id, { shipment_status: 'booked' });
      return {
        success: true,
        alreadyBooked: true,
        awb: order.awb_number || order.awb,
        shipment_id: order.shipment_id || null,
        courier_name: order.courier_name || 'Shiprath',
      };
    }

    const secretKey = (process.env.SHIPRATH_SECRET_KEY || '').trim();
    const customerId = (process.env.SHIPRATH_CUSTOMER_ID || '').trim();

    if (!secretKey || !customerId) {
      console.warn('[SHIPRATH BOOK] Credentials not set — skipping Shiprath booking.');
      const errMsg = 'Shiprath API credentials are missing or invalid in server environment variables.';
      if (order.id) await safeUpdateOrder(order.id, { shipment_status: 'failed', shipment_error: errMsg });
      return { error: errMsg };
    }

    const destinationPincode = String(order.pincode || '').trim();
    if (!destinationPincode || !/^\d{6}$/.test(destinationPincode)) {
      console.warn('[SHIPRATH BOOK] Invalid/missing pincode on order:', order.order_number);
      const errMsg = `Invalid or missing 6-digit delivery pincode: "${destinationPincode || 'none'}".`;
      if (order.id) await safeUpdateOrder(order.id, { shipment_status: 'failed', shipment_error: errMsg });
      return { error: errMsg };
    }

    // MILASTY ships prepaid only. A COD order must never be booked as prepaid (the courier would
    // not collect payment), and Shiprath's COD booking fields are not verified for this project.
    if (String(order.payment_method || '').toLowerCase() === 'cod') {
      const errMsg = 'COD orders cannot be auto-booked: MILASTY is configured prepaid-only and the Shiprath COD booking fields are not verified. Book this order manually in the Shiprath panel.';
      if (order.id) await safeUpdateOrder(order.id, { shipment_status: 'failed', shipment_error: errMsg });
      return { error: errMsg };
    }

    const items = order.order_items || order.items || [];
    const declaredValue = Number(order.grand_total || order.subtotal || 200);

    // ── Package: real total weight of ALL items (kg) + standard box for that weight (cm) ──
    let pkg;
    try {
      if (packageOverride) {
        const w = Number(packageOverride.weightKg);
        pkg = {
          totalWeightKg: w,
          dimensions: {
            length: Number(packageOverride.length),
            width: Number(packageOverride.width),
            height: Number(packageOverride.height),
          },
          manual: true,
        };
        assertValidPackage(pkg);
        console.log(`[SHIPRATH PACKAGE] ${order.order_number} → MANUAL override ${w}kg, ${pkg.dimensions.length}×${pkg.dimensions.width}×${pkg.dimensions.height} cm`);
      } else {
        pkg = await calculatePackage(items);
      }
    } catch (pkgErr) {
      const errMsg = `Package calculation failed: ${pkgErr.message}`;
      console.error(`[SHIPRATH BOOK] ${order.order_number} → ${errMsg}`);
      if (order.id) await safeUpdateOrder(order.id, { shipment_status: 'failed', shipment_error: errMsg });
      return { error: errMsg };
    }
    const calculatedWeightKg = pkg.totalWeightKg;
    const box = pkg.dimensions;

    if (order.quoted_weight_kg != null && Number(order.quoted_weight_kg) !== calculatedWeightKg) {
      console.warn(`[SHIPRATH BOOK] ${order.order_number} → booking weight ${calculatedWeightKg}kg differs from checkout quote ${order.quoted_weight_kg}kg`);
    }

    // ── Build payload fields ───────────────────────────────────────────────
    const fullAddr = String(order.shipping_address || '');
    // Stored format: "<building>, <street...>, <city>, <state>, India" (building optional, street may contain commas)
    const addrParts = fullAddr.split(',').map((s) => s.trim()).filter(Boolean);
    if (addrParts.length && /^india$/i.test(addrParts[addrParts.length - 1])) addrParts.pop();
    const parsedState = addrParts.length >= 3 ? addrParts[addrParts.length - 1] : '';
    const parsedCity = addrParts.length >= 3 ? addrParts[addrParts.length - 2] : '';
    const streetParts = addrParts.length >= 3 ? addrParts.slice(0, -2) : addrParts;
    const consigneeAddress = streetParts.join(', ') || fullAddr;
    const consigneeCity = order.delivery_city || parsedCity || 'City';
    const consigneeState = order.delivery_state || parsedState || 'State';

    const bookItems = items.length > 0
      ? items.map((item) => {
          const nameVal = String(item.product_title || item.title || item.product_name || item.name || 'MILASTY Artisan Bake').slice(0, 100);
          const qtyVal = Math.max(1, Number(item.quantity || item.qty || item.item_quantity || 1));
          const priceVal = Number(item.unit_price || item.price || item.totalPrice || item.item_value || 0) || Math.max(1, Math.round(declaredValue / (items.length || 1)));
          const skuVal = String(item.product_id || item.productId || item.sku || 'MILASTY-SKU').slice(0, 50);
          return {
            item_name: nameVal,
            name: nameVal,
            item_quantity: qtyVal,
            qty: qtyVal,
            quantity: qtyVal,
            item_value: priceVal,
            price: priceVal,
            unit_price: priceVal,
            sku: skuVal,
          };
        })
      : [{
          item_name: 'MILASTY Artisan Bake',
          name: 'MILASTY Artisan Bake',
          item_quantity: 1,
          qty: 1,
          quantity: 1,
          item_value: declaredValue,
          price: declaredValue,
          unit_price: declaredValue,
          sku: 'MILASTY-001',
        }];

    // MILASTY IS PREPAID ONLY — STRICT ENFORCEMENT
    const typeVal = 'PrePaid';
    const paymentModeVal = 'prepaid';
    const codAmountVal = 0;

    // "Deliver to someone else": the recipient is the consignee; the buyer stays the customer
    const custName = String(order.recipient_name || order.customer_name || order.customerName || order.user?.name || 'Customer').slice(0, 100);
    const custMobile = String(order.recipient_phone || order.customer_phone || order.customerPhone || order.phone || '').replace(/\D/g, '').slice(-10) || '9876543210';
    const custEmail = String(order.customer_email || order.customerEmail || order.user?.email || 'orders@milasty.com').slice(0, 100);

    // Package details stored on the order for admin visibility
    const packageFields = {
      package_weight_kg: calculatedWeightKg,
      package_length_cm: box.length,
      package_width_cm: box.width,
      package_height_cm: box.height,
      package_is_manual: Boolean(pkg.manual),
    };

    // Persist a booking failure. The order stays PAID and is NOT marked shipped.
    const markFailed = async (errMsg, extra = {}) => {
      if (!order.id) return;
      const { error: upErr } = await safeUpdateOrder(order.id, {
        shipment_status: 'failed',
        shipment_error: String(errMsg).slice(0, 1000),
        shipment_last_attempt_at: new Date().toISOString(),
        ...packageFields,
        ...extra,
      });
      if (upErr) console.error(`[SHIPRATH BOOK] ${order.order_number} → could not save failure state:`, upErr.message);
    };

    // ── Candidate rates, in the exact order they will be tried ──────────────
    // 1. The rate selected at checkout (the one the customer's delivery charge came from).
    // 2. Automatic fallback: the other valid rates from the SAME rate response, cheapest first.
    // IDs are used exactly as Shiprath returned them; an empty courier_id stays "".
    const snapshot = order.selected_rate_snapshot || null;
    const storedRate = order.selected_carrier_id
      ? {
          carrier_id: String(order.selected_carrier_id),
          courier_id: order.selected_courier_id == null ? '' : String(order.selected_courier_id),
          product_id: order.selected_product_id == null ? '' : String(order.selected_product_id),
          service_name: order.selected_service_name || 'Selected courier',
          total_charges: Number(order.selected_delivery_fee || order.delivery_fee || 0),
        }
      : null;
    if (storedRate && snapshot && isSameRate(snapshot, storedRate)) {
      storedRate.carrier_type = snapshot.carrier_type ?? snapshot.raw?.carrier_type ?? null;
      storedRate.rate_price = snapshot.rate_price ?? snapshot.raw?.rate_price ?? null;
      storedRate.service_provider = snapshot.service_provider || null;
    }

    const storedOptions = (Array.isArray(order.shipping_rate_options) ? order.shipping_rate_options : [])
      .map((r) => ({
        ...r,
        carrier_id: r.carrier_id == null ? '' : String(r.carrier_id),
        courier_id: r.courier_id == null ? '' : String(r.courier_id),
        product_id: r.product_id == null ? '' : String(r.product_id),
        total_charges: Number(r.total_charges),
      }))
      .filter((r) => !rateInvalidReason(r))
      .sort((a, b) => a.total_charges - b.total_charges);

    let candidateRates = [];
    let rateSource;

    if (storedRate) {
      const selected = storedOptions.find((r) => isSameRate(r, storedRate)) || storedRate;
      candidateRates = [selected, ...storedOptions.filter((r) => !isSameRate(r, storedRate))];
      rateSource = storedOptions.length > 0
        ? 'stored checkout quote (selected rate + same-response fallbacks)'
        : 'stored selected rate (no saved fallback list)';
    } else {
      // Legacy order placed before quotes were stored — fetch live rates once
      rateSource = 'live rates (legacy order without a stored quote)';
      try {
        const rateResult = await fetchLiveShiprathRate({
          pincode: destinationPincode,
          pkg,
          declaredValue,
        });
        candidateRates = rateResult.rateList || [];
      } catch (rateErr) {
        console.error(`[SHIPRATH BOOK] ${order.order_number} → Rate fetch failed:`, rateErr.message);
        const errMsg = `Rate fetch failed: ${rateErr.message}`;
        await markFailed(errMsg);
        return { error: errMsg, rawError: rateErr.message };
      }
    }

    // Only the chosen courier (Delhivery) is ever booked. Orders quoted before this rule may have
    // saved another courier — for those, fetch live rates of the chosen courier instead.
    const preferredCandidates = filterToPreferredCourier(candidateRates);
    if (preferredCandidates.length) {
      candidateRates = preferredCandidates;
    } else if (candidateRates.length) {
      rateSource = `live ${PREFERRED_COURIER} rates (saved checkout quote had no ${PREFERRED_COURIER} option)`;
      try {
        const rateResult = await fetchLiveShiprathRate({ pincode: destinationPincode, pkg, declaredValue });
        candidateRates = rateResult.rateList || [];
      } catch (rateErr) {
        const errMsg = `No ${PREFERRED_COURIER} service for this order: ${rateErr.message}`;
        console.error(`[SHIPRATH BOOK] ${order.order_number} → ${errMsg}`);
        await markFailed(errMsg);
        return { error: errMsg, rawError: rateErr.message };
      }
    }

    if (!candidateRates.length) {
      const errMsg = 'No courier services available for this package destination from Shiprath.';
      await markFailed(errMsg);
      return { error: errMsg };
    }

    console.log(`\n[SHIPRATH BOOK] ${order.order_number} → ${candidateRates.length} candidate(s) from ${rateSource}`);
    console.log(`  Destination: ${destinationPincode} | Weight sent: ${toShiprathBookingWeight(calculatedWeightKg)} ${SHIPRATH_BOOKING_WEIGHT_UNIT}`);
    const { volumetricWeightKg, applicableWeightKg } = logPackageWeights(`Create Shipment ${order.order_number}`, calculatedWeightKg, box);
    candidateRates.forEach((c, idx) => {
      console.log(`  [${idx + 1}] "${c.service_name}" carrier_id="${c.carrier_id}" courier_id="${c.courier_id}" product_id="${c.product_id}" ₹${c.total_charges}`);
    });

    // Field values follow the captured Shiprath dashboard Create Shipment request (order 750252).
    const buildBookingPayload = (rate) => ({
      // Carrier IDs — exactly as returned by the Rate API; an empty courier_id stays ""
      carrier_id: rate.carrier_id,
      courier_id: rate.courier_id ?? '',
      product_id: rate.product_id,
      carrier_type: rate.carrier_type != null && rate.carrier_type !== '' ? Number(rate.carrier_type) : DEFAULT_CARRIER_TYPE,
      service_name: rate.service_name,
      ...(rate.service_provider ? { company_name: rate.service_provider } : {}),

      // Parcel type and shipment type (dashboard: type = shipment_type = "Parcel")
      type: 'Parcel',
      parcel_type: 'Parcel',
      order_type: typeVal,
      shipment_type: 'Parcel',

      // Warehouse/Sender
      address_id: WAREHOUSE_ADDRESS_ID,
      from_postal_code: WAREHOUSE_PINCODE,
      from_country_code: 'IN',
      shipper_name: 'MILASTY',
      sender_name: 'MILASTY',
      shipper_mobile: '8927142056',
      sender_mobile: '8927142056',
      shipper_email: 'orders@milasty.com',
      sender_email: 'orders@milasty.com',
      shipper_address: 'MILASTY Bakery, Uttarakhand',
      sender_address: 'MILASTY Bakery, Uttarakhand',
      shipper_pincode: WAREHOUSE_PINCODE,
      sender_pincode: WAREHOUSE_PINCODE,

      // Customer/Consignee
      consignee_name: custName,
      receiver_name: custName,
      name: custName,
      consignee_mobile: custMobile,
      receiver_mobile: custMobile,
      receiver_phone: custMobile,
      mobile: custMobile,
      phone: custMobile,
      consignee_email: custEmail,
      receiver_email: custEmail,
      email: custEmail,
      consignee_address: consigneeAddress.slice(0, 200),
      receiver_address: consigneeAddress.slice(0, 200),
      address: consigneeAddress.slice(0, 200),
      consignee_city: consigneeCity.slice(0, 100),
      receiver_city: consigneeCity.slice(0, 100),
      destination_city: consigneeCity.slice(0, 100),
      city: consigneeCity.slice(0, 100),
      consignee_state: consigneeState.slice(0, 100),
      receiver_state: consigneeState.slice(0, 100),
      destination_state: consigneeState.slice(0, 100),
      state: consigneeState.slice(0, 100),
      consignee_pincode: destinationPincode,
      receiver_pincode: destinationPincode,
      destination_pincode: destinationPincode,
      pincode: destinationPincode,
      consignee_country: 'India',
      receiver_country: 'India',
      destination_country: 'India',
      country: 'India',
      to_postal_code: destinationPincode,
      to_country_code: 'IN',

      // Package — same weight calculation and same box selection as the rate quote.
      // Weights in kg, dimensions in cm: length / width / height only (the dashboard sends no breadth).
      order_number: String(order.order_number || order.orderNumber || order.id).slice(0, 50),
      weight: toShiprathBookingWeight(calculatedWeightKg),
      total_weight: toShiprathBookingWeight(calculatedWeightKg),
      volumetric_weight: toShiprathBookingWeight(volumetricWeightKg),
      length: box.length,
      width: box.width,
      height: box.height,
      mode: 'Domestic',

      // Shipping charge — the dashboard sends rate_price (base rate, e.g. "33.00") and
      // total_amount (the rate's total charge, e.g. 39.6). Order value goes in the fields below.
      ...(rate.rate_price != null && rate.rate_price !== '' ? { rate_price: String(rate.rate_price) } : {}),
      total_amount: rate.total_charges,

      // Financial (PREPAID ONLY)
      grand_total: declaredValue,
      order_amount: declaredValue,
      total: declaredValue,
      amount: declaredValue,
      declared_value: declaredValue,
      invoice_value: declaredValue,
      subtotal: Number(order.subtotal || order.sub_total || declaredValue),
      tax_amount: 0,
      tax: 0,
      discount: Number(order.discount_amount || order.discountAmount || 0),
      discount_amount: Number(order.discount_amount || order.discountAmount || 0),
      payment_mode: paymentModeVal,
      cod_amount: codAmountVal,
      collectable_amount: codAmountVal,

      items: bookItems,
    });

    const postBooking = async (endpoint, payload) => {
      const res = await fetch(`${SHIPRATH_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getShiprathHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45000),
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        const err = new Error(`Non-JSON response from Shiprath (HTTP ${res.status}): ${text.slice(0, 200)}`);
        err.uncertain = true;
        throw err;
      }
    };

    let bookData = null;
    let bookedRate = null;
    let lastRawError = null;
    let uncertain = false;
    const courierFailuresLog = [];
    const attempts = Array.isArray(order.shipment_attempts) ? [...order.shipment_attempts] : [];

    for (const candidateRate of candidateRates) {
      const courierLabel = candidateRate.service_name || candidateRate.service_provider || 'Unknown';
      const attempt = {
        at: new Date().toISOString(),
        service_name: courierLabel,
        carrier_id: candidateRate.carrier_id,
        courier_id: candidateRate.courier_id ?? '',
        product_id: candidateRate.product_id,
        quoted_charges: candidateRate.total_charges,
        weight_kg: calculatedWeightKg,
        weight_sent: toShiprathBookingWeight(calculatedWeightKg),
        weight_unit_sent: SHIPRATH_BOOKING_WEIGHT_UNIT,
        dimensions_cm: box,
        volumetric_weight_kg: volumetricWeightKg,
        applicable_weight_kg: applicableWeightKg,
        manual_package: Boolean(pkg.manual),
      };
      console.log(`[SHIPRATH BOOK] ${order.order_number} → Attempting "${courierLabel}"`);

      try {
        const bookingPayload = buildBookingPayload(candidateRate);
        console.log([
          '[SHIPRATH BOOK]',
          `Order ID: ${order.order_number}`,
          `Selected Service: ${courierLabel}`,
          `Carrier ID: ${bookingPayload.carrier_id}`,
          `Carrier Type: ${bookingPayload.carrier_type}`,
          `Courier ID: "${bookingPayload.courier_id}"`,
          `Weight: ${bookingPayload.weight} kg (total ${bookingPayload.total_weight}, volumetric ${bookingPayload.volumetric_weight})`,
          `Length: ${bookingPayload.length}`,
          `Width: ${bookingPayload.width}`,
          `Height: ${bookingPayload.height}`,
          `Payment Mode: ${bookingPayload.payment_mode}`,
        ].join('\n  '));
        if (SHIPRATH_LOG_PAYLOAD) {
          // Credentials travel only in headers, never in the payload. Contact details are masked.
          console.log(`[SHIPRATH PAYLOAD] ${order.order_number} → POST /shipment/new_shipment_create`, JSON.stringify(sanitizeBookingPayload(bookingPayload)));
        }
        let resData = await postBooking('/shipment/new_shipment_create', bookingPayload);

        // Fallback URL if endpoint differs
        if (!resData.status && String(resData.message || '').toLowerCase().includes('not found')) {
          resData = await postBooking('/shipment/create_shipment', bookingPayload);
        }

        // Shiprath answers status: "unsuccess" (a truthy string), so truthiness alone is not success
        attempt.ok = resData.status === true || /^(true|success|1)$/i.test(String(resData.status));
        attempt.message = resData.message || null;
        attempts.push(attempt);
        console.log([
          '[SHIPRATH BOOK RESPONSE]',
          `Order ID: ${order.order_number}`,
          `Status: ${resData.status}`,
          `Message: ${resData.message || ''}`,
          `Shipment ID: ${resData.shipment_id || resData.data?.shipment_id || ''}`,
        ].join('\n  '));

        if (attempt.ok) {
          bookData = resData;
          bookedRate = candidateRate;
          break; // Stop immediately on first successful booking — never create a second shipment
        }

        lastRawError = resData.message || 'Carrier booking error';
        courierFailuresLog.push(`${courierLabel}: ${lastRawError}`);

        // Merchant's Shiprath wallet is short — every other courier would fail the same way
        if (/wallet/i.test(lastRawError)) {
          console.warn(`[SHIPRATH BOOK] ${order.order_number} → Shiprath wallet balance too low; fallback stopped. Recharge the Shiprath wallet, then use Retry Shipment.`);
          break;
        }
      } catch (cErr) {
        // Network error / timeout / unreadable response: Shiprath MAY have created the shipment.
        // Trying another courier now could create a duplicate, so stop and flag for manual check.
        uncertain = true;
        lastRawError = `Booking response uncertain for "${courierLabel}": ${cErr.message}`;
        attempt.ok = false;
        attempt.uncertain = true;
        attempt.message = cErr.message;
        attempts.push(attempt);
        courierFailuresLog.push(`${courierLabel}: ${cErr.message} (uncertain — fallback stopped)`);
        console.error(`[SHIPRATH BOOK] ${order.order_number} → ${lastRawError}`);
        break;
      }
    }

    if (!bookData) {
      const realError = uncertain
        ? `UNCERTAIN — check the Shiprath panel for order ${order.order_number} before retrying. ${lastRawError}`
        : (lastRawError || 'All couriers rejected this shipment');
      console.error(`[SHIPRATH BOOK] ${order.order_number} → ❌ Booking failed after ${attempts.length} total attempt(s):`, courierFailuresLog);

      await markFailed([realError, ...courierFailuresLog].join(' | ').slice(0, 1000), { shipment_attempts: attempts });

      return {
        error: realError,
        rawError: realError,
        courierFailures: courierFailuresLog,
        uncertain,
      };
    }

    const awb = bookData.awb_number || bookData.awb || bookData.data?.awb_number || bookData.data?.awb || null;
    const shipmentId = bookData.shipment_id || bookData.data?.shipment_id || null;
    const courierName = bookedRate?.service_name || 'Shiprath Partner';
    const trackingUrl = awb ? `https://backend.shiprath.com/tracking/${awb}` : null;
    const isFallback = storedRate ? !isSameRate(bookedRate, storedRate) : false;

    if (isFallback) {
      console.warn(`[SHIPRATH BOOK] ${order.order_number} → Booked with FALLBACK "${courierName}" ₹${bookedRate.total_charges} (customer paid ₹${order.delivery_fee}; MILASTY absorbs the difference)`);
    }
    if (!awb) {
      console.warn(`[SHIPRATH BOOK] ${order.order_number} → Shiprath reported success but returned no AWB. Shipment ID: ${shipmentId}`);
    }

    // ── Persist shipment details — only after a successful booking ───────────
    if (order.id) {
      const { error: dbErr, skipped } = await safeUpdateOrder(order.id, {
        awb_number: awb,
        awb,
        shipment_id: shipmentId,
        courier_name: courierName,
        tracking_url: trackingUrl,
        // Booking ≠ physically shipped: order_status is left as-is (confirmed). It moves to
        // shipped / out_for_delivery / delivered only from Shiprath tracking (trackOrderShipment).
        shipment_status: 'booked',
        ...packageFields,
        shipment_error: null,
        shipment_booked_at: new Date().toISOString(),
        shipment_last_attempt_at: new Date().toISOString(),
        booked_carrier_id: bookedRate.carrier_id,
        booked_courier_id: bookedRate.courier_id ?? '',
        booked_product_id: bookedRate.product_id,
        booked_service_name: courierName,
        booked_shipping_charge: bookedRate.total_charges,
        shipment_booking_response: bookData,
        shipment_attempts: attempts,
      });
      if (dbErr) {
        // The shipment EXISTS at Shiprath — make this impossible to miss so it is not re-booked
        console.error(`[SHIPRATH BOOK] ⚠️ ${order.order_number} BOOKED (AWB ${awb}, shipment ${shipmentId}) but saving to DB failed:`, dbErr.message);
      } else {
        console.log(`[SHIPRATH BOOK] ✅ ${order.order_number} saved AWB ${awb}${skipped.length ? ` (columns not in schema: ${skipped.join(', ')})` : ''}`);
      }
    }

    return {
      success: true,
      awb,
      shipment_id: shipmentId,
      courier_name: courierName,
      tracking_url: trackingUrl,
      carrier_id: bookedRate.carrier_id,
      courier_id: bookedRate.courier_id ?? '',
      product_id: bookedRate.product_id,
      fallbackUsed: isFallback,
      raw: bookData,
    };
  } catch (error) {
    console.error('[SHIPRATH BOOK] Critical Exception:', error.message);
    if (order?.id) {
      await safeUpdateOrder(order.id, { shipment_status: 'failed', shipment_error: `Booking exception: ${error.message}` });
    }
    return { error: error.message };
  }
};

/**
 * Atomically move an order into shipment_status = 'creating'.
 * Only one caller can win the claim, so concurrent triggers (payment verify, every Razorpay
 * webhook event, admin retry) can never book the same order twice.
 *
 * @param {string} orderId
 * @param {Array<string|null>} fromStatuses  statuses the claim is allowed from (null = no status)
 */
export async function claimOrderForBooking(orderId, fromStatuses) {
  const filter = fromStatuses
    .map((s) => (s === null ? 'shipment_status.is.null' : `shipment_status.eq.${s}`))
    .join(',');

  const { data, error } = await supabase
    .from('orders')
    .update({ shipment_status: 'creating' })
    .eq('id', orderId)
    .neq('order_status', 'cancelled')
    .or(filter)
    .select('id');

  if (error) return { claimed: false, error };
  if (data && data.length > 0) {
    await safeUpdateOrder(orderId, { shipment_last_attempt_at: new Date().toISOString() });
  }
  return { claimed: Boolean(data && data.length > 0), error: null };
}

const SHIPMENT_CREATABLE = ['not_created', 'pending', 'failed', null, ''];

/** Why this order can't have a shipment created right now, or null if it can. */
export function shipmentBlockReason(order) {
  if (String(order.order_status || '').toLowerCase() === 'cancelled') return 'This order is cancelled — no shipment can be created.';
  if (String(order.order_status || '').toLowerCase() === 'delivered') return 'This order is already delivered.';
  if (String(order.payment_method || '').toLowerCase() === 'cod') {
    return 'COD orders cannot be booked through the API (MILASTY ships prepaid-only and the Shiprath COD fields are not verified). Book it manually in the Shiprath panel.';
  }
  if (String(order.payment_status || '').toLowerCase() !== 'paid') return 'Shipments can only be created for paid orders.';
  return null;
}

/**
 * GET /api/orders/admin/:id/shipment-preview
 * Everything the admin confirms before creating a shipment: address, items, the delivery charge the
 * customer paid, the courier quoted at checkout and the calculated package. Read-only — calls nothing at Shiprath.
 */
export const getShipmentPreview = async (req, res) => {
  try {
    const orderId = req.params.id;
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(orderId);
    let query = supabase.from('orders').select('*, order_items(*)');
    query = isUuid ? query.eq('id', orderId) : query.eq('order_number', orderId);
    const { data: order, error } = await query.maybeSingle();
    if (error || !order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const items = order.order_items || [];
    let pkg = null;
    let packageError = null;
    try {
      pkg = await calculatePackage(items);
    } catch (e) {
      packageError = e.message;
    }

    const shipStatus = String(order.shipment_status || '').toLowerCase();
    return res.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        recipient_name: order.recipient_name || null,
        recipient_phone: order.recipient_phone || null,
        shipping_address: order.shipping_address,
        pincode: order.pincode,
        delivery_fee: Number(order.delivery_fee || 0),
        grand_total: Number(order.grand_total || 0),
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        selected_service_name: order.selected_service_name || null,
        shipment_status: order.shipment_status || 'not_created',
        shipment_error: order.shipment_error || null,
        awb_number: order.awb_number || order.awb || null,
        items: items.map((i) => ({ title: i.product_title || i.title, variant: i.variant_name, quantity: i.quantity })),
      },
      package: pkg ? { weightKg: pkg.totalWeightKg, ...pkg.dimensions } : null,
      packageError,
      blockedReason: shipmentBlockReason(order)
        || (order.awb_number || order.awb || shipStatus === 'booked' ? 'A shipment already exists for this order.' : null),
      inProgress: shipStatus === 'creating',
      uncertainPreviousAttempt: shipStatus === 'failed' && /^UNCERTAIN/i.test(order.shipment_error || ''),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not load shipment preview.' });
  }
};

/**
 * POST /api/orders/admin/:id/book-shipment (also /retry-shipment and /api/shipping/book)
 * Admin "Create Shipment" — the ONLY way a Shiprath shipment is created (nothing books at checkout).
 * Body: { package?: { weightKg, length, width, height }, force?: boolean, confirmNoExistingShipment?: boolean }
 *   force                      — only to retry an order stuck in 'creating'
 *   confirmNoExistingShipment  — required after an UNCERTAIN attempt (response lost; Shiprath may have booked it)
 */
export const bookShipmentForOrder = async (req, res) => {
  try {
    const orderId = req.params.id || req.body.orderId;
    const force = Boolean(req.body?.force);
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required.' });
    }

    // Optional manual package (admin used a different physical box): { weightKg, length, width, height }
    let packageOverride = null;
    if (req.body?.package) {
      const p = req.body.package;
      packageOverride = { weightKg: Number(p.weightKg), length: Number(p.length), width: Number(p.width), height: Number(p.height) };
      try {
        assertValidPackage({ totalWeightKg: packageOverride.weightKg, dimensions: packageOverride });
      } catch (e) {
        return res.status(400).json({ success: false, message: `Invalid manual package: ${e.message}` });
      }
    }

    const isUuid = /^[0-9a-fA-F-]{36}$/.test(orderId);
    let query = supabase.from('orders').select('*, order_items(*)');
    query = isUuid ? query.eq('id', orderId) : query.eq('order_number', orderId);

    const { data: order, error } = await query.maybeSingle();
    if (error || !order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const blocked = shipmentBlockReason(order);
    if (blocked) {
      return res.status(400).json({ success: false, code: 'NOT_ELIGIBLE', message: blocked });
    }

    const shipStatus = String(order.shipment_status || '').toLowerCase();

    // A previous attempt lost Shiprath's response — the shipment may exist. Never re-book blindly.
    if (shipStatus === 'failed' && /^UNCERTAIN/i.test(order.shipment_error || '') && !req.body?.confirmNoExistingShipment) {
      return res.status(409).json({
        success: false,
        code: 'UNCERTAIN_PREVIOUS_ATTEMPT',
        message: `The last attempt for ${order.order_number} lost Shiprath's response, so a shipment may already exist. Check the Shiprath panel for this order first; only retry if no shipment is there.`,
      });
    }

    if (order.awb_number || order.awb || shipStatus === 'booked') {
      return res.status(409).json({
        success: false,
        code: 'ALREADY_BOOKED',
        message: `Shipment already booked${order.awb_number ? ` (AWB ${order.awb_number})` : ''}. Not creating another one.`,
      });
    }

    if (shipStatus === 'creating' && !force) {
      return res.status(409).json({
        success: false,
        code: 'IN_PROGRESS',
        message: 'A booking for this order is in progress (or got stuck). Check the Shiprath panel first; retry with force only if no shipment exists there.',
      });
    }

    const fromStatuses = force
      ? ['creating', ...SHIPMENT_CREATABLE.filter((s) => s !== '')]
      : SHIPMENT_CREATABLE.filter((s) => s !== '');
    const { claimed, error: claimErr } = await claimOrderForBooking(order.id, fromStatuses);
    if (claimErr) {
      return res.status(500).json({ success: false, message: `Could not lock order for booking: ${claimErr.message}` });
    }
    if (!claimed) {
      return res.status(409).json({ success: false, code: 'STATE_CHANGED', message: 'Shipment state changed while retrying. Refresh and check again.' });
    }

    // Re-read after taking the lock: the customer may have cancelled between our first read and the claim
    const { data: lockedOrder } = await supabase.from('orders').select('order_status').eq('id', order.id).maybeSingle();
    if (String(lockedOrder?.order_status || '').toLowerCase() === 'cancelled') {
      await safeUpdateOrder(order.id, { shipment_status: 'cancelled' });
      return res.status(400).json({ success: false, code: 'NOT_ELIGIBLE', message: 'This order was cancelled — no shipment was created.' });
    }

    console.log(`[ADMIN CREATE SHIPMENT] ${order.order_number} by ${req.user?.email || req.user?.id || 'admin'} (previous status: ${shipStatus || 'none'}${force ? ', forced' : ''}${packageOverride ? ', manual package' : ''})`);
    const result = await bookShiprathShipment(order, { packageOverride });

    if (!result || result.error) {
      const realError = result?.rawError || result?.error || 'Shiprath booking failed.';
      console.error(`[ADMIN CREATE SHIPMENT] ${order.order_number} -> FAILED: ${realError}`);
      return res.status(400).json({
        success: false,
        message: realError,
        rawError: realError,
        courierFailures: result?.courierFailures || [],
        uncertain: Boolean(result?.uncertain),
      });
    }

    return res.json({ success: true, ...result, raw: undefined });
  } catch (error) {
    console.error('[SHIPRATH RETRY ROUTE] Exception:', error.message);
    return res.status(500).json({ success: false, message: 'Error booking shipment.', error: error.message });
  }
};


/**
 * GET /api/shipping/track/:awb (and /api/shiprat/track/:awb)
 * Live shipment tracking by AWB
 */
export const trackShipment = async (req, res) => {
  try {
    const { awb } = req.params;
    if (!awb) {
      return res.status(400).json({ success: false, message: 'AWB number is required.' });
    }

    const response = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_tracking`, {
      method: 'POST',
      headers: getShiprathHeaders(),
      body: JSON.stringify({ awb_number: awb, awb }),
    });

    const data = await response.json();
    if (!response.ok || !data?.status) {
      return res.status(502).json({ success: false, message: data?.message || 'Shiprath returned no tracking data.', tracking: data });
    }

    // Auto-advance matching order in DB if courier has moved forward
    try {
      const highestMapped = findHighestTrackingStatus(data);
      if (highestMapped) {
        const { data: order } = await supabase
          .from('orders')
          .select('id, order_number, order_status, shipment_status')
          .or(`awb_number.eq.${awb},awb.eq.${awb}`)
          .maybeSingle();

        if (order && String(order.order_status || '').toLowerCase() !== 'cancelled') {
          const currentProgressIdx = SHIPMENT_PROGRESS.indexOf(String(order.shipment_status || 'booked').toLowerCase());
          const newProgressIdx = SHIPMENT_PROGRESS.indexOf(highestMapped);
          if (newProgressIdx > currentProgressIdx) {
            const newOrderStatus = highestMapped === 'delivered' ? 'delivered'
              : highestMapped === 'out_for_delivery' ? 'out_for_delivery'
              : 'shipped';
            await safeUpdateOrder(order.id, {
              shipment_status: highestMapped,
              order_status: newOrderStatus,
              shipment_tracking_updated_at: new Date().toISOString(),
            });
            console.log(`[ADMIN TRACK AUTO-SYNC] Order ${order.order_number} (${awb}) updated to ${newOrderStatus} (${highestMapped})`);
          }
        }
      }
    } catch (e) {
      console.warn('[ADMIN TRACK AUTO-SYNC] Notice:', e.message);
    }

    return res.json({ success: true, tracking: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error tracking shipment.', error: error.message });
  }
};

/** Can this request's user see this order? (owner by id/email/phone, or admin) */
export function canAccessOrder(user, order) {
  if (!user || !order) return false;
  if (user.role === 'admin') return true;

  const uid = user.id || user._id;
  const orderUid = order.user_id || order.userId || order.user?.id || order.user?._id;
  if (uid && orderUid && String(orderUid) === String(uid)) return true;

  const userEmail = String(user.email || '').toLowerCase().trim();
  const orderEmail = String(order.customer_email || order.customerEmail || order.email || order.user?.email || '').toLowerCase().trim();
  if (userEmail && orderEmail && userEmail === orderEmail) return true;

  const digits = (v) => String(v || '').replace(/\D/g, '').slice(-10);
  const userPhone = digits(user.phone || user.mobile);
  const orderPhone = digits(order.customer_phone || order.customerPhone || order.phone || order.user?.phone);
  if (userPhone && orderPhone && userPhone.length === 10 && userPhone === orderPhone) return true;

  return false;
}

// Shipment progress, in order. Tracking may only move an order forward along this list.
export const SHIPMENT_PROGRESS = ['pending', 'creating', 'failed', 'booked', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];

export function extractTrackingEvents(trackData) {
  const d = trackData?.data && typeof trackData.data === 'object' && !Array.isArray(trackData.data) ? trackData.data : trackData;
  const list = d?.shipment_track || d?.scans || d?.tracking_data || trackData?.shipment_track || [];
  return Array.isArray(list) ? list : [];
}

/** Map carrier status text to MILASTY shipment_status. Returns null when unrecognised. */
export function mapTrackingStatus(text) {
  if (!text) return null;
  const s = String(text).toLowerCase().trim();
  if (!s) return null;

  // RTO (Return to Origin) is handled manually by admin
  if (/\brto\b|return(ed)?[\s_-]*to[\s_-]*origin/i.test(s)) return null;

  // Delivered: must be delivered, but NOT failed/undelivered/rescheduled
  if (/(?:^|[_\s-])(?:delivered|dlvd|successful(?:ly)?[\s_-]*delivered|delivery[\s_-]*done|completed[\s_-]*delivery)(?:$|[_\s-])/i.test(s) ||
      (/\bdelivered\b/i.test(s) && !/undelivered|not[\s_-]*delivered|failed[\s_-]*delivery|attempted/i.test(s))) {
    return 'delivered';
  }

  // Out for Delivery
  if (/out[\s_-]*for[\s_-]*delivery|\bofd\b|out[\s_-]*to[\s_-]*delivery|delivery[\s_-]*out|outfordelivery/i.test(s)) {
    return 'out_for_delivery';
  }

  // In Transit
  if (/in[\s_-]*transit|intransit|dispatched|shipped|reached|arrived|connected|bagged|\bhub\b|departed|in[\s_-]*network|forwarded|transhipment/i.test(s)) {
    return 'in_transit';
  }

  // Picked Up
  if (/picked[\s_-]*up|pickup[\s_-]*(?:done|complete|successful|scheduled)|collected/i.test(s)) {
    return 'picked_up';
  }

  // Booked / Created
  if (/booked|manifested|created|soft[\s_-]*data|shipment[\s_-]*created/i.test(s)) {
    return 'booked';
  }

  return null;
}

/**
 * Scan all top-level status strings AND all nested scan events to find the highest milestone reached.
 */
export function findHighestTrackingStatus(trackData) {
  if (!trackData) return null;
  const d = trackData?.data && typeof trackData.data === 'object' && !Array.isArray(trackData.data) ? trackData.data : trackData;
  const events = extractTrackingEvents(trackData);

  const candidateTexts = [
    d?.current_status,
    d?.current_status_name,
    d?.shipment_status,
    d?.status_name,
    d?.status_text,
    typeof d?.status === 'string' ? d.status : null,
    d?.latest_status,
    d?.tracking_status,
    d?.delivery_status,
  ];

  for (const e of events) {
    if (e && typeof e === 'object') {
      candidateTexts.push(e.status, e.activity, e.remark, e.scan_type, e.status_name, e.status_text);
    } else if (typeof e === 'string') {
      candidateTexts.push(e);
    }
  }

  let highestStatus = null;
  let highestIndex = -1;

  for (const text of candidateTexts) {
    if (typeof text !== 'string' || !text.trim()) continue;
    const mapped = mapTrackingStatus(text);
    if (!mapped) continue;
    const idx = SHIPMENT_PROGRESS.indexOf(mapped);
    if (idx > highestIndex) {
      highestIndex = idx;
      highestStatus = mapped;
    }
  }

  return highestStatus;
}

/**
 * Live sync tracking status for a single order from Shiprath.
 * Transitions order_status to 'out_for_delivery' or 'delivered' if courier tracking advanced.
 */
export async function syncSingleOrderTracking(orderOrId) {
  try {
    let order = null;
    if (typeof orderOrId === 'object' && orderOrId !== null) {
      order = orderOrId;
    } else if (typeof orderOrId === 'string') {
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(orderOrId);
      let q = supabase.from('orders').select('*');
      q = isUuid ? q.eq('id', orderOrId) : q.eq('order_number', orderOrId);
      const { data, error } = await q.maybeSingle();
      if (error || !data) return { success: false, message: 'Order not found' };
      order = data;
    }

    if (!order) return { success: false, message: 'Invalid order' };

    const currentOrderStatus = String(order.order_status || '').toLowerCase();
    if (currentOrderStatus === 'cancelled') {
      return { success: false, message: 'Order is cancelled' };
    }

    const awb = order.awb_number || order.awb || null;
    if (!awb) {
      return { success: false, message: 'Order has no AWB' };
    }

    let headers;
    try {
      headers = getShiprathHeaders();
    } catch (e) {
      return { success: false, message: 'Shiprath credentials not configured' };
    }

    const trackRes = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_tracking`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ awb_number: awb, awb }),
      signal: AbortSignal.timeout(15000),
    });

    const trackData = await trackRes.json();
    if (!trackData?.status && !trackData?.success && !Array.isArray(trackData?.data?.shipment_track) && !trackData?.data) {
      return { success: false, message: trackData?.message || 'No tracking info from carrier' };
    }

    const currentShipmentStatus = String(order.shipment_status || 'booked').toLowerCase();
    const highestMapped = findHighestTrackingStatus(trackData);

    if (!highestMapped) {
      return { success: true, updated: false, orderStatus: currentOrderStatus, shipmentStatus: currentShipmentStatus };
    }

    const currentProgressIdx = SHIPMENT_PROGRESS.indexOf(currentShipmentStatus);
    const newProgressIdx = SHIPMENT_PROGRESS.indexOf(highestMapped);
    const isForward = newProgressIdx > currentProgressIdx;

    if (isForward && currentOrderStatus !== 'cancelled') {
      let newOrderStatus = currentOrderStatus;
      if (highestMapped === 'delivered') {
        newOrderStatus = 'delivered';
      } else if (highestMapped === 'out_for_delivery') {
        newOrderStatus = 'out_for_delivery';
      } else if (['in_transit', 'picked_up'].includes(highestMapped)) {
        if (!['shipped', 'out_for_delivery', 'delivered'].includes(currentOrderStatus)) {
          newOrderStatus = 'shipped';
        }
      }

      const updates = {
        shipment_status: highestMapped,
        order_status: newOrderStatus,
        shipment_tracking_updated_at: new Date().toISOString(),
      };

      const { error: upErr } = await safeUpdateOrder(order.id, updates);
      if (!upErr) {
        console.log(`[AUTO-TRACK SYNC] ✅ Order ${order.order_number} (${awb}) automatically updated: ` +
          `order_status: ${currentOrderStatus} -> ${newOrderStatus}, shipment_status: ${currentShipmentStatus} -> ${highestMapped}`);
        order.shipment_status = highestMapped;
        order.order_status = newOrderStatus;
        order.shipment_tracking_updated_at = updates.shipment_tracking_updated_at;

        return {
          success: true,
          updated: true,
          orderStatus: newOrderStatus,
          shipmentStatus: highestMapped,
        };
      } else {
        console.warn(`[AUTO-TRACK SYNC] Failed to update DB for order ${order.order_number}:`, upErr.message);
      }
    }

    return {
      success: true,
      updated: false,
      orderStatus: currentOrderStatus,
      shipmentStatus: currentShipmentStatus,
    };
  } catch (err) {
    console.warn(`[AUTO-TRACK SYNC] Error syncing tracking for order:`, err?.message);
    return { success: false, message: err?.message };
  }
}

/**
 * Periodic background sweeper:
 * Finds all active shipped orders (shipped, out_for_delivery, packed with an AWB)
 * and automatically updates their status to 'out_for_delivery' or 'delivered'
 * as the courier progresses.
 */
export async function sweepShippedOrders() {
  try {
    const { data: activeOrders, error } = await supabase
      .from('orders')
      .select('id, order_number, order_status, shipment_status, awb_number, created_at, shipment_tracking_updated_at')
      .in('order_status', ['shipped', 'Shipped', 'out_for_delivery', 'Out for Delivery', 'packed', 'Packed'])
      .not('awb_number', 'is', null)
      .neq('order_status', 'cancelled')
      .neq('order_status', 'delivered')
      .limit(30);

    if (error || !activeOrders || activeOrders.length === 0) {
      return;
    }

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const ordersToSync = activeOrders.filter((o) => {
      if (!o.awb_number) return false;
      const lastChecked = o.shipment_tracking_updated_at ? new Date(o.shipment_tracking_updated_at).getTime() : 0;
      return !lastChecked || lastChecked < fiveMinutesAgo;
    });

    if (ordersToSync.length === 0) return;

    console.log(`[SHIPMENT SWEEPER] Checking tracking for ${ordersToSync.length} active shipped order(s)...`);

    for (const order of ordersToSync) {
      await syncSingleOrderTracking(order);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  } catch (err) {
    console.warn('[SHIPMENT SWEEPER] Error in background shipment sweep:', err?.message);
  }
}

/**
 * POST /api/shipping/webhook (and /api/shiprat/webhook)
 * Public webhook receiver for real-time tracking updates pushed by Shiprath or courier partners.
 * Immediately transitions order_status to 'out_for_delivery' or 'delivered'.
 */
export async function handleShipmentWebhook(req, res) {
  try {
    const payload = req.body || {};
    console.log('[SHIPMENT WEBHOOK RECEIVED]', JSON.stringify(payload).slice(0, 500));

    const awb = payload.awb || payload.awb_number || payload.data?.awb || payload.data?.awb_number || payload.waybill;
    const orderNumber = payload.order_id || payload.order_number || payload.data?.order_id || payload.data?.order_number;

    if (!awb && !orderNumber) {
      return res.status(200).json({ success: true, message: 'Webhook received (no AWB/order identified).' });
    }

    let query = supabase.from('orders').select('*');
    if (awb) {
      query = query.eq('awb_number', String(awb).trim());
    } else {
      query = query.eq('order_number', String(orderNumber).trim());
    }

    const { data: order, error } = await query.maybeSingle();
    if (error || !order) {
      return res.status(200).json({ success: true, message: 'Order not matched in MILASTY system.' });
    }

    const mapped = findHighestTrackingStatus(payload);

    if (mapped) {
      const currentShipmentStatus = String(order.shipment_status || 'booked').toLowerCase();
      const currentOrderStatus = String(order.order_status || '').toLowerCase();
      const currentIdx = SHIPMENT_PROGRESS.indexOf(currentShipmentStatus);
      const newIdx = SHIPMENT_PROGRESS.indexOf(mapped);

      if (newIdx > currentIdx && currentOrderStatus !== 'cancelled') {
        const newOrderStatus = mapped === 'delivered' ? 'delivered'
          : mapped === 'out_for_delivery' ? 'out_for_delivery'
          : 'shipped';

        const updates = {
          shipment_status: mapped,
          order_status: newOrderStatus,
          shipment_tracking_updated_at: new Date().toISOString(),
        };

        await safeUpdateOrder(order.id, updates);
        console.log(`[SHIPMENT WEBHOOK] ✅ Order ${order.order_number} automatically updated to ${newOrderStatus} (${mapped})`);
        return res.json({ success: true, updated: true, newStatus: newOrderStatus });
      }
    }

    await syncSingleOrderTracking(order);

    return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (err) {
    console.error('[SHIPMENT WEBHOOK ERROR]', err);
    return res.status(200).json({ success: true, message: 'Webhook acknowledged with error' });
  }
}

/**
 * GET /api/shipping/order/:orderId/tracking (and /api/shiprat/order/:orderId/tracking)
 * Customer order tracking. Updates shipment_status from live Shiprath tracking.
 * The response is customer-safe: no courier names, carrier IDs or Shiprath links.
 */
export const trackOrderShipment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const isUuid = /^[0-9a-fA-F-]{36}$/.test(orderId);
    let query = supabase.from('orders').select('*');
    query = isUuid ? query.eq('id', orderId) : query.eq('order_number', orderId);

    const { data: order, error } = await query.maybeSingle();
    if (error || !order || !canAccessOrder(req.user, order)) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const awb = order.awb_number || order.awb || null;
    let shipmentStatus = String(order.shipment_status || (awb ? 'booked' : 'pending')).toLowerCase();
    let orderStatus = order.order_status;

    let events = [];
    let estimatedDelivery = null;
    let trackingLive = false; // true only when Shiprath actually answered with tracking data

    if (awb) {
      try {
        const trackRes = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_tracking`, {
          method: 'POST',
          headers: getShiprathHeaders(),
          body: JSON.stringify({ awb_number: awb, awb }),
          signal: AbortSignal.timeout(20000),
        });
        const trackData = await trackRes.json();
        if (!trackData?.status) {
          console.warn(`[SHIPRATH TRACK] ${order.order_number} → HTTP ${trackRes.status}: ${trackData?.message || 'no tracking data'}`);
        }

        if (trackData?.status) {
          trackingLive = true;
          const d = trackData.data && typeof trackData.data === 'object' && !Array.isArray(trackData.data) ? trackData.data : trackData;
          estimatedDelivery = d.estimated_delivery || d.edd || null;
          events = extractTrackingEvents(trackData).slice(0, 20).map((e) => ({
            activity: e.activity || e.status || e.remark || e.scan_type || null,
            location: e.location || e.city || null,
            date: e.date || e.datetime || e.scan_date || e.updated_at || null,
          }));

          const mapped = findHighestTrackingStatus(trackData);
          const isForward = mapped && SHIPMENT_PROGRESS.indexOf(mapped) > SHIPMENT_PROGRESS.indexOf(shipmentStatus);

          if (isForward && String(order.order_status || '').toLowerCase() !== 'cancelled') {
            const newOrderStatus = mapped === 'delivered' ? 'delivered'
              : mapped === 'out_for_delivery' ? 'out_for_delivery'
              : 'shipped';
            const { error: upErr } = await safeUpdateOrder(order.id, {
              shipment_status: mapped,
              order_status: newOrderStatus,
              shipment_tracking_updated_at: new Date().toISOString(),
            });
            if (!upErr) {
              console.log(`[SHIPRATH TRACK] ${order.order_number} → ${shipmentStatus} → ${mapped}`);
              shipmentStatus = mapped;
              orderStatus = newOrderStatus;
            }
          }
        }
      } catch (trackErr) {
        console.warn(`[SHIPRATH TRACK] ${order.order_number} → tracking fetch failed:`, trackErr.message);
      }
    }

    const done = (step) => SHIPMENT_PROGRESS.indexOf(shipmentStatus) >= SHIPMENT_PROGRESS.indexOf(step);
    const timeline = [
      { step: 'Order Confirmed', completed: true, timestamp: order.created_at },
      { step: 'Shipment Created', completed: Boolean(awb) || done('booked') },
      { step: 'Picked Up', completed: done('picked_up') },
      { step: 'In Transit', completed: done('in_transit') },
      { step: 'Out for Delivery', completed: done('out_for_delivery') },
      { step: 'Delivered', completed: done('delivered') },
    ];

    return res.json({
      success: true,
      awb,
      courier_name: order.courier_name || 'Shiprath Delivery Partner',
      shipment_status: customerShipmentStatus(shipmentStatus),
      order_status: orderStatus,
      message: awb ? null : 'Order confirmed. Your shipment is being prepared.',
      tracking_live: trackingLive,
      timeline,
      tracking: awb ? { estimated_delivery: estimatedDelivery, shipment_track: events } : null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching order tracking.' });
  }
};

/** What a customer sees for shipment_status — internal failures read as "processing". */
export function customerShipmentStatus(status) {
  const s = String(status || '').toLowerCase();
  if (['pending', 'not_created', 'creating', 'failed', ''].includes(s)) return 'processing';
  return s;
}

// Order cancellation (policy, refund tracking, Shiprath shipment_cancel) lives in cancellationController.js

/**
 * GET /api/shipping/diagnose-credentials  (PUBLIC — NO AUTH)
 * Safe Shiprath credential diagnostic endpoint.
 * Does NOT expose secret values. Does NOT create any shipment.
 * Reports env var presence, character length, whitespace detection, and live API response.
 */
export const diagnoseCredentials = async (req, res) => {
  const rawSecret = process.env.SHIPRATH_SECRET_KEY;
  const rawCustomer = process.env.SHIPRATH_CUSTOMER_ID;

  const secretPresent = Boolean(rawSecret);
  const customerPresent = Boolean(rawCustomer);

  // Trim whitespace/newlines
  const trimmedSecret = (rawSecret || '').trim();
  const trimmedCustomer = (rawCustomer || '').trim();

  const secretHasWhitespace = secretPresent && (rawSecret !== trimmedSecret);
  const customerHasWhitespace = customerPresent && (rawCustomer !== trimmedCustomer);

  const report = {
    environment: process.env.NODE_ENV || 'unknown',
    envVars: {
      SHIPRATH_SECRET_KEY: {
        present: secretPresent,
        length: trimmedSecret.length,
        hasWhitespace: secretHasWhitespace,
        firstChar: trimmedSecret.length > 0 ? trimmedSecret[0] : null,
        lastChar: trimmedSecret.length > 0 ? trimmedSecret[trimmedSecret.length - 1] : null,
      },
      SHIPRATH_CUSTOMER_ID: {
        present: customerPresent,
        length: trimmedCustomer.length,
        hasWhitespace: customerHasWhitespace,
        value: trimmedCustomer, // customer ID is not a secret — safe to expose for verification
      },
    },
    headers: {
      willSend: {
        'Content-Type': 'application/json',
        secretkey: secretPresent ? `[REDACTED — length ${trimmedSecret.length}]` : '[MISSING]',
        customerid: customerPresent ? trimmedCustomer : '[MISSING]',
      },
    },
  };

  if (!secretPresent || !customerPresent) {
    return res.json({
      ...report,
      apiTest: null,
      conclusion: 'FAIL — One or both env vars missing. Set SHIPRATH_SECRET_KEY and SHIPRATH_CUSTOMER_ID in Railway Variables.',
    });
  }

  // Make the live Shiprath rate API call using TRIMMED values and full parameter set
  let apiTest = null;
  try {
    const pingRes = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_rate_time`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        secretkey: trimmedSecret,
        customerid: trimmedCustomer,
      },
      body: JSON.stringify({
        from_postal_code: WAREHOUSE_PINCODE,
        from_country_code: 'IN',
        to_postal_code: '110001',
        to_country_code: 'IN',
        weight: 1,
        length: 10,
        height: 10,
        width: 10,
        parcel_type: 'Parcel',
        mode: 'Domestic',
        payment_mode: 'prepaid',
        cod_amount: 0,
      }),

    });

    const pingData = await pingRes.json();
    const isConnected = pingRes.ok && (pingData.status === true || (pingData.rate_list && pingData.rate_list.length > 0));

    apiTest = {
      httpStatus: pingRes.status,
      shiprathStatus: pingData.status,
      shiprathMessage: pingData.message || null,
      rateCount: Array.isArray(pingData.rate_list) ? pingData.rate_list.length : (Array.isArray(pingData.data) ? pingData.data.length : 0),
      rawResponse: pingData,
      connected: isConnected,
    };

    const conclusion = isConnected
      ? 'SUCCESS — Shiprath API connected. Credentials are valid and working correctly.'
      : `FAIL — Shiprath returned: "${pingData.message || 'unknown error'}". HTTP ${pingRes.status}.`;

    return res.json({ ...report, apiTest, conclusion });

  } catch (err) {
    apiTest = { error: err.message };
    return res.json({
      ...report,
      apiTest,
      conclusion: `FAIL — Network error calling Shiprath API: ${err.message}`,
    });
  }

};

