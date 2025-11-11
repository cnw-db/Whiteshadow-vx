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
  if (!q) return reply("🚩 Please provide a Facebook URL 🐼");

  try {
    const apiUrl = `https://api.ootaizumi.web.id/downloader/facebook?url=${encodeURIComponent(q)}`;
    const { data: json } = await axios.get(apiUrl);

    if (!json.status || !json.result?.downloads?.length) 
      return reply("❌ No video found or invalid URL.");

    const thumb = json.result.thumbnail;
    const downloads = json.result.downloads;

    // Send caption + choices
    let caption = `🎥 *WHITESHADOW-MD FACEBOOK DOWNLOADER* 🎥\n\n`;
    caption += `📝 URL: ${q}\n\n💬 Reply with your choice:\n`;
    downloads.forEach((d, i) => caption += `${i+1}️⃣ ${d.quality}\n`);
    caption += `\n© Powered by WhiteShadow-MD`;

    const sentMsg = await conn.sendMessage(from, { image: { url: thumb }, caption }, { quoted: fakevCard });
    const msgId = sentMsg.key.id;

    // Listener for reply
    const replyHandler = async (msgUpdate) => {
      try {
        const msg = msgUpdate.messages?.[0];
        if (!msg?.message) return;

        const userText = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === msgId;
        if (!isReply) return;

        const choice = parseInt(userText.trim()) - 1;
        if (isNaN(choice) || !downloads[choice]) return reply("❌ Reply with a valid number!");

        const selected = downloads[choice];

        // React downloading
        await conn.sendMessage(from, { react: { text: "⬇️", key: msg.key } });

        // Send as document (safe for Heroku)
        await conn.sendMessage(from, {
          document: { url: selected.url },
          mimetype: "video/mp4",
          fileName: `facebook_${choice+1}.mp4`,
          caption: `*${selected.quality}*`
        }, { quoted: m });

        // React done
        await conn.sendMessage(from, { react: { text: "✅", key: msg.key } });

        // Remove listener to prevent multiple triggers
        conn.ev.off("messages.upsert", replyHandler);

      } catch (err) {
        console.error("Reply handler error:", err);
      }
    };

    conn.ev.on("messages.upsert", replyHandler);

  } catch (err) {
    console.error("API error:", err);
    reply("💔 Failed to download the video. Try again later 🐼");
  }
});
