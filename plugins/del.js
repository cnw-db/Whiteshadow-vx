//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Feature : Share Code / Newsletter Broadcaster (Fixed)
//  👑 Developer : Chamod Nimsara (WhiteShadow)
//  📡 Channel   : https://whatsapp.com/channel/0029Vb4fjWE1yT25R7epR110
//═══════════════════════════════════════════════//

const { cmd } = require('../command')

cmd({
  pattern: "sharecode",
  alias: ["sc", "sharepost", "postnews"],
  desc: "Send update message with image + button to specific newsletter channels",
  category: "owner",
  use: ".sharecode <image_url|target_url|button_text>",
  react: "📰",
  filename: __filename
}, async (client, message, match, { reply, prefix, command, isCreator }) => {
  try {
    if (!isCreator) return reply("*⛔ Owner command only!*")

    const newsletterList = [
      "120363317972190466@newsletter", // 🧠 Add more channel IDs if needed
    ]

    // Safely get text
    let input = ''
    if (match && typeof match === 'string') input = match.trim()
    else if (message?.message?.extendedTextMessage?.text)
      input = message.message.extendedTextMessage.text.trim()
    else if (message?.message?.conversation)
      input = message.message.conversation.trim()

    if (!input || !input.includes("|")) {
      return reply(`❌ *Wrong format!*\n\n📌 Usage:\n${prefix + command} <image_url|target_url|button_text>\n\n🧠 Example:\n${prefix + command} https://files.catbox.moe/fyr37r.jpg|https://t.me/whiteshadowbot|Join Telegram`)
    }

    const [imageUrl, targetUrl, buttonText] = input.split("|").map(v => v.trim())

    if (!imageUrl || !targetUrl || !buttonText)
      return reply(`⚠️ Missing part!\n\nExample:\n${prefix + command} <image_url|target_url|button_text>`)

    await message.react('🔄')

    const titleText = "> 𝗪𝗵𝗶𝘁𝗲𝗦𝗵𝗮𝗱𝗼𝘄 𝗨𝗽𝗱𝗮𝘁𝗲𝘀 ⚡\n> Tap button below 👇"
    const footerText = "© 2025 WhiteShadow Broadcast System"

    const msg = {
      interactiveMessage: {
        title: titleText,
        footer: footerText,
        image: { url: imageUrl },
        buttons: [
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: buttonText,
              url: targetUrl
            })
          },
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "WhiteShadow 🎉",
              url: "https://whatsapp.com/channel/0029Vb4fjWE1yT25R7epR110"
            })
          }
        ]
      }
    }

    // Send message to each newsletter ID
    let count = 0
    for (const id of newsletterList) {
      try {
        await client.sendMessage(id, msg)
        count++
        console.log(`✅ Sent to: ${id}`)
        await new Promise(r => setTimeout(r, 1500))
      } catch (err) {
        console.error(`❌ Failed to send to ${id}:`, err.message)
      }
    }

    await message.react('✅')
    await reply(`✅ Successfully sent to ${count}/${newsletterList.length} newsletters.`)
  } catch (err) {
    console.error(err)
    await message.react('❌')
    await reply("❌ Error while sending:\n" + (err?.message || String(err)))
  }
})
