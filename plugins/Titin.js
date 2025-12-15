const fetch = require('node-fetch');
const { cmd } = require('../command');

cmd({
    pattern: "reactch",
    alias: ["rch", "reactchannel"],
    desc: "Send emoji reaction to WhatsApp Channel (user API key)",
    category: "tools",
    react: "⚡",
    filename: __filename
}, async (conn, m, text) => {
    try {
        if (!text) {
            return m.reply(
`❌ Usage:
.reactch <API_KEY> <CHANNEL_LINK> <EMOJI>

📌 Example:
.reactch APIKEY_dapiya https://whatsapp.com/channel/xxxx 🔥`
            );
        }

        const args = text.split(" ");

        const apiKey = args[0];
        const channelLink = args[1];
        const emoji = args.slice(2).join(" ");

        if (!apiKey || !channelLink || !emoji) {
            return m.reply("⚠️ API key, channel link සහ emoji එකත් දෙන්න!");
        }

        const ENCODED_LINK_CH = encodeURIComponent(channelLink);
        const ENCODED_EMOJI = encodeURIComponent(emoji);

        const url = `https://react.whyux-xec.my.id/api/rch?link=${ENCODED_LINK_CH}&emoji=${ENCODED_EMOJI}`;

        const headers = {
            "x-api-key": apiKey
        };

        const response = await fetch(url, {
            method: "GET",
            headers
        });

        const raw = await response.text();
        let result;

        try {
            result = JSON.parse(raw);
        } catch (e) {
            console.log("RAW RESPONSE:", raw);
            return m.reply("⚠️ API response invalid");
        }

        if (result && result.success === true) {
            return m.reply(
`✅ *React Sent Successfully!*
━━━━━━━━━━━━━━
🔗 Channel: ${channelLink}
🌟 Emoji: ${emoji}`
            );
        } else {
            console.error("API ERROR:", result);
            const errMsg = result?.error || "ukana react";
            return m.reply(`⚠️ ${errMsg}`);
        }

    } catch (err) {
        console.error("FETCH ERROR:", err);
        return m.reply("⚠️ API na bang! 🙄");
    }
});
