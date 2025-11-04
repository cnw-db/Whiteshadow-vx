const { cmd } = require('../command');

const metaNumber = '13135550002@s.whatsapp.net';

cmd({
  pattern: "meta",
  desc: "Chat directly with Meta AI",
  category: "ai",
  react: "🤖",
  use: ".meta <your question>",
}, async (m, sock, { text }) => {
  try {
    if (!text) {
      return await sock.sendMessage(m.chat, {
        text: "💡 *Usage:* `.meta your question`\n\n_Example:_ `.meta who are you?`",
      }, { quoted: m });
    }

    // Send user's question to Meta AI
    await sock.sendMessage(metaNumber, { text });

    // Listen for Meta AI's reply
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
    await sock.sendMessage(m.chat, { text: "❌ Error: Meta AI not responding." }, { quoted: m });
  }
});
