const { fetchJson } = require("../lib/functions");
const { downloadTiktok } = require("@mrnima/tiktok-downloader");
const { facebook } = require("@mrnima/facebook-downloader");
const cheerio = require("cheerio");
const { igdl } = require("ruhend-scraper");
const axios = require("axios");
const { cmd, commands } = require('../command');



cmd({
  pattern: "ig",
  alias: ["insta", "instagram"],
  desc: "Download Instagram videos or reels.",
  react: "🎥",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q || !q.startsWith("http")) {
      return reply("❌ Please provide a valid Instagram link.\n\n*Example:* .ig https://www.instagram.com/reel/xxxxxxxx/");
    }

    await conn.sendMessage(from, {
      react: { text: "⏳", key: m.key }
    });

    const apiUrl = `https://api.nekolabs.my.id/downloader/instagram?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data.success || !data.result || !data.result.downloadUrl) {
      return reply("⚠️ Couldn't fetch the Instagram video. Please check the link and try again.");
    }

    const result = data.result;
    const videoUrl = result.downloadUrl[0];
    const meta = result.metadata || {};

    const caption = `📥 *Instagram Video Downloaded Successfully!*\n\n👤 *User:* @${meta.username || "Unknown"}\n❤️ *Likes:* ${meta.like || "N/A"}\n💬 *Comments:* ${meta.comment || "N/A"}\n📝 *Caption:* ${meta.caption || "No caption"}\n\n> 🔰 Powered by *WhiteShadow-MD*`;

    await conn.sendMessage(from, {
      video: { url: videoUrl },
      mimetype: "video/mp4",
      caption
    }, { quoted: m });

  } catch (error) {
    console.error("IG Download Error:", error);
    reply("❌ Error downloading Instagram video. Please try again later.");
  }
});
// twitter-dl

cmd({
  pattern: "twitter",
  alias: ["tweet", "twdl"],
  desc: "Download Twitter videos",
  category: "download",
  filename: __filename
}, async (conn, m, store, {
  from,
  quoted,
  q,
  reply
}) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return conn.sendMessage(from, { text: "❌ Please provide a valid Twitter URL." }, { quoted: m });
    }

    await conn.sendMessage(from, {
      react: { text: '⏳', key: m.key }
    });

    const response = await axios.get(`https://www.dark-yasiya-api.site/download/twitter?url=${q}`);
    const data = response.data;

    if (!data || !data.status || !data.result) {
      return reply("⚠️ Failed to retrieve Twitter video. Please check the link and try again.");
    }

    const { desc, thumb, video_sd, video_hd } = data.result;

    const caption = `╭━━━〔 *TWITTER DOWNLOADER* 〕━━━⊷\n`
      + `┃▸ *Description:* ${desc || "No description"}\n`
      + `╰━━━⪼\n\n`
      + `📹 *Download Options:*\n`
      + `1️⃣  *SD Quality*\n`
      + `2️⃣  *HD Quality*\n`
      + `🎵 *Audio Options:*\n`
      + `3️⃣  *Audio*\n`
      + `4️⃣  *Document*\n`
      + `5️⃣  *Voice*\n\n`
      + `📌 *Reply with the number to download your choice.*`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: thumb },
      caption: caption
    }, { quoted: m });

    const messageID = sentMsg.key.id;

    conn.ev.on("messages.upsert", async (msgData) => {
      const receivedMsg = msgData.messages[0];
      if (!receivedMsg.message) return;

      const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
      const senderID = receivedMsg.key.remoteJid;
      const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

      if (isReplyToBot) {
        await conn.sendMessage(senderID, {
          react: { text: '⬇️', key: receivedMsg.key }
        });

        switch (receivedText) {
          case "1":
            await conn.sendMessage(senderID, {
              video: { url: video_sd },
              caption: "📥 *Downloaded in SD Quality*"
            }, { quoted: receivedMsg });
            break;

          case "2":
            await conn.sendMessage(senderID, {
              video: { url: video_hd },
              caption: "📥 *Downloaded in HD Quality*"
            }, { quoted: receivedMsg });
            break;

          case "3":
            await conn.sendMessage(senderID, {
              audio: { url: video_sd },
              mimetype: "audio/mpeg"
            }, { quoted: receivedMsg });
            break;

          case "4":
            await conn.sendMessage(senderID, {
              document: { url: video_sd },
              mimetype: "audio/mpeg",
              fileName: "Twitter_Audio.mp3",
              caption: "📥 *Audio Downloaded as Document*"
            }, { quoted: receivedMsg });
            break;

          case "5":
            await conn.sendMessage(senderID, {
              audio: { url: video_sd },
              mimetype: "audio/mp4",
              ptt: true
            }, { quoted: receivedMsg });
            break;

          default:
            reply("❌ Invalid option! Please reply with 1, 2, 3, 4, or 5.");
        }
      }
    });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while processing your request. Please try again.");
  }
});

