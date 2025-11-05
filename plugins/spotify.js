const axios = require('axios');
const { cmd } = require('../command');

//////////////////////////////
// 1️⃣ Spotify Search Command
//////////////////////////////

 //////////////////////////////
// 1️⃣ Spotify Search Command
//////////////////////////////
cmd({
    pattern: 'spotify',
    desc: 'Search Spotify tracks and send all results',
    alias: ['sp'],
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
        msg += 'Use `.sptdl <Spotify URL>` to download a track.';

        await conn.sendMessage(from, { text: msg }, { quoted: mek });

    } catch (err) {
        console.log(err);
        reply('❌ Failed to fetch Spotify search results.');
    }
});

//////////////////////////////
// 2️⃣ Spotify Download Command
//////////////////////////////
cmd({
    pattern: 'sptdl',
    desc: 'Download Spotify track using URL',
    alias: ['spotifydl'],
    type: 'downloader',
    react: '🎵',
    filename: __filename
}, async (conn, mek, m, { text, from, reply }) => {
    if (!text) return reply('❌ Please provide a Spotify track URL.');

    try {
        const downloadRes = await axios.get(`https://spotify-api-dli.vercel.app/spotifydl?url=${text}`);
        const trackData = downloadRes.data;

        if (!trackData.status) return reply('❌ Failed to download Spotify track.');

        // Send details card with thumbnail
        await conn.sendMessage(from, {
            image: { url: trackData.thumbnail },
            caption: `🎵 *Title:* ${trackData.title}\n👤 *Artist:* ${trackData.artist}\n⏱ *Duration:* ${trackData.duration}`,
        }, { quoted: mek });

        // Send audio
        await conn.sendMessage(from, {
            audio: { url: trackData.download_url },
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: mek });

    } catch (err) {
        console.log(err.response?.data || err.message);
        reply('❌ Failed to download Spotify track. Check the URL or try again later.');
    }
});
