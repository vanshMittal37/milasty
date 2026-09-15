import { supabase } from '../config/supabase.js';

// Default fallback list of delivery areas if database is unseeded
const FALLBACK_DELIVERY_AREAS = [
  { id: 'area-1', state: 'Uttarakhand', city: 'Kichha', pincode: '263153', delivery_charge: 40.00, status: 'active', delivery_note: 'Standard home delivery', estimated_days: '3–5 business days' },
  { id: 'area-2', state: 'Uttarakhand', city: 'Kichha', pincode: '263148', delivery_charge: 40.00, status: 'active', delivery_note: 'Standard home delivery', estimated_days: '3–5 business days' },
  { id: 'area-3', state: 'Uttarakhand', city: 'Rudarpur', pincode: '263153', delivery_charge: 40.00, status: 'active', delivery_note: 'Express local delivery', estimated_days: '2–3 business days' },
  { id: 'area-4', state: 'Uttar Pradesh', city: 'Noida', pincode: '201301', delivery_charge: 50.00, status: 'active', delivery_note: 'NCR Express Delivery', estimated_days: '2–4 business days' },
  { id: 'area-5', state: 'Delhi', city: 'New Delhi', pincode: '110001', delivery_charge: 0.00, status: 'active', delivery_note: 'Free Metro Delivery', estimated_days: '1–3 business days' },
  { id: 'area-6', state: 'Maharashtra', city: 'Mumbai', pincode: '400001', delivery_charge: 60.00, status: 'active', delivery_note: 'Pan-India Express Delivery', estimated_days: '3–5 business days' },
];

// In-memory array store fallback if Supabase table is not yet created
let memoryDeliveryAreas = [...FALLBACK_DELIVERY_AREAS];

/**
 * PUBLIC API — Customer PIN Code Serviceability Check
 * GET /api/delivery-areas/check/:pincode
 */
export const checkServiceability = async (req, res) => {
  try {
    const rawPin = req.params.pincode || req.query.pincode || '';
    const pincode = String(rawPin).trim();

    // Client/Server Validation: Exactly 6 digits
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        available: false,
        message: 'Please enter a valid 6-digit Indian PIN code.'
      });
    }

    // Attempt Supabase query
    let area = null;
    const { data: dbAreas, error } = await supabase
      .from('delivery_areas')
      .select('*')
      .eq('pincode', pincode)
      .eq('status', 'active');

    if (!error && dbAreas && dbAreas.length > 0) {
      area = dbAreas[0];
    } else {
      // Memory fallback lookup
      area = memoryDeliveryAreas.find(a => a.pincode === pincode && a.status === 'active');
    }

    if (!area) {
      return res.json({
        available: false,
        pincode,
        message: "Sorry, we currently don't deliver to this area. Please try another PIN code."
      });
    }

    const charge = Number(area.delivery_charge || 0);

    return res.json({
      available: true,
      pincode: area.pincode,
      city: area.city,
      state: area.state,
      deliveryCharge: charge,
      isFreeDelivery: charge === 0,
      deliveryNote: area.delivery_note || 'Delivered within 3–5 business days',
      estimatedDays: area.estimated_days || '3–5 business days',
      message: `Delivery available in ${area.city}, ${area.state}`
    });
  } catch (error) {
    console.error('checkServiceability error:', error);
    return res.status(500).json({
      available: false,
      message: 'Unable to verify delivery serviceability right now. Please try again.'
    });
  }
};

/**
 * ADMIN API — List all Delivery Areas with Search & Filter
 * GET /api/delivery-areas
 */
export const getDeliveryAreas = async (req, res) => {
  try {
    const { search, state, status } = req.query;

    let { data: areas, error } = await supabase
      .from('delivery_areas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !areas || areas.length === 0) {
      areas = memoryDeliveryAreas;
    }

    let filtered = [...areas];

    if (state && state !== 'all') {
      filtered = filtered.filter(a => a.state.toLowerCase() === state.toLowerCase());
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(a => a.status === status);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(a =>
        a.pincode.includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q)
      );
    }

    // Summary Analytics Metrics
    const totalAreas = areas.length;
    const activeAreas = areas.filter(a => a.status === 'active').length;
    const inactiveAreas = areas.filter(a => a.status === 'inactive').length;
    const areasWithCharges = areas.filter(a => Number(a.delivery_charge) > 0).length;
    const freeDeliveryAreas = areas.filter(a => Number(a.delivery_charge) === 0).length;

    return res.json({
      areas: filtered,
      summary: {
        totalAreas,
        activeAreas,
        inactiveAreas,
        areasWithCharges,
        freeDeliveryAreas,
      }
    });
  } catch (error) {
    console.error('getDeliveryAreas error:', error);
    res.status(500).json({ message: 'Error fetching delivery areas', error: error.message });
  }
};

/**
 * ADMIN API — Add New Delivery Area
 * POST /api/delivery-areas
 */
