/**
 * 🔮 WHITESHADOW-MD 🔮
 * Plugin: Image ➜ AI Video Generator
 * Author: ZenzzXD | Modified for WhiteShadow by Chamod Nimsara
 */

const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');

cmd({
    pattern: "img2vid",
    alias: ["text2vid", "image2video"],
    desc: "Convert an image + text prompt into an AI-generated video",
    category: "ai",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        // Get quoted message mimetype
        const mime = m.quoted?.mimetype || '';
        if (!/image/.test(mime))
            return reply("🖼️ Reply to an image with:\n\n`.img2vid <prompt>`");

        const prompt = m.text.split(" ").slice(1).join(" ");
        if (!prompt)
            return reply("⚠️ Please enter a prompt!\nExample: `.img2vid sunset over ocean`");

        await reply("⏳ *Uploading image... Please wait!*");

        // Download quoted image
        const img = await m.quoted.download();

        // Upload to uguu.se
        const form = new FormData();
        form.append("files[]", img, { filename: "whiteshadow.jpg", contentType: "image/jpeg" });

        const upload = await axios.post("https://uguu.se/upload", form, { headers: form.getHeaders() });
        const imageUrl = upload.data?.files?.[0]?.url;

        if (!imageUrl) return reply("❌ Image upload failed!");

        await reply("🎥 *Generating video... This may take 1–3 minutes*");

        // Generate video
        const gen = await axios.post("https://veo31ai.io/api/pixverse-token/gen", {
            videoPrompt: prompt,
            videoAspectRatio: "16:9",
            videoDuration: 5,
            videoQuality: "540p",
            videoModel: "v4.5",
            videoImageUrl: imageUrl,
            videoPublic: false
        });

        const taskId = gen.data?.taskId;
        if (!taskId) return reply("❌ Failed to create video task!");

        // Poll for completion
        const timeout = Date.now() + 180000;
        let videoUrl;

        while (Date.now() < timeout) {
            const res = await axios.post("https://veo31ai.io/api/pixverse-token/get", {
                taskId,
                videoPublic: false,
                videoQuality: "540p",
                videoAspectRatio: "16:9",
                videoPrompt: prompt
            });

            videoUrl = res.data?.videoData?.url;
            if (videoUrl) break;
            await new Promise(r => setTimeout(r, 5000));
        }

        if (!videoUrl) return reply("❌ Failed to generate video!");

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `🎬 *WhiteShadow AI - Image to Video*\n🎨 Prompt: ${prompt}`,
        }, { quoted: m });
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});
