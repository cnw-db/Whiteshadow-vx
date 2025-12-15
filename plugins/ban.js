const { cmd } = require("../command");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

cmd({
    pattern: 'aiimg ?(.*)',
    desc: 'Generate AI image with prompt & style',
    sucReact: "🤖",
    category: "AI",
    async handler(m, { text, client }) {
        if (!text) return m.reply("Usage: .aiimg <prompt>|<style>\nExample: girl wearing glasses|anime");

        let [prompt, style] = text.split('|');
        if (!style) style = 'photorealistic'; // default style

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
