const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
  pattern: 'lyrics',
  alias: ['lyric', 'songlyrics', 'lirik'],
  react: '🎵',
  desc: 'Find Sinhala song lyrics by title',
  category: 'music',
  use: '.lyrics <song name>'
}, async (conn, mek, m, { text }) => {
  if (!text) return m.reply('🎧 *Please provide a song name!*\n\nExample: `.lyrics Kamini smokio`');

  try {
    const api = `https://api.zenzxz.my.id/api/tools/lirik?title=${encodeURIComponent(text)}`;
    const res = await fetch(api);
    const json = await res.json();

    if (!json.success || !json.data || json.data.count === 0) {
      return m.reply('❌ Lyrics not found. Try another song name!');
    }

    const song = json.data.result[0];
    const title = song.trackName || song.name || text;
    const artist = song.artistName || 'Unknown Artist';
    const album = song.albumName || 'Unknown Album';
    const lyrics = song.plainLyrics ? song.plainLyrics.trim() : 'No lyrics found 😢';

    const caption = `
╔══ 🎶 *Song Lyrics* ══╗
🎵 *Title:* ${title}
👤 *Artist:* ${artist}
💿 *Album:* ${album}
⏱️ *Duration:* ${song.duration ? `${song.duration}s` : 'N/A'}
╚══════════════════════╝

📝 *Lyrics:*
${lyrics}

_© 2025 • WhiteShadow-MD™_
`;

    await conn.sendMessage(m.chat, { text: caption }, { quoted: mek });
  } catch (err) {
    console.error(err);
    m.reply('⚠️ Error fetching lyrics! Try again later.');
  }
});
