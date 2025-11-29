const { cmd } = require('../command'); // cmd system use කරලා
const axios = require('axios');

cmd({
  pattern: 'news',
  desc: 'Latest Sinhala News from your API',
  category: 'info',
  react: '📰',
  async handler(m, { conn }) {
    try {
      // API call
      const response = await axios.get('https://my-news-api.chamodshadow125.workers.dev/');
      const news = response.data;

      // Build message
      let message = `📰 *${news.title}*\n\n`;
      message += `📅 Date: ${news.date}\n`;
      message += `\n${news.desc.replace(/&nbsp;/g, '')}\n\n`;
      message += `🔗 [Read more](${news.url})`;

      // Send image with caption
      await conn.sendMessage(
        m.chat,
        {
          image: { url: news.image },
          caption: message,
          contextInfo: { mentionedJid: [m.sender] }
        },
        { quoted: m }
      );
    } catch (err) {
      console.error(err);
      await m.reply('❌ News load කරන්න බැරි වුණා. ඉදිරියට නැවත උත්සාහ කරන්න.');
    }
  }
});




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

