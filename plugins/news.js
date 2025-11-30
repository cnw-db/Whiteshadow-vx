const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "worldnews",
    desc: "Get the latest news headlines.",
    category: "news",
    react: "📰",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const apiKey="0f2c43ab11324578a7b1709651736382";
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`);
        const articles = response.data.articles;

        if (!articles.length) return reply("No news articles found.");

        // Send each article as a separate message with image and title
        for (let i = 0; i < Math.min(articles.length, 5); i++) {
            const article = articles[i];
            let message = `
📰 *${article.title}*
⚠️ _${article.description}_
🔗 _${article.url}_

  ©ᴘᴏᴡᴇʀᴇᴅ ʙʏ WHITESHADOW-MD
            `;

            console.log('Article URL:', article.urlToImage); // Log image URL for debugging

            if (article.urlToImage) {
                // Send image with caption
                await conn.sendMessage(from, { image: { url: article.urlToImage }, caption: message });
            } else {
                // Send text message if no image is available
                await conn.sendMessage(from, { text: message });
            }
        };
    } catch (e) {
        console.error("Error fetching news:", e);
        reply("Could not fetch news. Please try again later.");
    }
});



cmd({
    pattern: "derana",
    desc: "Get latest Derana Sinhala News.",
    category: "news",
    react: "📰",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const api = "https://derana.vercel.app/api/derana";

        const res = await axios.get(api);
        const data = res.data;

        if (!data.status) return reply("⚠️ Unable to fetch Derana News.");

        const news = data.result;

        let caption = `
📰 *${news.title}*
📅 ${news.date}

${news.desc}

🔗 *Source:* ${news.url}

© ᴘᴏᴡᴇʀᴇᴅ ʙʏ WHITESHADOW-MD
`;

        if (news.image) {
            await conn.sendMessage(from, {
                image: { url: news.image },
                caption: caption
            });
        } else {
            await conn.sendMessage(from, { text: caption });
        }

    } catch (e) {
        console.error("Derana Plugin Error:", e);
        reply("❌ Could not fetch Derana news. Try again later.");
    }
});
