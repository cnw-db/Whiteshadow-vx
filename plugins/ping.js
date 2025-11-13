const config = require('../config');
const { cmd, commands } = require('../command');

const meta = {
  key: {
    participant: `13135550002@s.whatsapp.net`,
    remoteJid: `13135550002@s.whatsapp.net`,
    fromMe: false,
    id: 'FAKE_META_ukqw2pzpid'
  },
  message: {
    'contactMessage': {
      'displayName': 'WHITESHADOW-MD',
      'vcard': `BEGIN:VCARD\nVERSION:3.0\nN:Whiteshadow;;;;\nFN:Whiteshadow\nTEL;waid=13135550002:+1 313 555 0002\nEND:VCARD`,
      sendEphemeral: true
    }
  },
  messageTimestamp: 1762719363,
  pushName: 'Meta AI'
};

cmd({
  pattern: "ping",
  alias: ["speed", "pong"],
  use: '.ping',
  desc: "Check bot's response time.",
  category: "main",
  react: "⚡",
  filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
  try {
    const startTime = Date.now();

    const emojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹', '💎', '🏆', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    // React with random emoji
    await conn.sendMessage(from, {
      react: { text: randomEmoji, key: mek.key }
    });

    const ping = Date.now() - startTime;

    // Speed badge and color
    let badge = '🐢 Slow', color = '🔴';
    if (ping <= 150) {
      badge = '🚀 Super Fast';
      color = '🟢';
    } else if (ping <= 300) {
      badge = '⚡ Fast';
      color = '🟡';
    } else if (ping <= 600) {
      badge = '⚠️ Medium';
      color = '🟠';
    }

    // Final message
    const text = `> *WHITESHADOW-MD ʀᴇsᴘᴏɴsᴇ: ${ping} ms ${randomEmoji}*\n> *sᴛᴀᴛᴜs: ${color} ${badge}*\n> *ᴠᴇʀsɪᴏɴ: ${config.version}*`;

    await conn.sendMessage(from, {
      text,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363397446799567@newsletter',
          newsletterName: "WHITESHADOW-MD",
          serverMessageId: 143
        }
      }
    }, { quoted: meta }); // 👈 quoted එකට meta දාන්න
  } catch (e) {
    console.error("❌ Error in ping command:", e);
    reply(`⚠️ Error: ${e.message}`);
  }
});
//cn
