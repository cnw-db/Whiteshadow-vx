const { cmd } = require('../command');

// Meta AI bot number
const metaNumber = '13135550002@s.whatsapp.net';

// Mode memory
let metaMode = false;

// Function to check status
function isMetaOn() {
  return metaMode;
}

// Main command
cmd({
  pattern: "meta",
  desc: "Talk with Meta AI or toggle AI mode",
  category: "ai",
  react: "🤖",
  use: ".meta [on/off/question]",
}, async (m, sock, { text }) => {
  try {
    // 1️⃣ No text → show help/status
    if (!text) {
      return await sock.sendMessage(m.chat, {
        text: `⚙️ *Meta AI Mode:* ${metaMode ? "✅ ON" : "❌ OFF"}\n\n🧠 *Usage:*\n.meta on → Activate Meta AI\n.meta off → Deactivate Meta AI\n.meta <question> → Ask Meta AI`,
      }, { quoted: m });
    }

    const lower = text.toLowerCase();

    // 2️⃣ Turn mode on/off
    if (lower === "on") {
      metaMode = true;
      return await sock.sendMessage(m.chat, { text: "✅ *Meta AI Mode Activated!*" }, { quoted: m });
    }
    if (lower === "off") {
      metaMode = false;
      return await sock.sendMessage(m.chat, { text: "🛑 *Meta AI Mode Deactivated!*" }, { quoted: m });
    }

    // 3️⃣ Ask question directly
    const question = text.trim();
    if (!question) return;

    // Send question to Meta AI number
    await sock.sendMessage(metaNumber, { text: question });

    // Wait for Meta AI reply
    sock.ev.on('messages.upsert', async (resp) => {
      try {
        const metaMsg = resp.messages[0];
        if (
          metaMsg.key.remoteJid === metaNumber &&
          !metaMsg.key.fromMe &&
          (metaMsg.message?.conversation || metaMsg.message?.extendedTextMessage?.text)
        ) {
          const metaReply = metaMsg.message.conversation || metaMsg.message.extendedTextMessage.text;
          await sock.sendMessage(m.chat, {
            text: `🤖 *Meta AI:* ${metaReply}`,
          }, { quoted: m });
        }
      } catch (err) {
        console.error("Meta AI reply error:", err);
      }
    });

  } catch (err) {
    console.error("Meta Command Error:", err);
  }
});

module.exports = { isMetaOn };
