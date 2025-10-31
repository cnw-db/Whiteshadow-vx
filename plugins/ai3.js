//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Command : AI Chat (with AI Badge Support)
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
}, async (m, { sock, text }) => {
  if (!text) {
    return await sock.sendMessage(m.chat, {
      text: "🧠 *Please enter a message to ask AI.*\nExample: .ai3 What is cyber security?"
    });
  }

  try {
    const res = await axios.get(`https://whiteshadow-thz2.onrender.com/ai/gpt-5-mini?query=${encodeURIComponent(text)}`, { timeout: 10000 });
    const data = res.data;

    if (data && data.status && data.answer) {
      await sock.sendMessage(m.chat, {
        text: `🤖 *WhiteShadow AI:*\n\n${data.answer}`,
        ai: true
      });
    } else {
      await sock.sendMessage(m.chat, { text: "⚠️ AI response not received properly." });
    }
  } catch (err) {
    console.log("❌ AI3 Error =>", err.message);
    await sock.sendMessage(m.chat, {
      text: "❌ *Error connecting to WHITESHADOW AI server.*\nCheck your internet or server link."
    });
  }
});
