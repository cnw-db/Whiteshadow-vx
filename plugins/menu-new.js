// menu.js — WHITESHADOW-MD (Modern reply-based cyber/dark menu)
// Replace your existing menu.js with this file.
// Assumes same project structure: ../config , ../command , ../lib/functions , axios available
const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "menu",
  desc: "Show interactive menu (reply with 1-10)",
  category: "menu",
  react: "🧾",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    // --- dynamic status values if available ---
    const uptime = (process.uptime && typeof process.uptime === 'function')
      ? Math.floor(process.uptime())
      : (config.RUNTIME_SECONDS || 0);

    const uptimeHuman = (() => {
      const s = uptime % 60;
      const mns = Math.floor((uptime % 3600) / 60);
      const h = Math.floor(uptime / 3600);
      return `${h}h ${mns}m ${s}s`;
    })();

    // --- main caption (cyber/dark style) ---
    const menuCaption = `╭━━━『 *WHITESHADOW-MD* 』━━━┈⊷
┃ ⚡︎ *Status:* ONLINE  •  ${config.MODE || 'public'}
┃ 👑 *Owner:* ${config.OWNER_NAME || 'Owner'}
┃ 🤖 *Bot:* ${config.BOT_NAME || 'WHITESHADOW-MD'}
┃ 🔣 *Prefix:* ${config.PREFIX || '.'}    •    ⏱ *Uptime:* ${uptimeHuman}
╰━━━━━━━━━━━━━━━━━━━━┈⊷

╭━━━〔 *MENU CATEGORIES* 〕━━━┈⊷
┃ 1️⃣  • Download
┃ 2️⃣  • Group & Admin
┃ 3️⃣  • Fun & Reactions
┃ 4️⃣  • Owner Tools
┃ 5️⃣  • AI & Image
┃ 6️⃣  • Anime & Wallpapers
┃ 7️⃣  • Convert & Utilities
┃ 8️⃣  • Music & Media
┃ 9️⃣  • Settings & Privacy
┃ 🔟  • All Commands (full list)
╰━━━━━━━━━━━━━━━━━━━━┈⊷

👉 Reply to this message with the number (1–10)
*Example:* reply with "1" to open Download menu.

${config.DESCRIPTION || ''}

*© WHITESHADOW-MD* • Powered by Chamod Nimsara
`;

    // context for verified/newsletter look
    const contextInfo = {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: config.NEWSLETTER_JID || '120363397446799567@newsletter',
        newsletterName: config.OWNER_NAME || 'WHITESHADOW',
        serverMessageId: Date.now() % 100000
      }
    };

    // try to send an image intro (fallbacks to text)
    let sentMsg;
    try {
      sentMsg = await conn.sendMessage(
        from,
        {
          image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/cz2592.jpeg' },
          caption: menuCaption,
          contextInfo
        },
        { quoted: mek }
      );
    } catch (e) {
      // fallback to plain text if image fails
      sentMsg = await conn.sendMessage(from, { text: menuCaption, contextInfo }, { quoted: mek });
    }

    // optionally play short intro audio (non-blocking)
    (async () => {
      try {
        await new Promise(r => setTimeout(r, 800));
        await conn.sendMessage(from, {
          audio: { url: config.MENU_AUDIO_URL || 'https://files.catbox.moe/mq5vez.mp3' },
          mimetype: 'audio/mp4',
          ptt: true
        }, { quoted: mecOrFallback(mek, sentMsg) });
      } catch (err) {
        // ignore audio errors
        console.log('menu audio error:', err?.message || err);
      }
    })();

    // NOTE: helper to pick quoted message safely
    function mecOrFallback(original, sent) {
      return original || (sent && sent.key ? sent : null);
    }

    // --- menu contents mapping (concise & clear) ---
    const menuData = {
      '1': {
        title: "📥 Download Menu",
        content: `╭━━━〔 *Download Menu* 〕━━━┈⊷
• yt / ytmp4 / ytmp3 / song / video / video2hd
• tiktok / tiktok2 / tiktokstalk
• facebook / ig / twitter / mediafire / gdrive
• web2zip / githubdl
╰━━━━━━━━━━━━━━━┈⊷
Reply .help <command> for details`
      },
      '2': {
        title: "👥 Group & Admin",
        content: `╭━━━〔 *Group & Admin* 〕━━━┈⊷
• invite / glink / mutegc / unmute / lockgc / unlockgc
• add @ / remove @ / promote / demote / tagall / hidetag
• removeadmins / removemembers / revoke
╰━━━━━━━━━━━━━━━┈⊷`
      },
      '3': {
        title: "😄 Fun & Reactions",
        content: `╭━━━〔 *Fun & Reactions* 〕━━━┈⊷
• animegirl / waifu / dog / img / prank / hack / joke / 8ball
• cuddle / hug / kiss / bonk / yeet / slap / blush / dance
• emix / ship / roast / compliment / pick
╰━━━━━━━━━━━━━━━┈⊷`
      },
      '4': {
        title: "👑 Owner Tools",
        content: `╭━━━〔 *Owner Tools* 〕━━━┈⊷
• broadcast / broadcast2 / status / setpp / restart / shutdown
• ban / unban / listban / env / update / forward
• admin (takeadmin) / leave / clearchats
╰━━━━━━━━━━━━━━━┈⊷`
      },
      '5': {
        title: "🤖 AI & Image",
        content: `╭━━━〔 *AI & Image* 〕━━━┈⊷
• ai / openai / ai2 / ai3 / ai5 / meta / copilot
• imagine / nanobanana / imagetools / img2vid / tofigure
• removebg / upimg / ad (image edits & logos)
╰━━━━━━━━━━━━━━━┈⊷`
      },
      '6': {
        title: "🎎 Anime & Wallpapers",
        content: `╭━━〔 *Anime & Wallpapers* 〕━━┈⊷
• waifu / neko / megumin / maid / awoo / rw (wallpapers)
• anime1..5 / garl / randomwall
╰━━━━━━━━━━━━━━━┈⊷`
      },
      '7': {
        title: "🔄 Convert & Utilities",
        content: `╭━━━〔 *Convert & Utilities* 〕━━━┈⊷
• sticker / take / vsticker / convert / attp / readmore
• base64 / urlencode / urldecode / binary / dbinary / topdf
• npn / npm (package search) / screenshot / fetch
╰━━━━━━━━━━━━━━━┈⊷`
      },
      '8': {
        title: "🎵 Music & Media",
        content: `╭━━━〔 *Music & Media* 〕━━━┈⊷
• song / play2 / play3 / play4 / ytmp4 / ytmp3 / videox
• playch / csong / ytpost / spotify / sptdl
╰━━━━━━━━━━━━━━━┈⊷`
      },
      '9': {
        title: "⚙️ Settings & Privacy",
        content: `╭━━━〔 *Settings & Privacy* 〕━━━┈⊷
• setprefix / mode / welcome / auto-reply / autoreact / autosticker
• antidelete / antildk / getprivacy / setonline / setppall
╰━━━━━━━━━━━━━━━┈⊷`
      },
      '10': {
        title: "📜 Full Command List",
        content: `╭━━━〔 *Full Command List* 〕━━━┈⊷
Reply with: *menu2* or use *.menu2* to get the full, paginated command list.
You can also use: *.list* or *.listcmd*
╰━━━━━━━━━━━━━━━┈⊷`
      }
    };

    // Save the message id to match replies
    const messageID = sentMsg.key && sentMsg.key.id ? sentMsg.key.id : null;

    // Handler to listen for replies (only for this menu message)
    const handler = async (msgData) => {
      try {
        const received = msgData.messages[0];
        if (!received?.message || !received.key?.remoteJid) return;

        // only treat replies that reference our menu message id
        const isReply = received.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID;
        if (!isReply) return;

        const text = received.message.conversation || received.message.extendedTextMessage?.text || '';
        const sender = received.key.remoteJid;

        // sanitize input (trim and take first token)
        const token = text.trim().split(/\s+/)[0];

        if (menuData[token]) {
          const selected = menuData[token];

          // try to send the mapped menu content as an image caption (if image available) else text
          try {
            await conn.sendMessage(sender, {
              image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/cz2592.jpeg' },
              caption: `╭━━━〔 *${selected.title.replace(/\*|\╭|\╰/g,'')}* 〕━━━┈⊷\n${selected.content}\n╰━━━━━━━━━━━━━━━━━━━━┈⊷`,
              contextInfo
            }, { quoted: received });
          } catch (err) {
            await conn.sendMessage(sender, { text: `${selected.title}\n\n${selected.content}`, contextInfo }, { quoted: received });
          }

          // react ok
          try {
            await conn.sendMessage(sender, { react: { text: '✅', key: received.key } });
          } catch (e) {
            // ignore react errors
          }
        } else {
          // invalid option handler
          await conn.sendMessage(sender, {
            text: `❌ *Invalid Option!* ❌\n\nPlease reply with a number between 1 - 10 to select a menu.\n\n*Example:* Reply with "1" for Download Menu\n\n${config.DESCRIPTION || ''}`,
            contextInfo
          }, { quoted: received });
        }
      } catch (e) {
        console.log('menu handler error:', e?.message || e);
      }
    };

    // register listener
    conn.ev.on('messages.upsert', handler);

    // auto remove listener after 5 minutes to avoid memory leak
    setTimeout(() => {
      try {
        conn.ev.off('messages.upsert', handler);
      } catch (e) {
        console.log('error removing menu handler:', e?.message || e);
      }
    }, 5 * 60 * 1000);

  } catch (err) {
    console.error('Menu command error:', err);
    try {
      await conn.sendMessage(from, { text: `❌ Menu system error. Try again later.\n\n${config.DESCRIPTION || ''}` }, { quoted: mek });
    } catch (finalErr) {
      console.log('menu final send error:', finalErr?.message || finalErr);
    }
  }
});
