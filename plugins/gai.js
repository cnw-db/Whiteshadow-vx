const { cmd } = require('../command');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

cmd({
    pattern: "aiask",
    alias: ["imageai", "geminiai", "smartai"],
    desc: "AI Smart Chat / Image Description",
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (client, message, match) => {
    try {
        // Detect image (if replied)
        const media = message.quoted?.message?.imageMessage || message.message?.imageMessage;
        const userText = match || message.quoted?.text || "";

        // If image is present → analyze image
        if (media) {
            const buffer = await client.downloadMediaMessage(media);

            // Upload to Catbox
            const formData = new FormData();
            formData.append("fileToUpload", buffer, "image.jpg");

            const catboxRes = await fetch("https://catbox.moe/user/api.php", {
                method: "POST",
                body: formData
            });
            const imageUrl = await catboxRes.text();

            // API request with image
            const prompt = encodeURIComponent(userText || "මෙම ඡායාරූපය විස්තර කරන්න");
            const apiUrl = `https://api.nekolabs.web.id/ai/gemini/2.5-flash-lite?text=${prompt}&imageUrl=${encodeURIComponent(imageUrl)}`;

            const aiRes = await fetch(apiUrl);
            const aiJson = await aiRes.json();

            if (!aiJson.success) return await message.reply("😔 AI විස්තර ලබාගැනීමට අසමත් විය.");

            return await message.reply(`🖼️ *Image Analysis Result:*\n\n${aiJson.result}`);
        }

        // If no image → normal AI chat
        if (!userText) return await message.reply("🤖 කරුණාකර ප්‍රශ්නයක් හෝ image එකක් යවන්න.");

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
