const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "ai3",
  alias: ["whiteshadowai", "chat3"],
  desc: "Chat with WHITESHADOW AI (Gemini API backend)",
  category: "ai",
  react: "🤖",
  filename: __filename
}, async (message, extra) => {
  const sock = extra.sock || message.client || global.sock;
  const body = message.text || message.body || '';
  const text = body.split(' ').slice(1).join(' ');

  if (!text)
    return await sock.sendMessage(message.chat, { text: "🧠 *Please enter a message to ask AI.*\nExample: .ai3 What is cyber security?" }, { quoted: message });

  try {
    const res = await axios.get(`https://whiteshadow-thz2.onrender.com/ai/gpt-5-mini?query=${encodeURIComponent(text)}`);
    const data = res.data;

    if (data && data.status && data.answer) {
      await sock.sendMessage(message.chat, {
        text: `🤖 *WhiteShadow AI:*\n\n${data.answer}`,
        ai: true
      }, { quoted: message });
    } else {
      await sock.sendMessage(message.chat, { text: "⚠️ AI response not received properly." }, { quoted: message });
    }
  } catch (e) {
    console.log("AI3 ERROR =>", e.message);
    await sock.sendMessage(message.chat, { text: "❌ *Error connecting to WHITESHADOW AI server.*" }, { quoted: message });
  }
});
