const { cmd } = require('../command');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

cmd({
  pattern: 'phonk',
  alias: ['phonkplay', 'phonkdl'],
  react: '🎧',
  desc: 'Send phonk song to WhatsApp Channel',
  category: 'channel',
  use: '.phonk <youtube link> | <channelJid>',
  filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
  try {
    // ─── ARGUMENT PARSE ───
    if (!q || !q.includes('|')) {
      return reply(
        `⚠️ Usage:\n.phonk https://youtu.be/xxxx | 120363xxxxxxxxx@newsletter`
      );
    }

    let [ytInput, channelJidRaw] = q.split('|');

    ytInput = ytInput.trim();
    let channelJid = channelJidRaw
      .trim()
      .replace(/\s+/g, '')
      .replace(/\u200B/g, '');

    // ─── VALIDATION ───
    if (!ytInput.startsWith('http')) {
      return reply('❌ Valid YouTube link එකක් දෙන්න.');
    }

    if (!channelJid.includes('@newsletter')) {
      return reply('❌ Channel JID වැරදියි (@newsletter check කරන්න)');
    }

    // ─── FETCH FROM MOVANEST API ───
    const apiUrl = `https://www.movanest.xyz/v2/ytdl2?input=${encodeURIComponent(
      ytInput
    )}&format=audio&bitrate=320`;

    const res = await fetch(apiUrl);
    if (!res.ok) return reply('❌ API connection failed.');

    const data = await res.json();

    if (!data.status || !data.results?.recommended?.dlurl) {
      return reply('❌ Audio download link ලබාගත නොහැකි විය.');
    }

    // ─── METADATA ───
    const meta = {
      title: data.results.title || 'Unknown',
      artist: data.results.channel?.name || 'Unknown',
      duration: data.results.duration || 'N/A',
      thumb: data.results.thumb || null,
    };

    const dlUrl = data.results.recommended.dlurl;

    // ─── THUMBNAIL ───
    let thumbBuffer = null;
    try {
      if (meta.thumb) {
        const t = await fetch(meta.thumb);
        thumbBuffer = Buffer.from(await t.arrayBuffer());
      }
    } catch {}

    // ─── CAPTION ───
    const caption = `
*...🎧 Phonk Hub | 🇱🇰 Trending Phonks...*

*🐸 Title:* ${meta.title}
*🎨 Artist:* ${meta.artist}
*⌛ Duration:* ${meta.duration}

*ලංකාවෙ හොදම Phonk Channel එකට join වෙන්න 🔥*
> *Phonk Hub 🍄 SL 🇱🇰*
`;

    // ─── SEND IMAGE ───
    await conn.sendMessage(
      channelJid,
      {
        image: thumbBuffer,
        caption,
      },
      { quoted: mek }
    );

    // ─── TEMP FILES ───
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const base = Date.now();
    const mp3Path = path.join(tempDir, `${base}_phonk.mp3`);
    const opusPath = path.join(tempDir, `${base}_phonk.opus`);

    // ─── DOWNLOAD AUDIO ───
    const audioRes = await fetch(dlUrl);
    if (!audioRes.ok) return reply('❌ Audio download error.');

    fs.writeFileSync(mp3Path, Buffer.from(await audioRes.arrayBuffer()));

    // ─── CONVERT TO OPUS ───
    await new Promise((resolve, reject) => {
      ffmpeg(mp3Path)
        .audioCodec('libopus')
        .audioBitrate('64k')
        .format('opus')
        .save(opusPath)
        .on('end', resolve)
        .on('error', reject);
    });

    // ─── SEND VOICE NOTE ───
    await conn.sendMessage(
      channelJid,
      {
        audio: fs.readFileSync(opusPath),
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true,
      },
      { quoted: mek }
    );

    // ─── CLEANUP ───
    try { fs.unlinkSync(mp3Path); } catch {}
    try { fs.unlinkSync(opusPath); } catch {}

    reply(`✅ Phonk sent successfully to:\n${channelJid}`);
  } catch (err) {
    console.error('PHONK ERROR:', err);
    reply('⚠️ Error while sending phonk.');
  }
});
