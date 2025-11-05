const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: 'spotify',
    desc: 'Search and download Spotify tracks',
    alias: ['sp'],
    type: 'downloader',
    react: '🎵',
    filename: __filename
}, async (conn, mek, m, { text, from, reply }) => {
    if (!text) return reply('❌ Please provide a song name.');

    try {
        // 1️⃣ Spotify Search
        const searchRes = await axios.get(`https://api.ootaizumi.web.id/search/spotify?query=${encodeURIComponent(text)}`);
        const results = searchRes.data.result;
        if (!results || !results.length) return reply('❌ No results found.');

        // Build small details card with first 5 results
        let cardText = '🎵 Spotify Search Results:\n\n';
        results.slice(0, 5).forEach((track, i) => {
            cardText += `*${i+1}.* ${track.title}\n👤 ${track.artist}\n⏱ ${track.duration}\n🔗 ${track.url}\n\n`;
        });
        cardText += 'Reply with the number of the track to download.';

        await conn.sendMessage(from, { text: cardText }, { quoted: mek });

        // 2️⃣ Wait for user reply to select track
        const filter = (replyMsg) => replyMsg.from === from && !isNaN(replyMsg.text) && replyMsg.text > 0 && replyMsg.text <= results.slice(0,5).length;

        const collected = await conn.awaitMessages(from, { filter, max: 1, time: 60000 });
        if (!collected || !collected.size) return reply('❌ No selection made.');

        const choice = parseInt(collected.first().text) - 1;
        const selectedTrack = results[choice];

        // Download track
        const downloadRes = await axios.get(`https://spotify-api-dli.vercel.app/spotifydl?url=${selectedTrack.url}`);
        const trackData = downloadRes.data;

        // Send audio + thumbnail + info
        await conn.sendMessage(from, { 
            image: { url: trackData.thumbnail },
            caption: `🎵 *Title:* ${trackData.title}\n👤 *Artist:* ${trackData.artist}\n⏱ *Duration:* ${trackData.duration}`,
        }, { quoted: mek });

        await conn.sendMessage(from, { 
            audio: { url: trackData.download_url }, 
            mimetype: 'audio/mpeg', 
            ptt: false 
        }, { quoted: mek });

    } catch (err) {
        console.log(err);
        reply('❌ Failed to fetch the track.');
    }
});
