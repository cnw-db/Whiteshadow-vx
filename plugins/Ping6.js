const { cmd } = require('../command');

cmd({
  pattern: "ping6",
  alias: ["speed6", "pong6"],
  desc: "Check bot response speed with AI icon",
  category: "utility",
  react: "🤖",
  filename: __filename
}, async (m, { sock }) => {
  try {
    const start = new Date().getTime();
    const sent = await sock.sendMessage(m.chat, { text: "🤖 *Pinging...*", ai: true });
    const end = new Date().getTime();
    const speed = end - start;

    await sock.sendMessage(m.chat, {
      text: `🤖 *WHITESHADOW AI Speed Test*\n\n⚡ Response Time: *${speed} ms*\n👑 Powered by: *WHITESHADOW-MD*`,
      ai: true
    });
  } catch (err) {
    console.error(err);
    await sock.sendMessage(m.chat, { text: "❌ *Ping failed!*", ai: true });
  }
});
