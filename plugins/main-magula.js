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

    const search = await axios.get(`https://foreign-marna-sithaunarathnapromax.koyeb.app/cz?search=${encodeURIComponent(q)}`);
    if (!search.data || search.data.length === 0) return reply("❌ No results found!");

    let msg = `🎬 *CineSubz Movie Search*\n\n`;
    search.data.slice(0, 8).forEach((m, i) => {
      msg += `*${i + 1}.* ${m.title}\n🎞️ ${m.quality}\n🕐 ${m.time}\n\n`;
    });
    msg += "_Reply with number to view info_\n\n⚡ Powered by WhiteShadow-MD";

    await conn.sendMessage(from, { text: msg }, { quoted: mek });

    conn.ev.once('messages.upsert', async (data) => {
      const selected = data.messages[0].message?.conversation;
      if (!selected) return;
      const num = parseInt(selected);
      if (isNaN(num) || num < 1 || num > search.data.length) return reply("❌ Invalid number!");

      const movie = search.data[num - 1];
      reply(`📑 Fetching info for *${movie.title}*...`);

      const info = await axios.get(`https://foreign-marna-sithaunarathnapromax.koyeb.app/czinfo?url=${encodeURIComponent(movie.link)}`);
      const det = info.data;

      let caption = `🎬 *${det.title}*\n🗓️ ${det.year || 'Unknown'}\n🎞️ ${det.quality}\n🌐 ${det.language || 'N/A'}\n📄 ${det.genre || 'Unknown'}\n\n${det.description || ''}\n\n_Reply "download" to get 720p movie_\n\n⚡ Powered by WhiteShadow-MD`;

      await conn.sendMessage(from, {
        image: { url: det.image || movie.image },
        caption: caption
      }, { quoted: mek });

      conn.ev.once('messages.upsert', async (data2) => {
        const msg2 = data2.messages[0].message?.conversation?.toLowerCase();
        if (!msg2.includes("download")) return;
        reply(`📥 Preparing 720p download for *${det.title}*...`);

        const dl = await axios.get(`https://foreign-marna-sithaunarathnapromax.koyeb.app/czdl?url=${encodeURIComponent(movie.link)}`);
        const fileUrl = dl.data?.download;
        if (!fileUrl) return reply("❌ Download link not found!");

        const head = await fetch(fileUrl, { method: 'HEAD' });
        const size = head.headers.get('content-length');
        const fileSizeMB = (size / (1024 * 1024)).toFixed(2);

        if (fileSizeMB <= 2048) {
          reply(`📤 Sending *${det.title}* (${fileSizeMB} MB)...`);
          await conn.sendMessage(from, {
            document: { url: fileUrl },
            fileName: `${det.title}.mp4`,
            mimetype: "video/mp4",
            caption: `🎬 *${det.title}* (720p)\n⚡ Powered by WhiteShadow-MD`
          }, { quoted: mek });
        } else {
          reply(`⚠️ File too large (${fileSizeMB}MB)\n📎 Download manually:\n${fileUrl}\n\n⚡ Powered by WhiteShadow-MD`);
        }
      });
    });

  } catch (e) {
    console.error(e);
    reply("⚠️ *Error!* Something went wrong.");
  }
});
