import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { normalizeIndianMobile } from '../utils/phone.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default authentication folder path (can be overridden on Railway via WHATSAPP_AUTH_DIR)
const DEFAULT_AUTH_DIR = path.resolve(__dirname, '../.baileys_auth');
const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR || DEFAULT_AUTH_DIR;

// State tracking for the singleton connection
let sock = null;
let connectionState = 'disconnected'; // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
let currentQR = null;
let currentQRDataUrl = null;
let qrTimestamp = null;
let lastConnectedAt = null;
let lastMessageAt = null;
let connectedUser = null; // { id, name, phone }
let reconnectAttempts = 0;
let reconnectTimer = null;
let isInitializing = false;

// Listeners subscribed to connection state changes (e.g. notification queue)
const stateListeners = new Set();

/**
 * Safely removes all event listeners and closes the active socket instance.
 */
function cleanupCurrentSocket() {
  if (sock) {
    try {
      sock.ev.removeAllListeners('connection.update');
      sock.ev.removeAllListeners('creds.update');
      sock.ev.removeAllListeners('messages.upsert');
      sock.end(undefined);
    } catch (e) {
      // Ignore socket termination error
    }
    sock = null;
  }
}

/**
 * Register a callback for connection state changes ('connected' | 'disconnected' | 'connecting' | 'qr_ready')
 */
export function onWhatsAppStateChange(callback) {
  stateListeners.add(callback);
  return () => stateListeners.delete(callback);
}

function notifyStateChange(newState) {
  connectionState = newState;
  for (const listener of stateListeners) {
    try {
      listener(newState);
    } catch (err) {
      console.error('[WHATSAPP SERVICE] State listener error:', err.message);
    }
  }
}

/**
 * Returns the current live status of the WhatsApp singleton service.
 */
export function getWhatsAppStatus() {
  const isConnected = connectionState === 'connected' && sock !== null;
  return {
    isConnected,
    status: connectionState,
    connectedPhone: connectedUser?.phone || null,
    connectedUser: connectedUser || null,
    lastConnectedAt,
    lastMessageAt,
    reconnectAttempts,
    hasSessionAuth: fs.existsSync(path.join(AUTH_DIR, 'creds.json')),
    qr: connectionState === 'qr_ready' ? currentQR : null,
    qrDataUrl: connectionState === 'qr_ready' ? currentQRDataUrl : null,
    qrTimestamp,
    authDir: process.env.NODE_ENV === 'production' ? '[configured]' : AUTH_DIR,
  };
}

/**
 * Initializes the singleton Baileys WhatsApp connection.
 * Idempotent: safe to call multiple times without creating duplicate sockets.
 */
