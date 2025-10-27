//═══════════════════════════════════════════════//
//                WHITESHADOW-MD                 //
//═══════════════════════════════════════════════//
//  ⚡ Feature : Newsletter Broadcast
//  👑 Developer : Chamod Nimsara (WhiteShadow) creater
//  📡 Channel   : https://whatsapp.com/channel/0029Vb4fjWE1yT25R7epR110
//═══════════════════════════════════════════════//

const { cmd } = require('../command')

cmd({
    pattern: "broadcast2",
    alias: ["bcnews", "newsletterbc", "bc"],
    desc: "Broadcast message to all subscribed newsletters (admin only)",
    category: "owner",
    use: ".broadcast <url|button_text|title>",
    react: "📢",
    filename: __filename
}, async (client, message, text, { isCreator, reply, prefix, command }) => {
    try {
        if (!isCreator) return reply("*⛔ Owner command only!*")

        if (!text || !text.includes("|")) {
            return reply(`⚙️ *Usage:* ${prefix + command} <url|button_text|title>\n\n📌 Example:\n${prefix + command} https://t.me/whiteshadowbot|Join Telegram|WhiteShadow Updates`)
        }

        const [url, display_text, topic] = text.split("|").map(v => v.trim())

        // Fetch subscribed newsletters
        const data = await client.newsletterFetchAllSubscribe()
        const ids = data
            .filter(v => v.viewer_metadata?.role === "ADMIN")
            .map(v => v.id)

        if (!ids.length) return reply("❌ No admin newsletters found!")

        const interactiveMessage = {
            title: topic,
            footer: "⚡ WhiteShadow Broadcast System",
            image: { url: "https://github.com/kiuur.png" },
            nativeFlowMessage: {
                messageParamsJson: JSON.stringify({
                    bottom_sheet: {
                        list_title: "Menu"
                    }
                }),
                buttons: [
                    {
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: display_text,
                            url: url
                        })
                    }
                ]
            }
        }

        // Broadcast to all newsletters
        let successCount = 0
        for (const jid of ids) {
            await client.sendMessage(jid, { interactiveMessage })
            successCount++
            await new Promise(r => setTimeout(r, 4500))
        }

        await reply(`✅ *Broadcast sent to ${successCount} channels successfully!*`)
    } catch (err) {
        console.error(err)
        await reply("❌ Error while broadcasting:\n" + err.message)
    }
})
