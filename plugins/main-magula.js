const { cmd } = require('../command');
const axios = require('axios');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

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
    if (!q) return reply("🎬 Please enter a movie name!\nExample: .cz Titanic");

    await reply("🔎 Searching CineSubz...");

    // Search API
    const search = await axios.get(`https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/search?q=${encodeURIComponent(q)}&apiKey=d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56`);

    if (!search.data?.data || search.data.data.length === 0) return reply("❌ No results found!");

    let msg = `🎬 *CineSubz Movie Search Results*\n\n`;
    search.data.data.slice(0, 8).forEach((m, i) => {
      msg += `*${i + 1}.* ${m.title}\nType: ${m.type}\nYear: ${m.year}\nRating: ${m.rating || 'N/A'}\n\n`;
    });
    msg += "_Reply with number to view info_\n\n⚡ Powered by WhiteShadow-MD";

    const listMsg = await conn.sendMessage(from, { text: msg }, { quoted: mek });
    const listMsgId = listMsg.key.id;

    conn.ev.on("messages.upsert", async (upd) => {
      const msgUp = upd.messages[0];
      const text = msgUp.message?.conversation || msgUp.message?.extendedTextMessage?.text;
      const isReply = msgUp.message?.extendedTextMessage?.contextInfo?.stanzaId === listMsgId;
      if (!isReply) return;

      const num = parseInt(text) - 1;
      if (isNaN(num) || num < 0 || num >= search.data.data.length) return reply("❌ Invalid number!");

      const movie = search.data.data[num];
      await reply(`📑 Fetching info for *${movie.title}*...`);

      // Movie details API
      const detRes = await axios.get(`https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/movie-details?url=${encodeURIComponent(movie.link)}&apiKey=d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56`);
      const det = detRes.data.mainDetails;

      // Send info
      const infoMsg = await conn.sendMessage(from, {
        image: { url: det.imageUrl },
        caption: `🎬 *${det.maintitle}*\n🗓️ ${det.dateCreated}\n🌐 ${det.country}\n⏱️ ${det.runtime}\n\n_Reply "download" to get 720p movie_\n\n⚡ Powered by WhiteShadow-MD`
      }, { quoted: msgUp });
      const infoMsgId = infoMsg.key.id;

      // Listen for "download" reply
      conn.ev.on("messages.upsert", async (upd2) => {
        const dlMsg = upd2.messages[0];
        const dlText = dlMsg.message?.conversation || dlMsg.message?.extendedTextMessage?.text;
        const isDLReply = dlMsg.message?.extendedTextMessage?.contextInfo?.stanzaId === infoMsgId;
        if (!isDLReply || dlText.toLowerCase() !== "download") return;

        await reply(`📥 Preparing 720p download for *${det.maintitle}*...`);

        // Download URL API
        const dlRes = await axios.get(`https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/downloadurl?url=${encodeURIComponent(movie.link)}&apiKey=d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56`);
        const fileUrl = dlRes.data.url;
        const fileSizeMB = parseFloat(dlRes.data.size.replace(' GB','')) * 1024; // GB to MB

        if (fileSizeMB <= 2048) {
          // Send file using generateWAMessageFromContent
          const fileMsg = generateWAMessageFromContent(from, {
            documentMessage: {
              url: fileUrl,
              mimetype: "video/mp4",
              fileName: `${det.maintitle}.mp4`,
              caption: `🎬 *${det.maintitle}* (720p)\n⚡ Powered by WhiteShadow-MD`
            }
          }, { quoted: dlMsg });

          await conn.relayMessage(from, fileMsg.message, { messageId: fileMsg.key.id });
        } else {
          reply(`⚠️ File too large (${fileSizeMB.toFixed(2)} MB)\n📎 Download manually:\n${fileUrl}`);
        }
      });
    });

  } catch (e) {
    console.error(e);
    reply("⚠️ *Error!* Something went wrong.");
  }
});
