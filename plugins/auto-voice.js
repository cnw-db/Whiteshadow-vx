const axios = require('axios');
const config = require("../config");
const { cmd } = require("../command");

cmd({ on: "body" }, async (conn, mek, msg, { from, body, isOwner }) => {
  try {

    // JSON URL
    const jsonUrl = "https://raw.githubusercontent.com/chamod-mv/Whiteshadow-data/refs/heads/main/autovoice.json";

    // Fetch JSON safely
    const res = await axios.get(jsonUrl).catch(() => null);
    if (!res || !res.data) {
      return conn.sendMessage(from, { text: "⚠️ AutoVoice JSON load failed!" }, { quoted: mek });
    }

    const data = res.data;

    if (!body) return;
    const text = body.toLowerCase().trim();

    if (!data[text]) return;

    if (config.AUTO_VOICE !== "true") return;
    if (isOwner) return;

    const audioUrl = data[text];

    if (!/^https?:\/\//i.test(audioUrl)) {
      return conn.sendMessage(from, { text: "❌ Invalid audio URL in JSON." }, { quoted: mek });
    }

    // Show recording status
    await conn.sendPresenceUpdate("recording", from);

    // Send as OGG OPUS (WhatsApp voice note format)
    await conn.sendMessage(
      from,
      {
        audio: { url: audioUrl },
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true
      },
      { quoted: mek }
    );

  } catch (e) {
    console.error("AutoVoice Error:", e);
    return conn.sendMessage(from, { text: "⚠️ AutoVoice Error: " + e.message }, { quoted: mek });
  }
});
