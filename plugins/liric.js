//WHITESHADOW-MD// 

const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
  pattern: 'lyrics',
  alias: ['liric', 'lyric', 'ly'],
  desc: 'Search and display song lyrics 🎵',
  react: '🎶',
  category: 'music',
  use: '.lyrics <song name>',
  filename: __filename
}, async (conn, msg, args, { from, reply }) => {
  try {
    const query = args.join(' ');
    if (!query) return reply('🎧 *Please enter a song name!*\n\nExample: `.lyrics Kamini Smokio`');

    await conn.sendMessage(from, { react: { text: '🔍', key: msg.key } });

    const res = await fetch(`https://api.zenzxz.my.id/api/tools/lirik?title=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data.success || !data.data?.result || data.data.result.length === 0) {
      return reply('❌ Lyrics not found. Try another song!');
    }

    const song = data.data.result[0];
    const title = song.trackName || 'Unknown Title';
    const artist = song.artistName || 'Unknown Artist';
    const lyrics = song.plainLyrics || 'Lyrics not available.';

    const caption = `
🎵 *${title}*
👤 Artist: ${artist}

─────────────────────
${lyrics}
─────────────────────

© 2025 WhiteShadow-MD 🎧
`;

    await conn.sendMessage(from, { text: caption }, { quoted: msg });

  } catch (err) {
    console.error(err);
    reply('❌ Error fetching lyrics. Please try again later.');
  }
});
