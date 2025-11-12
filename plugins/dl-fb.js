const axios = require("axios");
const { cmd } = require('../command');

cmd({
  pattern: "facebook",
  alias: ["fb"],
  desc: "🎥 Download Facebook videos (HD/SD)",
  category: "downloader",
  react: "🎬",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ *Please provide a valid Facebook video URL!*" }, { quoted: m });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    // ✅ Fetching from new API
    const apiUrl = `https://delirius-apiofc.vercel.app/download/facebook?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data || !data.urls || data.urls.length === 0) {
      return reply("⚠️ *Failed to fetch video data! Please check the link.*");
    }

    const hd = data.urls[0]?.hd;
    const sd = data.urls[1]?.sd;
    const title = data.title || "Facebook Video";

    const caption = `
🎬 *WhiteShadow FB Downloader* 📥

📑 *Title:* ${title}
🔗 *Link:* ${q}

🔢 *Reply with one of the following numbers:*

1️⃣ *HD Quality*  
2️⃣ *SD Quality*

> ⚙️ Powered by *WhiteShadow-MD*
    `;

    const sentMsg = await conn.sendMessage(from, { text: caption }, { quoted: m });
    const messageID = sentMsg.key.id;

    // 🧠 Stable Reply System
    const onReply = async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const contextID = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId;

      if (contextID !== messageID) return; // Only handle replies to this message

      await conn.sendMessage(senderID, { react: { text: '⬇️', key: receivedMsg.key } });

      switch (receivedText.trim()) {
        case "1":
          await conn.sendMessage(senderID, {
            video: { url: hd },
            caption: "✅ *Downloaded in HD Quality*"
          }, { quoted: receivedMsg });
          break;

        case "2":
          await conn.sendMessage(senderID, {
            video: { url: sd },
            caption: "✅ *Downloaded in SD Quality*"
          }, { quoted: receivedMsg });
          break;

        default:
          await conn.sendMessage(senderID, { text: "❌ Invalid option! Please reply with 1 or 2." }, { quoted: receivedMsg });
      }

      // 🧹 Memory-safe cleanup
      conn.ev.off("messages.upsert", onReply);
    };

    conn.ev.on("messages.upsert", onReply);

  } catch (error) {
    console.error("Facebook Plugin Error:", error);
    reply("❌ *An error occurred while processing your request.*");
  }
});
