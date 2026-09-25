import { supabase } from '../config/supabase.js';

/**
 * Standardize database row to Delivery Rule object
 */
const formatRuleRow = (row) => {
  if (!row) return null;
  let parsedNote = {};
  if (row.delivery_note) {
    try {
      parsedNote = JSON.parse(row.delivery_note);
    } catch (e) {
      // not json, ignore
    }
  }

  let minVal = 0;
  if (row.min_order_value !== undefined && row.min_order_value !== null) {
    minVal = Number(row.min_order_value);
  } else if (parsedNote.min_order_value !== undefined) {
    minVal = Number(parsedNote.min_order_value);
  } else if (!isNaN(Number(row.city))) {
    minVal = Number(row.city);
  }

  let maxVal = null;
  if (row.max_order_value !== undefined) {
    maxVal = row.max_order_value !== null ? Number(row.max_order_value) : null;
  } else if (parsedNote.max_order_value !== undefined) {
    maxVal = parsedNote.max_order_value !== null ? Number(parsedNote.max_order_value) : null;
  } else if (row.pincode && row.pincode !== 'INF' && !isNaN(Number(row.pincode)) && Number(row.pincode) < 900000 && Number(row.pincode) > 0) {
    maxVal = Number(row.pincode);
  }

  const deliveryCharge = Number(row.delivery_charge || 0);
  const isFreeDelivery = row.is_free_delivery !== undefined 
    ? !!row.is_free_delivery 
    : (parsedNote.is_free_delivery !== undefined ? !!parsedNote.is_free_delivery : deliveryCharge === 0);

  const isActive = row.is_active !== undefined 
    ? !!row.is_active 
    : (row.status === 'active');

  return {
    id: row.id,
    min_order_value: minVal,
    max_order_value: maxVal,
    delivery_charge: deliveryCharge,
    is_free_delivery: isFreeDelivery,
    is_active: isActive,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
};

/**
 * Fetch all rules from Database with automatic fallback & initial seed
 */
export const fetchAllDeliveryRulesFromDb = async () => {
  // 1. Try public.delivery_charge_rules table first
  try {
    const { data: directRules, error: directErr } = await supabase
      .from('delivery_charge_rules')
      .select('*')
      .order('min_order_value', { ascending: true });

    if (!directErr && directRules) {
      return directRules.map(formatRuleRow);
    }
  } catch (e) {
    // Table might not exist yet, fallback to delivery_areas
  }

  // 2. Query delivery_areas table for rows with state = 'DELIVERY_RULE'
  try {
    const { data: areaRows, error: areaErr } = await supabase
      .from('delivery_areas')
      .select('*')
      .eq('state', 'DELIVERY_RULE')
      .order('created_at', { ascending: true });

    if (!areaErr && areaRows && areaRows.length > 0) {
      const formatted = areaRows.map(formatRuleRow);
      formatted.sort((a, b) => a.min_order_value - b.min_order_value);
      return formatted;
    }
  } catch (e) {
    // ignore
  }

  // 3. If no rules exist in database, seed initial default rules into delivery_areas
  const defaultSeed = [
    { min_order_value: 0, max_order_value: 799, delivery_charge: 40, is_free_delivery: false, is_active: true },
    { min_order_value: 800, max_order_value: 1499, delivery_charge: 20, is_free_delivery: false, is_active: true },
    { min_order_value: 1500, max_order_value: null, delivery_charge: 0, is_free_delivery: true, is_active: true },
  ];

  try {
    for (const rule of defaultSeed) {
      const noteJson = JSON.stringify({
        min_order_value: rule.min_order_value,
        max_order_value: rule.max_order_value,
        is_free_delivery: rule.is_free_delivery,
      });

      await supabase.from('delivery_areas').insert([{
        state: 'DELIVERY_RULE',
        city: String(rule.min_order_value),
        pincode: rule.max_order_value !== null ? String(rule.max_order_value) : 'INF',
        delivery_charge: rule.delivery_charge,
        status: rule.is_active ? 'active' : 'inactive',
        delivery_note: noteJson,
        estimated_days: '3-5 business days'
      }]);
    }

    // Re-fetch after seeding
    const { data: newRows } = await supabase
      .from('delivery_areas')
      .select('*')
      .eq('state', 'DELIVERY_RULE');

    if (newRows && newRows.length > 0) {
      const formatted = newRows.map(formatRuleRow);
      formatted.sort((a, b) => a.min_order_value - b.min_order_value);
      return formatted;
    }
  } catch (e) {
    console.error('Seeding default delivery rules error:', e);
  }

  // Pure memory fallback if DB is entirely unresponsive
  return defaultSeed.map((s, idx) => ({ id: `rule-${idx}`, ...s, created_at: new Date().toISOString() }));
};

/**
 * CENTRALIZED DELIVERY CALCULATOR
 * Calculate delivery charge based on active order-value rules
 */
export const calculateDeliveryCharge = async (subtotalInput) => {
  const subtotal = Math.max(0, Number(subtotalInput || 0));
  const rules = await fetchAllDeliveryRulesFromDb();
  const activeRules = rules.filter(r => r.is_active);

  if (activeRules.length === 0) {
    return {
      success: false,
      deliveryFee: 0,
      isFreeDelivery: false,
      matchedRuleId: null,
      error: 'Delivery charge could not be calculated because no active delivery rules are configured. Please contact support.',
    };
  }

  // Find matching active rule
  // Rule matches if subtotal >= min_order_value AND (max_order_value is null OR subtotal <= max_order_value)
  const matchedRule = activeRules.find(r => {
    const min = Number(r.min_order_value || 0);
    const max = r.max_order_value !== null && r.max_order_value !== '' && r.max_order_value !== undefined 
      ? Number(r.max_order_value) 
      : null;

    if (subtotal < min) return false;
    if (max !== null && subtotal > max) return false;
    return true;
  });

  if (!matchedRule) {
    return {
      success: false,
      deliveryFee: 0,
      isFreeDelivery: false,
      matchedRuleId: null,
      error: `Delivery charge could not be calculated for order value ₹${subtotal}. No delivery rule matches this order amount.`,
    };
  }

  const fee = Number(matchedRule.delivery_charge || 0);
  const isFree = matchedRule.is_free_delivery || fee === 0;

  return {
    success: true,
    deliveryFee: isFree ? 0 : fee,
    isFreeDelivery: isFree,
    matchedRuleId: matchedRule.id,
    matchedRule,
  };
};

/**
 * Validate Range Overlaps
 */
export const checkRuleOverlap = (newRule, existingRules, excludeId = null) => {
  const min1 = Number(newRule.min_order_value || 0);
  const max1 = newRule.max_order_value !== null && newRule.max_order_value !== '' && newRule.max_order_value !== undefined 
    ? Number(newRule.max_order_value) 
    : null;

  const activeRules = existingRules.filter(r => r.is_active && r.id !== excludeId);

  for (const r of activeRules) {
    const min2 = Number(r.min_order_value || 0);
    const max2 = r.max_order_value !== null && r.max_order_value !== '' && r.max_order_value !== undefined 
      ? Number(r.max_order_value) 
      : null;

    const high1 = max1 === null ? Infinity : max1;
    const high2 = max2 === null ? Infinity : max2;

    if (min1 <= high2 && high1 >= min2) {
      return {
        hasOverlap: true,
        conflictingRule: r,
        message: `Delivery rule (₹${min1} – ${max1 !== null ? '₹' + max1 : '∞'}) overlaps with existing active rule (₹${min2} – ${max2 !== null ? '₹' + max2 : '∞'}).`,
      };
    }
  }

  return { hasOverlap: false };
};

/**
 * Check Order Value Coverage
 */
export const checkRuleCoverage = (rules) => {
  const activeRules = rules.filter(r => r.is_active);
  if (activeRules.length === 0) {
    return {
      isCovered: false,
      message: 'No active delivery rules configured. All checkouts will fail.',
    };
  }

  const sorted = [...activeRules].sort((a, b) => a.min_order_value - b.min_order_value);
  
  if (sorted[0].min_order_value > 0) {
    return {
      isCovered: false,
      message: `Orders below ₹${sorted[0].min_order_value} are not covered by any active delivery rule.`,
    };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentMax = sorted[i].max_order_value;
    const nextMin = sorted[i + 1].min_order_value;

    if (currentMax === null) {
      // Current rule goes to infinity, so subsequent rules overlap or are redundant
      return {
        isCovered: false,
        message: `Rule ₹${sorted[i].min_order_value}+ has no upper limit, rendering subsequent rules unreachable.`,
      };
    }

    if (nextMin > currentMax + 1) {
      return {
        isCovered: false,
        message: `Order values between ₹${currentMax + 1} and ₹${nextMin - 1} are not covered by any active rule.`,
      };
    }
  }

  const lastRule = sorted[sorted.length - 1];
  if (lastRule.max_order_value !== null) {
    return {
      isCovered: false,
      message: `Orders above ₹${lastRule.max_order_value} are not covered by any active delivery rule.`,
    };
  }

  return {
    isCovered: true,
    message: 'All order values from ₹0 to ∞ are fully covered by active delivery rules.',
  };
};

/**
 * PUBLIC API — Calculate Delivery Charge for Cart/Checkout
 * GET /api/delivery-charges/calculate?subtotal=XYZ
 */
export const calculateDeliveryPublic = async (req, res) => {
  try {
    const subtotal = req.query.subtotal;
    const result = await calculateDeliveryCharge(subtotal);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (error) {
    console.error('calculateDeliveryPublic error:', error);
    res.status(500).json({ success: false, message: 'Server error calculating delivery charge', error: error.message });
  }
};

/**
 * ADMIN API — Get All Delivery Charge Rules + Coverage
 * GET /api/delivery-charges
 */
export const getDeliveryRules = async (req, res) => {
  try {
    const rules = await fetchAllDeliveryRulesFromDb();
    const coverage = checkRuleCoverage(rules);

    return res.json({
      success: true,
      rules,
      coverage,
    });
  } catch (error) {
    console.error('getDeliveryRules error:', error);
    res.status(500).json({ success: false, message: 'Error fetching delivery charge rules', error: error.message });
  }
};

/**
 * ADMIN API — Add New Delivery Charge Rule
 * POST /api/delivery-charges
 */
export const createDeliveryRule = async (req, res) => {
  try {
    const { min_order_value, max_order_value, delivery_charge, is_free_delivery, is_active } = req.body;

    const minNum = Number(min_order_value);
    if (isNaN(minNum) || minNum < 0) {
      return res.status(400).json({ message: 'Minimum Order Value must be a valid number >= 0.' });
    }

    let maxNum = null;
    if (max_order_value !== '' && max_order_value !== null && max_order_value !== undefined) {
      maxNum = Number(max_order_value);
      if (isNaN(maxNum) || maxNum <= minNum) {
        return res.status(400).json({ message: 'Maximum Order Value must be greater than Minimum Order Value.' });
      }
    }

    const freeFlag = !!is_free_delivery || Number(delivery_charge) === 0;
    const chargeNum = freeFlag ? 0 : Math.max(0, Number(delivery_charge || 0));
    const activeFlag = is_active !== undefined ? !!is_active : true;

    // Check overlap with existing active rules
    const existingRules = await fetchAllDeliveryRulesFromDb();
    if (activeFlag) {
      const overlapCheck = checkRuleOverlap(
        { min_order_value: minNum, max_order_value: maxNum, is_active: activeFlag },
        existingRules
      );

      if (overlapCheck.hasOverlap) {
        return res.status(400).json({ message: overlapCheck.message });
      }
    }

    const noteJson = JSON.stringify({
      min_order_value: minNum,
      max_order_value: maxNum,
      is_free_delivery: freeFlag,
    });

    // Try inserting to delivery_charge_rules or fallback to delivery_areas
    let savedRule = null;
    try {
      const { data, error } = await supabase
        .from('delivery_charge_rules')
        .insert([{
          min_order_value: minNum,
          max_order_value: maxNum,
          delivery_charge: chargeNum,
          is_free_delivery: freeFlag,
          is_active: activeFlag,
        }])
        .select()
        .single();

      if (!error && data) {
        savedRule = formatRuleRow(data);
      }
    } catch (e) {
      // fallback
    }

    if (!savedRule) {
      const { data, error } = await supabase
        .from('delivery_areas')
        .insert([{
          state: 'DELIVERY_RULE',
          city: String(minNum),
          pincode: maxNum !== null ? String(maxNum) : 'INF',
          delivery_charge: chargeNum,
          status: activeFlag ? 'active' : 'inactive',
          delivery_note: noteJson,
          estimated_days: '3-5 business days'
        }])
        .select()
        .single();

      if (error) {
        return res.status(500).json({ message: `Failed to save delivery rule: ${error.message}` });
      }
      savedRule = formatRuleRow(data);
    }

    const updatedRules = await fetchAllDeliveryRulesFromDb();
    const coverage = checkRuleCoverage(updatedRules);

    return res.status(201).json({
      success: true,
      message: 'Delivery charge rule created successfully',
      rule: savedRule,
      coverage,
    });
  } catch (error) {
    console.error('createDeliveryRule error:', error);
    res.status(500).json({ message: 'Error creating delivery rule', error: error.message });
  }
};

/**
 * ADMIN API — Edit Delivery Charge Rule
 * PUT /api/delivery-charges/:id
 */
export const updateDeliveryRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { min_order_value, max_order_value, delivery_charge, is_free_delivery, is_active } = req.body;

    const minNum = Number(min_order_value);
    if (isNaN(minNum) || minNum < 0) {
      return res.status(400).json({ message: 'Minimum Order Value must be a valid number >= 0.' });
    }

    let maxNum = null;
    if (max_order_value !== '' && max_order_value !== null && max_order_value !== undefined) {
      maxNum = Number(max_order_value);
      if (isNaN(maxNum) || maxNum <= minNum) {
        return res.status(400).json({ message: 'Maximum Order Value must be greater than Minimum Order Value.' });
      }
    }

    const freeFlag = !!is_free_delivery || Number(delivery_charge) === 0;
    const chargeNum = freeFlag ? 0 : Math.max(0, Number(delivery_charge || 0));
    const activeFlag = is_active !== undefined ? !!is_active : true;

    // Check overlap with existing active rules (excluding current rule ID)
    const existingRules = await fetchAllDeliveryRulesFromDb();
    if (activeFlag) {
      const overlapCheck = checkRuleOverlap(
        { min_order_value: minNum, max_order_value: maxNum, is_active: activeFlag },
        existingRules,
        id
      );

      if (overlapCheck.hasOverlap) {
        return res.status(400).json({ message: overlapCheck.message });
      }
    }

    const noteJson = JSON.stringify({
      min_order_value: minNum,
      max_order_value: maxNum,
      is_free_delivery: freeFlag,
    });

    let updatedRule = null;
    try {
      const { data, error } = await supabase
        .from('delivery_charge_rules')
        .update({
          min_order_value: minNum,
          max_order_value: maxNum,
          delivery_charge: chargeNum,
          is_free_delivery: freeFlag,
          is_active: activeFlag,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (!error && data) {
        updatedRule = formatRuleRow(data);
      }
    } catch (e) {
      // fallback
    }

    if (!updatedRule) {
      const { data, error } = await supabase
        .from('delivery_areas')
        .update({
          city: String(minNum),
          pincode: maxNum !== null ? String(maxNum) : 'INF',
          delivery_charge: chargeNum,
          status: activeFlag ? 'active' : 'inactive',
          delivery_note: noteJson,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        return res.status(500).json({ message: `Failed to update delivery rule: ${error.message}` });
      }
      updatedRule = formatRuleRow(data);
    }

    const updatedRules = await fetchAllDeliveryRulesFromDb();
    const coverage = checkRuleCoverage(updatedRules);

    return res.json({
      success: true,
      message: 'Delivery charge rule updated successfully',
      rule: updatedRule,
      coverage,
    });
  } catch (error) {
    console.error('updateDeliveryRule error:', error);
    res.status(500).json({ message: 'Error updating delivery rule', error: error.message });
  }
};

/**
 * ADMIN API — Delete Delivery Charge Rule
 * DELETE /api/delivery-charges/:id
 */
export const deleteDeliveryRule = async (req, res) => {
  try {
    const { id } = req.params;

    try {
      await supabase.from('delivery_charge_rules').delete().eq('id', id);
    } catch (e) {}

    await supabase.from('delivery_areas').delete().eq('id', id);

    const updatedRules = await fetchAllDeliveryRulesFromDb();
    const coverage = checkRuleCoverage(updatedRules);

    return res.json({
      success: true,
      message: 'Delivery charge rule deleted successfully',
      coverage,
    });
  } catch (error) {
    console.error('deleteDeliveryRule error:', error);
    res.status(500).json({ message: 'Error deleting delivery rule', error: error.message });
  }
};
