//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Command : AI Chat (with AI Badge)
//  👑 Developer : Chamod Nimsara (WhiteShadow)
//═══════════════════════════════════════════════//

const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "ai3",
  alias: ["whiteshadowai", "chat3"],
  desc: "Chat with WHITESHADOW AI (Gemini API backend)",
  category: "ai",
  use: ".ai3 <question>",
  react: "🤖",
  filename: __filename
}, async (m, sock) => {
  const text = m.text?.split(' ').slice(1).join(' ');
  
  if (!text) {
    return await sock.reply(m.chat, "🧠 *Please enter a message to ask AI.*\nExample: .ai3 What is cyber security?", m);
  }

  try {
    const url = `https://whiteshadow-thz2.onrender.com/ai/gpt-5-mini?query=${encodeURIComponent(text)}`;
    const { data } = await axios.get(url, { timeout: 10000 });

    if (data?.status && data?.answer) {
      await sock.sendMessage(m.chat, {
        text: `🤖 *WhiteShadow AI:*\n\n${data.answer.trim() || "No reply from AI 🤔"}`,
        ai: true
      }, { quoted: m });
    } else {
      await sock.reply(m.chat, "⚠️ AI response not received properly.", m);
    }

  } catch (e) {
    console.log("AI3 Error =>", e.message);
    await sock.reply(m.chat, "❌ *Error connecting to WHITESHADOW AI server.*", m);
  }
});
