const fs = require('fs');
const https = require('https');
const path = require('path');

cmd({
    pattern: "pingx",
    alias: ["speedy", "pongz"],
    use: ".ping",
    desc: "Ping command with sticker image",
    category: "main",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, sender, pushname, reply }) => {
    try {
        const start = Date.now();

        // React with random emoji
        const emojis = ['🔥','⚡','🚀','💨','🎯','🎉','🌟','💥','🕐','🔹'];
        const randomEmoji = emojis[Math.floor(Math.random()*emojis.length)];
        await conn.sendMessage(from, { react: { text: randomEmoji, key: mek.key } });

        const ping = Date.now() - start;

        let badge = '🐢 Slow', color = '🔴';
        if (ping <= 150) { badge = '🚀 Super Fast'; color = '🟢'; }
        else if (ping <= 300) { badge = '⚡ Fast'; color = '🟡'; }
        else if (ping <= 600) { badge = '⚠️ Medium'; color = '🟠'; }

        // Download the WebP sticker from the URL
        const url = 'https://files.catbox.moe/732gct.webp';
        const stickerPath = path.join(__dirname, 'temp_sticker.webp');

        // Simple download logic
        await new Promise((resolve, reject) => {
            const file = fs.createWriteStream(stickerPath);
            https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            }).on('error', (err) => {
                fs.unlink(stickerPath, ()=>{});
                reject(err);
            });
        });

        const stickerBuffer = fs.readFileSync(stickerPath);

        // Send sticker
        const sentSticker = await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

        // Send ping info as text (quote sticker)
        await conn.sendMessage(from, {
            text: `> *WHITESHADOW‑MD ʀᴇsᴘᴏɴsᴇ: ${ping} ms ${randomEmoji}*\n> *sᴛᴀᴛᴜs: ${color} ${badge}*`
        }, { quoted: sentSticker });

        // (Optional) Delete temp sticker file
        fs.unlinkSync(stickerPath);

    } catch (e) {
        console.error("❌ Error in ping command:", e);
        reply(`⚠️ Error: ${e.message}`);
    }
});
