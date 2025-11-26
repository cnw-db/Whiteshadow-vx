const { cmd } = require('../command');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

cmd({
  pattern: 'csong',
  alias: ['cnsong', 'channelplay'],
  react: '🎶',
  desc: 'Send a YouTube song to a WhatsApp Channel (voice + styled caption)',
  category: 'channel',
  use: '.csong <songName>/<channelJid>',
  filename: __filename,
}, async (conn, mek, m, { reply, q, botNumber }) => {
  try {

    // ─── OWNER + BOT CHECK ───
    const ownerNumbers = ['94704896880@s.whatsapp.net']; 
    const botJid = botNumber + '@s.whatsapp.net';
    const sender = mek.key?.fromMe ? botJid : mek.sender;

    if (!ownerNumbers.includes(sender) && sender !== botJid) {
      return reply('❌ *මෙම command එක bot owner සහ bot number වලට පමණි!*');
    }

    // ─── ARGUMENT CHECK ───
    if (!q || !q.includes('/')) {
      return reply(`⚠️ Usage example:\n.csong Shape of You/120363397446799567@newsletter`);
    }

    const [songName, channelJidRaw] = q.split('/').map(x => x.trim());
    const channelJid = channelJidRaw || '';
    if (!channelJid.endsWith('@newsletter')) {
      return reply('❌ *Channel JID වැරදිය!* (අවසානය @newsletter වන බවට සොයා බලන්න)');
    }
    if (!songName) return reply('🎵 කරුණාකර ගීතයේ නම ඇතුළත් කරන්න.');

    // ─── FETCH SONG DATA ───
    const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(songName)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) return reply('❌ API සම්බන්ධතාවය අසාර්ථකයි.');
    const data = await res.json();

    if (!data?.success || !data?.result?.downloadUrl) {
      return reply('❌ ගීතය සොයාගත නොහැකි විය / API දෝෂයක්.');
    }

    const meta = data.result.metadata;
    const dlUrl = data.result.downloadUrl;

    // ─── THUMBNAIL ───
    let thumb = null;
    try {
      if (meta.cover) {
        const thumbRes = await fetch(meta.cover);
        thumb = Buffer.from(await thumbRes.arrayBuffer());
      }
    } catch {}

    // ─── STYLED CAPTION ───
    const caption = `
╭───〔 🎧 *NOW PLAYING ON WHITESHADOW MUSIC* 🎶 〕───╮
│
│  🎵 Title: ${meta.title || "Unknown"}
│  👤 Artist: ${meta.channel || "Unknown"}
│  ⏱ Duration: ${meta.duration || "N/A"}
│  🌐 YouTube: ${meta.url || "N/A"}
│
│  💫 Vibe with the beat!
│  🎙️ Forwarded from *WHITESHADOW-MD💫* Music Channel
╰───────────────────────────────╯
`;

    // ─── SEND IMAGE CARD ───
    await conn.sendMessage(channelJid, {
      image: thumb || null,
      caption,
    }, { quoted: mek });

    // ─── TEMP FILE PATHS ───
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const mp3Path = path.join(tempDir, `${Date.now()}_ws.mp3`);
    const opusPath = path.join(tempDir, `${Date.now()}_ws.opus`);

    // ─── DOWNLOAD AUDIO ───
    const audioRes = await fetch(dlUrl);
    if (!audioRes.ok) return reply('❌ ගීතය download කල නොහැක.');
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    if (!audioBuffer || audioBuffer.length === 0) return reply('❌ Audio file එක හිස් වෙලා තියෙනවා.');
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

    const voiceBuffer = fs.readFileSync(opusPath);

    // ─── SEND VOICE MESSAGE ───
    await conn.sendMessage(channelJid, {
      audio: voiceBuffer,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true
    }, { quoted: mek });

    // ─── CLEANUP ───
    try { fs.unlinkSync(mp3Path); } catch {}
    try { fs.unlinkSync(opusPath); } catch {}

    reply(`✅ *"${meta.title}" සාර්ථකව ${channelJid} වෙත forward කරන ලදි!*`);

  } catch (err) {
    console.error('csong error:', err);
    reply('⚠️ ගීතය Channel එකට යැවීමේදී දෝෂයක්. නැවත උත්සාහ කරන්න.');
  }
});
