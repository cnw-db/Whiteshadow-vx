const fs = require('fs');

cmd({
    pattern: "pingx",
    alias: ["speedx", "pongx"],
    use: ".ping",
    desc: "Ping command using fake stickerPackMessage style",
    category: "main",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, sender, pushname, reply }) => {
    try {
        const start = Date.now();

        // 1️⃣ React with a random emoji
        const emojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        await conn.sendMessage(from, { react: { text: randomEmoji, key: mek.key } });

        // 2️⃣ Calculate ping
        const ping = Date.now() - start;

        // 3️⃣ Speed badge
        let badge = '🐢 Slow', color = '🔴';
        if (ping <= 150) { badge = '🚀 Super Fast'; color = '🟢'; }
        else if (ping <= 300) { badge = '⚡ Fast'; color = '🟡'; }
        else if (ping <= 600) { badge = '⚠️ Medium'; color = '🟠'; }

        // 4️⃣ Fake sticker pack message object (fpack style)
        const fpack = { 
            key: { 
                fromMe: false, 
                participant: "0@s.whatsapp.net", 
                ...(m.chat ? { remoteJid: m.chat } : {}) 
            },
            message: { 
                stickerPackMessage: { 
                    name: `Ping: ${ping} ms ${randomEmoji}`, 
                    publisher: `Status: ${color} ${badge}` 
                } 
            } 
        };

        // 5️⃣ Send the fpack message (quoted to original)
        await conn.sendMessage(from, fpack, { quoted: mek });

    } catch (e) {
        console.error("❌ Error in ping command:", e);
        reply(`⚠️ Error: ${e.message}`);
    }
});
