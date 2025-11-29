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
