const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

// Fake vCard
const fakevCard = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "© Chamod Nimsara",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:Chamod Nimsara
TEL;type=CELL;type=VOICE;waid=94704896880:+94704896880
END:VCARD`
    }
  }
};

const api = "https://facebook-downloader-chamod.vercel.app/api/fb";

cmd({
  pattern: "fb2",
  react: "🎥",
  alias: ["facebook2", "fbb2", "fbvideo2"],
  desc: "Download videos from Facebook (HD/SD selection)",
  category: "download",
  use: ".fb2 <facebook_url>",
  filename: __filename
},
async (conn, mek, m, { from, prefix, q, reply }) => {
  try {
    if (!q) return reply("🚩 Please give a valid Facebook URL 🐼");

    const fb = await fetchJson(`${api}?url=${encodeURIComponent(q)}`);

    if (!fb.download || !fb.download.videos.length) {
      return reply("❌ I couldn't find any video for this link.");
    }

    const caption = `🎥 *WHITESHADOW-MD FACEBOOK DOWNLOADER* 🎥

📝 *Title:* ${fb.metadata.title}
🔗 *URL:* ${q}

💬 *Reply with your choice:*
1️⃣ HD Quality 🔋
2️⃣ SD Quality 🪫

> © Powerd by Chamod Nimsara 🌛`;

    // Send thumbnail first
    const sentMsg = await conn.sendMessage(from, {
      image: { url: fb.metadata.thumbnail },
      caption: caption
    }, { quoted: fakevCard });

    const messageID = sentMsg.key.id;

    // Listen for reply
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

        const choice = userText.trim();

        await conn.sendMessage(from, { react: { text: "⬇️", key: mekInfo.key } });

        // HD Video
        if (choice === "1") {
          const hdVideo = fb.download.videos.find(v => v.quality.includes("720") || v.quality.includes("HD"));
          if (!hdVideo) return reply("❌ HD video not available for this link.");
          await conn.sendMessage(from, {
            video: { url: hdVideo.link },
            mimetype: "video/mp4",
            caption: "*HD Quality Video* 🔋"
          }, { quoted: mek });

        // SD Video
        } else if (choice === "2") {
          const sdVideo = fb.download.videos.find(v => v.quality.includes("360") || v.quality.includes("SD"));
          if (!sdVideo) return reply("❌ SD video not available for this link.");
          await conn.sendMessage(from, {
            video: { url: sdVideo.link },
            mimetype: "video/mp4",
            caption: "*SD Quality Video* 🪫"
          }, { quoted: mek });

        } else {
          return reply("❌ Invalid choice! Please reply with *1* or *2*.");
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mekInfo.key } });

      } catch (err) {
        console.error("reply handler error:", err);
        reply("⚠️ Error while processing your reply.");
      }
    });

  } catch (err) {
    console.error(err);
    reply("💔 Failed to fetch the video. Please try again later 🐼");
  }
});



cmd({
  pattern: "facebook",
  react: "🎥",
  alias: ["fbb", "fbvideo", "fb"],
  desc: "Download videos from Facebook",
  category: "download",
  use: ".facebook <facebook_url>",
  filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("🚩 Please provide a Facebook URL.");

    // Replace YOUR_API_KEY with your actual API key
    const APIKEY = "APIKEY"; 
    const apiUrl = `https://gtech-api-xtp1.onrender.com/api/download/fb?url=${encodeURIComponent(q)}&apikey=${APIKEY}`;

    const res = await axios.get(apiUrl);
    const json = res.data;

    if (!json.status || !json.data?.data?.length) {
      return reply("❌ No video found for this URL.");
    }

    const videoData = json.data.data[0];

    let caption = `*WHITESHADOW-MD*

📝 ᴛɪᴛʟᴇ : Facebook Video
🦸‍♀️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ : Chamod Nimsara
🔗 ᴜʀʟ : ${q}
🎥 ʀᴇsᴏʟᴜᴛɪᴏɴ : ${videoData.resolution}`;

    // Send thumbnail if available
    if (videoData.thumbnail) {
      await conn.sendMessage(from, {
        image: { url: videoData.thumbnail },
        caption: caption
      }, { quoted: mek });
    }

    // Send the video
    await conn.sendMessage(from, {
      video: { url: videoData.url },
      mimetype: "video/mp4",
      caption: `*Video:* ${videoData.resolution}`
    }, { quoted: mek });

  } catch (err) {
    console.error(err);
    reply("❌ ERROR: Could not fetch the Facebook video.");
  }
});
