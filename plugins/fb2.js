const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "facebook2",
  alias: ["fb2", "fbv", "fbdown", "fbdl"],
  react: "🎥",
  desc: "Download Facebook videos - WhiteShadow-MD",
  category: "download",
  use: ".facebook <url>",
  filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("🚩 *Please provide a valid Facebook video link!*");

    // Fetch video info from API
    const api = `https://api.ootaizumi.web.id/downloader/facebook?url=${encodeURIComponent(q)}`;
    const res = await axios.get(api);
    const data = res.data?.result;

    if (!data || !data.downloads || data.downloads.length === 0)
      return reply("❌ *Couldn't find downloadable links. Try another link!*");

    // Create video option list
    const qualityList = data.downloads.map((v, i) => `*${i + 1}.* ${v.quality}`).join("\n");

    const caption = `⚡ *WHITESHADOW-MD — FACEBOOK DOWNLOADER* ⚡

🎬 *Video Detected!*
Choose your desired quality 👇

${qualityList}

📌 *Reply with the number (1, 2, 3...)* to download.
`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: data.thumbnail },
      caption: caption,
      contextInfo: {
        externalAdReply: {
          title: "Facebook Downloader",
          body: "WhiteShadow-MD | Powered by Chamod",
          thumbnailUrl: data.thumbnail,
          mediaType: 1,
          sourceUrl: q
        }
      }
    });

    const messageID = sentMsg.key.id;

    // Reply listener
    conn.ev.on("messages.upsert", async (msgUpdate) => {
      try {
        const mekInfo = msgUpdate?.messages?.[0];
        if (!mekInfo?.message) return;

        const userText =
          mekInfo?.message?.conversation ||
          mekInfo?.message?.extendedTextMessage?.text;

        const isReply =
          mekInfo?.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID;

        if (!isReply) return;

        const choice = parseInt(userText.trim());
        if (isNaN(choice) || choice < 1 || choice > data.downloads.length) {
          return reply("❌ *Invalid choice! Please reply with a valid number.*");
        }

        const selected = data.downloads[choice - 1];
        await conn.sendMessage(from, { react: { text: "⬇️", key: mekInfo.key } });

        // 🔥 Send video
        await conn.sendMessage(from, {
          video: { url: selected.url },
          mimetype: "video/mp4",
          caption: `🎥 *${selected.quality} Video* | WhiteShadow-MD`
          // document: true  <-- enable this line to send as document
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mekInfo.key } });

      } catch (err) {
        console.error("Reply handler error:", err);
      }
    });

  } catch (err) {
    console.error(err);
    reply("💔 *Failed to download Facebook video. Please try again later!*");
  }
});
