//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Feature : WhiteShadow AI (Gemini 2.5 Lite)
//  👑 Developer : Chamod Nimsara (WhiteShadow)
//  📡 Channel   : https://whatsapp.com/channel/0029Vb4fjWE1yT25R7epR110
//═══════════════════════════════════════════════//

const { cmd } = require('../command');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const imgbbKey = "ee4d92af1027d2fe2874d4327c539d46";

cmd({
  pattern: "ai2",
  alias: ["gemini", "aimg"],
  desc: "Chat with WhiteShadow AI (supports image input)",
  category: "ai",
  use: ".ai2 <prompt> (tag image optional)",
  react: "🤖",
  filename: __filename
}, async (client, message, match) => {
  try {
    let prompt = match || "";
    let imageUrl = null;

    //==== 🖼️ If image quoted ====
    if (message.quoted && message.quoted.imageMessage) {
      const mediaPath = path.join(__dirname, "../temp", `${Date.now()}.jpg`);
      const buffer = await message.quoted.download();
      fs.writeFileSync(mediaPath, buffer);

      const form = new FormData();
      form.append("image", fs.createReadStream(mediaPath));

      const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
        method: "POST",
        body: form
      });
      const uploadJson = await uploadRes.json();

      if (uploadJson?.data?.url) imageUrl = uploadJson.data.url;

      fs.unlinkSync(mediaPath); // delete temp file
    }

    //==== ⚙️ Build API URL ====
    let apiUrl = `https://api.nekolabs.web.id/ai/gemini/2.5-flash-lite?text=${encodeURIComponent(prompt)}`;
    if (imageUrl) apiUrl += `&imageUrl=${encodeURIComponent(imageUrl)}`;

    const res = await fetch(apiUrl);
    const json = await res.json();

    //==== ✅ Proper Response Check ====
    const aiText = json?.result || json?.message || json?.response || null;

    if (!aiText) {
      return await message.reply("💬 *WhiteShadow AI:*\n\nIt seems the API didn’t return a proper text response. Try again with a clearer prompt.");
    }

    //==== 💬 Send AI Reply ====
    await message.reply(`💬 *WhiteShadow AI:*\n\n${aiText}`);

  } catch (err) {
    console.error(err);
    await message.reply("❌ *WhiteShadow AI Error:*\nAn error occurred while processing your request.");
  }
});
