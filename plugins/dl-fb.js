const axios = require("axios");
const { cmd } = require('../command');

cmd({
  pattern: "facebook",
  alias: ["fb"],
  desc: "Download Facebook videos or images",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ Please provide a valid Facebook video URL." }, { quoted: m });
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    // Fetch data from API
    const apiUrl = `https://api.ootaizumi.web.id/downloader/facebook?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data?.thumbnail || !data?.downloads?.length) {
      return reply("⚠️ Failed to fetch Facebook video. Check the link and try again.");
    }

    // Filter out audio only (we keep only video & image)
    const downloads = data.downloads.filter(d => !d.quality.toLowerCase().includes("audio"));

    const caption = `
📺 *Facebook Downloader* 📥
🔗 Link: ${q}

Reply with the number to download:

${downloads.map((d, i) => `${i+1}️⃣ ${d.quality}`).join("\n")}

> Powered by Whiteshadow`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: data.thumbnail },
      caption
    }, { quoted: m });

    const msgID = sentMsg.key.id;

    // Listen for reply
    conn.ev.on("messages.upsert", async ({ messages }) => {
      const receivedMsg = messages[0];
      if (!receivedMsg?.message) return;

      const text = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const sender = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === msgID;

      if (isReplyToBot) {
        await conn.sendMessage(sender, { react: { text: '⏳', key: receivedMsg.key } });

        const index = parseInt(text.trim()) - 1;
        const selected = downloads[index];

        if (selected) {
          // Determine type: video or image
          const type = selected.quality.toLowerCase().includes("jpg") || selected.quality.toLowerCase().includes("image") ? "image" : "video";

          await conn.sendMessage(sender, {
            [type]: { url: selected.url },
            caption: `📥 Downloaded: ${selected.quality}`
          }, { quoted: receivedMsg });
        } else {
          reply("❌ Invalid option! Please reply with a valid number from the list.");
        }
      }
    });

  } catch (error) {
    console.error("Facebook Plugin Error:", error);
    reply("❌ An error occurred while processing your request. Please try again later.");
  }
});
