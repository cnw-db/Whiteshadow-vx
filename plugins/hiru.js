const { cmd } = require('../command');
const axios = require("axios");

cmd({
    pattern: "derana",
    alias: ["news2", "derananews"],
    category: "news",
    react: "📰",
    desc: "Get latest AdaDerana Sinhala news"
}, 

async (msg, args, client) => {
    try {

        // API URL
        const apiURL = "https://derana.vercel.app/api/derana";

        const { data } = await axios.get(apiURL);

        if (!data.status) {
            return client.sendMessage(
                msg.from,
                { text: "❌ Failed to fetch news!" },
                { quoted: msg }
            );
        }

        const n = data.result;

        // WhatsApp Caption
        const caption =
`📰 *AdaDerana පුවත් (Latest)*
  
*📌 ශීර්ෂය:* ${n.title}

*📅 දිනය:* ${n.date}

*📝 විස්තර:*  
${n.desc ? n.desc.substring(0, 800) : n.description}

🔗 *සම්පූර්ණ පුවත:*  
${n.url};

        // Send news with image
        await client.sendMessage(
            msg.from,
            {
                image: { url: n.image },
                caption
            },
            { quoted: msg }
        );

    } catch (e) {
        console.log(e);
        client.sendMessage(
            msg.from,
            { text: "⚠️ Error fetching Derana news!" },
            { quoted: msg }
        );
    }
});
