//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Feature : Group Status Sender
//  👑 Developer : Chamod Nimsara (WhiteShadow)
//  📡 Channel   : https://whatsapp.com/channel/0029Vb4fjWE1yT25R7epR110
//═══════════════════════════════════════════════//

const { cmd } = require('../command');
const baileys = require('@whiskeysockets/baileys');
const crypto = require('crypto');

/**
 * Send WhatsApp-like group status message
 * @param {import('@whiskeysockets/baileys').WASocket} client
 * @param {string} jid Group JID
 * @param {import('@whiskeysockets/baileys').AnyMessageContent} content
 */
async function groupStatus(client, jid, content) {
  try {
    const { backgroundColor } = content;
    delete content.backgroundColor;

    const inside = await baileys.generateWAMessageContent(content, {
      upload: client.waUploadToServer,
      backgroundColor
    });

    const messageSecret = crypto.randomBytes(32);

    const m = baileys.generateWAMessageFromContent(jid, {
      messageContextInfo: { messageSecret },
      groupStatusMessageV2: {
        message: {
          ...inside,
          messageContextInfo: { messageSecret }
        }
      }
    }, {});

    await client.relayMessage(jid, m.message, { messageId: m.key.id });
    return m;
  } catch (err) {
    console.error('❌ GroupStatus Error:', err);
  }
}

cmd({
  pattern: "groupstatus",
  alias: ["gstatus", "gs"],
  desc: "Send a status update visible to all group members.",
  category: "group",
  use: ".groupstatus <text>",
  react: "🟢",
  filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
  try {
    if (!m.isGroup) return reply("⚠️ This command only works in groups!");
    if (!q) return reply("📜 Use: .groupstatus <text>");

    await groupStatus(conn, from, {
      text: q,
      backgroundColor: "#25D366"
    });

    reply("✅ Group status posted successfully!");
  } catch (err) {
    console.error(err);
    reply("❌ Failed to send group status.");
  }
});
