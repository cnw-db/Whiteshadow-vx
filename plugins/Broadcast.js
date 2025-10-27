//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Feature : Newsletter Broadcast (Custom Image Support)
//  👑 Developer : Chamod Nimsara (WhiteShadow)
//  📡 Channel   : https://whatsapp.com/channel/0029Vb4fjWE1yT25R7epR110
//═══════════════════════════════════════════════//

const { cmd } = require('../command')

cmd({
  pattern: "broadcast2",
  alias: ["bcnews", "newsletterbc", "bc"],
  desc: "Broadcast message to all subscribed newsletters (owner only)",
  category: "owner",
  use: ".broadcast <url|button_text|title|image_url>",
  react: "📢",
  filename: __filename
}, async (client, message, match, { isCreator, reply, prefix, command }) => {
  try {
    if (!isCreator) return reply("*⛔ Owner command only!*")

    // Get text safely
    let text = ''
    if (typeof match === 'string' && match.trim()) {
      text = match.trim()
    } else if (message?.message) {
      text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        ''
    }

    if (!text || !text.includes("|")) {
      return reply(`⚙️ *Usage:* ${prefix + command} <url|button_text|title|image_url>\n\n📌 Example:\n${prefix + command} https://t.me/whiteshadowbot|Join Telegram|WhiteShadow Updates|https://files.catbox.moe/fyr37r.jpg`)
    }

    // Split parameters
    const [url, display_text, topic, image_url] = text.split("|").map(v => v.trim())

    // Fetch subscribed newsletters
    const data = await client.newsletterFetchAllSubscribe()
    const ids = (Array.isArray(data) ? data : [])
      .filter(v => v && v.viewer_metadata?.role === "ADMIN")
      .map(v => v.id)
      .filter(Boolean)

    if (!ids.length) return reply("❌ No admin newsletters found!")

    // Default image if not provided
    const finalImage = image_url || "https://files.catbox.moe/fyr37r.jpg"

    const interactiveMessage = {
      title: topic || 'WhiteShadow Broadcast',
      footer: "⚡ WhiteShadow Broadcast System",
      image: { url: finalImage },
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

    // Send broadcast
    let successCount = 0
    for (const jid of ids) {
      try {
        await client.sendMessage(jid, { interactiveMessage })
        successCount++
      } catch (e) {
        console.error(`❌ Failed to send to ${jid}:`, e?.message || e)
      }
      await new Promise(r => setTimeout(r, 4500))
    }

    await reply(`✅ *Broadcast sent to ${successCount}/${ids.length} newsletters successfully!*`)
  } catch (err) {
    console.error(err)
    await reply("❌ Error while broadcasting:\n" + (err?.message || String(err)))
  }
})
