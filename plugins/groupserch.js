// plugins/groupsearch.js
// WhatsApp Group Search Plugin with Safe/Unsafe Toggle
// Author: ChatGPT with chamod nimsara  (for WhiteShadow-MD) don't copy ⚠ 

const axios = require("axios");
const { cmd } = require("../command");

const BLOCK_PATTERNS = [
  /18\+/i, /adult/i, /nsfw/i, /sex/i, /porn/i, /bokep/i, /xxx/i,
  /hot/i, /nude/i, /call boy/i, /call girl/i, /escort/i,
  /service/i, /lesbian/i, /gay/i, /horny/i, /fetish/i,
  /dirty/i, /colmek/i, /coly/i, /okep/i
];

function isUnsafe(item) {
  const text = `${item?.name || ""} ${item?.description || ""} ${item?.category || ""}`.toLowerCase();
  if (BLOCK_PATTERNS.some(r => r.test(text))) return true;
  if (/\b(1[0-7]|[0-9])\b/.test(text)) return true;
  if (/age\s*(\d{1,2})/.test(text)) {
    const n = parseInt(text.match(/age\s*(\d{1,2})/)[1], 10);
    if (n < 18) return true;
  }
  return false;
}

function fmtItem(it, idx) {
  return `*${idx}. ${it.name?.trim() || "(no title)"}*\n🌍 ${it.country || "Unknown"} | 🏷️ ${it.category || "N/A"}\n🔗 ${it.link}`;
}

cmd({
  pattern: "groupsearch",
  alias: ["grsearch", "cari"],
  use: ".groupsearch <query> [--limit N] [--cat category] [--unsafe]",
  desc: "Search WhatsApp groups (Safe by default, add --unsafe to allow 18+)",
  category: "search",
  react: "🔎",
  filename: __filename
},
async (conn, mek, m, { args, reply }) => {
  try {
    if (!args.length) return reply("*Usage:* .groupsearch <query> [--limit N] [--cat category] [--unsafe]");

    let limit = 15;
    let categoryFilter = null;
    let allowUnsafe = false;

    args = args.filter((a, i) => {
      if (a === "--limit" && args[i + 1] && /^\d+$/.test(args[i + 1])) {
        limit = Math.min(30, Math.max(1, parseInt(args[i + 1])));
        return false;
      }
      if (a === "--cat" && args[i + 1]) {
        categoryFilter = args[i + 1].toLowerCase();
        return false;
      }
      if (a === "--unsafe") {
        allowUnsafe = true;
        return false;
      }
      return true;
    });

    const query = args.join(" ");
    const url = `https://api.nazirganz.space/api/internet/carigc?query={encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { timeout: 15000 });

    // Handle both "data.data" and "data.result"
    const resultsRaw = data?.data || data?.result;
    if (!data || data.status !== true || !Array.isArray(resultsRaw)) {
      return reply("❌ Invalid API response.");
    }

    let results = resultsRaw;
    if (!allowUnsafe) results = results.filter(it => !isUnsafe(it));
    if (categoryFilter) results = results.filter(it => (it.category || "").toLowerCase().includes(categoryFilter));

    const seen = new Set();
    results = results.filter(it => {
      if (!it.link || seen.has(it.link)) return false;
      seen.add(it.link);
      return true;
    });

    if (!results.length) {
      return reply(`⚠️ No ${allowUnsafe ? "results" : "*safe* results*"} for “${query}”${categoryFilter ? ` in category ${categoryFilter}` : ""}.`);
    }

    results = results.slice(0, limit);
    let text = `🔍 *WhatsApp Group Search*\n🔖 Query: ${query}\n🔰 Mode: ${allowUnsafe ? "🔞 Unsafe (18+ allowed)" : "✅ Safe"}\n📊 Results: ${results.length}\n\n`;
    results.forEach((it, i) => text += fmtItem(it, i + 1) + "\n\n");

    await reply(text.trim());
  } catch (e) {
    console.error("[groupsearch]", e);
    reply("❌ Failed to fetch results. Try again later.");
  }
});

module.exports = {};
