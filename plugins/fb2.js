const { cmd } = require('../command');
const axios = require('axios');
const { 
    prepareWAMessageMedia, 
    generateWAMessageFromContent, 
    generateWAMessageContent 
} = require('@whiskeysockets/baileys');

cmd({
    pattern: 'fb2',
    desc: 'Download Facebook video from a link',
    category: 'downloader',
    react: '📥',
    async exec(socket, msg, args) {
        const from = msg.key.remoteJid;
        const reply = msg.message?.conversation || args.join(' ');

        if (!reply) return socket.sendMessage(from, { text: '❌ Please provide a Facebook video link.' }, { quoted: msg });

        try {
            // Fetch JSON from API
            const apiUrl = `https://api.ootaizumi.web.id/downloader/facebook?url=${encodeURIComponent(reply)}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.result) {
                return socket.sendMessage(from, { text: '💔 Failed to fetch video. Please try again.' }, { quoted: msg });
            }

            const { thumbnail, downloads } = data.result;

            // Build interactive reply
            let text = `💻 *Facebook Video Found!*\nChoose the quality to download by replying with number:\n\n`;
            downloads.forEach((d, i) => {
                text += `*${i + 1}.* ${d.quality}\n`;
            });

            // Send thumbnail + options
            const media = await prepareWAMessageMedia({ image: { url: thumbnail } }, { upload: socket.waUploadToServer });
            const content = generateWAMessageFromContent(from, generateWAMessageContent({
                imageMessage: media.imageMessage,
                caption: text
            }), { quoted: msg });
            await socket.relayMessage(from, content.message, { messageId: content.key.id });

            // Store the downloads temporarily for this user
            socket.fbDownloads = socket.fbDownloads || {};
            socket.fbDownloads[from] = downloads;

        } catch (e) {
            console.log(e);
            return socket.sendMessage(from, { text: '💔 Failed to download Facebook video. Please try again later!' }, { quoted: msg });
        }
    }
});

// Reply handler
cmd({
    pattern: /^[1-9]$/,
    category: 'downloader',
    async exec(socket, msg) {
        const from = msg.key.remoteJid;
        const reply = msg.message.conversation.trim();

        if (!socket.fbDownloads || !socket.fbDownloads[from]) return;
        const downloads = socket.fbDownloads[from];

        const index = parseInt(reply) - 1;
        if (index < 0 || index >= downloads.length) return;

        const chosen = downloads[index];

        // Send selected video
        await socket.sendMessage(from, { video: { url: chosen.url }, caption: `🎬 Downloading: ${chosen.quality}` });

        // Clear temporary storage
        delete socket.fbDownloads[from];
    }
});
