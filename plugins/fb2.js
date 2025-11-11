const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

const fakevCard = {
    key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
    message: {
        contactMessage: {
            displayName: "© WhiteShadow-MD",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:WhiteShadow-MD\nTEL;type=CELL;type=VOICE;waid=94704896880:+94704896880\nEND:VCARD`
        }
    }
};

cmd({
    pattern: "facebook",
    react: "🎥",
    alias: ["fbb", "fbvideo", "fb"],
    desc: "Download Facebook videos via number reply",
    category: "download",
    use: ".facebook <facebook_url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply("🚩 Please provide a valid Facebook URL 🐼");

    try {
        const fb = await fetchJson(`https://api.ootaizumi.web.id/downloader/facebook?url=${encodeURIComponent(q)}`);
        if (!fb.status || !fb.result?.downloads?.length) return reply("❌ Couldn't find video for this link.");

        const thumb = fb.result.thumbnail;
        const downloads = fb.result.downloads;

        let caption = `🎥 *WHITESHADOW-MD FACEBOOK DOWNLOADER* 🎥\n\n📝 *Title:* Facebook Video\n🔗 *URL:* ${q}\n\n💬 *Reply with your choice:*`;
        downloads.forEach((d, i) => caption += `\n${i + 1}️⃣ ${d.quality}`);
        caption += `\n\n© Powered by WhiteShadow-MD 🌛`;

        const sentMsg = await conn.sendMessage(from, {
            image: { url: thumb },
            caption
        }, { quoted: fakevCard });

        const messageID = sentMsg.key.id;

        // ❌ Remove any previous listener for this message
        const listener = async (msgUpdate) => {
            try {
                const mekInfo = msgUpdate?.messages?.[0];
                if (!mekInfo?.message) return;

                // Get actual text from message
                const userText = mekInfo?.message?.conversation || mekInfo?.message?.extendedTextMessage?.text;
                if (!userText) return;

                // Check if reply is for this message
                const contextId = mekInfo?.message?.extendedTextMessage?.contextInfo?.stanzaId;
                if (contextId !== messageID) return;

                const choice = parseInt(userText.trim());
                if (!choice || choice < 1 || choice > downloads.length) return reply("❌ Invalid choice! Please reply with a valid number.");

                await conn.sendMessage(from, { react: { text: "⬇️", key: mekInfo.key } });

                const selected = downloads[choice - 1];
                await conn.sendMessage(from, {
                    video: { url: selected.url },
                    mimetype: "video/mp4",
                    caption: `*${selected.quality}*`
                }, { quoted: m });

                await conn.sendMessage(from, { react: { text: "✅", key: mekInfo.key } });

                // Remove listener after successful reply
                conn.ev.off("messages.upsert", listener);
            } catch (err) {
                console.error("Reply handler error:", err);
            }
        };

        conn.ev.on("messages.upsert", listener);

    } catch (err) {
        console.error(err);
        reply("💔 Failed to download the video. Please try again later 🐼");
    }
});
