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
async (conn, mek, m, { from, q, reply, sleep }) => {
  try {
    if (!q) return reply("🚩 *Please provide a valid Facebook video link!*");

    const res = await axios.get(`https://api.ootaizumi.web.id/downloader/facebook?url=${encodeURIComponent(q)}`);
    const data = res.data?.result;

    if (!data || !data.downloads?.length)
      return reply("❌ *Couldn't find downloadable links. Try another link!*");

    const qualityList = data.downloads.map((v, i) => `*${i + 1}.* ${v.quality}`).join("\n");

    const caption = `⚡ *WHITESHADOW-MD — FACEBOOK DOWNLOADER* ⚡

🎬 *Video Detected!*
Choose your desired quality 👇

${qualityList}

📌 *Reply with the number (1, 2, 3...)* to download.`;

    // Send main message
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
    }, { quoted: mek });

    // 🕐 Wait for reply (up to 60 seconds)
    const waitForReply = async () => {
      return new Promise((resolve) => {
        const listener = async (msgUpdate) => {
          try {
            const msg = msgUpdate?.messages?.[0];
            if (!msg?.message) return;

            const userText =
              msg.message.conversation ||
              msg.message.extendedTextMessage?.text;

            const contextId =
              msg.message?.extendedTextMessage?.contextInfo?.stanzaId;

            // Only accept replies to our message
            if (contextId !== sentMsg.key.id) return;

            conn.ev.off("messages.upsert", listener); // remove listener after one match
            resolve(userText.trim());
          } catch {
            resolve(null);
          }
        };
        conn.ev.on("messages.upsert", listener);

        // Timeout after 60s
        setTimeout(() => {
          conn.ev.off("messages.upsert", listener);
          resolve(null);
        }, 60000);
      });
    };

    const choice = await waitForReply();

    if (!choice) return reply("⏰ *Time out!* Please send the command again.");
    const index = parseInt(choice);

    if (isNaN(index) || index < 1 || index > data.downloads.length)
      return reply("❌ *Invalid number!* Reply with a valid option.");

    const selected = data.downloads[index - 1];

    await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

    await conn.sendMessage(from, {
      video: { url: selected.url },
      mimetype: "video/mp4",
      caption: `🎥 *${selected.quality} Video* | WhiteShadow-MD`
      // document: true // <- uncomment to send as document
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error(err);
    reply("💔 *Failed to download Facebook video. Please try again later!*");
  }
});
