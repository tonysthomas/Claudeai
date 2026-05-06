const express = require('express');
const router = express.Router();
const taraCore = require('../agents/tara_core');
const { sendMessage } = require('../utils/messenger');

router.post('/', async (req, res) => {
  // Acknowledge immediately — Telegram requires fast 200 or it retries
  res.sendStatus(200);

  const body = req.body;

  // Handle file/document messages
  if (body.message?.document) {
    const doc = body.message.document;
    const chatId = String(body.message.chat.id);
    const fileName = doc.file_name || 'file';
    const mimeType = doc.mime_type || '';

    console.log(`[TELEGRAM] File received from ${chatId}: ${fileName}`);

    const envelope = {
      channel: 'telegram',
      chatId,
      text: '',
      fileName,
      mimeType,
      fileId: doc.file_id,
      hasFile: true,
    };

    const reply = await taraCore.handle(envelope);
    if (reply) await sendMessage('telegram', chatId, reply);
    return;
  }

  // Handle text messages
  if (body.message?.text) {
    const chatId = String(body.message.chat.id);
    const text = body.message.text.trim();

    console.log(`[TELEGRAM] Message from ${chatId}: ${text}`);

    const envelope = {
      channel: 'telegram',
      chatId,
      text,
      hasFile: false,
    };

    const reply = await taraCore.handle(envelope);
    if (reply) await sendMessage('telegram', chatId, reply);
    return;
  }

  // Ignore everything else (edits, reactions, etc.)
});

module.exports = router;
