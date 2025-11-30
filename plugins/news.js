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


cmd({
    pattern: "sinhalanews",
    desc: "Get latest Sinhala news from Derana & News1st.",
    category: "news",
    react: "📰",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        // ===== DERANA NEWS =====
        const deranaAPI = "https://derana.vercel.app/api/derana";
        const deranaRes = await axios.get(deranaAPI);
        const deranaData = deranaRes.data;

        if (deranaData.status) {
            const news = deranaData.result;
            let caption = `
📰 *${news.title}*
📅 ${news.date}

${news.desc}

🔗 *Source:* ${news.url}

© ᴘᴏᴡᴇʀᴇᴅ ʙʏ WHITESHADOW-MD
            `;
            if (news.image) {
                await conn.sendMessage(from, { image: { url: news.image }, caption });
            } else {
                await conn.sendMessage(from, { text: caption });
            }
        }

        // ===== NEWS1ST =====
        const news1stAPI = "https://my-news-api.chamodshadow125.workers.dev/";
        const news1stRes = await axios.get(news1stAPI);
        const news1st = news1stRes.data;

        let caption2 = `
📰 *${news1st.title}*
📅 ${news1st.date}

${news1st.desc}

🔗 *Source:* ${news1st.url}

© ᴘᴏᴡᴇʀᴇᴅ ʙʏ WHITESHADOW-MD
        `;
        if (news1st.image) {
            await conn.sendMessage(from, { image: { url: news1st.image }, caption: caption2 });
        } else {
            await conn.sendMessage(from, { text: caption2 });
        }

    } catch (e) {
        console.error("Sinhala News Plugin Error:", e);
        reply("❌ Could not fetch Sinhala news. Try again later.");
    }
});




cmd({
    pattern: "news1st",
    alias: ["sirasa"], // ⚡ Alias added here
    desc: "Get latest News1st Sinhala news.",
    category: "news",
    react: "📰",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const api = "https://my-news-api.chamodshadow125.workers.dev/";
        const res = await axios.get(api);
        const news = res.data;

        let caption = `
📰 *${news.title}*
📅 ${news.date}

${news.desc}

🔗 *Source:* ${news.url}

© ᴘᴏᴡᴇʀᴇᴅ ʙʏ WHITESHADOW-MD
        `;

        if (news.image) {
            await conn.sendMessage(from, { image: { url: news.image }, caption });
        } else {
            await conn.sendMessage(from, { text: caption });
        }

    } catch (e) {
        console.error("News1st Plugin Error:", e);
        reply("❌ Could not fetch News1st news. Try again later.");
    }
});
