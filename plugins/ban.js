const { cmd } = require("../command");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const styles = ['photorealistic', 'digital-art', 'impressionist', 'anime', 'fantasy', 'sci-fi', 'vintage'];

cmd({
    pattern: 'aiimg ?(.*)',
    desc: 'Generate AI image with prompt & style (choose style via buttons)',
    sucReact: "🤖",
    category: "AI",
    async handler(m, { text, client }) {
        if (!text) return m.reply("Usage: .aiimg <prompt>\nThen select style from buttons.");

        const prompt = text.trim();

        // Create style buttons
        const buttons = styles.map(style => ({
            buttonId: `aiimgbtn|${prompt}|${style}`,
            buttonText: { displayText: style },
            type: 1
        }));

        const buttonMessage = {
            text: `✨ *Select Style for:* ${prompt}`,
            buttons,
            headerType: 1
        };

        await client.sendMessage(m.from, buttonMessage, { quoted: m });
    }
});

// Button handler
cmd({
    pattern: 'aiimgbtn\\|(.*)\\|(.*)',
    fromMe: true,
    desc: 'Handle AI image button press',
    async handler(m, { client, match }) {
        const [_, prompt, style] = match;

        try {
            const url = `https://ai-pic-whiteshadow.vercel.app/api/unrestrictedai?prompt=${encodeURIComponent(prompt)}&style=${encodeURIComponent(style)}`;
            const res = await fetch(url);
            const data = await res.json();

            if (!data.status) return m.reply("❌ Failed to generate image.");

            await client.sendMessage(m.from, {
                image: { url: data.result },
                caption: `✨ *AI Image Generated*\n• Prompt: ${data.prompt}\n• Style: ${data.style}\n• Creator: ${data.creator}`
            }, { quoted: m });

        } catch (err) {
            console.log(err);
            m.reply("❌ Error generating AI image.");
        }
    }
});