export async function initializeWhatsApp() {
  // If WhatsApp is disabled via environment variable, skip initialization
  if (process.env.WHATSAPP_ENABLED === 'false') {
    console.log('[WHATSAPP SERVICE] WhatsApp integration is disabled via WHATSAPP_ENABLED=false');
    notifyStateChange('disconnected');
    return null;
  }

  // Prevent concurrent connection handshakes
  if (isInitializing) {
    console.log('[WHATSAPP SERVICE] Connection initialization already in progress...');
    return sock;
  }

  if (sock && connectionState === 'connected') {
    return sock;
  }

  // Safely tear down any lingering socket before creating a fresh connection
  if (sock) {
    cleanupCurrentSocket();
  }

  isInitializing = true;
  notifyStateChange('connecting');

  try {
    // Ensure the authentication directory exists
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    console.log(`[WHATSAPP SERVICE] Initializing session from: ${path.basename(AUTH_DIR)}`);
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // Fetch latest WhatsApp Web version to prevent protocol mismatch
    let version;
    try {
      const v = await fetchLatestBaileysVersion();
      version = v.version;
    } catch (vErr) {
      // Fallback silently if offline or blocked
    }

    // Create the Baileys socket with clean logger
    sock = makeWASocket({
      version,
      logger: pino({ level: process.env.WHATSAPP_LOG_LEVEL || 'silent' }),
      auth: state,
      printQRInTerminal: false, // Managed manually below for custom terminal display & web dashboard
      markOnlineOnConnect: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    });

    // Save updated credentials whenever Baileys signals
    sock.ev.on('creds.update', saveCreds);

    // Handle connection lifecycle events
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Handle QR code generation when authentication is required
      if (qr) {
        currentQR = qr;
        qrTimestamp = new Date().toISOString();
        try {
          currentQRDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
        } catch (qrErr) {
          console.warn('[WHATSAPP SERVICE] Could not generate QR data URL:', qrErr.message);
          currentQRDataUrl = null;
        }

        notifyStateChange('qr_ready');
        console.log('\n[WHATSAPP SERVICE] 📲 QR Code generated! Scan via WhatsApp on your phone:');
        try {
          qrcodeTerminal.generate(qr, { small: true });
        } catch (tErr) {
          console.log('[WHATSAPP SERVICE] QR Raw string:', qr);
        }
      }

      if (connection === 'connecting') {
        console.log('[WHATSAPP SERVICE] Connecting to WhatsApp...');
        notifyStateChange('connecting');
      }

      if (connection === 'open') {
        reconnectAttempts = 0;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }

        currentQR = null;
        currentQRDataUrl = null;
        lastConnectedAt = new Date().toISOString();

        // Extract safely the connected phone and user details
        const rawJid = sock.user?.id || '';
        const rawPhone = rawJid.split(':')[0] || rawJid.split('@')[0];
        connectedUser = {
          id: rawJid,
          phone: rawPhone,
          name: sock.user?.name || 'MILASTY WhatsApp',
        };

        console.log(`[WHATSAPP SERVICE] ✅ WhatsApp connected successfully! Connected as: ${rawPhone}`);
        notifyStateChange('connected');
      }

      if (connection === 'close') {
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        console.warn(`[WHATSAPP SERVICE] ⚠️ Connection closed. Status code: ${statusCode}`);

        // Tear down the dead socket immediately to prevent listener leaks
        cleanupCurrentSocket();

        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (statusCode === DisconnectReason.loggedOut) {
          console.error('[WHATSAPP SERVICE] ❌ Logged out from WhatsApp. Clear auth or scan a new QR code.');
          connectedUser = null;
          notifyStateChange('disconnected');
          return;
        }

        notifyStateChange('disconnected');

        // Automatic exponential backoff reconnection
        if (shouldReconnect && !reconnectTimer) {
          reconnectAttempts += 1;
          const delayMs = Math.min(3000 * Math.pow(1.5, reconnectAttempts - 1), 60000);
          console.log(`[WHATSAPP SERVICE] Reconnecting in ${(delayMs / 1000).toFixed(1)}s (attempt ${reconnectAttempts})...`);

          reconnectTimer = setTimeout(async () => {
            reconnectTimer = null;
            try {
              await initializeWhatsApp();
            } catch (rErr) {
              console.error('[WHATSAPP SERVICE] Auto-reconnect attempt failed:', rErr.message);
            }
          }, delayMs);
        }
      }
    });

    isInitializing = false;
    return sock;
  } catch (error) {
    isInitializing = false;
    notifyStateChange('disconnected');
    console.error('[WHATSAPP SERVICE] Initialization error:', error.message);
    throw error;
  }
}

/**
 * Format any mobile input into a valid WhatsApp JID.
 * Handles Indian numbers (10 digits) with country code 91, or cleans general international digits.
 */
export function formatWhatsAppJid(phone) {
  if (!phone) return null;
  const indianDigits = normalizeIndianMobile(phone);
  if (indianDigits) {
    return `91${indianDigits}@s.whatsapp.net`;
  }
  const cleanDigits = String(phone).replace(/\D/g, '');
  if (cleanDigits.length >= 10 && cleanDigits.length <= 15) {
    return `${cleanDigits}@s.whatsapp.net`;
  }
  return null;
}

