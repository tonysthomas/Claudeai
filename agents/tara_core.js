const config = require('../config');

/**
 * TARA CORE — Session 1 stub.
 * Receives a normalised message envelope and returns a response string.
 * Full AI routing and agent orchestration added in Session 2.
 *
 * Envelope shape:
 * {
 *   channel:  'telegram' | 'whatsapp'
 *   chatId:   string
 *   text:     string
 *   hasFile:  boolean
 *   fileName: string   (if hasFile)
 *   mimeType: string   (if hasFile)
 *   fileId:   string   (if hasFile — platform file reference)
 * }
 */
async function handle(envelope) {
  const { channel, chatId, text, hasFile, fileName } = envelope;

  console.log(`[TARA CORE] Envelope received — channel: ${channel} | chatId: ${chatId} | hasFile: ${hasFile}`);

  // File received
  if (hasFile) {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    const isData = ['csv', 'xlsx', 'xls'].includes(ext);

    if (isData) {
      return (
        `✅ *TARA received your file: ${fileName}*\n\n` +
        `I can see this is a data file. Once we complete the full build, ` +
        `I will parse this, run categorisation, and send you the full Gap Analysis.\n\n` +
        `_Session 1 complete — data processing activates in Session 4._`
      );
    }

    return (
      `✅ *TARA received: ${fileName}*\n\n` +
      `File noted. Full processing activates in a later session.`
    );
  }

  // /start command (Telegram onboarding)
  if (text === '/start') {
    return (
      `👋 *Hello — I'm TARA.*\n\n` +
      `I'm your AI Chief of Training for *${config.org.name}*.\n\n` +
      `I connect training engagement to commercial performance — ` +
      `identifying skill gaps, proving ROI, and generating coaching briefs automatically.\n\n` +
      `*What I can do once fully configured:*\n` +
      `• Analyse your training vs ${config.org.primaryKpi} data\n` +
      `• Categorise every employee into performance tiers\n` +
      `• Generate GROW coaching briefs per individual\n` +
      `• Send you a Gap Analysis presentation\n\n` +
      `Send me a CSV file or ask me anything to get started.\n\n` +
      `_TARA v2.0 — Session 1 active. Full build in progress._`
    );
  }

  // Help command
  if (text === '/help' || text.toLowerCase() === 'help') {
    return (
      `*TARA — Available Commands*\n\n` +
      `📊 Send a CSV/XLSX file → I will analyse training & performance data\n` +
      `💬 Ask me anything → I will diagnose, recommend, and generate outputs\n\n` +
      `*Coming in full build:*\n` +
      `/roi — Prove training ROI in ${config.org.currency}\n` +
      `/alerts — See who is at risk right now\n` +
      `/coaching — Generate GROW briefs for your team\n` +
      `/gaps — Full skill gap analysis\n` +
      `/pulse — Who has dropped off training\n\n` +
      `_TARA v2.0 — Session 1 active._`
    );
  }

  // Status command
  if (text === '/status') {
    return (
      `*TARA System Status*\n\n` +
      `🟢 Messaging layer: Active\n` +
      `🟡 AI processing: Session 2 (pending)\n` +
      `🟡 Data parser: Session 4 (pending)\n` +
      `🟡 Analytics engine: Session 5 (pending)\n` +
      `🟡 Dashboard: Session 3 (pending)\n\n` +
      `Organisation: *${config.org.name}*\n` +
      `Primary KPI: *${config.org.primaryKpi}*\n` +
      `Currency: *${config.org.currency}*`
    );
  }

  // Default echo — any other text
  if (text) {
    return (
      `✅ *TARA received your message.*\n\n` +
      `_"${text}"_\n\n` +
      `Full AI processing activates in Session 2. ` +
      `Right now I can confirm the messaging layer is working correctly.\n\n` +
      `Try /help or /status to see what's available.`
    );
  }

  return null;
}

module.exports = { handle };
