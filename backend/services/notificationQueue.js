import { supabase } from '../config/supabase.js';
import {
  sendWhatsAppMessage,
  getWhatsAppStatus,
  onWhatsAppStateChange
} from './whatsappService.js';
import { normalizeIndianMobile } from '../utils/phone.js';

// In-memory queue & state fallback (handles operations before DB migration is run)
const inMemoryQueue = [];
const inMemoryHistory = [];
const processedIdempotencyKeys = new Set();
let isProcessing = false;
let dbTableAvailable = null; // null = unverified, true = exists in Supabase, false = table missing

/**
 * Check if the whatsapp_notifications table exists in Supabase
 */
async function checkTableAvailability() {
  if (dbTableAvailable !== null) return dbTableAvailable;
  try {
    const { error } = await supabase
      .from('whatsapp_notifications')
      .select('id')
      .limit(1);

    if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache'))) {
      dbTableAvailable = false;
      console.log('[NOTIFICATION QUEUE] DB table whatsapp_notifications not found. Operating with in-memory persistence.');
    } else {
      dbTableAvailable = true;
      console.log('[NOTIFICATION QUEUE] Connected to Supabase whatsapp_notifications table.');
    }
  } catch (e) {
    dbTableAvailable = false;
  }
  return dbTableAvailable;
}

/**
 * MSG91 SMS Fallback Handler
 * Sends an SMS through MSG91 if WhatsApp delivery fails or is disconnected.
 */
