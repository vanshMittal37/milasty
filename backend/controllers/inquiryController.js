import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');

// Helper to ensure data directory and file exist
const ensureLocalFile = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INQUIRIES_FILE)) {
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
};

const readLocalInquiries = () => {
  try {
    ensureLocalFile();
    const raw = fs.readFileSync(INQUIRIES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local inquiries JSON:', err.message);
    return [];
  }
};

const writeLocalInquiries = (data) => {
  try {
    ensureLocalFile();
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local inquiries JSON:', err.message);
  }
};

// Generate readable inquiry number: INQ-1001, INQ-1002, etc.
const generateInquiryNumber = async (localList = []) => {
  let highestNum = 1000;

  // Try DB
  try {
    const { data: dbInquiries } = await supabase
      .from('customer_inquiries')
      .select('inquiry_number')
      .order('created_at', { ascending: false });

    if (dbInquiries && dbInquiries.length > 0) {
      for (const item of dbInquiries) {
        if (item.inquiry_number && item.inquiry_number.startsWith('INQ-')) {
          const num = parseInt(item.inquiry_number.replace('INQ-', ''), 10);
          if (!isNaN(num) && num > highestNum) {
            highestNum = num;
          }
        }
      }
    }
  } catch (e) {
    // Ignore DB error
  }

  // Also check local list
  for (const item of localList) {
    if (item.inquiry_number && item.inquiry_number.startsWith('INQ-')) {
      const num = parseInt(item.inquiry_number.replace('INQ-', ''), 10);
      if (!isNaN(num) && num > highestNum) {
        highestNum = num;
      }
    }
  }

  return `INQ-${highestNum + 1}`;
};

/**
 * PUBLIC/CUSTOMER API — Submit Contact Form Inquiry
 * POST /api/inquiries
 */
export const createInquiry = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validation: Name *, Email *, Message *
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }
    if (!email || !String(email).trim() || !email.includes('@')) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    // Determine authenticated user_id if present
    const authenticatedUserId = req.user?.id || req.user?._id || null;

    const localList = readLocalInquiries();
    const inquiryNumber = await generateInquiryNumber(localList);
    const now = new Date().toISOString();

    const newInquiry = {
      id: `inq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      inquiry_number: inquiryNumber,
      user_id: authenticatedUserId ? String(authenticatedUserId) : null,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      message: String(message).trim(),
      status: 'new',
      admin_response: '',
      admin_notes: '',
      created_at: now,
      updated_at: now,
      contacted_at: null,
      resolved_at: null,
      closed_at: null,
    };

    // Save to Supabase DB if table exists
    let dbSavedInquiry = null;
    try {
      const { data, error } = await supabase
        .from('customer_inquiries')
        .insert([{
          inquiry_number: newInquiry.inquiry_number,
          user_id: newInquiry.user_id,
          name: newInquiry.name,
          email: newInquiry.email,
          phone: newInquiry.phone,
          message: newInquiry.message,
          status: 'new',
          admin_response: '',
          admin_notes: '',
          created_at: now,
          updated_at: now,
        }])
        .select()
        .single();

      if (!error && data) {
        dbSavedInquiry = data;
        newInquiry.id = data.id; // use DB ID if available
      } else if (error) {
        console.warn('Supabase customer_inquiries insert notice:', error.message);
      }
    } catch (dbErr) {
      console.warn('Supabase DB operation exception:', dbErr.message);
    }

    // Always update local disk backup
    localList.unshift(newInquiry);
    writeLocalInquiries(localList);

    // Return success response to website UI ONLY. (Do NOT send any email/WhatsApp/SMS!)
    return res.status(201).json({
      success: true,
      message: 'Thank you for contacting MILASTY. Your inquiry has been received successfully.',
      inquiry: dbSavedInquiry || newInquiry,
    });
  } catch (error) {
    console.error('createInquiry controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to submit your inquiry right now. Please try again.',
      error: error.message,
    });
  }
};

/**
 * CUSTOMER API — Get My Inquiries
 * GET /api/inquiries/my-inquiries
 */
export const getMyInquiries = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'User authentication required.' });
    }

    const userIdStr = String(userId);
    let inquiries = [];

    // Attempt DB fetch first
    try {
      const { data, error } = await supabase
        .from('customer_inquiries')
        .select('*')
        .eq('user_id', userIdStr)
        .order('created_at', { ascending: false });

      if (!error && data) {
        inquiries = data;
      }
    } catch (e) {
      console.warn('Supabase getMyInquiries notice:', e.message);
    }

    // Fallback to local file if DB returns empty/fails
    if (inquiries.length === 0) {
      const localList = readLocalInquiries();
      inquiries = localList.filter(item => item.user_id && String(item.user_id) === userIdStr);
    }

    return res.json({
      success: true,
      count: inquiries.length,
      inquiries,
    });
  } catch (error) {
    console.error('getMyInquiries error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching your inquiries.',
      error: error.message,
    });
  }
};

/**
 * CUSTOMER API — Get Single Inquiry Detail
 * GET /api/inquiries/my-inquiries/:id
 */
export const getMyInquiryById = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required.' });
    }

    const userIdStr = String(userId);
    let inquiry = null;

    // Try DB
    try {
      const { data, error } = await supabase
        .from('customer_inquiries')
        .select('*')
        .or(`id.eq.${id},inquiry_number.eq.${id}`)
        .maybeSingle();

      if (!error && data) {
        if (data.user_id && String(data.user_id) !== userIdStr) {
          return res.status(403).json({ message: 'Access denied. You can only view your own inquiries.' });
        }
        inquiry = data;
      }
    } catch (e) {
      console.warn('Supabase getMyInquiryById notice:', e.message);
    }

    // Fallback local list
    if (!inquiry) {
      const localList = readLocalInquiries();
      const match = localList.find(item => item.id === id || item.inquiry_number === id);
      if (match) {
        if (match.user_id && String(match.user_id) !== userIdStr) {
          return res.status(403).json({ message: 'Access denied. You can only view your own inquiries.' });
        }
        inquiry = match;
      }
    }

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    return res.json({
      success: true,
      inquiry,
    });
  } catch (error) {
    console.error('getMyInquiryById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching inquiry details.',
      error: error.message,
    });
  }
};

/**
 * ADMIN API — Get All Customer Inquiries (with Search, Status Filter, Sort & Summary Counts)
 * GET /api/inquiries/admin/all
 */
export const getAllInquiriesAdmin = async (req, res) => {
  try {
    const { search, status, sort } = req.query;
    let allInquiries = [];

    // Attempt DB query
    try {
      const { data, error } = await supabase
        .from('customer_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        allInquiries = data;
      }
    } catch (e) {
      console.warn('Supabase getAllInquiriesAdmin notice:', e.message);
    }

    // Merge with local list if DB returned fewer records or failed
    const localList = readLocalInquiries();
    const map = new Map();
    // Put local ones first
    localList.forEach(item => map.set(item.inquiry_number || item.id, item));
    // Put DB ones over them if available
    allInquiries.forEach(item => map.set(item.inquiry_number || item.id, item));

    const combinedList = Array.from(map.values());

    // Calculate Summary Counts from complete dataset
    const summary = {
      totalQueries: combinedList.length,
      new: combinedList.filter(i => (i.status || 'new') === 'new').length,
      in_progress: combinedList.filter(i => i.status === 'in_progress').length,
      contacted: combinedList.filter(i => i.status === 'contacted').length,
      resolved: combinedList.filter(i => i.status === 'resolved').length,
      closed: combinedList.filter(i => i.status === 'closed').length,
    };

    let filtered = [...combinedList];

    // Status Filter
    if (status && status !== 'all') {
      filtered = filtered.filter(i => (i.status || 'new') === status.toLowerCase());
    }

    // Search Filter: Inquiry Number, Customer Name, Email, Phone, Message
    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      filtered = filtered.filter(i =>
        (i.inquiry_number && i.inquiry_number.toLowerCase().includes(q)) ||
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.email && i.email.toLowerCase().includes(q)) ||
        (i.phone && i.phone.toLowerCase().includes(q)) ||
        (i.message && i.message.toLowerCase().includes(q))
      );
    }

    // Sort Order
    if (sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else {
      filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return res.json({
      success: true,
      summary,
      count: filtered.length,
      inquiries: filtered,
    });
  } catch (error) {
    console.error('getAllInquiriesAdmin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching customer inquiries.',
      error: error.message,
    });
  }
};

/**
 * ADMIN API — Get Single Inquiry Detail (Admin View)
 * GET /api/inquiries/admin/:id
 */
export const getInquiryByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    let inquiry = null;

    // Try DB
    try {
      const { data, error } = await supabase
        .from('customer_inquiries')
        .select('*')
        .or(`id.eq.${id},inquiry_number.eq.${id}`)
        .maybeSingle();

      if (!error && data) {
        inquiry = data;
      }
    } catch (e) {
      console.warn('Supabase getInquiryByIdAdmin notice:', e.message);
    }

    if (!inquiry) {
      const localList = readLocalInquiries();
      inquiry = localList.find(item => item.id === id || item.inquiry_number === id) || null;
    }

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    return res.json({
      success: true,
      inquiry,
    });
  } catch (error) {
    console.error('getInquiryByIdAdmin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching inquiry details.',
      error: error.message,
    });
  }
};

/**
 * ADMIN API — Update Inquiry Status
 * PATCH /api/inquiries/admin/:id/status
 */
export const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['new', 'in_progress', 'contacted', 'resolved', 'closed'];
    if (!status || !allowedStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const cleanStatus = status.toLowerCase();
    const now = new Date().toISOString();

    const updatePayload = {
      status: cleanStatus,
      updated_at: now,
    };

    if (cleanStatus === 'contacted') updatePayload.contacted_at = now;
    if (cleanStatus === 'resolved') updatePayload.resolved_at = now;
    if (cleanStatus === 'closed') updatePayload.closed_at = now;

    let updatedInquiry = null;

    // Try updating DB
    try {
      const { data, error } = await supabase
        .from('customer_inquiries')
        .update(updatePayload)
        .or(`id.eq.${id},inquiry_number.eq.${id}`)
        .select()
        .maybeSingle();

      if (!error && data) {
        updatedInquiry = data;
      }
    } catch (e) {
      console.warn('Supabase updateInquiryStatus notice:', e.message);
    }

    // Always update local disk record
    const localList = readLocalInquiries();
    const idx = localList.findIndex(item => item.id === id || item.inquiry_number === id);
    if (idx !== -1) {
      localList[idx] = {
        ...localList[idx],
        ...updatePayload,
      };
      writeLocalInquiries(localList);
      if (!updatedInquiry) {
        updatedInquiry = localList[idx];
      }
    }

    if (!updatedInquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    return res.json({
      success: true,
      message: 'Status updated successfully.',
      inquiry: updatedInquiry,
    });
  } catch (error) {
    console.error('updateInquiryStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating inquiry status.',
      error: error.message,
    });
  }
};

/**
 * ADMIN API — Save Admin Response
 * PATCH /api/inquiries/admin/:id/response
 */
export const saveAdminResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_response } = req.body;

    const responseText = admin_response !== undefined ? String(admin_response).trim() : '';
    const now = new Date().toISOString();

    const updatePayload = {
      admin_response: responseText,
      updated_at: now,
    };

    let updatedInquiry = null;

    try {
      const { data, error } = await supabase
        .from('customer_inquiries')
        .update(updatePayload)
        .or(`id.eq.${id},inquiry_number.eq.${id}`)
        .select()
        .maybeSingle();

      if (!error && data) {
        updatedInquiry = data;
      }
    } catch (e) {
      console.warn('Supabase saveAdminResponse notice:', e.message);
    }

    const localList = readLocalInquiries();
    const idx = localList.findIndex(item => item.id === id || item.inquiry_number === id);
    if (idx !== -1) {
      localList[idx] = {
        ...localList[idx],
        ...updatePayload,
      };
      writeLocalInquiries(localList);
      if (!updatedInquiry) {
        updatedInquiry = localList[idx];
      }
    }

    if (!updatedInquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    return res.json({
      success: true,
      message: 'Admin response saved successfully.',
      inquiry: updatedInquiry,
    });
  } catch (error) {
    console.error('saveAdminResponse error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error saving admin response.',
      error: error.message,
    });
  }
};

/**
 * ADMIN API — Save Internal Notes (Admin Only)
 * PATCH /api/inquiries/admin/:id/notes
 */
export const saveAdminNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const notesText = admin_notes !== undefined ? String(admin_notes).trim() : '';
    const now = new Date().toISOString();

    const updatePayload = {
      admin_notes: notesText,
      updated_at: now,
    };

    let updatedInquiry = null;

    try {
      const { data, error } = await supabase
        .from('customer_inquiries')
        .update(updatePayload)
        .or(`id.eq.${id},inquiry_number.eq.${id}`)
        .select()
        .maybeSingle();

      if (!error && data) {
        updatedInquiry = data;
      }
    } catch (e) {
      console.warn('Supabase saveAdminNotes notice:', e.message);
    }

    const localList = readLocalInquiries();
    const idx = localList.findIndex(item => item.id === id || item.inquiry_number === id);
    if (idx !== -1) {
      localList[idx] = {
        ...localList[idx],
        ...updatePayload,
      };
      writeLocalInquiries(localList);
      if (!updatedInquiry) {
        updatedInquiry = localList[idx];
      }
    }

    if (!updatedInquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    return res.json({
      success: true,
      message: 'Internal notes saved successfully.',
      inquiry: updatedInquiry,
    });
  } catch (error) {
    console.error('saveAdminNotes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error saving internal notes.',
      error: error.message,
    });
  }
};