export const createDeliveryArea = async (req, res) => {
  try {
    const { state, city, pincode, delivery_charge, status = 'active', delivery_note, estimated_days } = req.body;

    if (!state || !state.trim()) {
      return res.status(400).json({ message: 'State is required.' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ message: 'City is required.' });
    }
    if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({ message: 'PIN code must be exactly 6 digits.' });
    }

    const chargeNum = delivery_charge !== '' && delivery_charge !== null && delivery_charge !== undefined
      ? Math.max(0, Number(delivery_charge))
      : 0;

    const payload = {
      state: state.trim(),
      city: city.trim(),
      pincode: String(pincode).trim(),
      delivery_charge: chargeNum,
      status: status === 'inactive' ? 'inactive' : 'active',
      delivery_note: delivery_note ? delivery_note.trim() : 'Delivered within 3–5 business days',
      estimated_days: estimated_days ? estimated_days.trim() : '3–5 business days',
      updated_at: new Date().toISOString(),
    };

    // Check duplicate in memory / DB
    const { data: existing } = await supabase
      .from('delivery_areas')
      .select('id')
      .eq('state', payload.state)
      .eq('city', payload.city)
      .eq('pincode', payload.pincode)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ message: `Delivery area already exists for ${payload.city}, ${payload.state} (${payload.pincode}).` });
    }

    let { data: newArea, error } = await supabase
      .from('delivery_areas')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Supabase delivery_areas insert warning:', error.message);
      newArea = { id: `area-${Date.now()}`, ...payload, created_at: new Date().toISOString() };
      memoryDeliveryAreas.unshift(newArea);
    } else {
      memoryDeliveryAreas.unshift(newArea);
    }

    return res.status(201).json({
      message: 'Delivery area created successfully',
      area: newArea
    });
  } catch (error) {
    console.error('createDeliveryArea error:', error);
    res.status(500).json({ message: 'Error creating delivery area', error: error.message });
  }
};

/**
 * ADMIN API — Edit Delivery Area
 * PUT /api/delivery-areas/:id
 */
export const updateDeliveryArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { state, city, pincode, delivery_charge, status, delivery_note, estimated_days } = req.body;

    const updatePayload = { updated_at: new Date().toISOString() };

    if (state) updatePayload.state = state.trim();
    if (city) updatePayload.city = city.trim();
    if (pincode) {
      if (!/^\d{6}$/.test(String(pincode).trim())) {
        return res.status(400).json({ message: 'PIN code must be exactly 6 digits.' });
      }
      updatePayload.pincode = String(pincode).trim();
    }
    if (delivery_charge !== undefined && delivery_charge !== null) {
      updatePayload.delivery_charge = Math.max(0, Number(delivery_charge));
    }
    if (status !== undefined) updatePayload.status = status;
    if (delivery_note !== undefined) updatePayload.delivery_note = delivery_note.trim();
    if (estimated_days !== undefined) updatePayload.estimated_days = estimated_days.trim();

    let { data: updatedArea, error } = await supabase
      .from('delivery_areas')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error || !updatedArea) {
      const idx = memoryDeliveryAreas.findIndex(a => a.id === id);
      if (idx !== -1) {
        memoryDeliveryAreas[idx] = { ...memoryDeliveryAreas[idx], ...updatePayload };
        updatedArea = memoryDeliveryAreas[idx];
      }
    }

    return res.json({
      message: 'Delivery area updated successfully',
      area: updatedArea || { id, ...updatePayload }
    });
  } catch (error) {
    console.error('updateDeliveryArea error:', error);
    res.status(500).json({ message: 'Error updating delivery area', error: error.message });
  }
};

/**
 * ADMIN API — Delete Delivery Area
 * DELETE /api/delivery-areas/:id
 */
export const deleteDeliveryArea = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('delivery_areas')
      .delete()
      .eq('id', id);

    memoryDeliveryAreas = memoryDeliveryAreas.filter(a => a.id !== id);

    return res.json({ message: 'Delivery area deleted successfully' });
  } catch (error) {
    console.error('deleteDeliveryArea error:', error);
    res.status(500).json({ message: 'Error deleting delivery area', error: error.message });
  }
};

/**
 * ADMIN HELPER API — Pincode Auto Lookup (India Post Postal Pincode API)
 * GET /api/delivery-areas/lookup-pincode/:pincode
 */
export const lookupPincodeDetails = async (req, res) => {
  try {
    const pincode = req.params.pincode;
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ message: 'Invalid 6-digit PIN code format.' });
    }

    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();

    if (!data || !Array.isArray(data) || data[0]?.Status !== 'Success') {
      return res.status(404).json({ message: 'PIN code details not found in official India postal dataset.' });
    }

    const offices = data[0].PostOffice || [];
    if (offices.length === 0) {
      return res.status(404).json({ message: 'No post offices associated with this PIN code.' });
    }

    const first = offices[0];
    const state = first.State;
    const district = first.District || first.Block || first.Name;
    const postOffices = offices.map(o => o.Name);

    return res.json({
      pincode,
      state,
      district,
      city: district,
      postOffices,
    });
  } catch (error) {
    console.error('lookupPincodeDetails error:', error);
    res.status(500).json({ message: 'Error querying PIN code lookup service', error: error.message });
  }
};
