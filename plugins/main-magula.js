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
    for (let i = 0; i < movies.length; i++) {
      const m = movies[i];
      listText += `🔸 *${i + 1}. ${m.title}*\n🎭 ${m.type} | ⭐ ${m.rating} | 📅 ${m.year}\n\n`;
    }
    listText += `💬 Reply with the *number* of the movie to get details.\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD`;

    const sentMsg = await conn.sendMessage(from, { text: listText }, { quoted: mek });

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg) return;

      let replyText = '';
      let repliedId = '';

      // Support both plain text and extendedTextMessage
      if (msg.message?.conversation) {
        replyText = msg.message.conversation.trim();
        repliedId = msg.message?.contextInfo?.quotedMessage?.conversation;
      } else if (msg.message?.extendedTextMessage) {
        replyText = msg.message.extendedTextMessage.text.trim();
        repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;
      }

      // Select movie
      if (repliedId === sentMsg.key.id) {
        const index = parseInt(replyText) - 1;
        const selected = movies[index];
        if (!selected) return conn.sendMessage(from, { text: "❌ Invalid number." }, { quoted: msg });

        await conn.sendMessage(from, { react: { text: '🎥', key: msg.key } });

        const detailsUrl = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/movie-details?url=${encodeURIComponent(selected.link)}&apiKey=d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56`;
        const movieRes = await axios.get(detailsUrl);
        const movie = movieRes.data;

        if (!movie.mainDetails) return conn.sendMessage(from, { text: "⚠️ Couldn't fetch movie details." }, { quoted: msg });

        const caption = `🎬 *${movie.mainDetails.maintitle}*\n⭐ IMDB: ${movie.mainDetails.rating?.value || "N/A"} (${movie.mainDetails.rating?.count || 0} votes)\n🎞️ Genres: ${movie.mainDetails.genres.join(", ")}\n📅 Year: ${movie.mainDetails.dateCreated}\n🌍 Country: ${movie.mainDetails.country}\n🕒 Duration: ${movie.mainDetails.runtime}\n\n🧠 *Storyline:*\n${movie.moviedata.description.trim().slice(0, 500)}...\n\n💬 Reply *download* to get the movie file.\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD`;

        const detailsMsg = await conn.sendMessage(from, {
          image: { url: movie.mainDetails.imageUrl },
          caption
        }, { quoted: msg });

        // Store selected movie link in cache keyed by details message ID
        cache.set(`cz_dl_${from}_${detailsMsg.key.id}`, movie.dilinks.link);
      }

      // Download movie
      else if (replyText.toLowerCase() === 'download') {
        // Find the closest previous quoted message ID with a movie link
        const quotedId = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
        const key = quotedId ? `cz_dl_${from}_${quotedId}` : null;
        const link = key ? cache.get(key) : null;

        if (!link) return conn.sendMessage(from, { text: "⚠️ Please reply to a movie details message first!" }, { quoted: msg });

        await conn.sendMessage(from, { react: { text: '📦', key: msg.key } });

        const dlApi = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/downloadurl?url=${encodeURIComponent(link)}&apiKey=d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56`;
        const dlRes = await axios.get(dlApi);
        const dl = dlRes.data;

        if (!dl.url) return conn.sendMessage(from, { text: "⚠️ No download link found." }, { quoted: msg });

        // Send movie as document (support MKV / MP4)
        const mimeType = dl.url.endsWith('.mkv') ? 'video/x-matroska' : 'video/mp4';
        const fileName = link.split('/').pop() + (dl.url.endsWith('.mkv') ? '.mkv' : '.mp4');

        await conn.sendMessage(from, {
          document: { url: dl.url },
          mimetype: mimeType,
          fileName: fileName,
          caption: `🎥 *CineSubz Movie Downloaded!*\n📺 Quality: ${dl.quality}\n💾 Size: ${dl.size}\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD`
        }, { quoted: msg });
      }
    };

    conn.ev.on('messages.upsert', listener);

  } catch (e) {
    await conn.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: mek });
  }
});
