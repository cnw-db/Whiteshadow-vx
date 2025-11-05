const axios = require('axios');
const config = require("../config");
const { cmd } = require("../command");

cmd({ on: "body" }, async (conn, m, msg, { from, body, isOwner }) => {
  try {
    const jsonUrl = "https://raw.githubusercontent.com/chamod-mv/Whiteshadow-data/refs/heads/main/autovoice.json";
    const res = await axios.get(jsonUrl);
    const voiceMap = res.data;

    for (const keyword in voiceMap) {
      if (body.toLowerCase() === keyword.toLowerCase()) {
        if (config.AUTO_VOICE === "true") {

          // OPTIONAL: Skip owner messages
          if (isOwner) return;

          const audioUrl = voiceMap[keyword];
          if (!audioUrl.endsWith(".mp3") && !audioUrl.endsWith(".m4a")) {
            return conn.sendMessage(from, { text: "Invalid audio format. Only .mp3 or .m4a supported." }, { quoted: m });
          }

          await conn.sendPresenceUpdate("recording", from);
          await conn.sendMessage(
            from,
            {
              audio: { url: audioUrl },
              mimetype: "audio/mp4", // use mp4 type, better for m4a/mp3 both
              ptt: true
            },
            { quoted: m }
          );
        }
      }
    }
  } catch (e) {
    console.error("AutoVoice error:", e);
    return conn.sendMessage(from, { text: "Error fetching voice: " + e.message }, { quoted: m });
  }
});