/**
 * Sends a WhatsApp text message to the specified phone number.
 * Modular interface: can easily be adapted or backed by WhatsApp Business Cloud API.
 *
 * @param {string} phone - Recipient phone number (e.g. "9876543210", "+919876543210")
 * @param {string} messageText - The message text to deliver
 * @param {object} [options] - Additional options
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export async function sendWhatsAppMessage(phone, messageText, options = {}) {
  try {
    if (!phone) {
      throw new Error('Recipient phone number is required');
    }
    if (!messageText || !messageText.trim()) {
      throw new Error('Message text cannot be empty');
    }

    const jid = formatWhatsAppJid(phone);
    if (!jid) {
      throw new Error(`Invalid mobile number format: ${phone}. Must be a valid 10-digit Indian mobile number.`);
    }

    // Ensure WhatsApp is connected
    if (!sock || connectionState !== 'connected') {
      throw new Error('WhatsApp service is currently disconnected. Message queued for delivery.');
    }

    const result = await sock.sendMessage(jid, { text: messageText }, options);
    lastMessageAt = new Date().toISOString();

    const messageId = result?.key?.id || `msg_${Date.now()}`;
    console.log(`[WHATSAPP SERVICE] 📤 Message sent successfully to ${phone} (ID: ${messageId})`);

    return {
      success: true,
      messageId,
      recipient: phone,
      jid,
      timestamp: lastMessageAt,
    };
  } catch (error) {
    console.error(`[WHATSAPP SERVICE] ❌ Failed to send message to ${phone}:`, error.message);
    return {
      success: false,
      error: error.message,
      recipient: phone,
    };
  }
}

/**
 * Checks whether a filename corresponds to a Baileys auth session file.
 * Baileys multi-file auth stores:
 *  - creds.json
 *  - app-state-sync-key-*.json
 *  - app-state-sync-version-*.json
 *  - pre-key-*.json
 *  - sender-key-*.json
 *  - sender-key-memory-*.json
 *  - session-*.json
 *  - Baileys-specific atomic write temp files (e.g. creds.json.tmp, .creds.json.tmp, .tmp-creds.json)
 *
 * NOTE: Unrelated .tmp files (e.g. cache.tmp, report.tmp) are explicitly preserved.
 */
export function isBaileysAuthFile(filename) {
  if (!filename || typeof filename !== 'string') return false;

  const baileysPrefixes = [
    'app-state-sync-key-',
    'app-state-sync-version-',
    'pre-key-',
    'session-',
    'sender-key-',
    'sender-key-memory-',
    'baileys_store',
  ];

  // Helper to check if a base name matches Baileys credential format
  const isBaileysBaseName = (name) => {
    if (!name) return false;
    const clean = name.startsWith('.') ? name.slice(1) : name;
    if (clean === 'creds.json') return true;
    if (clean.endsWith('.json')) {
      return baileysPrefixes.some((prefix) => clean.startsWith(prefix));
    }
    return false;
  };

  // Exact credentials or state JSON files
  if (isBaileysBaseName(filename)) return true;

  // Baileys atomic write temp files ending in .tmp (e.g. creds.json.tmp, .creds.json.tmp)
  if (filename.endsWith('.tmp')) {
    const baseWithoutTmp = filename.slice(0, -4);
    return isBaileysBaseName(baseWithoutTmp);
  }

  // Baileys atomic write temp files with .tmp- prefix (e.g. .tmp-creds.json)
  if (filename.startsWith('.tmp-')) {
    const baseWithoutPrefix = filename.slice(5);
    return isBaileysBaseName(baseWithoutPrefix);
  }

  return false;
}

/**
 * Safely removes only expired Baileys authentication files inside WHATSAPP_AUTH_DIR.
 * - Validates directory path using fs.realpathSync().
 * - Rejects symlinked auth directories.
 * - Preserves the directory itself (vital for persistent volume mount roots).
 * - Preserves unrelated files and system folders (e.g. lost+found, cache.tmp, .gitkeep).
 * - Protects local .baileys_auth session.
 * - Returns a clear success/failure result object: { success, deletedCount, error? }.
 */
