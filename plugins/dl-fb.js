const axios = require("axios");
const { cmd } = require('../command');

cmd({
  pattern: "facebook",
  react: "🎥",
  alias: ["fbb", "fbvideo", "fb"],
  desc: "Download videos from Facebook",
  category: "download",
  use: '.facebook <facebook_url>',
  filename: __filename
}, async (conn, mek, { from, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) return reply("🚩 Please provide a valid Facebook URL.");

    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    // ✅ Ootaizumi API
    const apiUrl = `https://api.ootaizumi.web.id/downloader/facebook?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !Array.isArray(data.downloads) || data.downloads.length === 0) {
      return reply("⚠️ Failed to fetch Facebook video. Check the link and try again.");
    }

    // Filter only video downloads
    const videoOptions = data.downloads.filter(d => !d.quality.toLowerCase().includes("audio") && d.quality.toLowerCase().includes("download"));

    if (!videoOptions.length) return reply("⚠️ No video options available for this link.");

    const caption = `
*WHITESHADOW-MD*
📝 ᴛɪᴛʟᴇ : Facebook Video
🔗 ᴜʀʟ : ${q}
🦸‍♂️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ : WHITESHADOW-MD

Reply with the number to download:

${videoOptions.map((d, i) => `${i+1}️⃣ ${d.quality}`).join("\n")}
`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: data.thumbnail },
      caption
    }, { quoted: mek });

    const msgID = sentMsg.key.id;

    // Only listen once for this specific reply
    const handler = async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const replyText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === msgID;

      if (isReplyToBot) {
        const index = parseInt(replyText.trim()) - 1;
        const selected = videoOptions[index];
        if (!selected) {
          return conn.sendMessage(from, { text: "❌ Invalid option! Reply with a valid number." }, { quoted: receivedMsg });
        }

        await conn.sendMessage(from, {
          video: { url: selected.url },
          caption: `📥 Downloaded: ${selected.quality}`
        }, { quoted: receivedMsg });

        // Remove listener after first reply
        conn.ev.off("messages.upsert", handler);
      }
    };

    conn.ev.on("messages.upsert", handler);

  } catch (err) {
    console.error("Facebook Plugin Error:", err);
    reply("❌ An error occurred while fetching the video. Please try again later.");
  }
});