// MediaFire-dl

cmd({
  pattern: "mediafire",
  alias: ["mfire"],
  desc: "To download MediaFire files using Chamod's API.",
  react: "🎥",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q) return reply("❌ Please provide a valid MediaFire link.");

    // show processing react
    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    // call your Cloudflare Worker (make sure to encode the URL)
    const apiUrl = `https://mediafire-api.chamodshadow125.workers.dev/?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    // validate structure based on your JSON
    if (!data || data.status !== true || !data.result || !data.result.download_url) {
      return reply("⚠️ Failed to fetch MediaFire download link. Ensure the link is valid and public.");
    }

    // pull fields exactly as your API returns them
    const download_url = data.result.download_url;
    const filename = data.result.filename || "mediafire_download";
    const filesize = data.result.filesize || "Unknown";
    const uploaded = data.result.uploaded || "Unknown";

    // try to detect mime type if mime-types package is available, otherwise fallback
    let mime_type = "application/octet-stream";
    try {
      // if your bot has mime-types installed, uncomment these two lines:
      // const { lookup } = require('mime-types');
      // mime_type = lookup(filename) || mime_type;
    } catch (e) {
      // ignore and use fallback
    }

    // react to indicate ready
    await conn.sendMessage(from, { react: { text: "⬆️", key: m.key } });

    const caption = `╭━━━〔 *MEDIAFIRE DOWNLOADER* 〕━━━⊷\n`
      + `┃▸ *File Name:* ${filename}\n`
      + `┃▸ *File Size:* ${filesize}\n`
      + `┃▸ *Uploaded:* ${uploaded}\n`
      + `╰━━━⪼\n\n`
      + `📥 *Downloading your file...*`;

    // send the file to the user (document with remote URL)
    await conn.sendMessage(from, {
      document: { url: download_url },
      mimetype: mime_type,
      fileName: filename,
      caption: caption
    }, { quoted: m });

  } catch (error) {
    console.error("Mediafire command error:", error);
    reply("❌ An error occurred while processing your request. Please try again.");
  }
});

// apk-dl

cmd({
  pattern: "apk",
  desc: "Download APK from Aptoide.",
  category: "download",
  filename: __filename
}, async (conn, m, store, {
  from,
  quoted,
  q,
  reply
}) => {
  try {
    if (!q) {
      return reply("❌ Please provide an app name to search.");
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${q}/limit=1`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data || !data.datalist || !data.datalist.list.length) {
      return reply("⚠️ No results found for the given app name.");
    }

    const app = data.datalist.list[0];
    const appSize = (app.size / 1048576).toFixed(2); // Convert bytes to MB

    const caption = `╭━━━〔 *APK Downloader* 〕━━━┈⊷
┃ 📦 *Name:* ${app.name}
┃ 🏋 *Size:* ${appSize} MB
┃ 📦 *Package:* ${app.package}
┃ 📅 *Updated On:* ${app.updated}
┃ 👨‍💻 *Developer:* ${app.developer.name}
╰━━━━━━━━━━━━━━━┈⊷
🔗 *Powered By 『𝗪𝗵𝗶𝘁𝗲𝗦𝗵𝗮𝗱𝗼𝘄-MD』*`;

    await conn.sendMessage(from, { react: { text: "⬆️", key: m.key } });

    await conn.sendMessage(from, {
      document: { url: app.file.path_alt },
      fileName: `${app.name}.apk`,
      mimetype: "application/vnd.android.package-archive",
      caption: caption
    }, { quoted: m });

    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while fetching the APK. Please try again.");
  }
});

// G-Drive-DL

cmd({
  pattern: "gdrive",
  desc: "Download Google Drive files.",
  react: "🌐",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Please provide a valid Google Drive link.");
    }

    await conn.sendMessage(from, { react: { text: "⬇️", key: m.key } });

    // Use Izumi API
    const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/gdrive?url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data || !data.status || !data.result || !data.result.downloadUrl) {
      return reply("⚠️ Failed to fetch Google Drive file. Please check the link and try again.");
    }

    const { downloadUrl, fileName, mimetype, fileSize } = data.result;

    await conn.sendMessage(from, { react: { text: "⬆️", key: m.key } });

    await conn.sendMessage(from, {
      document: { url: downloadUrl },
      mimetype: mimetype || "application/octet-stream",
      fileName: fileName || "gdrive_file",
      caption: `📥 *Google Drive File Downloaded Successfully!*\n\n📂 *File Name:* ${fileName}\n📦 *Size:* ${fileSize} MB\n\n*© Powered By WHITESHADOW-MD*`
    }, { quoted: m });

    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while fetching the Google Drive file. Please try again.");
  }
});
