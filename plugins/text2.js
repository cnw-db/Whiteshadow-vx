/**
 * 🔮 WHITESHADOW-MD 🔮
 * Plugin: Image ➜ AI Video Generator (Fixed)
 * Author: ZenzzXD | Modified & Fixed by Chamod Nimsara
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
        const mime = m.quoted?.mimetype || '';
        if (!/image/.test(mime))
            return reply("🖼️ Reply to an image with:\n\n`.img2vid <prompt>`");

        const prompt = m.text.split(" ").slice(1).join(" ");
        if (!prompt)
            return reply("⚠️ Please enter a prompt!\nExample: `.img2vid beautiful cyberpunk city`");

        await reply("⏳ *Uploading image... Please wait!*");

        // 🖼️ Download the image from quoted message
        const img = await m.quoted.download();
        const form = new FormData();
        form.append("file", img, { filename: "whiteshadow.jpg", contentType: "image/jpeg" });

        // ✅ Use anonfiles for reliable upload
        const upload = await axios.post("https://api.anonfiles.com/upload", form, { headers: form.getHeaders() });
        const imageUrl = upload.data?.data?.file?.url?.short;

        if (!imageUrl) return reply("❌ Image upload failed!");

        await reply("🎥 *Generating video... This may take 1–3 minutes*");

        // 🎬 Generate video via PixVerse main API
        const gen = await axios.post("https://pixverse.ai/api/pixverse-token/gen", {
            videoPrompt: prompt,
            videoAspectRatio: "16:9",
            videoDuration: 5,
            videoQuality: "540p",
            videoModel: "v4.5",
            videoImageUrl: imageUrl,
            videoPublic: false
        }, {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        const taskId = gen.data?.taskId;
        if (!taskId) return reply("❌ Failed to create video task!");

        // 🔁 Polling for video result
        const timeout = Date.now() + 180000;
        let videoUrl;

        while (Date.now() < timeout) {
            const res = await axios.post("https://pixverse.ai/api/pixverse-token/get", {
                taskId,
                videoPublic: false,
                videoQuality: "540p",
                videoAspectRatio: "16:9",
                videoPrompt: prompt
            }, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            videoUrl = res.data?.videoData?.url;
            if (videoUrl) break;
            await new Promise(r => setTimeout(r, 5000));
        }

        if (!videoUrl) return reply("❌ Video generation failed! Try again later.");

        // ✅ Send the generated video
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `🎬 *WhiteShadow AI - Image to Video*\n🎨 Prompt: ${prompt}`,
        }, { quoted: m });

    } catch (e) {
        console.log("🔴 API Error:", e.response?.data || e.message);
        reply(`❌ Error: ${e.response?.data?.message || e.message}`);
    }
});
