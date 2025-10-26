//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Feature : WhiteShadow AI v5 (Gemini 2.5 Flash-Lite)
//  👑 Developer : Chamod Nimsara (WhiteShadow)
//  📡 Channel   : https://whatsapp.com/channel/0029Vb4fjWE1yT25R7epR110
//═══════════════════════════════════════════════//

const { cmd } = require('../command');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 🧩 imgbb API key
const imgbbKey = "ee4d92af1027d2fe2874d4327c539d46";

cmd({
  pattern: "ai5",
  alias: ["gemini5", "whiteai"],
  desc: "Chat or analyze images using WhiteShadow AI v5",
  category: "ai",
  use: ".ai5 <prompt> or reply with image",
  react: "⚡",
  filename: __filename
}, async (client, message, match) => {
  try {
    let prompt = match?.trim() || "Describe this image.";
    let imageUrl = null;

    // 🖼️ if user replied to an image
    if (message.quoted && message.quoted.imageMessage) {
      const imgPath = path.join(__dirname, "../temp", `${Date.now()}.jpg`);
      const imgBuffer = await message.quoted.download();
      fs.writeFileSync(imgPath, imgBuffer);

      const form = new FormData();
      form.append("image", fs.createReadStream(imgPath));

      const uploadRes = await fetch(`https://api.imgbb.com/1/upload?expiration=600&key=${imgbbKey}`, {
        method: "POST",
        body: form
      });

      const uploadData = await uploadRes.json();
      console.log("🖼️ Upload response:", uploadData);

      if (uploadData?.data?.url) imageUrl = uploadData.data.url;
      fs.unlinkSync(imgPath);
    }

    // 🌐 build api url
    let apiURL = `https://api.nekolabs.web.id/ai/gemini/2.5-flash-lite?text=${encodeURIComponent(prompt)}`;
    if (imageUrl) apiURL += `&imageUrl=${encodeURIComponent(imageUrl)}`;

    const res = await fetch(apiURL);
    const data = await res.json();

    console.log("🔍 Gemini API Response:", data);

    if (!data || !data.result) {
      return await message.reply("❌ *WhiteShadow AI v5:* No valid response from API.");
    }

    const aiText = data.result;
    await message.reply(`💬 *WhiteShadow AI v5:*\n\n${aiText}`);

  } catch (e) {
    console.error("❌ WhiteShadow AI v5 Error:", e);
    await message.reply("⚠️ *WhiteShadow AI v5 Error:* Something went wrong while processing your request.");
  }
});
