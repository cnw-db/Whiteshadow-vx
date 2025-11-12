const axios = require("axios");
const { cmd } = require('../command');

cmd({
  pattern: "facebook",
  alias: ["fb"], 
  desc: "Download Facebook videos",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ Please provide a valid Facebook video URL." }, { quoted: m });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    // ✅ Fetching data from Ootaizumi API
    const apiUrl = `https://api.ootaizumi.web.id/downloader/facebook?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data?.downloads || !Array.isArray(data.downloads) || data.downloads.length === 0) {
      return reply("⚠️ Failed to fetch Facebook video. Check the link and try again.");
    }

    // Only keep video & image options, remove audio
    const videoOptions = data.downloads.filter(d => !d.quality.toLowerCase().includes("audio"));

    const caption = `
📺 *Facebook Downloader* 📥
📑 *Link:* ${q}

🔢 *Reply with number to download:*

${videoOptions.map((d, i) => `${i+1}️⃣ ${d.quality}`).join('\n')}

> Powered by Whiteshadow
`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: data.thumbnail },
      caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    // 🧠 Interactive Reply System
    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

        const index = parseInt(receivedText.trim()) - 1;
        const selected = videoOptions[index];

        if (selected) {
          await conn.sendMessage(senderID, {
            video: { url: selected.url },
            caption: `📥 *Downloaded: ${selected.quality}*`
          }, { quoted: receivedMsg });
        } else {
          reply("❌ Invalid option! Reply with a valid number from the list.");
        }
      }
    });

  } catch (error) {
    console.error("Facebook Plugin Error:", error);
    reply("❌ An error occurred while fetching the video. Please try again later.");
  }
});
