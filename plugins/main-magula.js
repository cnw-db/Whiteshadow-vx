const { cmd } = require('../command');
const axios = require('axios');
const fetch = require('node-fetch');

cmd({
  pattern: "cz",
  alias: ["czmovie", "cinesubz"],
  desc: "Search Sinhala Sub movies (CineSubz API)",
  category: "movie",
  react: "🎬",
  use: ".cz <movie name>",
  filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
  try {
    if (!q) return reply("🎬 *Please enter a movie name!*\nExample: .cz Titanic");

    reply("🔎 Searching CineSubz...");

    const searchRes = await axios.get(`https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/search?q=${encodeURIComponent(q)}&apiKey=d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56`);
    const searchData = searchRes.data.data; // <-- API structure

    if (!searchData || searchData.length === 0) return reply("❌ No results found!");

    let msg = `🎬 *CineSubz Movie Search*\n\n`;
    searchData.slice(0, 8).forEach((movie, i) => {
      msg += `*${i + 1}.* ${movie.title}\n🗓️ ${movie.year}\n🎞️ ${movie.type}\n\n`;
    });
    msg += "_Reply with number to view info_\n\n⚡ Powered by WhiteShadow-MD";

    await conn.sendMessage(from, { text: msg }, { quoted: mek });

    conn.ev.once('messages.upsert', async (data) => {
      const selected = data.messages[0].message?.conversation;
      if (!selected) return;
      const num = parseInt(selected);
      if (isNaN(num) || num < 1 || num > searchData.length) return reply("❌ Invalid number!");

      const movie = searchData[num - 1];
      reply(`📑 Fetching info for *${movie.title}*...`);

      const infoRes = await axios.get(`https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/movie-details?url=${encodeURIComponent(movie.link)}&apiKey=d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56`);
      const det = infoRes.data.mainDetails;

      let caption = `🎬 *${det.maintitle}*\n🗓️ ${det.dateCreated || 'Unknown'}\n🎞️ ${movie.type}\n🌐 ${det.country || 'N/A'}\n📄 ${det.genres?.join(", ") || 'Unknown'}\n⏱️ ${det.runtime || 'N/A'}\n\n${movie.description || ''}\n\n_Reply "download" to get 720p movie_\n\n⚡ Powered by WhiteShadow-MD`;

      await conn.sendMessage(from, {
        image: { url: det.imageUrl || movie.imageSrc },
        caption: caption
      }, { quoted: mek });

      conn.ev.once('messages.upsert', async (data2) => {
        const msg2 = data2.messages[0].message?.conversation?.toLowerCase();
        if (!msg2.includes("download")) return;
        reply(`📥 Preparing 720p download for *${det.maintitle}*...`);

        const dlRes = await axios.get(`https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/downloadurl?url=${encodeURIComponent(movie.link)}&apiKey=d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56`);
        const fileUrl = dlRes.data.url;
        const fileSize = dlRes.data.size;
        const quality = dlRes.data.quality;

        if (!fileUrl) return reply("❌ Download link not found!");

        // Check size (in GB)
        const sizeGB = parseFloat(fileSize.replace(" GB", ""));
        if (sizeGB <= 2) {
          reply(`📤 Sending *${det.maintitle}* (${fileSize})...`);
          await conn.sendMessage(from, {
            document: { url: fileUrl },
            fileName: `${det.maintitle}.mp4`,
            mimetype: "video/mp4",
            caption: `🎬 *${det.maintitle}* (${quality})\n⚡ Powered by WhiteShadow-MD`
          }, { quoted: mek });
        } else {
          reply(`⚠️ File too large (${fileSize})\n📎 Download manually:\n${fileUrl}\n\n⚡ Powered by WhiteShadow-MD`);
        }
      });
    });

  } catch (e) {
    console.error(e);
    reply("⚠️ *Error!* Something went wrong.");
  }
});
