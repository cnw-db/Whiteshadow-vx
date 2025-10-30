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
  if (!text) {
    return await sock.sendMessage(m.chat, {
      text: "🧠 *Please enter a message to ask AI.*\nExample: .ai3 What is cyber security?",
      ai: true
    });
  }

  try {
    let res = await axios.get(`https://whiteshadow-thz2.onrender.com/ai/gpt-5-mini?query=${encodeURIComponent(text)}`);
    
    if (res.data && res.data.status && res.data.answer) {
      return await sock.sendMessage(m.chat, {
        text: `🤖 *WhiteShadow AI:*\n\n${res.data.answer}`,
        ai: true
      });
    } else {
      console.error(res.data);
      return await sock.sendMessage(m.chat, {
        text: "⚠️ *AI response not received properly.*",
        ai: true
      });
    }

  } catch (err) {
    console.error(err);
    return await sock.sendMessage(m.chat, {
      text: "❌ *Error connecting to WHITESHADOW AI server.*",
      ai: true
    });
  }
});
