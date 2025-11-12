const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');

cmd({
  pattern: "turl",
  desc: "Convert image/video to permanent Telegraph URL.",
  react: "🔗",
  category: "tools",
  filename: __filename
}, async (conn, m, store, { from, quoted, reply }) => {
  try {
    const q = quoted || m;
    const mime = (q.msg || q.message)?.mimetype;
    if (!mime) return reply("📸 Reply to an image or video.");

    let buffer = await q.download();
    if (buffer.length > 5 * 1024 * 1024) return reply("❌ Max upload size: 5MB.");

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
    await conn.sendMessage(from, { text: "🪄 Uploading...", quoted: m });

    const ext = mime.split('/')[1] || 'jpg';
    const form = new FormData();
    form.append('file', buffer, { filename: `upload.${ext}` });

    const res = await axios.post('https://telegra.ph/upload', form, { headers: form.getHeaders() });
    if (!Array.isArray(res.data) || !res.data[0]?.src) throw new Error("Invalid response.");

    const link = `https://telegra.ph${res.data[0].src}`;
    const size = formatBytes(buffer.length);

    const msg = `🃎🃏  *𝗨𝗣𝗟𝗢𝗔𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟*  🃏🃎\n\n` +
      `📁  𝙏𝙮𝙥𝙚: ${mime}\n` +
      `🔗  𝙇𝙞𝙣𝙠: ${link}\n` +
      `💾  𝙎𝙞𝙯𝙚: ${size}\n` +
      `🕐  𝙀𝙭𝙥𝙞𝙧𝙮: Never\n\n` +
      `> ✦ _Powered by 𝗪𝗵𝗶𝘁𝗲𝗦𝗵𝗮𝗱𝗼𝘄-𝗠𝗗_ ✦`;

    await conn.sendMessage(from, { text: msg }, { quoted: m });
    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    // --- memory cleanup ---
    buffer = null;
    res.data = null;

  } catch (err) {
    console.error(err.response?.data || err.message);
    await conn.sendMessage(from, { text: "❌ Upload failed! Try again 🥺", quoted: m });
    await conn.sendMessage(from, { react: { text: "💥", key: m.key } });
  }
});

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}
