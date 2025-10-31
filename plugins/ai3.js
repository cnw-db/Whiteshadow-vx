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
}, async (m, { sock, text, reply }) => {
  if (!text)
    return reply("🧠 *Please enter a message to ask AI.*\nExample: .ai3 What is cyber security?");

  try {
    let res = await axios.get(`https://whiteshadow-thz2.onrender.com/ai/gpt-5-mini?query=${encodeURIComponent(text)}`);

    if (res.data && res.data.status && res.data.answer) {
      await sock.sendMessage(m.chat, {
        text: res.data.answer,
        ai: true // 🔥 This adds the “AI ✦” badge (if supported in your bot base)
      });
    } else {
      console.error(res.data);
      return reply("⚠️ AI response not received properly.");
    }

  } catch (err) {
    console.error(err);
    return reply("❌ *Error connecting to WHITESHADOW AI server.*");
  }
});
