const { cmd } = require('../command');

cmd({
  pattern: 'fbdown',
  desc: 'Download Facebook video and send',
  category: 'downloader',
  react: '🎬',
  async exec(socket, msg, args) {
    try {
      if (!args[0]) return await socket.sendMessage(msg.key.remoteJid, { text: 'Please provide Facebook video link!' }, { quoted: msg });

      const fbUrl = args[0];
      // Facebook API call
      const res = await axios.get(`https://api.ootaizumi.web.id/downloader/facebook?url=${encodeURIComponent(fbUrl)}`);
      const data = res.data;

      if (!data || !data.result || !data.result.downloads || !data.result.downloads.length) {
        return await socket.sendMessage(msg.key.remoteJid, { text: '💔 Failed to fetch video. Try another link.' }, { quoted: msg });
      }

      const downloads = data.result.downloads;

      // Create buttons for quality selection
      const buttons = downloads.map((d, i) => ({
        buttonId: `fbchoose_${i}`,
        buttonText: { displayText: d.quality },
        type: 1
      }));

      await socket.sendMessage(msg.key.remoteJid, {
        text: 'Choose video quality to download:',
        buttons,
        headerType: 1
      }, { quoted: msg });

      // Save data in temporary map to access in reply
      socket.fbVideoCache = socket.fbVideoCache || new Map();
      socket.fbVideoCache.set(msg.key.id, downloads);

    } catch (err) {
      console.log(err);
      await socket.sendMessage(msg.key.remoteJid, { text: '❌ Error occurred while fetching video.' }, { quoted: msg });
    }
  }
});

// Button reply handler
cmd({
  pattern: 'fbchoose_',
  async exec(socket, msg) {
    try {
      const id = msg.message.extendedTextMessage.contextInfo.stanzaId;
      const index = parseInt(msg.text.replace('fbchoose_', ''));
      const downloads = socket.fbVideoCache.get(id);

      if (!downloads || !downloads[index]) {
        return await socket.sendMessage(msg.key.remoteJid, { text: '❌ Video not found in cache.' }, { quoted: msg });
      }

      const chosen = downloads[index];

      await socket.sendMessage(msg.key.remoteJid, {
        video: { url: chosen.url },
        caption: `🎬 Sending video: ${chosen.quality}`
      }, { quoted: msg });

      // Clear cache for this message
      socket.fbVideoCache.delete(id);

    } catch (err) {
      console.log(err);
      await socket.sendMessage(msg.key.remoteJid, { text: '❌ Error sending video.' }, { quoted: msg });
    }
  }
});