async function sendMsg91SmsFallback(phone, messageBody, metadata = {}) {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    return { success: false, reason: 'MSG91_AUTH_KEY not configured' };
  }

  const cleanPhone = normalizeIndianMobile(phone);
  if (!cleanPhone) {
    return { success: false, reason: 'Invalid Indian phone number' };
  }

  try {
    const templateId = metadata?.templateId || process.env.MSG91_TEMPLATE_ID;
    const senderId = process.env.MSG91_SENDER_ID || 'MLASTY';

    console.log(`[MSG91 FALLBACK] Attempting SMS fallback to ${cleanPhone}...`);

    let response;
    if (templateId) {
      // Flow / Template API
      response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: authKey,
        },
        body: JSON.stringify({
          template_id: templateId,
          short_url: '0',
          recipients: [
            {
              mobiles: `91${cleanPhone}`,
              message: messageBody,
              ...(metadata.variables || {}),
            },
          ],
        }),
      });
    } else {
      // Standard SMS endpoint fallback
      response = await fetch('https://api.msg91.com/api/v2/sendsms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: authKey,
        },
        body: JSON.stringify({
          sender: senderId,
          route: '4', // Transactional route
          country: '91',
          sms: [
            {
              message: messageBody,
              to: [cleanPhone],
            },
          ],
        }),
      });
    }

    const data = await response.json().catch(() => ({}));
    if (response.ok && data.type !== 'error') {
      console.log(`[MSG91 FALLBACK] ✅ SMS delivered successfully to ${cleanPhone}`);
      return { success: true, response: data };
    } else {
      console.warn(`[MSG91 FALLBACK] ⚠️ MSG91 returned error:`, data);
      return { success: false, error: data.message || 'MSG91 API error' };
    }
  } catch (err) {
    console.error('[MSG91 FALLBACK] Exception sending SMS:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Enqueue a notification for asynchronous, non-blocking delivery.
 *
 * @param {object} params
 * @param {string} params.recipientPhone - Recipient phone number
 * @param {string} params.eventType - e.g. 'order_confirmed', 'signup_otp', 'order_shipped'
 * @param {string} [params.referenceId] - e.g. order number (MIL-123456)
 * @param {string} [params.idempotencyKey] - Unique key to prevent duplicates
 * @param {string} params.messageBody - The plain text message
 * @param {object} [params.metadata] - Extra data (variables, etc.)
 * @param {boolean} [params.allowSmsFallback=true] - Fall back to SMS if WhatsApp unavailable
 * @returns {Promise<{ queued: boolean, duplicate?: boolean, id?: string }>}
 */
export async function enqueueNotification({
  recipientPhone,
  eventType,
  referenceId = null,
  idempotencyKey = null,
  messageBody,
  metadata = {},
  allowSmsFallback = true,
}) {
  try {
    if (!recipientPhone || !messageBody) {
      console.warn('[NOTIFICATION QUEUE] Missing phone or messageBody for notification.');
      return { queued: false, error: 'recipientPhone and messageBody are required' };
    }

    // Build default idempotency key if not explicitly given
    const key = idempotencyKey || (referenceId ? `${eventType}:${referenceId}` : null);

    // 1. Immediate synchronous deduplication lock (closes concurrency window)
    if (key) {
      if (processedIdempotencyKeys.has(key)) {
        console.log(`[NOTIFICATION QUEUE] 🛡️ Duplicate suppressed by memory lock for key: ${key}`);
        return { queued: false, duplicate: true, idempotencyKey: key };
      }
      processedIdempotencyKeys.add(key);
    }

    const hasDb = await checkTableAvailability();

    // 2. Database deduplication check (if table exists)
    if (hasDb && key) {
      const { data: existing } = await supabase
        .from('whatsapp_notifications')
        .select('id, status')
        .eq('idempotency_key', key)
        .maybeSingle();

      if (existing) {
        console.log(`[NOTIFICATION QUEUE] 🛡️ Database duplicate suppressed for key: ${key} (status: ${existing.status})`);
        return { queued: false, duplicate: true, id: existing.id, status: existing.status };
      }
    }

    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recipient_phone: recipientPhone,
      event_type: eventType,
      reference_id: referenceId,
      idempotency_key: key,
      message_body: messageBody,
      status: 'pending',
      attempts: 0,
      max_attempts: 3,
      sent_via: 'whatsapp',
      allow_sms_fallback: allowSmsFallback,
      metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Persist to Supabase if table is ready
    if (hasDb) {
      const { data: inserted, error: insertErr } = await supabase
        .from('whatsapp_notifications')
        .insert([{
          recipient_phone: job.recipient_phone,
          event_type: job.event_type,
          reference_id: job.reference_id,
          idempotency_key: job.idempotency_key,
          message_body: job.message_body,
          status: 'pending',
          attempts: 0,
          max_attempts: job.max_attempts,
          sent_via: 'whatsapp',
          metadata: job.metadata,
        }])
        .select('id')
        .single();

      if (insertErr) {
        // Handle PostgreSQL unique constraint violation on idempotency_key (code 23505)
        if (insertErr.code === '23505' || insertErr.message?.includes('duplicate key') || insertErr.message?.includes('unique constraint')) {
          console.log(`[NOTIFICATION QUEUE] 🛡️ Database unique constraint caught duplicate key: ${key}`);
          return { queued: false, duplicate: true, idempotencyKey: key };
        }
        console.warn('[NOTIFICATION QUEUE] DB notification insert notice:', insertErr.message);
      } else if (inserted?.id) {
        job.id = inserted.id;
      }
    }

    // Add to in-memory processing queue
    inMemoryQueue.push(job);
    inMemoryHistory.unshift(job);
    if (inMemoryHistory.length > 500) inMemoryHistory.pop();

    console.log(`[NOTIFICATION QUEUE] 📥 Enqueued notification for ${recipientPhone} [${eventType}] (Job ID: ${job.id})`);

    // Trigger queue processing asynchronously (non-blocking)
    setImmediate(() => {
      processQueue().catch((err) => console.error('[NOTIFICATION QUEUE] Process queue error:', err.message));
    });

    return { queued: true, id: job.id };
  } catch (error) {
    console.error('[NOTIFICATION QUEUE] Failed to enqueue notification:', error.message);
    return { queued: false, error: error.message };
  }
}

/**
 * Worker: iterates and processes items in the notification queue.
 */
async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    while (inMemoryQueue.length > 0) {
      const job = inMemoryQueue[0];
      const status = getWhatsAppStatus();

      // If WhatsApp is offline and retry attempts are remaining
      if (!status.isConnected) {
        // Check if SMS fallback is enabled and we should fallback immediately or retry
        if (job.allow_sms_fallback && process.env.MSG91_AUTH_KEY) {
          console.log(`[NOTIFICATION QUEUE] WhatsApp disconnected. Routing job ${job.id} to MSG91 fallback...`);
          const smsResult = await sendMsg91SmsFallback(job.recipient_phone, job.message_body, job.metadata);
          if (smsResult.success) {
            await finalizeJob(job, 'sent', null, 'sms_msg91');
            inMemoryQueue.shift();
            continue;
          }
        }

        console.log(`[NOTIFICATION QUEUE] ⏸️ WhatsApp offline. Pausing queue dispatch (${inMemoryQueue.length} jobs pending).`);
        break; // Pause until WhatsApp is reconnected
      }

      job.attempts += 1;
      const sendResult = await sendWhatsAppMessage(job.recipient_phone, job.message_body);

      if (sendResult.success) {
        await finalizeJob(job, 'sent', null, 'whatsapp');
        inMemoryQueue.shift();
      } else {
        // Sending failed
        if (job.attempts >= job.max_attempts) {
          // Attempt SMS fallback as final safety net if available
          if (job.allow_sms_fallback && process.env.MSG91_AUTH_KEY) {
            console.log(`[NOTIFICATION QUEUE] Max WhatsApp attempts reached. Trying final MSG91 fallback for ${job.id}...`);
            const smsResult = await sendMsg91SmsFallback(job.recipient_phone, job.message_body, job.metadata);
            if (smsResult.success) {
              await finalizeJob(job, 'sent', null, 'sms_msg91');
              inMemoryQueue.shift();
              continue;
            }
          }

          console.error(`[NOTIFICATION QUEUE] ❌ Job ${job.id} permanently failed after ${job.attempts} attempts: ${sendResult.error}`);
          await finalizeJob(job, 'failed', sendResult.error, 'whatsapp');
          inMemoryQueue.shift();
        } else {
          // Backoff before retrying
          console.warn(`[NOTIFICATION QUEUE] ⚠️ Job ${job.id} attempt ${job.attempts} failed: ${sendResult.error}. Will retry.`);
          await new Promise((resolve) => setTimeout(resolve, 2000 * job.attempts));
        }
      }

      // Polite throttling between messages to avoid WhatsApp spam triggers
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Record job finalization in memory and database.
 */
async function finalizeJob(job, status, errorMessage = null, sentVia = 'whatsapp') {
  job.status = status;
  job.last_error = errorMessage;
  job.sent_via = sentVia;
  job.sent_at = status === 'sent' ? new Date().toISOString() : null;
  job.updated_at = new Date().toISOString();

  const hasDb = await checkTableAvailability();
  if (hasDb && job.id && !String(job.id).startsWith('job_')) {
    try {
      await supabase
        .from('whatsapp_notifications')
        .update({
          status: job.status,
          attempts: job.attempts,
          last_error: job.last_error,
          sent_via: job.sent_via,
          sent_at: job.sent_at,
          updated_at: job.updated_at,
        })
        .eq('id', job.id);
    } catch (e) {
      // In-memory fallback is active
    }
  }
}

// Automatically wake up and process queue when WhatsApp connects
onWhatsAppStateChange((newState) => {
  if (newState === 'connected') {
    console.log('[NOTIFICATION QUEUE] ⚡ WhatsApp connected. Flushing pending notification queue...');
    setImmediate(() => {
      processQueue().catch((err) => console.error('[NOTIFICATION QUEUE] Wakeup flush error:', err.message));
    });
  }
});

/**
 * Retrieve recent notification history for Admin Panel.
 */
export async function getNotificationHistory({ limit = 50, offset = 0, status = null, eventType = null } = {}) {
  const hasDb = await checkTableAvailability();
  if (hasDb) {
    try {
      let query = supabase
        .from('whatsapp_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq('status', status);
      if (eventType) query = query.eq('event_type', eventType);

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      // Fallback to in-memory
    }
  }

  // In-memory history slice
  let filtered = [...inMemoryHistory];
  if (status) filtered = filtered.filter((item) => item.status === status);
  if (eventType) filtered = filtered.filter((item) => item.event_type === eventType);
  return filtered.slice(offset, offset + limit);
}

/**
 * Returns summary statistics of the notification queue.
 */
export async function getQueueStats() {
  const hasDb = await checkTableAvailability();
  let dbCounts = null;

  if (hasDb) {
    try {
      const [totalRes, sentRes, failedRes, pendingRes] = await Promise.all([
        supabase.from('whatsapp_notifications').select('id', { count: 'exact', head: true }),
        supabase.from('whatsapp_notifications').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('whatsapp_notifications').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
        supabase.from('whatsapp_notifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      dbCounts = {
        total: totalRes.count || 0,
        sent: sentRes.count || 0,
        failed: failedRes.count || 0,
        pending: pendingRes.count || 0,
      };
    } catch (e) {}
  }

  return {
    queueLength: inMemoryQueue.length,
    isProcessing,
    dbTableAvailable: hasDb,
    inMemoryCounts: {
      total: inMemoryHistory.length,
      sent: inMemoryHistory.filter((i) => i.status === 'sent').length,
      failed: inMemoryHistory.filter((i) => i.status === 'failed').length,
      pending: inMemoryQueue.length,
    },
    counts: dbCounts || {
      total: inMemoryHistory.length,
      sent: inMemoryHistory.filter((i) => i.status === 'sent').length,
      failed: inMemoryHistory.filter((i) => i.status === 'failed').length,
      pending: inMemoryQueue.length,
    },
  };
}

/**
 * Recovers pending and interrupted notification jobs from the Supabase database.
 * Executed automatically on server startup or when reconnecting.
 */
export async function recoverPendingJobs() {
  const hasDb = await checkTableAvailability();
  if (!hasDb) {
    return { recovered: 0, reason: 'database_table_not_available' };
  }

  try {
    const { data: pendingRows, error } = await supabase
      .from('whatsapp_notifications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      console.warn('[NOTIFICATION QUEUE] Could not fetch pending jobs for recovery:', error.message);
      return { recovered: 0, error: error.message };
    }

    if (!pendingRows || pendingRows.length === 0) {
      return { recovered: 0 };
    }

    let recoveredCount = 0;
    const queuedIds = new Set(inMemoryQueue.map((j) => j.id));

    for (const row of pendingRows) {
      if (queuedIds.has(row.id)) continue;

      if (row.idempotency_key) {
        processedIdempotencyKeys.add(row.idempotency_key);
      }

      const job = {
        id: row.id,
        recipient_phone: row.recipient_phone,
        event_type: row.event_type,
        reference_id: row.reference_id,
        idempotency_key: row.idempotency_key,
        message_body: row.message_body,
        status: 'pending',
        attempts: row.attempts || 0,
        max_attempts: row.max_attempts || 3,
        sent_via: row.sent_via || 'whatsapp',
        allow_sms_fallback: true,
        metadata: row.metadata || {},
        created_at: row.created_at,
        updated_at: row.updated_at,
      };

      inMemoryQueue.push(job);
      inMemoryHistory.unshift(job);
      queuedIds.add(row.id);
      recoveredCount++;
    }

    if (recoveredCount > 0) {
      console.log(`[NOTIFICATION QUEUE] 🔄 Restored ${recoveredCount} pending notifications from database.`);
      const status = getWhatsAppStatus();
      if (status.isConnected) {
        setImmediate(() => {
          processQueue().catch((err) => console.error('[NOTIFICATION QUEUE] Recovery flush error:', err.message));
        });
      }
    }

    return { recovered: recoveredCount };
  } catch (err) {
    console.error('[NOTIFICATION QUEUE] Exception during recoverPendingJobs:', err.message);
    return { recovered: 0, error: err.message };
  }
}

/**
 * Expose in-memory queue and history for admin dashboard fallback when database table is pending.
 */
export function getQueueMemoryState() {
  return {
    pendingQueue: [...inMemoryQueue],
    history: [...inMemoryHistory],
  };
}
