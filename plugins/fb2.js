const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: 'fb2',
  desc: 'Download Facebook video with number reply',
  category: 'downloader',
  react: '🎬',
  async exec(socket, msg, args) {
    try {
      if (!args[0]) return await socket.sendMessage(msg.key.remoteJid, { text: 'Please provide Facebook video link!' }, { quoted: msg });

      const fbUrl = args[0];
      const res = await axios.get(`https://api.ootaizumi.web.id/downloader/facebook?url=${encodeURIComponent(fbUrl)}`);
      const data = res.data;

      if (!data?.result?.downloads?.length) {
        return await socket.sendMessage(msg.key.remoteJid, { text: '💔 Failed to fetch video. Try another link.' }, { quoted: msg });
      }

      const downloads = data.result.downloads;
      let listText = 'Choose video quality by replying with number:\n\n';
      downloads.forEach((d, i) => {
        listText += `${i + 1}. ${d.quality}\n`;
      });

      await socket.sendMessage(msg.key.remoteJid, { text: listText }, { quoted: msg });

      // Save in cache for number reply
      socket.fbVideoCache = socket.fbVideoCache || new Map();
      socket.fbVideoCache.set(msg.key.id, downloads);

    } catch (err) {
      console.log(err);
      await socket.sendMessage(msg.key.remoteJid, { text: '❌ Error occurred while fetching video.' }, { quoted: msg });
    }
  }
});

// Handle number reply
cmd({
  pattern: /^\d+$/,
  fromMe: false,
  async exec(socket, msg) {
    try {
      const id = msg.message.extendedTextMessage?.contextInfo?.stanzaId;
      if (!id) return;

      const downloads = socket.fbVideoCache?.get(id);
      if (!downloads) return; // no cached video

      const num = parseInt(msg.text);
      if (!num || num < 1 || num > downloads.length) {
        return await socket.sendMessage(msg.key.remoteJid, { text: '❌ Invalid number. Try again.' }, { quoted: msg });
      }

      const chosen = downloads[num - 1];

      await socket.sendMessage(msg.key.remoteJid, {
        video: { url: chosen.url },
        caption: `🎬 Sending video: ${chosen.quality}`
      }, { quoted: msg });

      socket.fbVideoCache.delete(id); // clear cache

    } catch (err) {
      console.log(err);
      await socket.sendMessage(msg.key.remoteJid, { text: '❌ Error sending video.' }, { quoted: msg });
    }
  }
});
