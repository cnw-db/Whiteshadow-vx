const axios = require("axios");  
const { cmd } = require('../command');  

// ✅ Active replies map to prevent memory leaks
const activeReplies = new Map();  

cmd({  
  pattern: "facebook",  
  alias: ["fb"],  
  desc: "Download Facebook videos",  
  category: "download",  
  filename: __filename  
}, async (conn, m, store, { from, q, reply }) => {  
  try {  
    if (!q || !q.startsWith("https://")) return reply("❌ Please provide a valid Facebook video URL.");  

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });  

    // ✅ Fetch Facebook data via API
    const apiUrl = `https://delirius-apiofc.vercel.app/download/facebook?url=${encodeURIComponent(q)}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    if (!data?.urls || !data.urls[0]) return reply("⚠️ Couldn't retrieve Facebook media. Please check the link.");  

    const videoData = data.urls[0];  
    const thumbnail = videoData.sd || videoData.hd || ""; // use SD or HD as fallback
    const caption = `
🎬 *Facebook Video Downloader*

📖 *Title:* ${data.title || "No Title"}
🔗 *URL:* ${q}

📌 *Reply with number below:*
1️⃣ SD Quality
2️⃣ HD Quality

> ⚡ Powered by *WhiteShadow-MD*
`;  

    // 📤 Send preview with thumbnail
    const sentMsg = await conn.sendMessage(from, {
      image: { url: thumbnail },
      caption
    }, { quoted: m });  

    const messageID = sentMsg.key.id;  

    // 🧠 Store video links temporarily
    activeReplies.set(messageID, { low: videoData.sd, high: videoData.hd });  

    // Auto clear memory after 15s
    setTimeout(() => activeReplies.delete(messageID), 15000);  

  } catch (e) {  
    console.error("Facebook Command Error:", e);  
    reply("❌ Error fetching data. Try again later!");  
  }  
});  

// 🧠 Safe reply handler (global)
if (!global.FB_REPLY_HANDLER) {
  global.FB_REPLY_HANDLER = true;

  conn.ev.on("messages.upsert", async (msgData) => {  
    try {  
      const msg = msgData.messages[0];  
      if (!msg?.message) return;  

      const text = msg.message.conversation || msg.message.extendedTextMessage?.text;  
      const replyTo = msg.message.extendedTextMessage?.contextInfo?.stanzaId;  
      const sender = msg.key.remoteJid;  

      if (activeReplies.has(replyTo)) {  
        const { low, high } = activeReplies.get(replyTo);  
        await conn.sendMessage(sender, { react: { text: '⏳', key: msg.key } });  

        switch (text.trim()) {  
          case "1":  
            await conn.sendMessage(sender, {  
              video: { url: low },  
              caption: "📥 *Downloaded in SD Quality*"  
            }, { quoted: msg });  
            break;  

          case "2":  
            await conn.sendMessage(sender, {  
              video: { url: high },  
              caption: "📥 *Downloaded in HD Quality*"  
            }, { quoted: msg });  
            break;  

          default:  
            await conn.sendMessage(sender, { text: "❌ Invalid choice! Reply with 1 or 2." }, { quoted: msg });  
        }  

        activeReplies.delete(replyTo); // clear memory  
      }  
    } catch (err) {  
      console.error("Reply Handler Error:", err);  
    }  
  });  
}
