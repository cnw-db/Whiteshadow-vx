//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Feature : Share Code / Newsletter Broadcaster
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

    // Get text safely
    let text = ''
    if (typeof match === 'string' && match.trim()) text = match.trim()
    else if (message?.message)
      text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        ''

    if (!text || !text.includes("|")) {
      return reply(`❌ *Wrong Format!*\n\n📌 Usage:\n${prefix + command} <image_url|target_url|button_text>\n\n🧠 Example:\n${prefix + command} https://files.catbox.moe/fyr37r.jpg|https://t.me/whiteshadowbot|Join Telegram`)
    }

    const parts = text.split("|").map(x => x.trim())
    if (parts.length < 3 || parts.some(x => !x)) {
      return reply(`❌ *Invalid parts!*\n\nUsage:\n${prefix + command} image_url|target_url|button_text`)
    }

    const [imageUrl, targetUrl, buttonText] = parts
    const titleText = "> 𝗪𝗵𝗶𝘁𝗲𝗦𝗵𝗮𝗱𝗼𝘄 𝗨𝗽𝗱𝗮𝘁𝗲𝘀 ⚡\n> Tap button below 👇"
    const footerText = "© 2025 WhiteShadow Broadcast System"

    await message.react('🔄')

    const interactiveMessage = {
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

    // Send to all newsletter channels
    let sent = 0
    for (const id of newsletterList) {
      await client.sendMessage(id, interactiveMessage)
      sent++
      console.log(`✅ Sent to: ${id}`)
      await new Promise(r => setTimeout(r, 1500))
    }

    await message.react('✅')
    await reply(`✅ Successfully sent to *${sent}* newsletter(s):\n${newsletterList.join("\n")}`)
  } catch (e) {
    console.error(e)
    await message.react('❌')
    await reply(`❌ Error while sending:\n${e.message}`)
  }
})
