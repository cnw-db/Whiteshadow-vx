const { cmd } = require('../command');
const fetch = require('node-fetch');
const fs = require('fs');

cmd({
  pattern: 'lyrics',
  alias: ['lyric', 'lirik'],
  react: '🎵',
  desc: 'Get Sinhala or English song lyrics (WhiteShadow-MD Style)',
  category: 'music',
  use: '.lyrics <song name>'
}, async (conn, mek, m, { text }) => {
  if (!text) return m.reply('🎧 *Please provide a song name!*\n\nExample: `.lyrics Lelena`');

  try {
    const api = `https://api.zenzxz.my.id/api/tools/lirik?title=${encodeURIComponent(text)}`;
    const res = await fetch(api);
    const json = await res.json();

    if (!json.success || !json.data?.result?.length) {
      return m.reply('❌ Lyrics not found. Try another song name!');
    }

    const song = json.data.result[0];
    const title = song.trackName || song.name || text;
    const artist = song.artistName || 'Unknown Artist';
    const album = song.albumName || 'Unknown Album';
    const duration = song.duration ? `${song.duration}s` : 'N/A';
    const lyrics = song.plainLyrics?.trim() || 'No lyrics found 😢';

    // 🖼 Custom WhiteShadow Thumbnail
    const thumb = 'https://raw.githubusercontent.com/cnw-db/WHITESHADOW-MD-/refs/heads/main/1762108661488.jpg';

    const shortLyrics =
      lyrics.length > 900
        ? lyrics.substring(0, 900) + '\n\n...(reply *1* to get full lyrics as TXT file)'
        : lyrics;

    // 🎨 WhiteShadow-MD Style Caption
    const caption = `
╭─────❮ *🎧 WHITESHADOW LYRICS SYSTEM* ❯─────╮

🎵 *Title:* ${title}
👤 *Artist:* ${artist}
💿 *Album:* ${album}
⏱️ *Duration:* ${duration}
💠 *Requested by:* ${m.pushName}

📝 *Lyrics:*
${shortLyrics}

╰────────────────────────────────╯
🧩 ᴘᴏᴡᴇʀᴇᴅ ʙʏ *WhiteShadow-MD*
_Reply with *1* to download full lyrics as TXT file_
`;

    // Send main lyrics message with thumbnail
    const sentMsg = await conn.sendMessage(
      m.chat,
      {
        image: { url: thumb },
        caption: caption,
      },
      { quoted: mek }
    );

    // Listener for reply
    const listener = async (msgUpdate) => {
      try {
        const msg = msgUpdate.messages[0];
        if (!msg?.message?.conversation) return;
        const body = msg.message.conversation.trim();
        const context = msg.messageContextInfo;

        // If user replied "1" to the correct message
        if (body === '1' && context?.stanzaId === sentMsg.key.id) {
          const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
          fs.writeFileSync(fileName, `${title}\nby ${artist}\n\n${lyrics}`);

          await conn.sendMessage(
            m.chat,
            {
              document: { url: fileName },
              mimetype: 'text/plain',
              fileName: `${title}.txt`,
              caption: `🎶 *${title}* Lyrics file by WhiteShadow-MD`,
            },
            { quoted: msg }
          );

          fs.unlinkSync(fileName);
          conn.ev.off('messages.upsert', listener); // remove after done ✅
        }
      } catch (e) {
        console.log('Lyrics reply handler error:', e);
      }
    };

    conn.ev.on('messages.upsert', listener);
    setTimeout(() => conn.ev.off('messages.upsert', listener), 180000); // auto remove after 3 min

  } catch (err) {
    console.error(err);
    m.reply('⚠️ Error fetching lyrics! Try again later.');
  }
});
