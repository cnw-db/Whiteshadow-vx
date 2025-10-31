const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "cz",
  alias: ["cinesubz", "csub"],
  react: "🎬",
  desc: "Search Sinhala Sub Movies from CineSubz",
  category: "movie",
  filename: __filename
}, async (conn, m, text) => {
  try {
    if (!text) return m.reply("🔎 *Please enter a movie or TV name!*\n\nExample: .cz new");

    const apiKey = "d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56";
    const base = "https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz";
    
    // 🔍 Search Movies
    const search = await axios.get(`${base}/search?q=${encodeURIComponent(text)}&apiKey=${apiKey}`);
    const results = search.data?.data || [];

    if (results.length === 0) return m.reply("❌ No results found!");

    // 🔢 Create selectable list
    let list = "🎥 *CineSubz Results:*\n\n";
    results.slice(0, 10).forEach((item, i) => {
      list += `${i + 1}. *${item.title}* (${item.year})\n🎞️ ${item.type}\n⭐ ${item.rating || 'N/A'}\n\n`;
    });
    list += "\n💡 *Reply with a number (1-10) to get details.*";

    await m.reply(list);

    // Wait for reply number
    conn.once('chat-update', async (msgUpdate) => {
      const selectedMsg = msgUpdate.messages?.first?.message?.conversation;
      if (!selectedMsg) return;

      const num = parseInt(selectedMsg);
      if (isNaN(num) || num < 1 || num > results.length) return m.reply("⚠️ Invalid selection.");

      const movie = results[num - 1];

      // 🎬 Get Movie Details
      const detailRes = await axios.get(`${base}/movie-details?url=${encodeURIComponent(movie.link)}&apiKey=${apiKey}`);
      const details = detailRes.data.mainDetails;
      const info = detailRes.data.moviedata;

      let caption = `🎬 *${details.maintitle}*\n\n`;
      caption += `⭐ IMDb: ${details.rating.value || "N/A"} (${details.rating.count || "?"} votes)\n`;
      caption += `🕒 Duration: ${details.runtime}\n🌍 Country: ${details.country}\n📅 Year: ${details.dateCreated}\n🎭 Genre: ${details.genres.join(", ")}\n\n`;
      caption += `🧾 *Description:* ${info.description.slice(0, 300)}...\n\n`;
      caption += `🎥 [View on Cinesubz](${movie.link})`;

      await conn.sendMessage(m.chat, {
        image: { url: details.imageUrl },
        caption
      });

      // Optional: Download Example
      if (info.title && info.title.includes("telegra.ph")) {
        await conn.sendMessage(m.chat, { text: "📥 Use below command to get download link:\n\n`.czdl " + movie.link + "`" });
      }
    });

  } catch (err) {
    console.error(err);
    m.reply("❌ Error while fetching movie data!");
  }
});


// 🎬 DOWNLOAD COMMAND (.czdl)
cmd({
  pattern: "czdl",
  desc: "Get download link from CineSubz",
  category: "movie",
  react: "⬇️",
  filename: __filename
}, async (conn, m, text) => {
  try {
    if (!text) return m.reply("⚠️ Provide a valid CineSubz episode or movie URL!");

    const apiKey = "d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56";
    const base = "https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz";

    const res = await axios.get(`${base}/downloadurl?url=${encodeURIComponent(text)}&apiKey=${apiKey}`);
    const dl = res.data;

    if (!dl.url) return m.reply("❌ Download link not found.");

    let msg = `🎬 *Download Info*\n\n📁 Size: ${dl.size}\n📹 Quality: ${dl.quality}\n\n🎥 [Click to Download](${dl.url})`;
    await conn.sendMessage(m.chat, { video: { url: dl.url }, caption: msg });
  } catch (err) {
    console.error(err);
    m.reply("⚠️ Failed to fetch download link!");
  }
});
