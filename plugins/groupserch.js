const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
  pattern: 'groupfind',
  alias: ['gcfind', 'findgc'],
  react: '🌐',
  desc: 'Find public WhatsApp groups by topic',
  category: 'internet',
  use: '.groupfind <query>',
}, async (conn, mek, m, { args }) => {
  try {
    const query = args.join(' ');
    if (!query) return m.reply('🌀 Please enter a topic!\nExample: `.groupfind car`');

    await m.react('⏳');
    const api = `https://api.nazirganz.space/api/internet/carigc?query=${encodeURIComponent(query)}`;
    const res = await fetch(api);
    if (!res.ok) throw new Error('API Error');
    const json = await res.json();

    const results = json.result;
    if (!results || results.length === 0) return m.reply('❌ No groups found for that topic.');

    let count = 0;
    for (const gc of results.slice(0, 5)) { // send only first 5 groups
      count++;
      const caption = `
╭─────❰ *🌀 WHITESHADOW-MD* ❱─────╮
│ 🧩 *Group:* ${gc.name || 'Unknown'}
│ 🌍 *Country:* ${gc.country || 'Unknown'}
│ 🗂️ *Category:* ${gc.category || 'Unknown'}
│ 💬 *Description:* ${gc.description || '-'}
│ 🔗 *Link:* ${gc.link}
╰──────────────────────────────╯
🔎 _Result ${count} of ${results.length}_`;

      await conn.sendMessage(m.chat, {
        image: { url: gc.image || 'https://files.catbox.moe/fyr37r.jpg' },
        caption: caption,
        contextInfo: {
          externalAdReply: {
            title: "🌐 Group Finder - WHITESHADOW",
            body: `Topic: ${query}`,
            mediaUrl: gc.link,
            sourceUrl: gc.link,
            thumbnailUrl: gc.image || 'https://files.catbox.moe/fyr37r.jpg',
            showAdAttribution: true,
            renderLargerThumbnail: true,
          },
        },
      });
    }

    await m.react('✅');
  } catch (e) {
    console.error(e);
    m.reply('❌ Failed to fetch results. Please try again later.');
  }
});
