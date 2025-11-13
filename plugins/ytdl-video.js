const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

cmd({
  pattern: "video",
  alias: ["ytmp4","mp4","ytv","vi","v","vid","vide","videos","ytvi","ytvid","ytvide","ytvideos","searchyt","download","get","need","search"],
  desc: "🎬 Download YouTube videos in MP4 format",
  category: "download",
  react: "🎥",
  filename: __filename,
  use: ".video <video name>"
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return await conn.sendMessage(from, {
      text: `⚠️ *Usage:* .video <video name>\n\nExample:\n.video Believer - Imagine Dragons\n\nThis command will search YouTube and let you download videos easily 🎧`
    }, { quoted: mek });
  }

  try {
    const search = await yts(q);
    if (!search.videos.length)
      return await conn.sendMessage(from, { text: "❌ Sorry, no video found." }, { quoted: mek });

    const data = search.videos[0];
    const ytUrl = data.url;

    // Replace with your actual API key
    const api = `https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=${encodeURIComponent(ytUrl)}`;
    const { data: apiRes } = await axios.get(api);

    if (!apiRes?.status || !apiRes.result?.media?.video_url) {
      return await conn.sendMessage(from, { text: "⚠️ Unable to download video right now. Please try again later." }, { quoted: mek });
    }

    const result = apiRes.result.media;

    const caption = `╭───〔 *🎬 YouTube Video Info* 〕───⬤
│ 📺 *Title:* ${data.title}
│ 👤 *Channel:* ${data.author.name}
│ ⏱️ *Duration:* ${data.timestamp}
│ 👁️ *Views:* ${data.views}
│ 🔗 *Link:* ${data.url}
╰───────────────────────────⬤

Reply with:
「 1 」▶️ Watch Online
「 2 」📁 Download File`;

    const sentMsg = await conn.sendMessage(from, { image: { url: result.thumbnail }, caption }, { quoted: mek });
    const replyId = sentMsg.key.id;

    const handler = async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === replyId;
      const senderID = receivedMsg.key.remoteJid;

      if (!isReplyToBot) return;

      switch (receivedText.trim()) {
        case "1":
          await conn.sendMessage(senderID, { video: { url: result.video_url }, mimetype: "video/mp4", caption: `🎥 *${data.title}*` }, { quoted: receivedMsg });
          break;
        case "2":
          await conn.sendMessage(senderID, { document: { url: result.video_url }, mimetype: "video/mp4", fileName: `${data.title}.mp4` }, { quoted: receivedMsg });
          break;
        default:
          await conn.sendMessage(senderID, { text: "⚠️ Please reply with only *1* or *2*." }, { quoted: receivedMsg });
      }

      conn.ev.off("messages.upsert", handler);
    };

    conn.ev.on("messages.upsert", handler);

  } catch (e) {
    console.error("Video command error:", e);
    await conn.sendMessage(from, { text: "❌ Something went wrong while downloading the video. Please try again later." }, { quoted: mek });
  }
});