export function clearAuthDirectory() {
  try {
    const rawTargetDir = process.env.WHATSAPP_AUTH_DIR || AUTH_DIR;
    if (!rawTargetDir || !fs.existsSync(rawTargetDir)) {
      return { success: true, deletedCount: 0, message: 'Directory does not exist; nothing to clean.' };
    }

    // Security check: reject if the auth directory path itself is a symlink
    const lstatDir = fs.lstatSync(rawTargetDir);
    if (lstatDir.isSymbolicLink()) {
      const errMsg = `Security rejection: WHATSAPP_AUTH_DIR (${rawTargetDir}) cannot be a symbolic link.`;
      console.error(`[WHATSAPP SERVICE] ${errMsg}`);
      return { success: false, deletedCount: 0, error: errMsg };
    }

    // Resolve canonical physical realpath
    let realTarget;
    try {
      realTarget = fs.realpathSync(rawTargetDir);
    } catch (realErr) {
      const errMsg = `Failed to resolve realpath for auth dir: ${realErr.message}`;
      console.error(`[WHATSAPP SERVICE] ${errMsg}`);
      return { success: false, deletedCount: 0, error: errMsg };
    }

    // Ensure resolved path is an actual directory
    const realStat = fs.statSync(realTarget);
    if (!realStat.isDirectory()) {
      const errMsg = `Security rejection: resolved WHATSAPP_AUTH_DIR (${realTarget}) is not a directory.`;
      console.error(`[WHATSAPP SERVICE] ${errMsg}`);
      return { success: false, deletedCount: 0, error: errMsg };
    }

    // Protect local developer session: resolve DEFAULT_AUTH_DIR realpath if it exists
    let realDefault = null;
    try {
      if (fs.existsSync(DEFAULT_AUTH_DIR)) {
        realDefault = fs.realpathSync(DEFAULT_AUTH_DIR);
      }
    } catch (e) {
      realDefault = path.resolve(DEFAULT_AUTH_DIR);
    }

    if (realDefault && realTarget === realDefault) {
      if (process.env.WHATSAPP_AUTH_DIR) {
        console.log('[WHATSAPP SERVICE] Preserving local .baileys_auth session; skipping local clear.');
        return { success: true, deletedCount: 0, skipped: true };
      }
      if (process.env.NODE_ENV !== 'test') {
        console.log('[WHATSAPP SERVICE] Local environment detected: preserving local .baileys_auth session.');
        return { success: true, deletedCount: 0, skipped: true };
      }
    }

    console.log(`[WHATSAPP SERVICE] Safely removing Baileys authentication files inside: ${realTarget}`);
    const entries = fs.readdirSync(realTarget);
    let deletedCount = 0;
    const deletionErrors = [];

    for (const entry of entries) {
      // Exclude Linux volume system folders, git keeps, and non-Baileys files
      if (entry === 'lost+found' || entry === '.gitkeep' || !isBaileysAuthFile(entry)) {
        continue;
      }

      const entryPath = path.join(realTarget, entry);
      const resolvedEntry = path.resolve(entryPath);

      // Strict path confinement: verify resolved entry is strictly within realTarget
      if (!resolvedEntry.startsWith(realTarget + path.sep)) {
        console.warn(`[WHATSAPP SERVICE] Path confinement violation detected for ${entry}; skipping.`);
        continue;
      }

      try {
        const stat = fs.lstatSync(resolvedEntry);
        // Never delete directories
        if (stat.isDirectory()) {
          continue;
        }
        // Only unlink Baileys session files or symlinks pointing within auth dir
        if (stat.isFile() || stat.isSymbolicLink()) {
          fs.unlinkSync(resolvedEntry);
          deletedCount += 1;
        }
      } catch (rmErr) {
        console.error(`[WHATSAPP SERVICE] Failed to delete ${entry}:`, rmErr.message);
        deletionErrors.push(`${entry}: ${rmErr.message}`);
      }
    }

    if (deletionErrors.length > 0) {
      const errMsg = `Failed to remove some credentials (${deletionErrors.length} errors): ${deletionErrors.join('; ')}`;
      return { success: false, deletedCount, error: errMsg };
    }

    console.log(`[WHATSAPP SERVICE] Cleaned ${deletedCount} Baileys auth files from ${path.basename(realTarget)}.`);
    return { success: true, deletedCount };
  } catch (err) {
    console.error('[WHATSAPP SERVICE] Failed to clean auth directory contents:', err.message);
    return { success: false, deletedCount: 0, error: err.message };
  }
}

