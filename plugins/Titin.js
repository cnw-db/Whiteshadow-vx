const fetch = require('node-fetch');
const { cmd } = require('../command');

// 🔐 OWNER ONLY API KEY
const OWNER_API_KEY = "e149763832f5b3ac04fcc5fa3007a328fbb60b2e09f798398f14120b0d4bd29e";

cmd({
    pattern: "reactch",
    alias: ["rch"],
    desc: "Owner only multi emoji react to WhatsApp Channel",
    category: "owner",
    react: "⚡",
    filename: __filename
}, async (conn, m) => {
    try {
        // 👑 OWNER CHECK
        if (!m.isOwner) {
            return m.reply("❌ This command is *Owner Only*");
        }

        // ✅ SAFE TEXT READ
        const text =
            m.text ||
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            "";

        const args = text.trim().split(/\s+/).slice(1);

        if (args.length < 2) {
            return m.reply(
`❌ Usage:
.reactch <CHANNEL_LINK> <EMOJI1>|<EMOJI2>|<EMOJI3>

📌 Example:
.reactch https://whatsapp.com/channel/xxxx 🔥|😍|😂`
            );
        }

        const channelLink = args[0];
        const emojiText = args.slice(1).join(" ");
        const emojis = emojiText.split("|").map(e => e.trim()).filter(Boolean);

        if (emojis.length === 0) {
            return m.reply("⚠️ Emoji එකක්වත් හම්බුනේ නෑ");
        }

        let success = 0;
        let failed = 0;

        for (const emoji of emojis) {
            const url = `https://react.whyux-xec.my.id/api/rch?link=${encodeURIComponent(channelLink)}&emoji=${encodeURIComponent(emoji)}`;

            try {
                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        "x-api-key": OWNER_API_KEY
                    }
                });

                const raw = await res.text();
                let result;

                try {
                    result = JSON.parse(raw);
                } catch {
                    console.log("RAW API RESPONSE:", raw);
                    failed++;
                    continue;
                }

                if (result && result.success === true) {
                    success++;
                } else {
                    failed++;
                }

                // ⏳ small delay (API safe)
                await new Promise(r => setTimeout(r, 700));

            } catch (e) {
                console.error("REACT ERROR:", e);
                failed++;
            }
        }

        return m.reply(
`✅ *Multi React Finished*
━━━━━━━━━━━━━━
🔗 Channel: ${channelLink}
🎯 Success: ${success}
❌ Failed: ${failed}
✨ Emojis: ${emojis.join(" ")}`
        );

    } catch (err) {
        console.error("REACTCH ERROR:", err);
        return m.reply("⚠️ Something went wrong");
    }
});
