const { cmd } = require("../command");
const axios = require("axios");
const NodeCache = require("node-cache");

const movieCache = new NodeCache({ stdTTL: 300 });

/*
COMMANDS
.sublk <movie name>        -> search
.sublkdl <number>          -> download
*/

cmd({
  pattern: "sublk",
  alias: ["sub"],
  react: "🎬",
  desc: "Search Sinhala subtitle movies (sub.lk)",
  category: "movie",
  use: ".sublk <movie name>",
  filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
  try {
    if (!args.length) return reply("❌ Movie name ekak denna\n\nExample:\n.sublk new");

    const query = args.join(" ");
    const searchUrl = `https://darkyasiya-new-movie-api.vercel.app/api/movie/sublk/search?q=${encodeURIComponent(query)}`;

    const res = await axios.get(searchUrl);
    const list = res.data?.data?.movies || res.data?.data?.all;

    if (!list || list.length === 0) {
      return reply("❌ No results found.");
    }

    let text = `🎬 *SUB.LK SEARCH RESULTS*\n\n`;
    let store = [];

    list.slice(0, 10).forEach((m, i) => {
      text += `*${i + 1}.* ${m.title}\n⭐ IMDb: ${m.imdb}\n📅 Year: ${m.year}\n\n`;
      store.push({
        title: m.title,
        link: m.link
      });
    });

    movieCache.set(from, store);

    text += `📥 Download කරන්න:\n*.sublkdl <number>*\n\nExample:\n.sublkdl 1`;

    await reply(text);

  } catch (e) {
    console.log(e);
    reply("❌ Error fetching movies.");
  }
});


cmd({
  pattern: "sublkdl",
  react: "⬇️",
  desc: "Download Sinhala subtitle movie",
  category: "movie",
  use: ".sublkdl <number>",
  filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
  try {
    if (!args.length) return reply("❌ Number ekak denna");

    const cache = movieCache.get(from);
    if (!cache) return reply("❌ Search eka expire wela. Ayeth search karanna.");

    const index = parseInt(args[0]) - 1;
    if (!cache[index]) return reply("❌ Invalid number");

    const movie = cache[index];

    const dlApi = `https://movanest.zone.id/v2/sublk?url=${encodeURIComponent(movie.link)}`;
    const res = await axios.get(dlApi);

    if (!res.data || !res.data.result) {
      return reply("❌ Download link fetch karanna bari una.");
    }

    const data = res.data.result;

    let caption = `🎬 *${movie.title}*\n\n`;
    caption += `📁 Size: ${data.size || "Unknown"}\n`;
    caption += `🎞 Quality: ${data.quality || "HD"}\n`;
    caption += `🌐 Source: sub.lk\n\n`;
    caption += `⬇️ Downloading...`;

    await reply(caption);

    // REAL MOVIE FILE SEND (≤2GB WhatsApp limit)
    await conn.sendMessage(from, {
      document: { url: data.download },
      mimetype: "video/mp4",
      fileName: `${movie.title}.mp4`
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply("❌ Movie send karaddi error ekak.");
  }
});
