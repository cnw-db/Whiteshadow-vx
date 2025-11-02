const { cmd } = require("../command");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

// Fake vCard (for channel quoted look)
const fakevCard = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "© WhiteShadow-MD",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:White Shadow
ORG:WhiteShadow;
TEL;type=CELL;type=VOICE;waid=94704896880:+94704896880
END:VCARD`
    }
  }
};

cmd({
  pattern: "playch",
  alias: ["chplay", "chsong"],
  react: "🎵",
  desc: "Send YouTube song (voice + details) directly to WhatsApp Channel",
  category: "channel",
  use: ".playch <song name>/<channel JID>",
  filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
  try {
    if (!q || !q.includes("/")) {
      return reply(
        "⚠️ Usage:\n.playch <song>/<channel JID>\n\n📌 Example:\n.playch Shape of You/1203630xxxxx@newsletter"
      );
    }

    const [songName, channelJid] = q.split("/").map(x => x.trim());
    if (!channelJid.endsWith("@newsletter"))
      return reply("❌ Invalid Channel ID! Must end with @newsletter");

    if (!songName) return reply("🎧 Please enter the song name to search.");

    await reply(`🔍 Searching for *${songName}* on YouTube...`);

    // ─── Nekolabs API ───────────────────────────────
    const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(songName)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.success || !data?.result?.downloadUrl)
      return reply("❌ Failed to find the song or API returned an error.");

    const meta = data.result.metadata;
    const dlUrl = data.result.downloadUrl;

    // ─── Thumbnail ───────────────────────────────
    let thumb;
    try {
      const thumbRes = await fetch(meta.cover);
      thumb = Buffer.from(await thumbRes.arrayBuffer());
    } catch {
      thumb = null;
    }

    // ─── Caption (Stylish Music Channel Look) ───────────────────────────────
    const caption = `
🎶 *Now Playing on WhiteShadow Music Channel* 🎶

🎧 *Title:* ${meta.title}
📀 *Artist:* ${meta.channel}
⏱️ *Duration:* ${meta.duration}
🔗 *Watch on YouTube:* ${meta.url}

💬 “Feel the rhythm, embrace the vibe.”  
🔥 Exclusive drop powered by *WhiteShadow-MD* ⚡
`.trim();

    // ─── Send Thumbnail & Caption ───────────────────────────────
    await conn.sendMessage(
      channelJid,
      {
        image: thumb,
        caption: caption
      },
      { quoted: fakevCard }
    );

    // ─── Create temp folder ───────────────────────────────
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const mp3Path = path.join(tempDir, `${Date.now()}.mp3`);
    const opusPath = path.join(tempDir, `${Date.now()}.opus`);

    // ─── Download song ───────────────────────────────
    const audioRes = await fetch(dlUrl);
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    fs.writeFileSync(mp3Path, audioBuffer);

    // ─── Convert MP3 → Opus (PTT) ───────────────────────────────
    await new Promise((resolve, reject) => {
      ffmpeg(mp3Path)
        .audioCodec("libopus")
        .format("opus")
        .audioBitrate("64k")
        .save(opusPath)
        .on("end", resolve)
        .on("error", reject);
    });

    const voiceBuffer = fs.readFileSync(opusPath);

    // ─── Send Voice Note (PTT) ───────────────────────────────
    await conn.sendMessage(
      channelJid,
      {
        audio: voiceBuffer,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
        contextInfo: {
          externalAdReply: {
            title: meta.title,
            body: `${meta.channel} • WhiteShadow Music`,
            thumbnailUrl: meta.cover,
            sourceUrl: meta.url,
            mediaType: 1,
            renderLargerThumbnail: true,
            showAdAttribution: true
          }
        }
      },
      { quoted: fakevCard }
    );

    // ─── Cleanup ───────────────────────────────
    fs.unlinkSync(mp3Path);
    fs.unlinkSync(opusPath);

    reply(`✅ *Successfully uploaded* 🎵 ${meta.title} *to channel!*`);

  } catch (err) {
    console.error("playch error:", err);
    reply("⚠️ Error while sending song to channel.");
  }
});
