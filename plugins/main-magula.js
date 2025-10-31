const { cmd } = require("../command");
const axios = require("axios");

cmd({
  pattern: "cz",
  desc: "Search Sinhala-subbed movies or series (Cinesubz API)",
  category: "media",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  const API_KEY = "d3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56";

  if (!q) {
    return await conn.sendMessage(from, {
      text: `🎬 *Usage:*\n.sinhalasub <movie name>\n\n📌 Example: .sinhalasub new`,
    }, { quoted: mek });
  }

  try {
    // 1️⃣ Search movies
    const searchUrl = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/search?q=${encodeURIComponent(q)}&apiKey=${API_KEY}`;
    const { data } = await axios.get(searchUrl);

    if (!data.data || data.data.length === 0)
      throw new Error("No movies or series found!");

    const results = data.data.slice(0, 10); // limit to first 10 results
    let list = "🎞️ *Cinesubz Sinhala Sub Search Results*\n━━━━━━━━━━━━━━━\n";
    results.forEach((item, i) => {
      list += `🎬 ${i + 1}. *${item.title}*\n📆 ${item.year} | ⭐ ${item.rating}\n\n`;
    });
    list += "🟢 Reply with the *number* to view download info.";

    const sent = await conn.sendMessage(from, { text: list }, { quoted: mek });

    const listener = async (u) => {
      const msg = u.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;
      const replyText = msg.message.extendedTextMessage.text.trim();
      const replyId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyId !== sent.key.id) return;
      const choice = parseInt(replyText);
      if (isNaN(choice) || choice < 1 || choice > results.length)
        return await conn.sendMessage(from, { text: "❌ Invalid choice!" }, { quoted: msg });

      const movie = results[choice - 1];

      // 2️⃣ Get movie details
      const detailUrl = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/movie-details?url=${encodeURIComponent(movie.link)}&apiKey=${API_KEY}`;
      const detailRes = await axios.get(detailUrl);

      const detail = detailRes.data;
      let caption = `🎬 *${movie.title}*\n`;
      caption += `⭐ ${movie.rating} | 📆 ${movie.year}\n\n`;
      caption += `${movie.description}\n\n`;
      caption += `🎞️ Type "1" to get Download Link\n🛑 Type "done" to cancel`;

      const detailMsg = await conn.sendMessage(from, {
        image: { url: movie.imageSrc },
        caption
      }, { quoted: msg });

      const dlListener = async (up) => {
        const m2 = up.messages?.[0];
        if (!m2?.message?.extendedTextMessage) return;
        const txt = m2.message.extendedTextMessage.text.trim().toLowerCase();
        const refId = m2.message.extendedTextMessage.contextInfo?.stanzaId;

        if (refId !== detailMsg.key.id) return;

        if (txt === "done") {
          conn.ev.off("messages.upsert", dlListener);
          return await conn.sendMessage(from, { text: "✅ Cancelled." }, { quoted: m2 });
        }

        if (txt === "1") {
          // 3️⃣ Fetch download URL
          const dlUrl = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz/downloadurl?url=${encodeURIComponent(movie.link)}&apiKey=${API_KEY}`;
          const dlRes = await axios.get(dlUrl);
          const dl = dlRes.data;

          if (!dl.url)
            return await conn.sendMessage(from, { text: "❌ Download link not found." }, { quoted: m2 });

          await conn.sendMessage(from, {
            text: `📦 *Download Info*\n\n🎬 ${movie.title}\n⭐ ${movie.rating}\n📆 ${movie.year}\n🎥 Quality: ${dl.quality || "N/A"}\n💾 Size: ${dl.size || "Unknown"}\n\n📥 *Download Link:*\n${dl.url}`
          }, { quoted: m2 });
        }
      };

      conn.ev.on("messages.upsert", dlListener);
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    console.log(err.message);
    await conn.sendMessage(from, {
      text: `❌ *Error:* ${err.message || "Something went wrong!"}`,
    }, { quoted: mek });
  }
});
