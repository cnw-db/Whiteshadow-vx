//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Feature : Newsletter Broadcast
//  👑 Developer : Chamod Nimsara (WhiteShadow) creater
//  📡 Channel   : https://whatsapp.com/channel/0029Vb4fjWE1yT25R7epR110
//═══════════════════════════════════════════════//

  // pakada balanne
const { cmd } = require('../command')

cmd({
  pattern: "broadcast2",
  alias: ["bcnews", "newsletterbc", "bc2"],
  desc: "Broadcast message to all subscribed newsletters (owner only)",
  category: "owner",
  use: ".broadcast <url|button_text|title>",
  react: "📢",
  filename: __filename
}, async (client, message, match, { isCreator, reply, prefix, command }) => {
  try {
    if (!isCreator) return reply("*⛔ Owner command only!*")

    // Ensure we get a string from either match, plain conversation, or quoted text
    let text = ''
    if (typeof match === 'string' && match.trim()) {
      text = match.trim()
    } else if (message && message.message) {
      // common places to look for text depending on baileys payload
      text = (
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        message.message.message?.conversation ||
        ''
      ).toString().trim()
    }

    if (!text || !text.includes("|")) {
      return reply(`⚙️ *Usage:* ${prefix + command} <url|button_text|title>\n\n📌 Example:\n${prefix + command} https://t.me/whiteshadowbot|Join Telegram|WhiteShadow Updates`)
    }

    const [url, display_text, topic] = text.split("|").map(v => v.trim())

    // Fetch subscribed newsletters (may throw if API not present)
    const data = await client.newsletterFetchAllSubscribe()
    const ids = (Array.isArray(data) ? data : [])
      .filter(v => v && v.viewer_metadata?.role === "ADMIN")
      .map(v => v.id)
      .filter(Boolean)

    if (!ids.length) return reply("❌ No admin newsletters found!")

    const interactiveMessage = {
      title: topic || 'Broadcast',
      footer: "⚡ WhiteShadow Broadcast System",
      image: { url: "https://github.com/kiuur.png" },
      nativeFlowMessage: {
        messageParamsJson: JSON.stringify({
          bottom_sheet: { list_title: "Menu" }
        }),
        buttons: [
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: display_text || 'Open',
              url: url || ''
            })
          }
        ]
      }
    }

    let successCount = 0
    for (const jid of ids) {
      try {
        await client.sendMessage(jid, { interactiveMessage })
        successCount++
      } catch (e) {
        console.error(`Failed to send to ${jid}:`, e?.message || e)
      }
      // small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 4500))
    }

    await reply(`✅ *Broadcast sent to ${successCount}/${ids.length} channels.*`)
  } catch (err) {
    console.error(err)
    await reply("❌ Error while broadcasting:\n" + (err?.message || String(err)))
  }
})  
