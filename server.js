require('dotenv').config();
const express = require('express');
const config = require('./config');
const telegramWebhook = require('./webhooks/telegram');
const whatsappWebhook = require('./webhooks/whatsapp');

const app = express();

// Parse JSON bodies (Telegram and WhatsApp both send JSON)
app.use(express.json());

// ─── Webhook Routes ───────────────────────────────────────────────────────────
app.use('/webhook/telegram', telegramWebhook);
app.use('/webhook/whatsapp', whatsappWebhook);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'TARA v2.0',
    org: config.org.name,
    session: 1,
    channels: {
      telegram: !!config.telegram.botToken,
      whatsapp: !!(config.whatsapp.accessToken && config.whatsapp.phoneNumberId),
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('TARA v2.0 — Training Analytics & Resource Agent. Server running.');
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   TARA v2.0 — Training Analytics Agent  ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  Organisation : ${config.org.name}`);
  console.log(`  Port         : ${config.port}`);
  console.log(`  Telegram     : ${config.telegram.botToken ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`  WhatsApp     : ${config.whatsapp.accessToken ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log('');
  console.log(`  Webhook endpoints:`);
  console.log(`  POST /webhook/telegram`);
  console.log(`  POST /webhook/whatsapp`);
  console.log(`  GET  /webhook/whatsapp  (Meta verification)`);
  console.log(`  GET  /health`);
  console.log('');
  console.log('  Session 1 — Messaging layer active ✅');
  console.log('');
});
