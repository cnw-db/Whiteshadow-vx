const { cmd } = require('../command');
const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });

cmd({
  pattern: 'cinesubz',
  alias: ['cz', 'cinez'],
  desc: 'Search Sinhala Sub Movies from CineSubz',
  category: 'movie',
  react: '🎬',
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) return conn.sendMessage(from, {
    text: `🎬 *CINESUBZ SEARCH*\n\nUsage:\n\`\`\`.cinesubz <movie name>\`\`\`\nExample: .cinesubz the other`,
  }, { quoted: mek });

  try {
    const cacheKey = `cz_${q.toLowerCase()}`;
    let data = cache.get(cacheKey);

    if (!data) {
      const api = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/search?q=${encodeURIComponent(q)}&apiKey=d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56`;
      const res = await axios.get(api);
      data = res.data;
      if (!data.data || data.data.length === 0)
        return conn.sendMessage(from, { text: "❌ No Sinhala Sub Movies Found!" }, { quoted: mek });
      cache.set(cacheKey, data);
    }

    const movies = data.data.slice(0, 10);
    let listText = `🎬 *CineSubz Sinhala Sub Movies*\n━━━━━━━━━━━━━━━━━━\n`;
    movies.forEach((m, i) => {
      listText += `🔸 *${i + 1}. ${m.title}*\n🎭 ${m.type} | ⭐ ${m.rating} | 📅 ${m.year}\n\n`;
    });
    listText += `💬 Reply with the *number* to get details.\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD`;

    const listMsg = await conn.sendMessage(from, { text: listText }, { quoted: mek });

    // --- message listener ---
    conn.ev.on('messages.upsert', async (update) => {
      const msg = update.messages?.[0];
      if (!msg || msg.key.fromMe) return;

      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
      if (!text) return;

      const replyTo = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;

      // ✅ If replied to movie list
      if (replyTo === listMsg.key.id && /^[0-9]+$/.test(text.trim())) {
        const index = parseInt(text.trim()) - 1;
        const selected = movies[index];
        if (!selected) return conn.sendMessage(from, { text: "❌ Invalid number!" }, { quoted: msg });

        await conn.sendMessage(from, { react: { text: '🎥', key: msg.key } });

        const detailsAPI = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/movie-details?url=${encodeURIComponent(selected.link)}&apiKey=d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56`;
        const res = await axios.get(detailsAPI);
        const movie = res.data;

        if (!movie.mainDetails) return conn.sendMessage(from, { text: "⚠️ Couldn't fetch details." }, { quoted: msg });

        const caption = `🎬 *${movie.mainDetails.maintitle}*\n⭐ ${movie.mainDetails.rating?.value || "N/A"} (${movie.mainDetails.rating?.count || 0} votes)\n🎞️ ${movie.mainDetails.genres.join(", ")}\n📅 ${movie.mainDetails.dateCreated}\n🌍 ${movie.mainDetails.country}\n🕒 ${movie.mainDetails.runtime}\n\n🧠 *Storyline:*\n${movie.moviedata.description.trim().slice(0, 400)}...\n\n💬 Reply *download* to get file.\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD`;

        const detailsMsg = await conn.sendMessage(from, {
          image: { url: movie.mainDetails.imageUrl },
          caption
        }, { quoted: msg });

        cache.set(`cz_dl_${detailsMsg.key.id}`, movie.dilinks.link);
      }

      // ✅ If replied to details message with "download"
      else if (text.trim().toLowerCase() === "download") {
        const replyId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
        const movieLink = cache.get(`cz_dl_${replyId}`);

        if (!movieLink) {
          return conn.sendMessage(from, { text: "⚠️ Please reply to a movie details message first!" }, { quoted: msg });
        }

        await conn.sendMessage(from, { react: { text: '📦', key: msg.key } });

        const dlApi = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/downloadurl?url=${encodeURIComponent(movieLink)}&apiKey=d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56`;
        const dlRes = await axios.get(dlApi);
        const dl = dlRes.data;

        if (!dl.url) return conn.sendMessage(from, { text: "⚠️ No download link found!" }, { quoted: msg });

        const mimeType = dl.url.endsWith('.mkv') ? 'video/x-matroska' : 'video/mp4';
        const fileName = movieLink.split('/').pop() + (dl.url.endsWith('.mkv') ? '.mkv' : '.mp4');

        await conn.sendMessage(from, {
          document: { url: dl.url },
          mimetype: mimeType,
          fileName: fileName,
          caption: `🎥 *CineSubz Movie Downloaded!*\n📺 Quality: ${dl.quality}\n💾 Size: ${dl.size}\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD`
        }, { quoted: msg });
      }
    });

  } catch (err) {
    console.error(err);
    await conn.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: mek });
  }
});
