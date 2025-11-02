const { cmd } = require('../command');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const https = require('https');

cmd({
  pattern: 'getzip(?:\\s+(.*))?$',
  alias: ['zipget', 'webtozip'],
  react: '📦',
  desc: 'Download website as ZIP via API (WhiteShadow style)',
  category: 'tools',
  use: '.getzip <website_url>',
  async run({ msg, conn }, match) {
    try {
      const siteUrl = match && match.trim() ? match.trim() : 'https://whiteshadow-md.vercel.app/';
      const api = `https://api.elrayyxml.web.id/api/tools/webtozip?url=${encodeURIComponent(siteUrl)}`;

      await conn.sendMessage(msg.from, { text: '⏳ Creating ZIP archive... Please wait ⌛' }, { quoted: msg });

      const res = await fetch(api);
      const data = await res.json();

      if (!data.status || !data.result.downloadUrl) {
        return await conn.sendMessage(msg.from, { text: '❌ Failed to get ZIP link from API.' }, { quoted: msg });
      }

      const downloadUrl = data.result.downloadUrl;
      const copied = data.result.copiedFilesAmount || 0;
      const tmpFile = path.join(__dirname, `../temp/web-${Date.now()}.zip`);

      // Download the ZIP file
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(tmpFile);
        https.get(downloadUrl, (response) => {
          const total = parseInt(response.headers['content-length'] || '0');
          if (total > 80 * 1024 * 1024) {
            file.close();
            fs.unlinkSync(tmpFile);
            reject(new Error('⚠️ File too large (over 80MB) for WhatsApp upload.'));
            return;
          }
          response.pipe(file);
          file.on('finish', () => file.close(resolve));
        }).on('error', (err) => reject(err));
      });

      const stats = fs.statSync(tmpFile);
      const fileSize = (stats.size / (1024 * 1024)).toFixed(2);

      const caption = `╔═══• 𝐖𝐇𝐈𝐓𝐄𝐒𝐇𝐀𝐃𝐎𝐖 - 𝐆𝐄𝐓𝐙𝐈𝐏 •═══╗
🌐 *Site:* ${siteUrl}
📁 *Files:* ${copied}
💾 *Size:* ${fileSize} MB
⚙️ *Status:* Download completed

_📦 Powered by WhiteShadow-MD_`;

      await conn.sendMessage(
        msg.from,
        {
          document: fs.readFileSync(tmpFile),
          mimetype: 'application/zip',
          fileName: `website-${Date.now()}.zip`,
          caption,
          contextInfo: {
            externalAdReply: {
              title: 'WhiteShadow GetZip Downloader',
              body: 'Fast Web → ZIP Converter',
              thumbnailUrl: 'https://files.catbox.moe/fyr37r.jpg',
              sourceUrl: siteUrl,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        },
        { quoted: msg }
      );

      fs.unlinkSync(tmpFile); // delete temp zip

    } catch (err) {
      console.error(err);
      await conn.sendMessage(msg.from, { text: `❌ Error: ${err.message}` }, { quoted: msg });
    }
  }
});
