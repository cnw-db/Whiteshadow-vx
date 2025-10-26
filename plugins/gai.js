//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Feature : Smart AI Chat + Image Analysis
//  👑 Developer : Chamod Nimsara (WhiteShadow)
//  📡 Channel   : https://whatsapp.com/channel/0029Vb4fjWE1yT25R7epR110
//═══════════════════════════════════════════════//

const { cmd } = require('../command');
const fetch = require('node-fetch');
const FormData = require('form-data');
const { IMGBB_API_KEY } = require('../config');

cmd({
    pattern: "aiask",
    alias: ["geminiai", "imageai", "smartai"],
    react: "🤖",
    desc: "Chat with Gemini AI or analyze an image intelligently",
    category: "ai",
    filename: __filename
}, async (client, message, match) => {
    try {
        const media = message.quoted?.message?.imageMessage || message.message?.imageMessage;
        const userText = match || message.quoted?.text || "";

        // ─────── 🖼️ IMAGE MODE ───────
        if (media) {
            const buffer = await client.downloadMediaMessage(media);

            if (!IMGBB_API_KEY) {
                return await message.reply("⚠️ *IMGBB_API_KEY not found!* Please add it in your config.env file.");
            }

            // Upload to imgbb (temporary, auto-delete in 5min)
            const formData = new FormData();
            formData.append("image", buffer.toString("base64"));

            const uploadUrl = `https://api.imgbb.com/1/upload?expiration=300&key=${IMGBB_API_KEY}`;
            const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
            const uploadJson = await uploadRes.json();

            if (!uploadJson.success) return await message.reply("❌ Image upload failed!");

            const imageUrl = uploadJson.data.url;
            const prompt = encodeURIComponent(userText || "මෙම ඡායාරූපය විස්තර කරන්න");
            const apiUrl = `https://api.nekolabs.web.id/ai/gemini/2.5-flash-lite?text=${prompt}&imageUrl=${encodeURIComponent(imageUrl)}`;

            const aiRes = await fetch(apiUrl);
            const aiJson = await aiRes.json();

            if (!aiJson.success) return await message.reply("😔 AI විස්තර ලබාගැනීමට අසමත් විය.");

            return await message.reply(`🖼️ *AI Image Description:*\n\n${aiJson.result}\n\n🕒 (Temporary image — auto deleted after 5 minutes)`);
        }

        // ─────── 💬 TEXT MODE ───────
        if (!userText) return await message.reply("💬 කරුණාකර ප්‍රශ්නයක් හෝ image එකක් යවන්න.");

        const textPrompt = encodeURIComponent(userText);
        const aiRes = await fetch(`https://api.nekolabs.web.id/ai/gemini/2.5-flash-lite?text=${textPrompt}`);
        const aiJson = await aiRes.json();

        if (!aiJson.success) return await message.reply("❌ AI ප්‍රතිචාරය ලබාගැනීමට අසමත් විය.");

        await message.reply(`💬 *WhiteShadow AI:*\n\n${aiJson.result}`);
    } catch (e) {
        console.error(e);
        await message.reply("⚠️ දෝෂයක් සිදු විය. නැවත උත්සාහ කරන්න.");
    }
});
