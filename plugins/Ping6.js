const { cmd } = require('../command');
const crypto = require('crypto');
const { generateWAMessage, generateWAMessageFromContent, delay } = require('@whiskeysockets/baileys');

/**
 * Album Message Sender Function
 */
async function albumMessage(sock, jid, medias, options = {}) {
  if (typeof jid !== 'string') throw new TypeError('jid must be a string');

  for (const media of medias) {
    if (!['image', 'video'].includes(media.type))
      throw new TypeError(`Invalid media type: ${media.type}`);
    if (!media.data || (!media.data.url && !Buffer.isBuffer(media.data)))
      throw new TypeError(`Invalid media data: ${media.data}`);
  }

  if (medias.length < 2) throw new RangeError('Minimum 2 media required');

  const caption = options.text || options.caption || '';
  const sendDelay = !isNaN(options.delay) ? options.delay : 500;

  const album = generateWAMessageFromContent(jid, {
    messageContextInfo: { messageSecret: new Uint8Array(crypto.randomBytes(32)) },
    albumMessage: {
      expectedImageCount: medias.filter(m => m.type === 'image').length,
      expectedVideoCount: medias.filter(m => m.type === 'video').length,
      ...(options.quoted
        ? {
            contextInfo: {
              remoteJid: options.quoted.key.remoteJid,
              fromMe: options.quoted.key.fromMe,
              stanzaId: options.quoted.key.id,
              participant: options.quoted.key.participant || options.quoted.key.remoteJid,
              quotedMessage: options.quoted.message,
            },
          }
        : {}),
    },
  }, {});

  await sock.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id });

  for (let i = 0; i < medias.length; i++) {
    const { type, data } = medias[i];
    const msg = await generateWAMessage(album.key.remoteJid, {
      [type]: data,
      ...(i === 0 ? { caption } : {}),
    }, { upload: sock.waUploadToServer });

    msg.message.messageContextInfo = {
      messageSecret: new Uint8Array(crypto.randomBytes(32)),
      messageAssociation: { associationType: 1, parentMessageKey: album.key },
    };

    await sock.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
    await delay(sendDelay);
  }

  return album;
}

/**
 * Command: .album
 */
cmd({
  pattern: "album",
  desc: "Send multiple photos/videos as an album message",
  category: "media",
  react: "📸",
  use: ".album <caption>",
}, async (m, sock) => {
  try {
    const caption = m.text || "✨ WHITESHADOW Album ✨";

    // ✅ Chamod's Catbox Album
    const medias = [
      { type: "image", data: { url: "https://files.catbox.moe/ncoqaz.jpg" } },
      { type: "image", data: { url: "https://files.catbox.moe/401n5c.jpg" } },
      { type: "image", data: { url: "https://files.catbox.moe/4m8iw2.jpg" } },
    ];

    await albumMessage(sock, m.chat, medias, { caption, quoted: m });

  } catch (e) {
    await m.reply(`❌ *Album Send Error:*\n${e.message}`);
  }
});
