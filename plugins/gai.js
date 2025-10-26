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
  pattern: "ask2",
  alias: ["aiask", "aimg"],
  desc: "Chat with WhiteShadow AI (supports image input)",
  category: "ai",
  use: ".ai2 <prompt> (tag image optional)",
  react: "🤖",
  filename: __filename
}, async (client, message, match) => {
  try {
    let prompt = match || "";
    let imageUrl = null;

    //==== 🖼️ Handle image if quoted ====
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

      if (uploadJson && uploadJson.data && uploadJson.data.url) {
        imageUrl = uploadJson.data.url;
      }

      fs.unlinkSync(mediaPath); // 🧹 Delete after upload
    }

    //==== ⚙️ Build API URL ====
    let apiUrl = `https://api.nekolabs.web.id/ai/gemini/2.5-flash-lite?text=${encodeURIComponent(prompt)}`;
    if (imageUrl) apiUrl += `&imageUrl=${encodeURIComponent(imageUrl)}`;

    //==== 📡 Fetch from API ====
    const res = await fetch(apiUrl);
    const json = await res.json();

    if (!json || !json.success || !json.result) {
      return await message.reply("💬 *WhiteShadow AI:*\n\nIt looks like the API didn't return any data. Try again!");
    }

    //==== 💬 Send AI Response ====
    await message.reply(`💬 *WhiteShadow AI:*\n\n${json.result}`);

  } catch (err) {
    console.error(err);
    await message.reply("❌ *WhiteShadow AI Error:*\nSomething went wrong while processing your request.");
  }
});
