cmd({
    pattern: "ping0",
    alias: ["speed0", "pong0"],
    use: '.ping',
    desc: "Check bot's response time with sticker pack style.",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply, pushname }) => {
    try {
        const startTime = Date.now();

        const emojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹', '💎', '🏆', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        // React with random emoji
        await conn.sendMessage(from, { react: { text: randomEmoji, key: mek.key } });

        const ping = Date.now() - startTime;

        // Speed badge and color
        let badge = '🐢 Slow', color = '🔴';
        if (ping <= 150) { badge = '🚀 Super Fast'; color = '🟢'; }
        else if (ping <= 300) { badge = '⚡ Fast'; color = '🟡'; }
        else if (ping <= 600) { badge = '⚠️ Medium'; color = '🟠'; }

        // Fake sticker pack message object
        const fpack = { 
            key: { 
                fromMe: false, 
                participant: "0@s.whatsapp.net", 
                ...(m.chat ? { remoteJid: m.chat } : {}) 
            }, 
            message: { 
                stickerPackMessage: { 
                    name: `Ping: ${ping}ms ${randomEmoji}`, 
                    publisher: `Status: ${color} ${badge}` 
                } 
            } 
        };

        // Send the fake sticker pack (like “quoted” message)
        await conn.sendMessage(from, fpack, { quoted: mek });

    } catch (e) {
        console.error("❌ Error in ping command:", e);
        reply(`⚠️ Error: ${e.message}`);
    }
});
