const { cmd } = require('../command');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

cmd({
  pattern: 'phonk',
  alias: ['phonkplay', 'phonkdl'],
  react: '🎧',
  desc: 'Send trending phonk song to WhatsApp Channel',
  category: 'channel',
  use: '.phonk <songName>/<channelJid>',
  filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
  try {

    // ─── ARGUMENT CHECK ───
    if (!q || !q.includes('/')) {
      return reply(`⚠️ Usage: .phonk Moonlight/120363397446799567@newsletter`);
    }

    const [songName, channelJidRaw] = q.split('/').map(x => x.trim());
    const channelJid = channelJidRaw || '';

    if (!channelJid.endsWith('@newsletter')) {
      return reply('❌ *Channel JID වැරදියි!* (@newsletter ending check කරන්න)');
    }
    if (!songName) return reply('🎶 phonk ගීතයේ නම දෙන්න.');

    // ─── FETCH SONG DATA ───
    const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(songName)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) return reply('❌ API සම්බන්ධතාවය අසාර්ථකයි.');

    const data = await res.json();
    if (!data?.success || !data?.result?.downloadUrl) {
      return reply('❌ ගීතය සොයාගත නොහැකි විය.');
    }

    const meta = data.result.metadata;
    const dlUrl = data.result.downloadUrl;

    // ─── THUMBNAIL ───
    let thumb = null;
    try {
      if (meta.cover) {
        const t = await fetch(meta.cover);
        thumb = Buffer.from(await t.arrayBuffer());
      }
    } catch {}

    // ─── STYLED PHONK CAPTION ───
    const caption = `
*...🎧 Phonk Hub |🇱🇰 Trending Phonks...*

*🐸 Title:* ${meta.title || "Unknown"}
*🎨 Artist:* ${meta.channel || "Unknown"}
*⌛ Duration:* ${meta.duration || "N/A"}

*ලංකාවෙ හොදම Phonk චැනල් එකට දැන්ම සෙට් වෙන්න...✨♥️*
> *Phonk Hub 🍄 SL 🇱🇰*
`;

    // ─── SEND IMAGE CARD ───
    await conn.sendMessage(channelJid, {
      image: thumb || null,
      caption,
    }, { quoted: mek });

    // ─── FILE PATHS ───
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const mp3Path = path.join(tempDir, `${Date.now()}_phonk.mp3`);
    const opusPath = path.join(tempDir, `${Date.now()}_phonk.opus`);

    // ─── DOWNLOAD AUDIO ───
    const audioRes = await fetch(dlUrl);
    if (!audioRes.ok) return reply('❌ Audio download error.');
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    fs.writeFileSync(mp3Path, audioBuffer);

    // ─── CONVERT TO OPUS ───
    await new Promise((resolve, reject) => {
      ffmpeg(mp3Path)
        .audioCodec('libopus')
        .format('opus')
        .audioBitrate('64k')
        .save(opusPath)
        .on('end', resolve)
        .on('error', reject);
    });

    // ─── SEND VOICE MESSAGE ───
    await conn.sendMessage(channelJid, {
      audio: fs.readFileSync(opusPath),
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true
    }, { quoted: mek });

    // ─── CLEANUP ───
    try { fs.unlinkSync(mp3Path); } catch {}
    try { fs.unlinkSync(opusPath); } catch {}

    reply(`✅ Phonk track sent to channel: ${channelJid}`);

  } catch (err) {
    console.error('phonk error:', err);
    reply('⚠️ Error sending phonk track to the channel.');
  }
});
