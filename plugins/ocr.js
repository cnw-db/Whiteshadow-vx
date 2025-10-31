//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Feature : PlayCH (Send song to Channel)
//  👑 Developer : Chamod Nimsara (WhiteShadow)
//═══════════════════════════════════════════════//

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const yts = require('yt-search');
const { cmd } = require('../command');

// 🔧 Configurable variables
global.idch = "120363397446799567@newsletter"; // <-- Your Channel ID

cmd({
  pattern: "playch",
  alias: ["ytch", "playchannel"],
  use: ".playch <song name>",
  react: "🎧",
  desc: "Search and send YouTube song to your Channel as Voice Note (PTT)",
  category: "music",
  filename: __filename
},

async (conn, mek, m, {
  from, q, prefix, isOwner, reply
}) => {
  try {
    if (!isOwner) return reply("❌ *Only the bot owner can use this command!*");
    if (!q) return reply(`📌 *Please enter a song name!*\n\nExample:\n${prefix}playch calm down`);

    await reply(`🔍 Searching for *${q}* on YouTube...`);

    // 🔎 Search song using yt-search
    const search = await yts(q);
    const vid = search.videos && search.videos.length ? search.videos[0] : null;
    if (!vid) return reply('❌ No results found.');

    const url = vid.url;
    const apiUrl = `https://api.zenzxz.my.id/api/downloader/ytmp3?url=${encodeURIComponent(url)}`;

    // 📥 Get song info and download link
    const res = await axios.get(apiUrl);
    const data = res.data?.data;

    if (!data || !data.download_url) throw new Error("Failed to fetch download link from API.");

    await reply(`🎧 *${vid.title}*\n📺 ${vid.author.name}\n\n⏳ Downloading and converting...`);

    // Download MP3
    const audioRes = await axios.get(data.download_url, {
      responseType: 'arraybuffer',
      timeout: 120000
    });
    const buf = Buffer.from(audioRes.data);

    // Function to sanitize file names
    const sanitize = s => s.replace(/[\\/:*?"<>|]/g, '').trim();

    // 🌀 Convert MP3 to OGG (for Voice Note)
    const mp3ToOgg = async (buffer) => {
      const tmpIn = path.join(__dirname, `tmp_in_${Date.now()}.mp3`);
      const tmpOut = path.join(__dirname, `tmp_out_${Date.now()}.ogg`);
      fs.writeFileSync(tmpIn, buffer);
      return new Promise((resolve, reject) => {
        ffmpeg(tmpIn)
          .audioCodec('libopus')
          .format('ogg')
          .on('end', () => {
            const outBuf = fs.readFileSync(tmpOut);
            fs.unlinkSync(tmpIn);
            fs.unlinkSync(tmpOut);
            resolve(outBuf);
          })
          .on('error', err => reject(err))
          .save(tmpOut);
      });
    };

    const oggBuf = await mp3ToOgg(buf);
    const safeTitle = sanitize(data.title || vid.title);
    const filename = `${safeTitle}_128kbps.ogg`.slice(0, 160);

    // 📨 Send song to Channel
    await conn.sendMessage(global.idch, {
      audio: oggBuf,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true,
      fileName: filename,
      contextInfo: {
        externalAdReply: {
          title: data.title,
          body: vid.author.name,
          thumbnailUrl: data.thumbnail,
          sourceUrl: vid.url,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    });

    await reply(`✅ *${vid.title}* successfully sent to your channel!`);

  } catch (e) {
    console.error('[PLAYCH ERROR]', e);
    reply(`❌ *Error occurred while sending song:*\n${e.message}`);
  }
});
