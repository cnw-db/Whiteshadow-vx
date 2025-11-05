const axios = require('axios');
const { cmd } = require('../command'); // WHITESHADOW-MD cmd function path adjust කරන්න

cmd({
    pattern: 'spotify',
    desc: 'Search and download Spotify tracks',
    alias: ['sp'],
    type: 'downloader', // cmd type can be 'downloader', 'fun', etc.
    react: '🎵',
    filename: __filename
}, async (conn, mek, m, { text, from, reply }) => {
    if (!text) return reply('❌ Please provide a song name or Spotify track URL.');

    try {
        let trackData;

        // Check if text is a Spotify track URL
        if (text.includes('open.spotify.com/track')) {
            const res = await axios.get(`https://spotify-api-dli.vercel.app/spotifydl?url=${text}`);
            trackData = res.data;
        } else {
            // Search track by name
            const searchRes = await axios.get(`https://api.ootaizumi.web.id/search/spotify?query=${encodeURIComponent(text)}`);
            if (!searchRes.data.result || !searchRes.data.result.length) return reply('❌ No results found.');
            const firstTrack = searchRes.data.result[0];

            const res = await axios.get(`https://spotify-api-dli.vercel.app/spotifydl?url=${firstTrack.url}`);
            trackData = res.data;
        }

        // Send audio
        await conn.sendMessage(from, { 
            audio: { url: trackData.download_url }, 
            mimetype: 'audio/mpeg', 
            ptt: false 
        }, { quoted: mek });

        // Send track info
        await conn.sendMessage(from, { 
            text: `🎵 *Title:* ${trackData.title}\n👤 *Artist:* ${trackData.artist}\n⏱ *Duration:* ${trackData.duration}`,
        }, { quoted: mek });

    } catch (err) {
        console.log(err);
        reply('❌ Failed to fetch the track.');
    }
});
