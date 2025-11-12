const { cmd } = require('../command');
const axios = require('axios');
const NodeCache = require('node-cache');
const movieCache = new NodeCache({ stdTTL: 300 });

cmd({
  pattern: "cinesubz",
  alias: ["cz"],
  desc: "🎥 Search Sinhala subbed movies from CineSubz",
  category: "media",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {

  if (!q) return reply("📽️ *Usage:* .cinesubz <movie name>");

  try {
    const cacheKey = `cinesubz_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {
      const url = `https://darkyasiya-new-movie-api.vercel.app/api/movie/cinesubz/search?q=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
      data = res.data;
      if (!data.success || !data.data.all?.length) throw new Error("❌ No results found for your query.");
      movieCache.set(cacheKey, data);
    }

    const movieList = data.data.all.map((mov, i) => ({
      number: i + 1,
      title: mov.title,
      link: mov.link
    }));

    let textList = "🎬 *CINESUBZ MOVIE SEARCH*\n━━━━━━━━━━━━━━━\n\n";
    movieList.forEach(m => textList += `🔹 *${m.number}. ${m.title}*\n`);
    textList += "\n💬 *Reply with movie number to view details.*";

    const sentMsg = await conn.sendMessage(from, {
      text: textList
    }, { quoted: mek });

    const movieMap = new Map();

    conn.ev.on("messages.upsert", async (update) => {
      try {
        const msg = update.messages?.[0];
        if (!msg?.message?.extendedTextMessage) return;

        const replyText = msg.message.extendedTextMessage.text.trim();
        const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;
        const sender = msg.key.remoteJid;

        if (repliedId === sentMsg.key.id && sender === from) {
          const num = parseInt(replyText);
          const selected = movieList.find(m => m.number === num);
          if (!selected) return conn.sendMessage(from, { text: "❌ Invalid number." }, { quoted: msg });

          await conn.sendMessage(from, { react: { text: "🔎", key: msg.key } });

          const movieUrl = `https://darkyasiya-new-movie-api.vercel.app/api/movie/cinesubz/movie?url=${encodeURIComponent(selected.link)}`;
          const movieRes = await axios.get(movieUrl);
          const movie = movieRes.data.data;

          const dlUrl = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/downloadurl?url=${encodeURIComponent(selected.link)}&apiKey=35f70afaa18af9b20b76e3a38bdd18b33aff49244f9968e489123ae5834f950e`;
          const dlRes = await axios.get(dlUrl);
          const download = dlRes.data;

          if (!download.url?.length) return conn.sendMessage(from, { text: "❌ No download links found." }, { quoted: msg });

          let caption = `🎬 *${movie.title}*\n\n` +
            `⭐ *IMDb:* ${movie.imdb.value}\n` +
            `📅 *Released:* ${movie.dateCreate}\n` +
            `🌍 *Country:* ${movie.country}\n` +
            `🕐 *Runtime:* ${movie.runtime}\n` +
            `🎭 *Genre:* ${movie.category.join(", ")}\n` +
            `🧑‍🎤 *Cast:* ${movie.cast?.map(c => c.actor.name).slice(0, 10).join(", ")}\n\n` +
            `🎥 *Download Links:*\n`;

          download.url.forEach((d, i) => {
            caption += `🔸 ${i + 1}. *${d.quality}* — ${d.size}\n`;
          });
          caption += "\n💬 *Reply with number to download.*";

          const downloadMsg = await conn.sendMessage(from, {
            image: { url: movie.mainImage },
            caption
          }, { quoted: msg });

          movieMap.set(downloadMsg.key.id, { selected, downloads: download.url });
        }

        // download selection
        else if (movieMap.has(repliedId) && sender === from) {
          const { selected, downloads } = movieMap.get(repliedId);
          const num = parseInt(replyText);
          const chosen = downloads[num - 1];
          if (!chosen) return conn.sendMessage(from, { text: "❌ Invalid number." }, { quoted: msg });

          await conn.sendMessage(from, { react: { text: "📥", key: msg.key } });

          await conn.sendMessage(from, {
            document: { url: chosen.url },
            mimetype: "video/mp4",
            fileName: `${selected.title} - ${chosen.quality}.mp4`,
            caption: `🎬 ${selected.title}\n📺 ${chosen.quality}\n\n> ᴡʜɪᴛᴇsʜᴀᴅᴏᴡ-ᴍᴅ`
          }, { quoted: msg });
        }
      } catch (err) {
        console.log("CineSubz listener error:", err.message);
      }
    });

  } catch (err) {
    reply(`❌ *Error:* ${err.message}`);
  }
});
