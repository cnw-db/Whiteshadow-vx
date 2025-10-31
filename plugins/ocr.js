//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Feature : PlayCH (Send song to Channel)
//  👑 Developer : Chamod Nimsara (WhiteShadow)
//═══════════════════════════════════════════════//

const config = require('../config')
const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')
const ffmpeg = require('fluent-ffmpeg')
const yts = require('yt-search')
const { cmd } = require('../command')

// 🔧 Configurable variables (can edit here)
global.idch = "120363397446799567@newsletter" // Channel ID
global.yupraApi = "YOUR_API_KEY_HERE" // API Key from ytdlpyton

cmd({
  pattern: "playch",
  alias: ["ytch", "playchannel"],
  use: ".playch <song name>",
  react: "🎧",
  desc: "Search and send YouTube song to Channel as Voice Note (PTT)",
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
    const bitrate = '128';
    const metaUrl = `https://ytdlpyton.nvlgroup.my.id/info/?url=${encodeURIComponent(url)}&limit=50`;
    const dlUrl = `https://ytdlpyton.nvlgroup.my.id/download/audio?url=${encodeURIComponent(url)}&mode=url&bitrate=${bitrate}k`;

    const headers = {
      accept: 'application/json',
      'X-API-Key': global.yupraApi
    };

    // 📥 Get meta and download link
    const metaRes = await axios.get(metaUrl, { headers });
    const meta = metaRes.data;

    const dlRes = await axios.get(dlUrl, { headers });
    const info = dlRes.data;
    if (!info.download_url) throw new Error('Failed to get download URL.');

    await reply(`🎧 *${vid.title}*\n📺 ${vid.author.name}\n\n⏳ Downloading and converting...`);

    // Download MP3
    const audioRes = await axios.get(info.download_url, {
      responseType: 'arraybuffer',
      timeout: 120000
    });
    const buf = Buffer.from(audioRes.data);

    // Function to sanitize file names
    const sanitize = s => s.replace(/[\\/:*?"<>|]/g, '').trim();

    // 🌀 Convert MP3 to OGG
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
    const safeTitle = sanitize(meta.title || vid.title);
    const filename = `${safeTitle}_128kbps.ogg`.slice(0, 160);

    // 📨 Send song to Channel
    await conn.sendMessage(global.idch, {
      audio: oggBuf,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true,
      fileName: filename,
      contextInfo: {
        externalAdReply: {
          title: meta.title || vid.title,
          body: meta.channel || vid.author.name,
          thumbnailUrl: meta.thumbnail || vid.thumbnail,
          sourceUrl: meta.webpageurl || vid.url,
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
