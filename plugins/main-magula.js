const { cmd } = require("../command");
const axios = require("axios");
const config = require('../config');
const NodeCache = require("node-cache");

const movieCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

const movieMap = new Map();

cmd({
  pattern: "cine",
  alias: ["cz"],
  desc: "🎬 Sinhala Sub Movies (CineSubz)",
  category: "media",
  react: "🎥",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return conn.sendMessage(from, {
      text: "❌ *Use:*\n.sinhalasub <movie name>"
    }, { quoted: mek });
  }

  try {
    /* 🔍 SEARCH */
    const searchUrl =
      `https://api.srihub.store/movie/cinesubz?apikey=dew_YyT0KDc2boHDasFlmZCqDcPoeDHReD20aYmEsm1G&q=${encodeURIComponent(q)}`;

    const searchRes = await axios.get(searchUrl);
    const list = searchRes.data?.result;

    if (!list || !list.length) {
      return conn.sendMessage(from, {
        text: "❌ No results found."
      }, { quoted: mek });
    }

    let text = "🔢 *Reply with movie number*\n━━━━━━━━━━━━━━━\n\n";
    list.forEach((m, i) => {
      text += `*${i + 1}.* ${m.title}\n`;
    });

    const sentMsg = await conn.sendMessage(from, {
      text: `🎬 *CINESUBZ SEARCH*\n\n${text}\n\n> Powered by WHITESHADOW-MD`
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
          `https://api.srihub.store/movie/cinesubzdl?apikey=dew_YyT0KDc2boHDasFlmZCqDcPoeDHReD20aYmEsm1G&url=${encodeURIComponent(selected.link)}`;

        const movieRes = await axios.get(movieUrl);
        const movie = movieRes.data?.result;

        if (!movie?.downloadOptions?.length) {
          return conn.sendMessage(from, {
            text: "❌ No download links available."
          }, { quoted: msg });
        }

        const links = movie.downloadOptions[0].links;

        let cap =
          `🎬 *${movie.title}*\n\n` +
          `📅 Year: ${movie.info?.year}\n` +
          `🌍 Country: ${movie.info?.country}\n` +
          `🎞 Director: ${movie.info?.director}\n\n` +
          `📥 *Download Options*\n\n`;

        links.forEach((d, i) => {
          cap += `*${i + 1}.* ${d.quality} — ${d.size}\n`;
        });

        cap += "\n🔢 *Reply with quality number*";

        const infoMsg = await conn.sendMessage(from, {
          image: { url: movie.images?.[0] },
          caption: cap
        }, { quoted: msg });

        movieMap.set(infoMsg.key.id, {
          title: movie.title,
          downloads: links
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
          document: { url: chosen.url },
          mimetype: "video/mp4",
          fileName: `${title} - ${chosen.quality}.mp4`,
          caption:
            `🎬 *${title}*\n` +
            `🎥 ${chosen.quality}\n\n` +
            `> Powered by WHITESHADOW-MD`
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
