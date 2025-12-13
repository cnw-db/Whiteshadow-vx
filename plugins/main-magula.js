const { cmd } = require("../command");
const axios = require("axios");
const NodeCache = require("node-cache");

const movieCache = new NodeCache({ stdTTL: 100 });
const movieMap = new Map();

cmd({
  pattern: "cine",
  alias: ["cz"],
  desc: "🎬 Sinhala Sub Movies (CineSubz)",
  category: "media",
  react: "🎥",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {
  if (!q) return conn.sendMessage(from, { text: "❌ Use: .cine <movie name>" }, { quoted: mek });

  try {
    const searchUrl = `https://api.srihub.store/movie/cinesubz?apikey=dew_YyT0KDc2boHDasFlmZCqDcPoeDHReD20aYmEsm1G&q=${encodeURIComponent(q)}`;
    const searchRes = await axios.get(searchUrl);
    const list = searchRes.data?.result;

    if (!list?.length) return conn.sendMessage(from, { text: "❌ No results found." }, { quoted: mek });

    let text = "🔢 Reply with movie number:\n\n";
    list.forEach((m, i) => text += `*${i+1}.* ${m.title}\n`);

    const sentMsg = await conn.sendMessage(from, { text: `🎬 *CINESUBZ SEARCH*\n\n${text}` }, { quoted: mek });

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;
      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = list[num-1];
        if (!selected) return conn.sendMessage(from, { text: "*Invalid movie number.*" }, { quoted: msg });

        await conn.sendMessage(from, { react: { text: "🎯", key: msg.key } });

        // 🔗 Fetch movie download info
        const movieUrl = `https://api.srihub.store/movie/cinesubzdl?apikey=dew_YyT0KDc2boHDasFlmZCqDcPoeDHReD20aYmEsm1G&url=${encodeURIComponent(selected.link)}`;
        const movieRes = await axios.get(movieUrl);
        const movie = movieRes.data?.result;
        if (!movie?.downloadOptions?.length) return conn.sendMessage(from, { text: "❌ No download links." }, { quoted: msg });

        const links = movie.downloadOptions[0].links;
        let cap = `🎬 *${movie.title}*\n\n📥 Download Options:\n\n`;
        links.forEach((d, i) => cap += `*${i+1}.* ${d.quality} — ${d.size}\n`);
        cap += "\nReply with number to download.";

        const infoMsg = await conn.sendMessage(from, { image: { url: movie.images?.[0] }, caption: cap }, { quoted: msg });
        movieMap.set(infoMsg.key.id, { title: movie.title, downloads: links });
      }

      else if (movieMap.has(repliedId)) {
        const { title, downloads } = movieMap.get(repliedId);
        const num = parseInt(replyText);
        const chosen = downloads[num-1];
        if (!chosen) return conn.sendMessage(from, { text: "*Invalid quality number.*" }, { quoted: msg });

        // ✅ Get direct URL
        let directUrl = chosen.url;
        if (directUrl.includes("pixeldrain.com")) {
          const match = directUrl.match(/\/([A-Za-z0-9]+)$/);
          if (match) directUrl = `https://pixeldrain.com/api/file/${match[1]}`;
        }

        const sizeGB = chosen.size.toLowerCase().includes("gb") ? parseFloat(chosen.size) : parseFloat(chosen.size)/1024;
        if (sizeGB > 2) return conn.sendMessage(from, { text: `⚠️ File too large (${chosen.size})` }, { quoted: msg });

        await conn.sendMessage(from, { react: { text: "📥", key: msg.key } });
        await conn.sendMessage(from, {
          document: { url: directUrl },
          mimetype: "video/mp4",
          fileName: `${title} - ${chosen.quality}.mp4`,
          caption: `🎬 *${title}*\n🎥 ${chosen.quality}\n\n> Powered by WHITESHADOW-MD`
        }, { quoted: msg });
      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    return conn.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: mek });
  }
});
