const { cmd } = require('../command');

cmd({
  pattern: "ptvch",
  alias: ["ptvchannel"],
  desc: "Send replied video to a WhatsApp Channel as a round PTV video.",
  category: "channel",
  filename: __filename,
  owner: true
}, async (conn, mek, m, { reply, q }) => {
  try {

    // ─── CHECK CHANNEL JID ───
    if (!q || !q.endsWith("@newsletter")) {
      return reply("⚠️ *Use:* .ptvch 1203633xxxxx@newsletter\n\n📌 reply a video!");
    }

    const channelId = q.trim();

    // ─── CHECK REPLY VIDEO ───
    let vid;
    if (m.quoted && m.quoted.mtype === "videoMessage") {
      vid = await m.quoted.download();
    } else if (m.mtype === "videoMessage") {
      vid = await m.download();
    }

    if (!vid) return reply("🎥 *Reply to a video first!*");

    // ─── SEND ROUND VIDEO (EXACT FORMAT YOU REQUESTED) ───
    await conn.sendMessage(
      channelId,
      {
        video: vid,
        mimetype: "video/mp4",
        gifPlayback: true,
        ptv: true
      }
    );

    reply(`✅ *Round Video (PTV) sent to:* ${channelId}`);

  } catch (e) {
    console.error(e);
    reply("❌ Error sending PTV.");
  }
});
