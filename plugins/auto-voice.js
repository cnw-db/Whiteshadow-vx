const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const config = require("../config");
const { cmd } = require("../command");

cmd({ on: "body" }, async (conn, m, msg, { from, body }) => {
  try {
    if (config.AUTO_VOICE !== "true") return;

    const jsonUrl = "https://raw.githubusercontent.com/chamod-mv/Whiteshadow-data/refs/heads/main/autovoice.json";
    const res = await axios.get(jsonUrl);
    const voiceMap = res.data;
    const text = body.toLowerCase();

    for (const keyword in voiceMap) {
      if (text === keyword.toLowerCase()) {
        const audioUrl = voiceMap[keyword];

        const tempDir = path.join(__dirname, "../temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const mp3Path = path.join(tempDir, `${Date.now()}.mp3`);
        const opusPath = path.join(tempDir, `${Date.now()}.opus`);

        // ─── DOWNLOAD AUDIO ───
        const response = await axios.get(audioUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(mp3Path, Buffer.from(response.data));

        await new Promise((resolve, reject) => {
          ffmpeg(mp3Path)
            .audioCodec("libopus")
            .format("opus")
            .audioBitrate("64k")
            .save(opusPath)
            .on("end", resolve)
            .on("error", reject);
        });

        const voiceBuffer = fs.readFileSync(opusPath);

        // ─── SEND VOICE ───
        await conn.sendPresenceUpdate("recording", from);
        await conn.sendMessage(from, {
          audio: voiceBuffer,
          mimetype: "audio/ogg; codecs=opus",
          ptt: true
        }, { quoted: m });

        // ─── CLEANUP ───
        try { fs.unlinkSync(mp3Path); } catch {}
        try { fs.unlinkSync(opusPath); } catch {}

        break;
      }
    }
  } catch (e) {
    console.error("AutoVoice error:", e);
    return conn.sendMessage(from, { text: "⚠️ Error: " + e.message }, { quoted: m });
  }
});
