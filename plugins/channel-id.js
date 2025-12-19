const { cmd } = require("../command");
const axios = require('axios');

const activeSearch = {}; // temporary search cache per user

// 🔹 Search command
cmd({
    pattern: "pastpaper",
    alias: ["pp", "paper"],
    desc: "Search Past Papers",
    category: "education",
    react: "📚",
    filename: __filename
}, async (conn, mek, m, { from, text }) => {

    if (!text) return m.reply(
        "📌 *Usage:* .pastpaper <keyword>\n\nඋදා: .pastpaper ict"
    );

    try {
        const url = `https://past-paper-api.vercel.app/api/pastpapers?q=${encodeURIComponent(text)}&api_key=chama-free-api`;
        const res = await axios.get(url);
        const data = res.data;

        if (!data.success || !data.results || data.results.length === 0)
            return m.reply("❌ *No results found*");

        // Limit results to first 5 (Heroku safe)
        const results = data.results.slice(0, 5);
        activeSearch[from] = results;

        let msg = "📚 *PAST PAPERS SEARCH RESULTS*\n\n";
        results.forEach((p, i) => {
            msg += `*${i+1}.* ${p.title}\n`;
        });
        msg += `\n📝 Reply with the number to download (1-${results.length})`;
        msg += `\n───────────────\n⚡ *WhiteShadow-MD*`;

        // Image preview (first result's thumbnail or default)
        const previewImg = results[0].thumbnail || "https://i.imgur.com/6o5N7XH.jpeg";

        await conn.sendMessage(from, {
            image: { url: previewImg },
            caption: msg
        }, { quoted: m });

    } catch (e) {
        console.log(e);
        m.reply("❌ *Search Failed*");
    }
});

// 🔹 Reply handler for number download
cmd({
    pattern: "^[0-9]+$",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m) => {
    const from = m.from;
    const number = parseInt(m.text);

    if (!activeSearch[from]) return;

    const results = activeSearch[from];
    if (number < 1 || number > results.length)
        return m.reply("❌ Invalid number");

    const paper = results[number - 1];

    try {
        const dlUrl = `https://past-paper-api.vercel.app/api/download?url=${encodeURIComponent(paper.link)}&api_key=chama-free-api`;
        const res = await axios.get(dlUrl);
        const data = res.data;

        if (!data.success || !data.pdfs || data.pdfs.length === 0)
            return m.reply("❌ PDF not found");

        const pdfLink = data.pdfs[0];
        const fileName = pdfLink.split("/").pop();

        // Details message with WhiteShadow footer
        const detailsMsg = `
📄 *PAST PAPER DETAILS*

📌 *Title:* ${paper.title}
🔗 *Link:* ${paper.link}

⬇️ *Downloading PDF...*

───────────────
⚡ *WhiteShadow-MD*
`;

        await conn.sendMessage(from, {
            image: { url: paper.thumbnail || "https://i.imgur.com/6o5N7XH.jpeg" },
            caption: detailsMsg
        }, { quoted: m });

        // Download PDF as buffer and send
        const pdfRes = await axios.get(pdfLink, { responseType: "arraybuffer" });
        const pdfBuffer = Buffer.from(pdfRes.data);

        await conn.sendMessage(from, {
            document: pdfBuffer,
            mimetype: "application/pdf",
            fileName: fileName,
            caption: `📚 ${paper.title}\n\n⚡ WhiteShadow-MD`
        }, { quoted: m });

        delete activeSearch[from]; // clear cache after download

    } catch (e) {
        console.log(e);
        m.reply("❌ *Download Failed*");
    }
});
cmd({
  pattern: "cid",
  alias: ["newsletter", "cjid"],
  react: "📡",
  desc: "Get WhatsApp Channel info from link",
  category: "whatsapp",
  filename: __filename
}, async (conn, mek, m, {
  from,
  args,
  q,
  reply
}) => {
  try {
    if (!q) return reply("❎ Please provide a WhatsApp Channel link.\n\n*Example:* .cinfo https://whatsapp.com/channel/123456789");

    const match = q.match(/whatsapp\.com\/channel\/([\w-]+)/);
    if (!match) return reply("⚠️ *Invalid channel link format.*\n\nMake sure it looks like:\nhttps://whatsapp.com/channel/xxxxxxxxx");

    const inviteId = match[1];

    let metadata;
    try {
      metadata = await conn.newsletterMetadata("invite", inviteId);
    } catch (e) {
      return reply("❌ Failed to fetch channel metadata. Make sure the link is correct.");
    }

    if (!metadata || !metadata.id) return reply("❌ Channel not found or inaccessible.");

    const infoText = `*— 乂 Channel Info —*\n\n` +
      `🆔 *ID:* ${metadata.id}\n` +
      `📌 *Name:* ${metadata.name}\n` +
      `👥 *Followers:* ${metadata.subscribers?.toLocaleString() || "N/A"}\n` +
      `📅 *Created on:* ${metadata.creation_time ? new Date(metadata.creation_time * 1000).toLocaleString("id-ID") : "Unknown"}`;

    if (metadata.preview) {
      await conn.sendMessage(from, {
        image: { url: `https://pps.whatsapp.net${metadata.preview}` },
        caption: infoText
      }, { quoted: m });
    } else {
      await reply(infoText);
    }

  } catch (error) {
    console.error("❌ Error in .cinfo plugin:", error);
    reply("⚠️ An unexpected error occurred.");
  }
});
