const { cmd } = require('../command');
const { generateWAMessageFromContent, generateWAMessageContent, proto } = require('@whiskeysockets/baileys');

cmd({
    pattern: "catalog",
    alias: ["shop"],
    desc: "Send WhatsApp Business catalog button",
    category: "fun",
    react: "🛍️",
    filename: __filename
},
async (sock, m, mdata) => {
    try {
        const msg = await generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: "🛒 *Welcome to WhiteShadow Catalog!*" },
                        header: {
                            title: "👑 WhiteShadow Store",
                            hasMediaAttachment: true,
                            productMessage: {
                                product: {
                                    productImage: await (async () => {
                                        const { imageMessage } = await generateWAMessageContent(
                                            { image: { url: "https://files.catbox.moe/fyr37r.jpg" } }, // image URL
                                            { upload: sock.waUploadToServer }
                                        );
                                        return imageMessage;
                                    })(),
                                    productId: "9116471035103640",
                                    title: "WhiteShadow TikTok Boost Pack",
                                    description: "🔥 Get followers, likes & views instantly!",
                                    currencyCode: "LKR",
                                    priceAmount1000: "100000",
                                    retailerId: "4144242",
                                    url: "https://wa.me/c/94704896880",
                                    productImageCount: 1
                                },
                                businessOwnerJid: "94704896880@s.whatsapp.net"
                            }
                        },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "cta_catalog",
                                    buttonParamsJson: `{"business_phone_number": "94704896880", "catalog_product_id": "9116471035103640"}`
                                }
                            ]
                        }
                    }
                }
            }
        }, { quoted: m });

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    } catch (e) {
        console.error(e);
        await m.reply("⚠️ Error sending catalog button!");
    }
});
