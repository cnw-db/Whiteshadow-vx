const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const { PassThrough } = require("stream");
const { cmd } = require("../command");
const config = require("../config");

cmd({ on: "body" }, async (conn, m, msg, { from, body }) => {
  try {
    if (config.AUTO_VOICE !== "true") return;
    const res = await axios.get("https://raw.githubusercontent.com/chamod-mv/Whiteshadow-data/refs/heads/main/autovoice.json");
    const voiceMap = res.data;
    const text = body.toLowerCase();

    for (const keyword in voiceMap) {
      if (text === keyword.toLowerCase()) {
        const audioUrl = voiceMap[keyword];

        const response = await axios.get(audioUrl, { responseType: "stream" });
        const outputStream = new PassThrough();

        await new Promise((resolve, reject) => {
          ffmpeg(response.data)
            .audioCodec("libopus")
            .format("opus")
            .audioBitrate("64k")
            .pipe(outputStream)
            .on("finish", resolve)
            .on("error", reject);
        });

        const chunks = [];
        for await (const chunk of outputStream) chunks.push(chunk);
        const voiceBuffer = Buffer.concat(chunks);

        await conn.sendPresenceUpdate("recording", from);
        await conn.sendMessage(from, {
          audio: voiceBuffer,
          mimetype: "audio/ogg; codecs=opus",
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