/**
 * Disconnects the WhatsApp socket.
 * If clearAuth is true, removes stored credentials so a new number (e.g. client's number) can be linked.
 */
export async function disconnectWhatsApp(clearAuth = false) {
  console.log(`[WHATSAPP SERVICE] Disconnecting WhatsApp (clearAuth: ${clearAuth})...`);

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // Gracefully terminate active socket without touching credentials
  cleanupCurrentSocket();

  connectedUser = null;
  currentQR = null;
  currentQRDataUrl = null;
  reconnectAttempts = 0;
  notifyStateChange('disconnected');

  if (clearAuth) {
    const clearResult = clearAuthDirectory();
    if (!clearResult || clearResult.success === false) {
      const errMsg = clearResult?.error || 'Failed to delete authentication credentials during disconnect.';
      console.error(`[WHATSAPP SERVICE] Disconnect credential clearance failed: ${errMsg}`);
      throw new Error(errMsg);
    }
    return {
      success: true,
      message: 'WhatsApp disconnected and authentication session cleared successfully.',
      clearAuth: true,
      deletedCount: clearResult.deletedCount,
    };
  }

  return { success: true, message: 'WhatsApp disconnected successfully', clearAuth: false };
}

/**
 * Cleanly reconnects WhatsApp (e.g. requested by Admin).
 */
export async function reconnectWhatsApp() {
  console.log('[WHATSAPP SERVICE] Admin requested manual reconnect...');
  await disconnectWhatsApp(false);
  return initializeWhatsApp();
}

// Concurrency mutex lock to prevent simultaneous clear operations from creating duplicate sockets
let activeClearPromise = null;

/**
 * Clears stored authentication session and immediately re-initializes
 * the socket to generate a fresh QR code for pairing.
 * Concurrent requests safely join the existing in-flight operation.
 * If credential deletion fails, aborts socket restart and reports failure.
 */
export async function clearSessionAndRestart() {
  if (activeClearPromise) {
    console.log('[WHATSAPP SERVICE] Clear session already in progress. Joining in-flight operation...');
    return activeClearPromise;
  }

  activeClearPromise = (async () => {
    console.log('[WHATSAPP SERVICE] Admin requested Clear Session & Restart...');
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    isInitializing = false;
    cleanupCurrentSocket();
    connectedUser = null;
    currentQR = null;
    currentQRDataUrl = null;
    reconnectAttempts = 0;

    const clearResult = clearAuthDirectory();
    if (!clearResult || clearResult.success === false) {
      const errMsg = clearResult?.error || 'Failed to clear session authentication files.';
      console.error(`[WHATSAPP SERVICE] Clear session aborted: ${errMsg}`);
      notifyStateChange('disconnected');
      throw new Error(errMsg);
    }

    notifyStateChange('connecting');
    return initializeWhatsApp();
  })();

  try {
    return await activeClearPromise;
  } finally {
    activeClearPromise = null;
  }
}

// ─── Graceful Shutdown Handlers ──────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`[WHATSAPP SERVICE] Received ${signal}. Closing WhatsApp connection gracefully...`);
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (sock) {
    try {
      sock.end(undefined);
    } catch (e) {}
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
