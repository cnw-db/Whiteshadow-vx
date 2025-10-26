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

// 🧩 Your temporary imgbb API key (auto-deletes images)
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

    // 🖼️ If quoted image available
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
      if (uploadData?.data?.url) imageUrl = uploadData.data.url;

      fs.unlinkSync(imgPath); // auto delete temp file
    }

    // 🌐 Build Nekolabs API URL
    let apiURL = `https://api.nekolabs.web.id/ai/gemini/2.5-flash-lite?text=${encodeURIComponent(prompt)}`;
    if (imageUrl) apiURL += `&imageUrl=${encodeURIComponent(imageUrl)}`;

    const res = await fetch(apiURL);
    const data = await res.json();

    // 🧠 Extract the real AI reply
    const aiText =
      data?.result ||
      data?.message ||
      data?.response ||
      "⚠️ No valid text response received from API.";

    // 💬 Send clean formatted message
    await message.reply(`💬 *WhiteShadow AI v5:*\n\n${aiText}`);

  } catch (error) {
    console.error("WhiteShadow AI v5 Error:", error);
    await message.reply("❌ *WhiteShadow AI v5 Error:*\nSomething went wrong while processing your request.");
  }
});
