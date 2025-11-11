const { cmd } = require('../command');
const axios = require('axios');

const fakevCard = {
  key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
  message: { contactMessage: { displayName: "© WhiteShadow", vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:WhiteShadow\nTEL;type=CELL;waid=94704896880:+94704896880\nEND:VCARD` } }
};

cmd({
  pattern: "facebook2",
  react: "🎥",
  alias: ["fbb2","fbvideo2","fb2"],
  desc: "Download videos from Facebook",
  category: "download",
  use: ".facebook <url>",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("🚩 Please provide a Facebook URL 🐼");

    const apiUrl = `https://api.ootaizumi.web.id/downloader/facebook?url=${encodeURIComponent(q)}`;
    const res = await axios.get(apiUrl);
    const json = res.data;

    if (!json.status || !json.result || !json.result.downloads) 
      return reply("❌ No video found or invalid URL.");

    const thumb = json.result.thumbnail;
    const downloads = json.result.downloads;

    // Prepare caption with choices
    let caption = `🎥 *WHITESHADOW-MD FACEBOOK DOWNLOADER* 🎥\n\n`;
    caption += `📝 *URL:* ${q}\n\n`;
    caption += `💬 Reply with your choice:\n`;
    downloads.forEach((d, i) => {
      caption += `${i+1}️⃣ ${d.quality}\n`;
    });
    caption += `\n© Powered by WhiteShadow-MD`;

    // Send thumbnail + caption
    const sentMsg = await conn.sendMessage(from, {
      image: { url: thumb },
      caption: caption
    }, { quoted: fakevCard });

    const messageID = sentMsg.key.id;

    // Wait for reply
    const handler = async (msgUpdate) => {
      try {
        const mekInfo = msgUpdate?.messages?.[0];
        if (!mekInfo?.message) return;

        const userText =
          mekInfo?.message?.conversation ||
          mekInfo?.message?.extendedTextMessage?.text;

        const isReply =
          mekInfo?.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID;
        if (!isReply) return;

        const choice = parseInt(userText.trim()) - 1;
        if (choice < 0 || choice >= downloads.length)
          return reply("❌ Invalid choice! Reply with a valid number.");

        const selected = downloads[choice];

        // React downloading
        await conn.sendMessage(from, { react: { text: "⬇️", key: mekInfo.key } });

        // Send as document to avoid Heroku crash
        await conn.sendMessage(from, {
          document: { url: selected.url },
          mimetype: "video/mp4",
          fileName: `facebook_${choice+1}.mp4`,
          caption: `*${selected.quality}*`
        }, { quoted: m });

        // React done
        await conn.sendMessage(from, { react: { text: "✅", key: mekInfo.key } });

        // Remove listener
        conn.ev.off("messages.upsert", handler);
      } catch (err) {
        console.error(err);
        reply("⚠️ Error while processing your reply.");
      }
    };

    conn.ev.on("messages.upsert", handler);

  } catch (err) {
    console.error(err);
    reply("💔 Failed to download the video. Try again later 🐼");
  }
});
