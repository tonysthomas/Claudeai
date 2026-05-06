const express = require('express');
const router = express.Router();
const config = require('../config');
const taraCore = require('../agents/tara_core');
const { sendMessage } = require('../utils/messenger');

// Meta webhook verification (one-time setup handshake)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('[WHATSAPP] Webhook verified by Meta ✅');
    res.status(200).send(challenge);
  } else {
    console.warn('[WHATSAPP] Webhook verification failed — token mismatch');
    res.sendStatus(403);
  }
});

// Incoming messages from Meta
router.post('/', async (req, res) => {
  // Acknowledge immediately — Meta requires fast 200 or it retries
  res.sendStatus(200);

  const body = req.body;

  if (body.object !== 'whatsapp_business_account') return;

  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const messages = value?.messages;

  if (!messages || messages.length === 0) return;

  const message = messages[0];
  const from = message.from; // sender's phone number

  // Text message
  if (message.type === 'text') {
    const text = message.text?.body?.trim() || '';
    console.log(`[WHATSAPP] Message from ${from}: ${text}`);

    const envelope = {
      channel: 'whatsapp',
      chatId: from,
      text,
      hasFile: false,
    };

    const reply = await taraCore.handle(envelope);
    if (reply) await sendMessage('whatsapp', from, reply);
    return;
  }

  // Document/file message
  if (message.type === 'document') {
    const doc = message.document;
    const fileName = doc.filename || 'file';
    const mimeType = doc.mime_type || '';

    console.log(`[WHATSAPP] File received from ${from}: ${fileName}`);

    const envelope = {
      channel: 'whatsapp',
      chatId: from,
      text: '',
      fileName,
      mimeType,
      fileId: doc.id,
      hasFile: true,
    };

    const reply = await taraCore.handle(envelope);
    if (reply) await sendMessage('whatsapp', from, reply);
    return;
  }
});

module.exports = router;
