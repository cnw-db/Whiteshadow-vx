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
    const list = searchRes.data?.data?.data;

    if (!list || !list.length) {
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
        if (!selected) {
          return conn.sendMessage(from, {
            text: "*Invalid movie number.*"
          }, { quoted: msg });
        }

        await conn.sendMessage(from, {
          react: { text: "🎯", key: msg.key }
        });

        const movieUrl =
          `https://movanest.zone.id/v2/sublk?url=${encodeURIComponent(selected.link)}`;

        const movieRes = await axios.get(movieUrl);
        const movie = movieRes.data;

        if (!movie?.pixeldrainDownloads?.length) {
          return conn.sendMessage(from, {
            text: "❌ No WhatsApp-compatible downloads."
          }, { quoted: msg });
        }

        let cap =
          `🎬 *${movie.title}*\n\n` +
          `⭐ IMDb: ${movie.imdb}\n` +
          `📅 Date: ${movie.date}\n` +
          `🌍 Country: ${movie.country}\n` +
          `⏱ Runtime: ${movie.runtime}\n\n` +
          `📥 *Available Downloads*\n\n`;

        movie.pixeldrainDownloads.forEach((d, i) => {
          cap += `*${i + 1}.* ${d.quality} — ${d.size}\n`;
        });

        cap += "\n🔢 *Reply with quality number*";

        const infoMsg = await conn.sendMessage(from, {
          image: { url: movie.image },
          caption: cap
        }, { quoted: msg });

        movieMap.set(infoMsg.key.id, {
          title: movie.title,
          downloads: movie.pixeldrainDownloads
        });
      }

      /* 📥 QUALITY SELECT */
      else if (movieMap.has(repliedId)) {
        const { title, downloads } = movieMap.get(repliedId);
        const num = parseInt(replyText);
        const chosen = downloads[num - 1];

        if (!chosen) {
          return conn.sendMessage(from, {
            text: "*Invalid quality number.*"
          }, { quoted: msg });
        }

        const sizeTxt = chosen.size.toLowerCase();
        const sizeGB = sizeTxt.includes("gb")
          ? parseFloat(sizeTxt)
          : parseFloat(sizeTxt) / 1024;

        if (sizeGB > 2) {
          return conn.sendMessage(from, {
            text: `⚠️ *File too large (${chosen.size})*`
          }, { quoted: msg });
        }

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

  } catch (err) {
    await conn.sendMessage(from, {
      text: `❌ *Error:* ${err.message}`
    }, { quoted: mek });
  }
});
