const { cmd } = require("../command");
const axios = require("axios");
const NodeCache = require("node-cache");

const movieCache = new NodeCache({ stdTTL: 300 });
const movieMap = new Map();

cmd({
  pattern: "sublk",
  alias: ["sub"],
  desc: "🎬 Sinhala Sub Movies (Sub.lk)",
  category: "media",
  react: "🎥",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return conn.sendMessage(from, {
      text: "❌ *Use:* .sublk <movie name>"
    }, { quoted: mek });
  }

  try {
    /* 🔍 SEARCH */
    const searchUrl =
      `https://darkyasiya-new-movie-api.vercel.app/api/movie/sublk/search?q=${encodeURIComponent(q)}`;

    const searchRes = await axios.get(searchUrl);

    // ✅ FINAL CORRECT PATH
    const list = searchRes.data?.data?.all;

    if (!Array.isArray(list) || !list.length) {
      return conn.sendMessage(from, {
        text: "❌ No results found."
      }, { quoted: mek });
    }

    let txt = "🔢 *Reply with movie number*\n━━━━━━━━━━━━━━━\n\n";
    list.forEach((m, i) => {
      txt += `*${i + 1}.* ${m.title}\n`;
    });

    const sentMsg = await conn.sendMessage(from, {
      text: `🎬 *SUB.LK SEARCH*\n\n${txt}\n\n> Powered by WHITESHADOW-MD`
    }, { quoted: mek });

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId =
        msg.message.extendedTextMessage.contextInfo?.stanzaId;

      /* 🎬 MOVIE SELECT */
      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = list[num - 1];
        if (!selected) return;

        await conn.sendMessage(from, {
          react: { text: "🎯", key: msg.key }
        });

        const movieUrl =
          `https://movanest.zone.id/v2/sublk?url=${encodeURIComponent(selected.link)}`;

        const movieRes = await axios.get(movieUrl);
        const movie = movieRes.data;

        if (!movie?.pixeldrainDownloads?.length) {
          return conn.sendMessage(from, {
            text: "❌ WhatsApp-compatible files not found."
          }, { quoted: msg });
        }

        // ✅ ≤ 2GB only
        const safe = movie.pixeldrainDownloads.filter(d => {
          const s = d.size.toLowerCase();
          const gb = s.includes("gb") ? parseFloat(s) : parseFloat(s) / 1024;
          return gb <= 2;
        });

        if (!safe.length) {
          return conn.sendMessage(from, {
            text: "⚠️ Files exceed WhatsApp 2GB limit."
          }, { quoted: msg });
        }

        let cap =
          `🎬 *${movie.title}*\n\n` +
          `⭐ IMDb: ${movie.imdb}\n` +
          `📅 Date: ${movie.date}\n` +
          `🌍 Country: ${movie.country}\n\n` +
          `📥 *Downloads*\n\n`;

        safe.forEach((d, i) => {
          cap += `*${i + 1}.* ${d.quality} — ${d.size}\n`;
        });

        cap += "\n🔢 *Reply with quality number*";

        const infoMsg = await conn.sendMessage(from, {
          image: { url: movie.image },
          caption: cap
        }, { quoted: msg });

        movieMap.set(infoMsg.key.id, {
          title: movie.title,
          downloads: safe
        });
      }

      /* 📥 QUALITY SELECT */
      else if (movieMap.has(repliedId)) {
        const { title, downloads } = movieMap.get(repliedId);
        const num = parseInt(replyText);
        const chosen = downloads[num - 1];
        if (!chosen) return;

        await conn.sendMessage(from, {
          react: { text: "📥", key: msg.key }
        });

        await conn.sendMessage(from, {
          document: { url: chosen.finalDownloadUrl },
          mimetype: "video/mp4",
          fileName: `${title} - ${chosen.quality}.mp4`,
          caption:
            `🎬 *${title}*\n🎥 ${chosen.quality}\n\n> Powered by WHITESHADOW-MD`
        }, { quoted: msg });
      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (e) {
    console.log(e);
    await conn.sendMessage(from, {
      text: "❌ API Error"
    }, { quoted: mek });
  }
});
