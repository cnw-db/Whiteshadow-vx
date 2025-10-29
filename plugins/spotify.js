// File: plugins/spotify.js creater- chamod 
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

const footer = "🎧 WHITESHADOW-MD | Spotify Downloader";

cmd({
    pattern: "spotify",
    alias: ["spotdl", "spdl"],
    use: ".spotify <song name>",
    react: "🎶",
    desc: "Search and download Spotify songs interactively",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { q, from, reply }) => {
    try {
        if (!q) return await reply("❌ Please enter a song name!\n\nExample:\n`.spotify Lelena`");

        const searchApi = await fetchJson(`https://api.zenzxz.my.id/api/search/spotify?query=${encodeURIComponent(q)}`);
        if (!searchApi.success || !searchApi.data?.length) return await reply("❌ No songs found!");

        let listText = `🎧 *WHITESHADOW-MD SPOTIFY SEARCH*\n\n🔍 Results for: *${q}*\n\n`;
        searchApi.data.slice(0, 10).forEach((item, i) => {
            listText += `*${i + 1}.* ${item.title} - ${item.artist}\n💿 Album: ${item.album}\n\n`;
        });

        const listMsg = await conn.sendMessage(
            from,
            { text: listText + `Reply with number to choose a song.\n\n${footer}` },
            { quoted: mek }
        );

        // Wait for user to reply with number
        const listListener = async (update) => {
            const msg = update.messages?.[0];
            if (!msg?.message) return;

            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
            const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === listMsg.key.id;
            if (!isReply) return;

            conn.ev.off("messages.upsert", listListener);

            const index = parseInt(text.trim()) - 1;
            if (isNaN(index) || index < 0 || index >= searchApi.data.length)
                return await reply("❌ Invalid number!");

            const chosen = searchApi.data[index];
            const { cover, title, artist, album, url: trackUrl } = chosen;

            const askMsg = await conn.sendMessage(
                from,
                {
                    image: { url: cover },
                    caption: `🎵 *SONG INFO*\n\n🎧 *Title:* ${title}\n👤 *Artist:* ${artist}\n💿 *Album:* ${album}\n\nReply "1" to *Download Song*.\nReply "0" to *Cancel*.\n\n${footer}`,
                },
                { quoted: msg }
            );

            // Wait for user to confirm download or cancel
            const typeListener = async (tUpdate) => {
                const tMsg = tUpdate.messages?.[0];
                if (!tMsg?.message) return;

                const tText = tMsg.message.conversation || tMsg.message.extendedTextMessage?.text;
                const isReplyType = tMsg.message.extendedTextMessage?.contextInfo?.stanzaId === askMsg.key.id;
                if (!isReplyType) return;

                conn.ev.off("messages.upsert", typeListener);

                if (tText.trim() === "1") {
                    await conn.sendMessage(from, { text: "⏳ Downloading your song, please wait..." }, { quoted: tMsg });

                    const downloadApi = await fetchJson(`https://api.nekolabs.web.id/downloader/spotify/v1?url=${encodeURIComponent(trackUrl)}`);
                    if (!downloadApi.success || !downloadApi.result?.downloadUrl)
                        return await reply("❌ Download link not found! Try another song.");

                    const song = downloadApi.result;

                    await conn.sendMessage(
                        from,
                        {
                            audio: { url: song.downloadUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${song.title}.mp3`,
                            ptt: false,
                            caption: `🎶 *${song.title}*\n👤 ${song.artist}\n💿 Duration: ${song.duration}\n\n${footer}`
                        },
                        { quoted: tMsg }
                    );
                } else if (tText.trim() === "0") {
                    await conn.sendMessage(from, { text: "❌ Cancelled." }, { quoted: tMsg });
                } else {
                    await conn.sendMessage(from, { text: "❌ Invalid input. Reply 1 to download or 0 to cancel." }, { quoted: tMsg });
                }
            };

            conn.ev.on("messages.upsert", typeListener);
        };

        conn.ev.on("messages.upsert", listListener);

    } catch (e) {
        console.error(e);
        await reply("*❌ Error:* " + e);
    }
});
