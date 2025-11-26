const { cmd } = require('../command')

// Fix for node-fetch (works on any Node version)
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

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

    // ==============================
    // Validate Query
    // ==============================
    if (!q) return reply("⚠️ Please provide a song name or YouTube link.");

    // ==============================
    // API CALL
    // ==============================
    const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(q)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) return reply("❌ API is not responding. Try again later.");

    const data = await res.json();

    if (!data?.success || !data?.result)
      return reply("❌ Song not found or API error.");

    const meta = data.result.metadata || {};
    const dlUrl = data.result.downloadUrl;

    if (!dlUrl)
      return reply("❌ Audio download URL not found.");

    // ==============================
    // Thumbnail (Auto Fallback)
    // ==============================
    const cover = meta.cover || meta.thumbnail || null;

    let thumbBuffer = null;
    if (cover) {
      try {
        const t = await fetch(cover);
        thumbBuffer = Buffer.from(await t.arrayBuffer());
      } catch (err) {
        console.log("Thumbnail failed:", err);
      }
    }

    // ==============================
    // Safe Filename
    // ==============================
    const safeTitle = (meta.title || "song")
      .replace(/[\\/:*?"<>|]/g, "")
      .slice(0, 80);

    // ==============================
    // Caption
    // ==============================
    const caption = `
╔═══════════════
🎶 *Now Playing*
╠═══════════════
🎵 *Title:* ${meta.title || "Unknown"}
👤 *Channel:* ${meta.channel || "Unknown"}
⏱ *Duration:* ${meta.duration || "N/A"}
🔗 YouTube: ${meta.url || "N/A"}
╠═══════════════
⚡ Powered by *Whiteshadow MD*
╚═══════════════
`;

    // ==============================
    // Send Thumbnail
    // ==============================
    if (thumbBuffer) {
      await conn.sendMessage(from, {
        image: thumbBuffer,
        caption
      }, { quoted: mek });
    } else {
      await conn.sendMessage(from, { text: caption }, { quoted: mek });
    }

    // ==============================
    // Send Audio File
    // ==============================
    await conn.sendMessage(from, {
      audio: { url: dlUrl },
      mimetype: "audio/mpeg",
      fileName: `${safeTitle}.mp3`
    }, { quoted: mek });

  } catch (err) {
    console.error("song cmd error:", err);
    reply("⚠️ An unexpected error occurred. Try again later.");
  }
});
