const axios = require('axios');
const config = require("../config");
const { cmd } = require("../command");

cmd({ on: "body" }, async (conn, m, msg, { from, body }) => {
  try {
    if (config.AUTO_VOICE !== "true") return;
    const res = await axios.get("https://raw.githubusercontent.com/chamod-mv/Whiteshadow-data/refs/heads/main/autovoice.json");
    const voiceMap = res.data;
    const text = body.toLowerCase();

    for (const keyword in voiceMap) {
      if (text === keyword.toLowerCase()) {
        const audioUrl = voiceMap[keyword];

        // Download file as buffer
        const response = await axios.get(audioUrl, { responseType: "arraybuffer" });
        const audioBuffer = Buffer.from(response.data);

        // Detect MIME type
        let mime = "audio/mpeg";
        if (audioUrl.endsWith(".m4a")) mime = "audio/mp4";
        else if (audioUrl.endsWith(".ogg")) mime = "audio/ogg";

        await conn.sendPresenceUpdate("recording", from);

        // ✅ send with quoted + force PTT (WhatsApp compatible)
        await conn.sendMessage(from, {
          audio: audioBuffer,
          mimetype: mime,
          ptt: true
        }, { quoted: m });

        break;
      }
    }
  } catch (e) {
    console.error("AutoVoice error:", e);
    return conn.sendMessage(from, { text: "⚠️ Error: " + e.message }, { quoted: m });
  }
});
