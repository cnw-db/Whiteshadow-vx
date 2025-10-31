//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Feature : PlayCH (Send song to Channel)
//  👑 Developer : Chamod Nimsara (WhiteShadow)
//═══════════════════════════════════════════════//

const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')
const ffmpeg = require('fluent-ffmpeg')
const yts = require('yt-search')
const { cmd } = require('../command')

// 🔧 Configurable variables
global.idch = "120363397446799567@newsletter" // Channel ID

cmd({
  pattern: "playch",
  alias: ["ytch", "playchannel"],
  use: ".playch <song name>",
  react: "🎧",
  desc: "Search and send YouTube song to Channel as Voice Note (PTT)",
  category: "music",
  filename: __filename
},

async (conn, mek, m, { q, prefix, isOwner, reply }) => {
  try {
    if (!isOwner) return reply("❌ *Only the bot owner can use this command!*");
    if (!q) return reply(`📌 *Please enter a song name!*\n\nExample:\n${prefix}playch calm down`);

    await reply(`🔍 Searching for *${q}* on YouTube...`);

    const search = await yts(q);
    const vid = search.videos && search.videos.length ? search.videos[0] : null;
    if (!vid) return reply('❌ No results found.');

    const api = `https://api.zenzxz.my.id/api/downloader/ytmp3?url=${encodeURIComponent(vid.url)}`;
    const res = await axios.get(api);
    const data = res.data?.data;
    if (!data?.download_url) return reply('❌ Failed to get download URL.');

    await reply(`🎧 *${vid.title}*\n📺 ${vid.author.name}\n\n⏳ Downloading and converting...`);

    const audioRes = await axios.get(data.download_url, { responseType: 'arraybuffer' });
    const mp3Buffer = Buffer.from(audioRes.data);

    const sanitize = s => s.replace(/[\\/:*?"<>|]/g, '').trim();

    // ✅ Fixed converter
    const mp3ToOgg = async (buffer) => {
      const tmpIn = path.join(__dirname, `in_${Date.now()}.mp3`);
      const tmpOut = path.join(__dirname, `out_${Date.now()}.ogg`);
      fs.writeFileSync(tmpIn, buffer);

      return new Promise((resolve, reject) => {
        ffmpeg(tmpIn)
          .audioBitrate(128)
          .audioCodec('libopus')
          .toFormat('ogg')
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

    const oggBuf = await mp3ToOgg(mp3Buffer);
    const safeTitle = sanitize(data.title || vid.title);
    const filename = `${safeTitle}_128kbps.ogg`.slice(0, 160);

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

    await reply(`✅ *${data.title}* successfully sent to your channel!`);

  } catch (e) {
    console.error('[PLAYCH ERROR]', e);
    reply(`❌ *Error occurred while sending song:*\n${e.message}`);
  }
});
