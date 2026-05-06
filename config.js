require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT) || 3000,

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    apiBase: 'https://api.telegram.org',
  },

  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'tara_verify',
    apiBase: 'https://graph.facebook.com/v19.0',
  },

  org: {
    name: process.env.ORG_NAME || 'Organisation',
    primaryKpi: process.env.ORG_PRIMARY_KPI || 'Revenue',
    currency: process.env.ORG_CURRENCY || 'AED',
  },
};

function validate() {
  const warnings = [];
  if (!config.telegram.botToken) warnings.push('TELEGRAM_BOT_TOKEN not set — Telegram disabled');
  if (!config.whatsapp.phoneNumberId) warnings.push('WHATSAPP_PHONE_NUMBER_ID not set — WhatsApp disabled');
  if (!config.whatsapp.accessToken) warnings.push('WHATSAPP_ACCESS_TOKEN not set — WhatsApp disabled');
  if (!config.anthropic.apiKey) warnings.push('ANTHROPIC_API_KEY not set — AI responses disabled');
  warnings.forEach(w => console.warn(`[CONFIG] ⚠️  ${w}`));
}

validate();

module.exports = config;
