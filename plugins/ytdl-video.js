const { cmd } = require("../command");
const axios = require("axios");

cmd({
  pattern: "video",
  alias: ["yt2","ytmp42","mp42","ytv2"],
  desc: "🎬 Download YouTube video/audio via Izumi API",
  category: "download",
  react: "🎥",
  filename: __filename,
  use: ".video2 <YouTube URL>"
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return await conn.sendMessage(from, { text: `⚠️ Usage: .video2 <YouTube URL>\nExample:\n.video2 https://youtu.be/Lubq9sI-IoM` }, { quoted: mek });
  }

  try {
    const formats = ["360", "720", "1080", "mp3"];
    let formatText = `🎬 *Select Format for:* ${q}\n\n`;
    formats.forEach((f, i) => formatText += `「 ${i + 1} 」 ${f}\n`);

    // Send initial reply asking format
    const sentMsg = await conn.sendMessage(from, { text: formatText }, { quoted: mek });
    const replyId = sentMsg.key.id;

    const handler = async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg?.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === replyId;
      const senderID = receivedMsg.key.remoteJid;

      if (!isReplyToBot) return;

      const choice = parseInt(receivedText.trim());
      if (!choice || choice < 1 || choice > formats.length) {
        return await conn.sendMessage(senderID, { text: "⚠️ Reply with a valid number from the list!" }, { quoted: receivedMsg });
      }

      const selectedFormat = formats[choice - 1];
      const apiUrl = `https://api.ootaizumi.web.id/downloader/youtube?url=${encodeURIComponent(q)}&format=${selectedFormat}`;

      try {
        const { data } = await axios.get(apiUrl);
        if (!data?.status || !data?.result) {
          return await conn.sendMessage(senderID, { text: "❌ Could not download video/audio. Try again later." }, { quoted: receivedMsg });
        }

        const res = data.result;
        let caption = `🎬 *Title:* ${res.title}\n👤 *Channel:* ${res.author.channelTitle}\n⏱️ *Duration:* ${res.metadata.duration}\n🔗 *Link:* ${res.url}`;

        if (selectedFormat === "mp3") {
          await conn.sendMessage(senderID, { audio: { url: res.download }, mimetype: "audio/mpeg", fileName: `${res.title}.mp3`, caption }, { quoted: receivedMsg });
        } else {
          await conn.sendMessage(senderID, { video: { url: res.download }, mimetype: "video/mp4", caption }, { quoted: receivedMsg });
        }

      } catch (e) {
        console.error("Download error:", e);
        await conn.sendMessage(senderID, { text: "❌ Error downloading file. Try again later." }, { quoted: receivedMsg });
      }

      conn.ev.off("messages.upsert", handler);
    };

    conn.ev.on("messages.upsert", handler);

  } catch (e) {
    console.error("Video2 command error:", e);
    await conn.sendMessage(from, { text: "❌ Something went wrong. Try again later." }, { quoted: mek });
  }
});
