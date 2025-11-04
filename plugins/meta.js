const { cmd } = require('../command');

// Meta AI number
const metaNumber = '13135550002@s.whatsapp.net';

// Mode state memory
let metaMode = false;

// 🟢 Function to check mode status (exported)
function isMetaOn() {
  return metaMode;
}

// ⚙️ Command: .meta on / .meta off
cmd({
  pattern: "meta",
  desc: "Enable or disable Meta AI Auto Chat mode",
  react: "🤖",
  category: "ai",
  use: ".meta on / .meta off",
}, async (m, sock, { text }) => {
  if (!text) {
    return await sock.sendMessage(m.chat, {
      text: `⚙️ *Meta AI Mode:* ${metaMode ? "✅ ON" : "❌ OFF"}\n\n_Use:_ *.meta on* or *.meta off*`,
    }, { quoted: m });
  }

  if (text.toLowerCase() === "on") {
    metaMode = true;
    await sock.sendMessage(m.chat, { text: "🤖 Meta AI Mode Activated!" }, { quoted: m });
  } else if (text.toLowerCase() === "off") {
    metaMode = false;
    await sock.sendMessage(m.chat, { text: "🛑 Meta AI Mode Deactivated!" }, { quoted: m });
  } else {
    await sock.sendMessage(m.chat, { text: "❗ Invalid usage.\nUse: *.meta on* or *.meta off*" }, { quoted: m });
  }
});

// ⚡ Auto-forward system
cmd({
  pattern: "meta-auto",
  desc: "Auto forward user messages to Meta AI (if enabled)",
  dontAddCommandList: true, // hidden command
}, async (m, sock) => {
  try {
    const msg = m;
    if (!msg.message) return;

    const userText = msg.message.conversation || msg.message?.extendedTextMessage?.text;
    if (!userText) return;

    // Only forward when mode is ON
    if (isMetaOn() && msg.key.remoteJid !== metaNumber && !msg.key.fromMe) {
      await sock.sendMessage(metaNumber, { text: userText });

      sock.ev.on('messages.upsert', async (metaResp) => {
        try {
          const metaMsg = metaResp.messages[0];
          if (metaMsg.key.remoteJid === metaNumber && !metaMsg.key.fromMe) {
            const metaReply = metaMsg.message?.conversation || metaMsg.message?.extendedTextMessage?.text;
            if (metaReply) {
              await sock.sendMessage(msg.key.remoteJid, {
                text: `🤖 *Meta AI:* ${metaReply}`,
              }, { quoted: msg });
            }
          }
        } catch (err) {
          console.log('Meta AI reply error:', err);
        }
      });
    }
  } catch (err) {
    console.log('Meta Auto error:', err);
  }
});

module.exports = { isMetaOn };
