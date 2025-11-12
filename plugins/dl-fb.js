const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

cmd({
  pattern: "facebook",
  react: "🎥",
  alias: ["fbb", "fbvideo", "fb"],
  desc: "Download videos from Facebook",
  category: "download",
  use: '.facebook <facebook_url>',
  filename: __filename
},
async(conn, mek, m, { from, prefix, q, reply }) => {
  try {
    if (!q) return reply("🚩 Please give me a Facebook URL");

    // Fetch data from your Vercel API
    const fb = await fetchJson(`https://facebook-downloader-chamod.vercel.app/api/fb?url=${encodeURIComponent(q)}`);

    if (!fb.download || !fb.download.videos.length) {
      return reply("❌ I couldn't find any video for this URL.");
    }

    // Caption for thumbnail
    let caption = `*WHITESHADOW-MD*

📝 ᴛɪᴛʟᴇ : ${fb.metadata.title}
🦸‍♀️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ : Chamod Nimsara
🔗 ᴜʀʟ : ${q}`;

    // Send thumbnail image
    if (fb.metadata.thumbnail) {
      await conn.sendMessage(from, {
        image: { url: fb.metadata.thumbnail },
        caption: caption
      }, mek);
    }

    // Send all video qualities
    for (let v of fb.download.videos) {
      await conn.sendMessage(from, {
        video: { url: v.link },
        mimetype: "video/mp4",
        caption: `*${v.quality}*`
      }, { quoted: mek });
    }

  } catch (err) {
    console.error(err);
    reply("❌ ERROR: Something went wrong while fetching the video.");
  }
});
