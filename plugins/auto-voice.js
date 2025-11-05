const axios = require('axios');
const config = require("../config");
const { cmd } = require("../command");

cmd({ on: "body" }, async (conn, mek, msg, { from, body, isOwner }) => {
  try {
    const jsonUrl = "https://raw.githubusercontent.com/chamod-mv/Whiteshadow-data/refs/heads/main/autovoice.json";
    const res = await axios.get(jsonUrl);
    const data = res.data;

    const text = body.toLowerCase();

    if (data[text]) {
      if (config.AUTO_VOICE === 'true') {
        if (isOwner) return;

        const audioUrl = data[text];

        // Validate audio file type
        if (!audioUrl.endsWith(".mp3") && !audioUrl.endsWith(".m4a")) {
          return conn.sendMessage(from, { text: "❌ Invalid audio format. Only .mp3 or .m4a supported." }, { quoted: mek });
        }

        await conn.sendPresenceUpdate('recording', from);

        await conn.sendMessage(
          from,
          {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: true
          },
          { quoted: mek }
        );
      }
    }

  } catch (e) {
    console.error("AutoVoice error:", e);
    return conn.sendMessage(from, { text: "⚠️ Error fetching voice: " + e.message }, { quoted: mek });
  }
});
