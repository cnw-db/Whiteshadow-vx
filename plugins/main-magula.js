const { cmd } = require('../command')
const axios = require('axios')
const NodeCache = require('node-cache')
const path = require('path')
const {
  generateWAMessageContent,
  generateWAMessageFromContent
} = require('@whiskeysockets/baileys')

const movieCache = new NodeCache({ stdTTL: 120, checkperiod: 150 })
const API_KEY = 'd3d7e61cc85c2d70974972ff6d56edfac42932d394f7551207d2f6ca707eda56'
const BASE_URL = 'https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/cinesubz'

cmd({
  pattern: 'cinesubz',
  alias: ['cs'],
  desc: 'Search Sinhala Subbed Movies from CineSubz (New API)',
  category: 'movie',
  react: '🎬',
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) return conn.sendMessage(from, {
    text: `🎬 *CINESUBZ MOVIE SEARCH*\n\n📖 Usage:\n\`\`\`.cinesubz <movie name>\`\`\`\nEg: .cinesubz avengers\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD`
  }, { quoted: mek })

  try {
    const cacheKey = `cinesubz_${q.toLowerCase()}`
    let data = movieCache.get(cacheKey)

    if (!data) {
      const res = await axios.get(`${BASE_URL}/search?q=${encodeURIComponent(q)}&apiKey=${API_KEY}`)
      data = res.data
      if (!data || !data.data || data.data.length === 0)
        throw new Error('No Sinhala Subbed Movies Found!')
      movieCache.set(cacheKey, data)
    }

    const movieList = data.data.map((m, i) => ({
      number: i + 1,
      title: m.title,
      type: m.type,
      link: m.link,
      rating: m.rating,
      year: m.year,
      image: m.imageSrc
    }))

    let listText = `🔍 *CineSubz Sinhala Subbed Movies*\n━━━━━━━━━━━━━━━━━━\n`
    movieList.forEach(m => listText += `🔸 *${m.number}. ${m.title}*\n🎭 ${m.type} | ${m.rating} | 📅 ${m.year}\n`)
    listText += `\n💬 Reply with the *movie number* to continue.\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD`

    const sentMsg = await conn.sendMessage(from, { text: listText }, { quoted: mek })
    const movieMap = new Map()

    const listener = async (update) => {
      const msg = update.messages?.[0]
      if (!msg?.message?.extendedTextMessage) return
      const replyText = msg.message.extendedTextMessage.text.trim()
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId

      // Movie Selection
      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText)
        const selected = movieList.find(m => m.number === num)
        if (!selected) return conn.sendMessage(from, { text: `❌ Invalid Number` }, { quoted: msg })

        await conn.sendMessage(from, { react: { text: '🎯', key: msg.key } })

        // Fetch movie details
        const movieRes = await axios.get(`${BASE_URL}/movie-details?url=${encodeURIComponent(selected.link)}&apiKey=${API_KEY}`)
        const movie = movieRes.data.moviedata
        if (!movie) return conn.sendMessage(from, { text: '⚠️ No details found' }, { quoted: msg })

        // Send options to download (simplified single URL API)
        const dlRes = await axios.get(`${BASE_URL}/downloadurl?url=${encodeURIComponent(selected.link)}&apiKey=${API_KEY}`)
        const dl = dlRes.data
        if (!dl?.url) return conn.sendMessage(from, { text: '⚠️ No download link found' }, { quoted: msg })

        // Detect file extension & mimetype
        let fileExt = path.extname(dl.url).split('.').pop().toLowerCase() || 'mp4'
        const mimeType = fileExt === 'mkv' ? 'video/x-matroska' : 'video/mp4'

        const msgContent = await generateWAMessageContent({
          document: { url: dl.url },
          mimetype: mimeType,
          fileName: `${movie.title}.${fileExt}`,
          caption:
            `🎥 *${movie.title}*\n📺 ${dl.quality}\n💾 ${dl.size}\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD`
        }, { upload: conn.waUploadToServer })

        const msgNode = generateWAMessageFromContent(from, msgContent, { quoted: msg })
        await conn.relayMessage(from, msgNode.message, { messageId: msgNode.key.id })
      }
    }

    conn.ev.on('messages.upsert', listener)

  } catch (e) {
    return conn.sendMessage(from, { text: `❌ *Error*\n\n${e.message}\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD` }, { quoted: mek })
  }
})
