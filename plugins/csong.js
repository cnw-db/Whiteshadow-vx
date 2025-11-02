const { cmd } = require('../command');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

cmd({
  pattern: 'csong',
  alias: ['cnsong', 'channelplay'],
  react: '🎶',
  desc: 'Send a YouTube song to a WhatsApp Channel (voice + styled caption)',
  category: 'channel',
  use: '.csong <song name>/<channel JID>',
  filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
  try {
    if (!q || !q.includes('/')) {
      return reply(`⚠️ *Usage:*
      
🪄 Example:
.csong Shape of You/120363397446799567@newsletter`);
    }

    const [songName, channelJidRaw] = q.split('/').map(x => x.trim());
    const channelJid = channelJidRaw || '';
    if (!channelJid.endsWith('@newsletter')) {
      return reply('❌ *Invalid Channel JID!* (must end with @newsletter)');
    }
    if (!songName) return reply('🎵 Please enter a song name.');

    const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(songName)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.success || !data?.result?.downloadUrl) {
      return reply('❌ Song not found / API error.');
    }

    const meta = data.result.metadata;
    const dlUrl = data.result.downloadUrl;

    // download thumbnail
    let thumb = null;
    try {
      if (meta.cover) {
        const thumbRes = await fetch(meta.cover);
        thumb = Buffer.from(await thumbRes.arrayBuffer());
      }
    } catch { }

    // 🎧 Styled caption with music vibe
    const caption = `
╭───〔 🎧 *NOW PLAYING ON WHITE SHADOW MUSIC* 🎶 〕───╮
│
│  🎵 *Title:* ${meta.title}
│  👤 *Artist:* ${meta.channel}
│  ⏱ *Duration:* ${meta.duration}
│  🌐 *YouTube:* ${meta.url}
│
│  💫 Feel the rhythm. Vibe with the beat.
│  🎙️ Forwarded from *WHITESHADOW-MD💫* Music Channel
│
╰───────────────────────────────╯
`;

    const sender = mek.key?.participant || mek.key?.remoteJid || mek.sender || '';
    const contextInfo = {
      mentionedJid: sender ? [sender] : [],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363397446799567@newsletter',
        newsletterName: '🎵 WHITESHADOW-MD MUSIC 💫',
        serverMessageId: Math.floor(Date.now() / 1000)
      }
    };

    // send image (song card)
    await conn.sendMessage(channelJid, {
      image: thumb || undefined,
      caption,
      contextInfo
    }, { quoted: mek });

    // create temp paths
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const mp3Path = path.join(tempDir, `${Date.now()}_ws.mp3`);
    const opusPath = path.join(tempDir, `${Date.now()}_ws.opus`);

    // download song
    const audioRes = await fetch(dlUrl);
    fs.writeFileSync(mp3Path, Buffer.from(await audioRes.arrayBuffer()));

    // convert to opus (voice)
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

    // send voice note with same forward look
    await conn.sendMessage(channelJid, {
      audio: voiceBuffer,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true,
      contextInfo
    }, { quoted: mek });

    // cleanup
    try { fs.unlinkSync(mp3Path); } catch { }
    try { fs.unlinkSync(opusPath); } catch { }

    reply(`✅ *Successfully forwarded "${meta.title}" to ${channelJid}!*`);

  } catch (err) {
    console.error('csong error:', err);
    reply('⚠️ Error while sending song to channel.');
  }
});
