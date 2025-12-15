const axios = require("axios");
const { cmd } = require("../command");
const {
  proto,
  generateWAMessageFromContent,
  prepareWAMessageMedia
} = require("@whiskeysockets/baileys");

/* ───── Fake Meta Quote ───── */
const fakeMeta = (from) => ({
  key: {
    participant: "13135550002@s.whatsapp.net",
    remoteJid: from,
    fromMe: false,
    id: "FAKE_META_LYRICS"
  },
  message: {
    contactMessage: {
      displayName: "©WHITESHADOW-X",
      vcard: `BEGIN:VCARD
VERSION:3.0
N:Meta AI;;;;
FN:Meta AI
TEL;waid=13135550002:+1 313 555 0002
END:VCARD`,
      sendEphemeral: true
    }
  },
  pushName: "Meta AI",
  messageTimestamp: Math.floor(Date.now() / 1000)
});

/* ───── Fetch Lyrics ───── */
async function searchLyrics(query) {
  const url = `https://lyrics-api.chamodshadow125.workers.dev/?title=${encodeURIComponent(query)}`;
  const { data } = await axios.get(url);
  if (!data?.status || !data?.data?.length) return null;
  return data.data.slice(0, 5); // up to 5 cards
}

/* ───── Image Header Source ───── */
const HEADER_IMAGE = "https://files.catbox.moe/6kmrjw.jpg";

/* ───── Command ───── */
cmd({
  pattern: "lyrics2",
  alias: ["ly2"],
  desc: "Search song lyrics (carousel)",
  react: "🎶",
  category: "search",
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {

  if (!args.length) {
    return conn.sendMessage(from, {
      text: "🎵 *Lyrics Search*\n\nUsage:\n.lyrics <song name>"
    }, { quoted: fakeMeta(from) });
  }

  const query = args.join(" ");
  await store.react("⌛");

  try {
    const results = await searchLyrics(query);
    if (!results) {
      await store.react("❌");
      return reply("❌ Lyrics not found.");
    }

    const cards = await Promise.all(results.map(async (song) => {
      const songText = song.plainLyrics
        ? song.plainLyrics.slice(0, 500) + "..."
        : "Lyrics unavailable";

      const media = await prepareWAMessageMedia(
        { image: { url: HEADER_IMAGE } },
        { upload: conn.waUploadToServer }
      );

      return {
        body: proto.Message.InteractiveMessage.Body.fromObject({
          text:
`🎧 *${song.trackName}*
🎤 ${song.artistName}
──────────────────
${songText}`
        }),
        footer: proto.Message.InteractiveMessage.Footer.fromObject({
          text: "WHITESHADOW MD"
        }),
        header: proto.Message.InteractiveMessage.Header.fromObject({
          title: song.albumName || "Lyrics Result",
          hasMediaAttachment: true,
          imageMessage: media.imageMessage
        }),
        nativeFlowMessage:
          proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: []
          })
      };
    }));

    const msg = generateWAMessageFromContent(from, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage:
            proto.Message.InteractiveMessage.fromObject({
              body: {
                text: `🎶 *Lyrics Search Results*\n\n*Query:* ${query}`
              },
              footer: {
                text: "> 𝐏𝙾𝚆𝙴𝚁𝙳 𝐁𝚈 WHITESHADOW-𝐌𝙳"
              },
              header: { hasMediaAttachment: false },
              carouselMessage: { cards }
            })
        }
      }
    }, { quoted: fakeMeta(from) });

    await conn.relayMessage(from, msg.message, { messageId: msg.key.id });
    await store.react("✅");

  } catch (err) {
    console.error(err);
    await store.react("❌");
    reply("❌ Lyrics search failed.");
  }
});
