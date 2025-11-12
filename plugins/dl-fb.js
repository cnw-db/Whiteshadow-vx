const axios = require("axios");  
const { cmd } = require('../command');  

const activeReplies = new Map(); // prevent memory leak

cmd({  
  pattern: "facebook",  
  alias: ["fb"],  
  desc: "Download Facebook videos",  
  category: "download",  
  filename: __filename  
}, async (conn, m, store, { from, q, reply }) => {  
  try {  
    if (!q || !q.startsWith("https://")) return reply("❌ Please provide a valid Facebook URL.");  

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });  

    const apiUrl = `https://api.ootaizumi.web.id/downloader/facebook?url=${encodeURIComponent(q)}`;  
    const { data } = await axios.get(apiUrl);  

    if (!data?.downloads || !data.thumbnail) return reply("⚠️ Couldn't retrieve Facebook media.");  

    const hd = data.downloads.find(d => d.quality.includes("720p"))?.url;  
    const sd = data.downloads.find(d => d.quality.includes("360p"))?.url;  

    const caption = `🎬 *Facebook Video Downloader*\n\n📖 *Title:* Facebook Video\n🔗 *URL:* ${q}\n\n📌 Reply:\n1️⃣ SD Quality\n2️⃣ HD Quality\n\n> ⚡ Powered by WhiteShadow-MD`;  

    const sentMsg = await conn.sendMessage(from, { image: { url: data.thumbnail }, caption }, { quoted: m });  
    activeReplies.set(sentMsg.key.id, { hd, sd });  

    setTimeout(() => activeReplies.delete(sentMsg.key.id), 15000);  
  } catch (e) {  
    console.error(e);  
    reply("❌ Error fetching data.");  
  }  
});

// Reply handler
global.FB_REPLY_HANDLER = global.FB_REPLY_HANDLER || false;
if (!global.FB_REPLY_HANDLER) {
  conn.ev.on("messages.upsert", async (msgData) => {
    try {
      const msg = msgData.messages[0]; if (!msg?.message) return;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const replyTo = msg.message.extendedTextMessage?.contextInfo?.stanzaId;
      const sender = msg.key.remoteJid;

      if (activeReplies.has(replyTo)) {
        const { hd, sd } = activeReplies.get(replyTo);
        await conn.sendMessage(sender, { react: { text: '⏳', key: msg.key } });

        switch (text.trim()) {
          case "1":
            await conn.sendMessage(sender, { video: { url: sd }, caption: "📥 Downloaded in SD" }, { quoted: msg });
            break;
          case "2":
            await conn.sendMessage(sender, { video: { url: hd }, caption: "📥 Downloaded in HD" }, { quoted: msg });
            break;
          default:
            await conn.sendMessage(sender, { text: "❌ Reply with 1 or 2!" }, { quoted: msg });
        }

        activeReplies.delete(replyTo);
      }
    } catch (err) { console.error(err); }
  });

  global.FB_REPLY_HANDLER = true;
}
