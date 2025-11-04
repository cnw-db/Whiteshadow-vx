const axios = require('axios');
const config = require("../config");
const { cmd } = require("../command");

cmd({ on: "body" }, async (conn, m, msg, { from, body }) => {
  try {
    const jsonUrl = "https://raw.githubusercontent.com/chamod-mv/Whiteshadow-data/refs/heads/main/autovoice.json";
    const res = await axios.get(jsonUrl);
    const voiceMap = res.data;

    const text = body.toLowerCase();
    if (config.AUTO_VOICE !== "true") return; // AutoVoice off නම් stop

    for (const keyword in voiceMap) {
      if (text === keyword.toLowerCase()) {
        const audioUrl = voiceMap[keyword];

        // Valid format check
        if (!audioUrl.endsWith(".mp3") && !audioUrl.endsWith(".m4a")) {
          return conn.sendMessage(from, { text: "❌ Invalid audio format (.mp3 / .m4a only)" }, { quoted: m });
        }

        await conn.sendPresenceUpdate("recording", from);

        // Detect MIME type dynamically
        const mimeType = audioUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg";

        // Use buffer instead of direct URL (WhatsApp prefers file buffer)
        const audioBuffer = (await axios.get(audioUrl, { responseType: "arraybuffer" })).data;

        await conn.sendMessage(from, {
          audio: audioBuffer,
          mimetype: mimeType,
          ptt: true
        }, { quoted: m });

        break; // stop loop after match
      }
    }
  } catch (e) {
    console.error("AutoVoice error:", e);
    return conn.sendMessage(from, { text: "⚠️ Error fetching voice: " + e.message }, { quoted: m });
  }
});
