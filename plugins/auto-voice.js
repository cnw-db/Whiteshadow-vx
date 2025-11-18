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

    // Keyword not found → ignore
    if (!data[text]) return;

    // Auto voice disabled → ignore
    if (config.AUTO_VOICE !== "true") return;

    // Owner → ignore
    if (isOwner) return;

    const audioUrl = data[text];

    // Validate URL
    if (!/^https?:\/\//i.test(audioUrl)) {
      return conn.sendMessage(from, { text: "❌ Invalid audio URL in JSON." }, { quoted: mek });
    }

    // Detect MIME type
    let mimeType = audioUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg";

    // Show recording
    await conn.sendPresenceUpdate("recording", from);

    // Send voice (PTT)
    await conn.sendMessage(
      from,
      {
        audio: { url: audioUrl },
        mimetype: mimeType,
        ptt: true
      },
      { quoted: mek }
    );

  } catch (e) {
    console.error("AutoVoice Error:", e);
    return conn.sendMessage(from, { text: "⚠️ AutoVoice Error: " + e.message }, { quoted: mek });
  }
});
