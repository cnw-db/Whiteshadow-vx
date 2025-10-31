const { cmd } = require('../command')
const fetch = require('node-fetch')

cmd({
  pattern: "song",
  alias: ["play", "mp3"],
  react: "🎶",
  desc: "Download YouTube song (Audio) via Nekolabs API",
  category: "download",
  use: ".song <query>",
  filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
  try {
    if (!q) return reply("⚠️ Please provide a song name or YouTube link.");

    // 🔹 API Call
    const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(q)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.success || !data?.result?.downloadUrl)
      return reply("❌ Song not found or API error. Please try again later.");

    const meta = data.result.metadata;
    const dlUrl = data.result.downloadUrl;

    // 🔹 Thumbnail fetch (memory-safe)
    let thumbBuffer = null;
    try {
      const thumbRes = await fetch(meta.cover);
      thumbBuffer = Buffer.from(await thumbRes.arrayBuffer());
    } catch (e) {
      console.log("Thumbnail fetch failed:", e);
    }

    // 🔹 Caption
    const caption = `
╔═══════════════
🎶 *Now Playing*
╠═══════════════
🎵 *Title:* ${meta.title}
👤 *Channel:* ${meta.channel}
⏱ *Duration:* ${meta.duration}
🔗 [Watch on YouTube](${meta.url})
╠═══════════════
⚡ Powered by *Whiteshadow MD*
╚═══════════════
`;

    // 🔹 Send thumbnail & caption
    if (thumbBuffer) {
      await conn.sendMessage(from, {
        image: thumbBuffer,
        caption
      }, { quoted: mek });
    } else {
      await conn.sendMessage(from, { text: caption }, { quoted: mek });
    }

    // 🔹 Send audio
    await conn.sendMessage(from, {
      audio: { url: dlUrl },
      mimetype: "audio/mpeg",
      fileName: `${meta.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp3`
    }, { quoted: mek });

  } catch (err) {
    console.error("song cmd error:", err);
    reply("⚠️ An error occurred while processing your request. Please try again.");
  }
});
