const axios = require('axios');
const config = require('../config');

/**
 * Send a text message back to the user on the channel they used.
 * @param {string} channel  'telegram' | 'whatsapp'
 * @param {string} chatId   Telegram chat.id  OR  WhatsApp phone number (e.g. "971501234567")
 * @param {string} text     Message to send
 */
async function sendMessage(channel, chatId, text) {
  if (channel === 'telegram') {
    return sendTelegram(chatId, text);
  }
  if (channel === 'whatsapp') {
    return sendWhatsApp(chatId, text);
  }
  console.error(`[MESSENGER] Unknown channel: ${channel}`);
}

async function sendTelegram(chatId, text) {
  if (!config.telegram.botToken) {
    console.warn('[MESSENGER] Telegram token not configured — message not sent');
    return;
  }
  const url = `${config.telegram.apiBase}/bot${config.telegram.botToken}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    });
    console.log(`[MESSENGER] Telegram → ${chatId}`);
  } catch (err) {
    console.error('[MESSENGER] Telegram send failed:', err.response?.data || err.message);
  }
}

async function sendWhatsApp(to, text) {
  if (!config.whatsapp.accessToken || !config.whatsapp.phoneNumberId) {
    console.warn('[MESSENGER] WhatsApp not configured — message not sent');
    return;
  }
  const url = `${config.whatsapp.apiBase}/${config.whatsapp.phoneNumberId}/messages`;
  try {
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${config.whatsapp.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[MESSENGER] WhatsApp → ${to}`);
  } catch (err) {
    console.error('[MESSENGER] WhatsApp send failed:', err.response?.data || err.message);
  }
}

module.exports = { sendMessage };
