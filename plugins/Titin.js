const fetch = require('node-fetch');
const { cmd } = require('../command');

// 🔐 API KEY (hidden)
const BOT_API_KEY = "e149763832f5b3ac04fcc5fa3007a328fbb60b2e09f798398f14120b0d4bd29e";

cmd({
    pattern: "reactch",
    alias: ["rch"],
    desc: "Bot self only multi react",
    category: "owner",
    filename: __filename
}, async (conn, m) => {
    try {
        // ✅ BOT SELF CHECK (CORRECT)
        if (!m.fromMe) return; // bot msg not sent → ignore

        // ✅ READ TEXT SAFELY
        const fullText =
            m.text ||
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            "";

        const args = fullText.trim().split(/\s+/).slice(1);

        if (args.length < 2) {
            return m.reply(
`❌ Usage:
.reactch <CHANNEL_LINK> <EMOJI1>|<EMOJI2>|<EMOJI3>

📌 Example:
.reactch https://whatsapp.com/channel/xxxx 🔥|😍|😂`
            );
        }

        const channelLink = args[0];
        const emojis = args
            .slice(1)
            .join(" ")
            .split("|")
            .map(e => e.trim())
            .filter(Boolean);

        let success = 0;
        let failed = 0;

        for (const emoji of emojis) {
            const url =
`https://react.whyux-xec.my.id/api/rch?link=${encodeURIComponent(channelLink)}&emoji=${encodeURIComponent(emoji)}`;

            try {
                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        "x-api-key": BOT_API_KEY
                    }
                });

                const raw = await res.text();
                let json;

                try {
                    json = JSON.parse(raw);
                } catch {
                    console.log("RAW API:", raw);
                    failed++;
                    continue;
                }

                if (json.success === true) success++;
                else failed++;

                // ⏳ safe delay
                await new Promise(r => setTimeout(r, 600));

            } catch (e) {
                console.error("REACT ERROR:", e);
                failed++;
            }
        }

        return m.reply(
`🤖 *BOT MULTI REACT DONE*
━━━━━━━━━━━━━━
🔗 Channel: ${channelLink}
✨ Emojis: ${emojis.join(" ")}
✅ Success: ${success}
❌ Failed: ${failed}`
        );

    } catch (err) {
        console.error("REACTCH FATAL:", err);
        return m.reply("⚠️ React command crashed");
    }
});
