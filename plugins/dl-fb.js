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
      return reply("❌ Please provide a valid Facebook video URL.");
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    // ✅ Fetch video data
    const apiUrl = `https://api.ootaizumi.web.id/downloader/facebook?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data?.thumbnail || !data?.downloads) {
      return reply("⚠️ Failed to fetch Facebook video. Check the link and try again.");
    }

    // Filter only video downloads
    const videoDownloads = data.downloads.filter(d => !d.quality.toLowerCase().includes("mp3") && !d.quality.toLowerCase().includes("audio"));
    if (!videoDownloads.length) return reply("⚠️ No video download links found.");

    const caption = `
🎬 *Facebook Video Downloader*

🔗 *Link:* ${q}

💡 Reply with the number to download:

${videoDownloads.map((d, i) => `*${i+1}*️⃣ ${d.quality}`).join('\n')}

> Powered by 𝙒𝙝𝙞𝙩𝙚𝙎𝙝𝙖𝙙𝙤𝙬-MD`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: data.thumbnail },
      caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    // 🧠 Handle user reply for video download
    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        const index = parseInt(receivedText.trim()) - 1;
        const selected = videoDownloads[index];

        if (selected) {
          await conn.sendMessage(senderID, { react: { text: '⏳', key: receivedMsg.key } });

          await conn.sendMessage(senderID, {
            video: { url: selected.url },
            caption: `📥 *Downloaded: ${selected.quality}*`,
            mimetype: "video/mp4"
          }, { quoted: receivedMsg });
        } else {
          await reply("❌ Invalid number! Reply with a valid number from the list.");
        }
      }
    });

  } catch (error) {
    console.error("Facebook Plugin Error:", error);
    reply("❌ Something went wrong while fetching the Facebook video.");
  }
});
