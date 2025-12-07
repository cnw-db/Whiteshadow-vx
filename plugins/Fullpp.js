/**
* ·············································································
* : _     _ _    ,     _   ______   __   ()   _    ,   __    __    __  _     _:
* :' )   / ' )  /     | )    /     /  `  /\  ' )  /   /  )  /  )  / ')' )   / :
* : / / /   /--/  ,---|/  --/     /--   /  )  /--/   /--/  /  /  /  /  / / /  :
* :(_(_/   /  (_   \_/ \_(_/     (___, /__/__/  (_  /  (_ /__/_ (__/  (_(_/   :
* ·············································································
*/
const { cmd } = require('../command');
const axios = require("axios");
const fetch = require("node-fetch");
const fs = require("fs");

cmd({
    pattern: "fulldp",
    alias: ["fullpp", "setfulldp"],
    desc: "Set full-style profile picture",
    category: "owner",
    react: "🖼️",
    filename: __filename
},

async (conn, mek, m, { from, reply, isCreator, quoted, mime }) => {
    try {
        if (!isCreator) return reply("⚠️ Only bot owner can change profile picture.");
        
        if (!quoted) return reply(`🖼️ *Reply an image with:* .fulldp`);
        if (!/image/.test(mime)) return reply(`⚠️ Reply to an image only.`);

        // Download image
        const mediaPath = await conn.downloadAndSaveMediaMessage(quoted);

        // Read file
        const img = fs.readFileSync(mediaPath);

        // Upload to Catbox for safe link
        const form = new FormData();
        form.append("fileToUpload", fs.createReadStream(mediaPath));
        form.append("reqtype", "fileupload");

        const catRes = await fetch("https://catbox.moe/user/api.php", {
            method: "POST",
            body: form
        });

        const url = await catRes.text();

        // Apply as profile picture
        await conn.updateProfilePicture(conn.user.id, await (await fetch(url)).buffer());

        reply("✅ *Full-style DP applied successfully!*");

        fs.unlinkSync(mediaPath);

    } catch (e) {
        console.log(e);
        reply("❌ Error applying full DP!");
    }
});
