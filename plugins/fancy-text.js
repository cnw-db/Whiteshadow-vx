const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "fancy",
  alias: ["font", "style"],
  react: "✍️",
  desc: "Convert text into various fancy fonts.",
  category: "tools",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q) {
      return reply(
        "❎ Please provide text to convert into fancy fonts.\n\n*Example:* .fancy whiteshadow"
      );
    }

    const apiUrl = `https://movanest.zone.id/v2/fancytext?word=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.status || !Array.isArray(data.results)) {
      return reply("❌ Fancy text fetch failed. Try again later.");
    }

    let text = `✨ *Fancy Fonts Converter* ✨\n`;
    text += `📝 *Word:* ${q}\n`;
    text += `🔢 *Total Fonts:* ${data.results.length}\n\n`;

    data.results.forEach((font, index) => {
      text += `*${index + 1}.* ${font}\n`;
    });

    text += `\n> © Powered by *WHITESHADOW-MD*`;

    await conn.sendMessage(from, { text }, { quoted: m });

  } catch (err) {
    console.error("Fancy command error:", err);
    reply("⚠️ Error occurred while generating fancy fonts.");
  }
});
