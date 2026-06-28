import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import express from 'express';
import cors from 'cors';

const PORT = 3005;
let sock = null;
let connectionState = 'disconnected'; // disconnected, connecting, connected, qr_ready
let qrCodeData = null;
let messageQueue = [];

// Suppress Baileys default logging
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

async function getAuthState() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth/session');
  return { state, saveCreds };
}

async function connectWhatsApp() {
  try {
    const { state, saveCreds } = await getAuthState();
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: {
        level: 'silent',
        child: () => ({ level: 'silent' }),
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
        trace: () => {},
        fatal: () => {},
      },
      browser: ['Library MS', 'Chrome', '1.0.0'],
      // Mobile-friendly options
      markOnlineOnConnect: false,
      retryRequestDelayMs: 2000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      emitOwnEvents: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Generate QR code as data URL
        QRCode.toDataURL(qr, { width: 256, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
          .then((url) => {
            qrCodeData = url;
            connectionState = 'qr_ready';
          })
          .catch(() => {
            qrCodeData = null;
            connectionState = 'qr_ready';
          });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        if (statusCode === DisconnectReason.loggedOut) {
          connectionState = 'disconnected';
          qrCodeData = null;
          sock = null;
        } else {
          // Reconnect on other disconnects
          connectionState = 'disconnected';
          qrCodeData = null;
          setTimeout(() => connectWhatsApp(), 5000);
        }
      }

      if (connection === 'open') {
        connectionState = 'connected';
        qrCodeData = null;
        // Process any queued messages
        processQueue();
      }
    });

    connectionState = 'connecting';
  } catch (error) {
    connectionState = 'disconnected';
    console.error('Failed to initialize WhatsApp:', error?.message || error);
  }
}

async function processQueue() {
  while (messageQueue.length > 0 && connectionState === 'connected' && sock) {
    const item = messageQueue.shift();
    try {
      const jid = formatPhone(item.phone);
      await sock.sendMessage(jid, { text: item.message });
      item.resolve({ success: true, phone: item.phone, timestamp: new Date().toISOString() });
    } catch (error) {
      item.resolve({ success: false, phone: item.phone, error: error?.message || 'Send failed' });
    }
  }
}

function formatPhone(phone) {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  // Remove leading 0 or country code variations
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.substring(2);
  } else if (digits.startsWith('+91')) {
    digits = digits.substring(3);
  } else if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  // Must be 10 digits for Indian numbers
  if (digits.length === 10) {
    return `91${digits}@s.whatsapp.net`;
  }
  // Fallback: assume it's already in international format
  return `${digits}@s.whatsapp.net`;
}

// Express server
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// GET /status
app.get('/status', (req, res) => {
  res.json({
    status: connectionState,
    connected: connectionState === 'connected',
    qrCode: connectionState === 'qr_ready' ? qrCodeData : null,
  });
});

// POST /status - request QR / initiate connection
app.post('/status', (req, res) => {
  if (connectionState === 'connected') {
    return res.json({ status: 'connected', connected: true, qrCode: null, message: 'Already connected' });
  }
  if (connectionState === 'connecting' || connectionState === 'qr_ready') {
    return res.json({ status: connectionState, connected: false, qrCode: qrCodeData, message: 'Connection in progress' });
  }
  // Start new connection
  connectWhatsApp();
  res.json({ status: 'connecting', connected: false, message: 'Connecting...' });
});

// DELETE /status - disconnect
app.delete('/status', async (req, res) => {
  if (sock) {
    try {
      sock.end(new Error('User disconnected'));
    } catch (e) {
      // ignore
    }
    sock = null;
  }
  connectionState = 'disconnected';
  qrCodeData = null;
  messageQueue = [];
  res.json({ status: 'disconnected', message: 'Disconnected successfully' });
});

// POST /send - send a single message
app.post('/send', async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'phone and message are required' });
  }

  if (connectionState !== 'connected' || !sock) {
    return res.status(503).json({ error: 'WhatsApp is not connected. Please connect first.' });
  }

  try {
    const jid = formatPhone(phone);
    const result = await sock.sendMessage(jid, { text: message });
    res.json({
      success: true,
      phone,
      messageId: result?.key?.id || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error?.message || 'Failed to send message' });
  }
});

// POST /send-bulk - send messages to multiple numbers
app.post('/send-bulk', async (req, res) => {
  const { messages } = req.body; // [{ phone, message }]

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  if (connectionState !== 'connected' || !sock) {
    return res.status(503).json({ error: 'WhatsApp is not connected' });
  }

  const results = [];
  for (const item of messages) {
    try {
      const jid = formatPhone(item.phone);
      await sock.sendMessage(jid, { text: item.message });
      results.push({ phone: item.phone, success: true });
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      results.push({ phone: item.phone, success: false, error: error?.message });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  res.json({
    total: messages.length,
    sent: successCount,
    failed: messages.length - successCount,
    results,
  });
});

app.listen(PORT, () => {
  console.log(`WhatsApp service running on port ${PORT}`);

  // Auto-reconnect if we have a saved session
  getAuthState().then(({ state }) => {
    // If we have creds, try to auto-connect
    if (state.creds?.registered) {
      connectWhatsApp();
    }
  }).catch(() => {});
});