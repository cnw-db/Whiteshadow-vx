const axios = require('axios');
const { cmd } = require('../command');

//////////////////////////////
// 1️⃣ Spotify Search Command
//////////////////////////////

cmd({
    pattern: 'spotify',
    alias: ['sp'],
    desc: 'Search & download Spotify song',
    type: 'downloader',
    react: '🎧',
    filename: __filename
}, async (conn, mek, m, { text, from, reply }) => {
    try {
        if (!text) return reply('❌ *Song name එකක් දාන්න*\n\nExample:\n.spotify Lelena');

        const api = `https://private-api-whiteshadow-md.vercel.app/Spotify?input=${encodeURIComponent(text)}`;
        const res = await axios.get(api);
        const data = res.data;

        if (!data || !data.metadata || !data.audio)
            return reply('❌ Spotify song එක හම්බුනේ නැහැ');

        const { title, artist, duration, cover, url } = data.metadata;
        const audio = data.audio;

        // 🎴 Info card
        await conn.sendMessage(from, {
            image: { url: cover },
            caption:
`🎵 *Spotify Track Found*

📌 *Title:* ${title}
👤 *Artist:* ${artist}
⏱ *Duration:* ${duration}
🔗 *Spotify:* ${url}

⬇️ *Downloading audio...*`
        }, { quoted: mek });

        // 🎧 Audio
        await conn.sendMessage(from, {
            audio: { url: audio.url },
            mimetype: 'audio/mpeg',
            fileName: audio.name,
            ptt: false
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply('❌ Spotify download failed. Later try කරන්න.');
    }
});
 //////////////////////////////
// 1️⃣ Spotify Search Command
//////////////////////////////
cmd({
    pattern: 'spotifysearch',
    desc: 'Search Spotify tracks and send all results',
    alias: ['sps'],
    type: 'search',
    react: '🔍',
    filename: __filename
}, async (conn, mek, m, { text, from, reply }) => {
    if (!text) return reply('❌ Please provide a song name.');

    try {
        const searchRes = await axios.get(`https://api.ootaizumi.web.id/search/spotify?query=${encodeURIComponent(text)}`);
        const results = searchRes.data.result;
        if (!results || !results.length) return reply('❌ No results found.');

        let msg = '🎵 *Spotify Search Results:*\n\n';
        results.forEach((track, i) => {  // ✅ All results, no slice
            msg += `*${i+1}.* ${track.title}\n👤 ${track.artist}\n⏱ ${track.duration}\n🔗 ${track.url}\n\n`;
        });
        msg += 'Use `.spotify <correct name>` to download a track.';

        await conn.sendMessage(from, { text: msg }, { quoted: mek });

    } catch (err) {
        console.log(err);
        reply('❌ Failed to fetch Spotify search results.');
    }
});

//////////////////////////////
// 2️⃣ Spotify Download Command
//////////////////////////////
