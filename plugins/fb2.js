const axios = require("axios");
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

const api = `https://nethu-api-ashy.vercel.app`;

cmd({
  pattern: "facebook2",
  alias: ["fb2", "fbv", "fbdown", "fbdl"],
  react: "📥",
  desc: "Download Facebook videos (HD/SD) - WhiteShadow-MD",
  category: "download",
  use: ".facebook2 <url>",
  filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("🚩 *Send a valid Facebook video URL!*");

    // Fetch from API
    const fb = await fetchJson(`${api}/download/fbdown?url=${encodeURIComponent(q)}`);

    if (!fb.result || (!fb.result.hd && !fb.result.sd)) {
      return reply("❌ *Couldn't find a downloadable video for that link.*");
    }

    // Clean, WhiteShadow style caption
    const caption = `⚡ *WHITESHADOW-MD — FACEBOOK DL* ⚡

🔗 Link: ${q}

Choose quality:
• 1 — HD (if available)
• 2 — SD (if available)

Or just tap a button below.`;

    // Buttons for quick choice (HD / SD)
    const buttons = [
      { buttonId: 'WS_FB_HD', buttonText: { displayText: '🎬 HD' }, type: 1 },
      { buttonId: 'WS_FB_SD', buttonText: { displayText: '📺 SD' }, type: 1 }
    ];

    // Footer info (compact branding)
    const footer = 'WhiteShadow-MD • Owner: Chamod';

    // Send thumbnail + buttons (no fake vCard / no fake quote)
    const sentMsg = await conn.sendMessage(from, {
      image: { url: fb.result.thumb },
      caption,
      footer,
      buttons,
      headerType: 4
    }, { quoted: mek }); // quoted: mek keeps it neat in chat

    const messageID = sentMsg.key.id;

    // Listen to replies / button presses
    const handler = async (msgUpdate) => {
      try {
        const mekInfo = msgUpdate?.messages?.[0];
        if (!mekInfo || !mekInfo.message) return;

        // Only respond to messages in the same chat
        if ((mekInfo.key?.remoteJid || '') !== from) return;

        // Detect button reply
        const btnResp = mekInfo.message?.buttonsResponseMessage?.selectedButtonId;
        // Detect plain text reply
        const textResp =
          mekInfo.message?.conversation ||
          mekInfo.message?.extendedTextMessage?.text ||
          '';

        // Make sure user is replying to our menu (either by quoting it or via buttons)
        const isReplyToMenu = mekInfo.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID
                              || !!btnResp;

        if (!isReplyToMenu) return;

        await conn.sendMessage(from, { react: { text: "⬇️", key: mekInfo.key } });

        let choice = (btnResp || textResp).toString().trim().toLowerCase();

        // Normalize common replies
        if (choice === '1' || choice === '🎬 hd' || choice === 'ws_fb_hd' || choice === 'hd') {
          // HD
          if (!fb.result.hd) {
            await reply("❌ *HD not available for this video.*");
          } else {
            await conn.sendMessage(from, {
              video: { url: fb.result.hd },
              mimetype: "video/mp4",
              caption: "🎬 *Here is your HD video — WhiteShadow-MD*"
            }, { quoted: mek });
          }

        } else if (choice === '2' || choice === '📺 sd' || choice === 'ws_fb_sd' || choice === 'sd') {
          // SD
          if (!fb.result.sd) {
            await reply("❌ *SD not available for this video.*");
          } else {
            await conn.sendMessage(from, {
              video: { url: fb.result.sd },
              mimetype: "video/mp4",
              caption: "📺 *Here is your SD video — WhiteShadow-MD*"
            }, { quoted: mek });
          }

        } else {
          // Invalid
          await reply("⚠️ *Invalid option.* Reply with 1 (HD) or 2 (SD), or tap a button.");
        }

        // react done
        await conn.sendMessage(from, { react: { text: "✅", key: mekInfo.key } });

      } catch (err) {
        console.error("fb reply handler error:", err);
        // don't spam user with errors; optionally notify
        try { await reply("⚠️ *Error while processing reply.*"); } catch(e) {}
      }
    };

    // Attach temporary listener
    conn.ev.on("messages.upsert", handler);

    // Optional: auto-remove listener after some time to avoid memory leak
    // (If you prefer persistent listening, remove the timeout logic)
    setTimeout(() => {
      try { conn.ev.removeListener("messages.upsert", handler); } catch (e) {}
    }, 1000 * 60 * 3); // remove after 3 minutes

  } catch (err) {
    console.error(err);
    reply("💔 *Failed to process Facebook video. Try again later.*");
  }
});
