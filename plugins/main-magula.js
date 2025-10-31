const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "movie2",
  alias: ["sinhalasub", "cinesub"],
  react: "🎬",
  desc: "Search Sinhala Sub Movies and send directly",
  category: "movie",
  filename: __filename
}, async (conn, m, text) => {
  try {
    if (!text) return m.reply("🔍 *Please enter a movie name to search!*");

    m.reply("⏳ *Searching for Sinhala Subtitle Movies...*");

    const api = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/search?q=${encodeURIComponent(text)}&apiKey=d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56`;
    const { data } = await axios.get(api);

    if (!data || !data.data || data.data.length === 0)
      return m.reply("❌ *No results found!*");

    const movie = data.data[0]; // pick first result
    const caption = `
🎬 *${movie.title}*
⭐ ${movie.rating}
📆 ${movie.year}
📺 ${movie.type}

📝 ${movie.description.slice(0, 250)}...

🌐 *Source:* ${movie.link}
🎞️ *WhiteShadow-MD | Sinhala Sub Finder*
`;

    // Try to find a direct video link (replace with real if available)
    const possibleLinks = [
      movie.link,
      movie.downloadLink,
      movie.streamLink,
      movie.direct || ""
    ].filter(Boolean);

    await conn.sendMessage(
      m.chat,
      {
        image: { url: movie.imageSrc },
        caption: caption,
      },
      { quoted: m }
    );

    // If there’s a direct mp4 link
    const directLink = possibleLinks.find(l => l.endsWith(".mp4"));
    if (directLink) {
      m.reply("⏬ *Found direct video link, sending movie...*");

      const response = await axios({
        method: 'GET',
        url: directLink,
        responseType: 'stream',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      let fileSize = parseInt(response.headers['content-length'] || 0);
      if (fileSize > 2 * 1024 * 1024 * 1024) {
        return m.reply("⚠️ *File too large! WhatsApp only allows up to 2GB.*");
      }

      await conn.sendMessage(
        m.chat,
        {
          video: response.data,
          mimetype: 'video/mp4',
          caption: `📦 *Download Complete!*\n🎬 *${movie.title}*\n\n🔥 Powered by *WhiteShadow-MD*`,
        },
        { quoted: m }
      );
    } else {
      m.reply("⚠️ *No direct mp4 link found for this movie.*");
    }

  } catch (err) {
    console.error(err);
    m.reply("❌ *Failed to fetch or send movie!*");
  }
});
