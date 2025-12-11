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
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require("fs");
const FormData = require('form-data');

cmd({
    pattern: "fulldp",
    alias: ["fullpp", "setfulldp"],
    desc: "Set full-style profile picture",
    category: "owner",
    react: "🖼️",
    filename: __filename
},

async (conn, mek, m, { from, reply, isCreator, quoted }) => {
    try {

        if (!isCreator) return reply("⚠️ Only bot owner can change profile picture.");

        // Check quoted exists
        if (!quoted) return reply("🖼️ *Reply an image with:* .fulldp");

        // Detect quoted image type correctly
        let type = quoted.mimetype || quoted.msg?.mimetype || "";
        if (!type.includes("image")) {
            return reply("⚠️ Reply to a *valid image* only.");
        }

        // Download quoted image
        const mediaPath = await conn.downloadAndSaveMediaMessage(quoted);
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", fs.createReadStream(mediaPath));

        // Upload to Catbox for URL
        const catRes = await fetch("https://catbox.moe/user/api.php", {
            method: "POST",
            body: form
        });

        const url = await catRes.text();

        // Apply profile picture
        const buffer = await (await fetch(url)).buffer();
        await conn.updateProfilePicture(conn.user.id, buffer);

        reply("✅ *Full-style DP applied successfully!*");

        fs.unlinkSync(mediaPath);

    } catch (e) {
        console.log(e);
        reply("❌ Error applying full DP!");
    }
});
