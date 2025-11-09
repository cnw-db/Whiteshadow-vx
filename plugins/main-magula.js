const { cmd } = require('../command')
const axios = require('axios')
const NodeCache = require('node-cache')
const path = require('path')
const {
  generateWAMessageContent,
  generateWAMessageFromContent
} = require('@whiskeysockets/baileys')

const movieCache = new NodeCache({ stdTTL: 120, checkperiod: 150 })

cmd({
  pattern: 'cinesubz',
  alias: ['cs'],
  desc: 'Search Sinhala Subbed Movies from CineSubz',
  category: 'movie',
  react: '🎬',
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  if (!q) {
    return await conn.sendMessage(from, {
      text: `🎬 *CINESUBZ MOVIE SEARCH*\n\n📖 Usage:\n\`\`\`.cinesubz <movie name>\`\`\`\nEg: .cinesubz avengers\n━━━━━━━━━━━━━━━━━━\n⚡ Powered by WhiteShadow-MD`
    }, { quoted: mek })
  }

  try {
    const cacheKey = `cinesubz_${q.toLowerCase()}`
    let data = movieCache.get(cacheKey)

    if (!data) {
      const url = `https://darkyasiya-new-movie-api.vercel.app/api/movie/cinesubz/search?q=${encodeURIComponent(q)}`
      const res = await axios.get(url)
      data = res.data
      if (!data.success || !data.data.all || data.data.all.length === 0)
        throw new Error('No Sinhala Subbed Movies Found!')
      movieCache.set(cacheKey, data)
    }

    const movieList = data.data.all.map((m, i) => ({
      number: i + 1,
      title: m.title,
      year: m.year,
      imdb: m.imdb,
      type: m.type,
      image: m.image,
      link: m.link
    }))

    let listText = `🔍 *CineSubz Sinhala Subbed Movies*\n━━━━━━━━━━━━━━━━━━\n`
    for (const m of movieList)
      listText += `🔸 *${m.number}. ${m.title}*\n🎭 ${m.type} | ⭐ ${m.imdb} | 📅 ${m.year}\n`

    listText += `\n💬 Reply with the *movie number* to continue.\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD`

    const sentMsg = await conn.sendMessage(from, { text: listText }, { quoted: mek })
    const movieMap = new Map()

    const listener = async (update) => {
      const msg = update.messages?.[0]
      if (!msg?.message?.extendedTextMessage) return
      const replyText = msg.message.extendedTextMessage.text.trim()
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId

      // Select Movie
      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText)
        const selected = movieList.find(m => m.number === num)
        if (!selected)
          return conn.sendMessage(from, { text: `❌ Invalid Number. Please reply correctly.` }, { quoted: msg })

        await conn.sendMessage(from, { react: { text: '🎯', key: msg.key } })

        const movieApi = `https://darkyasiya-new-movie-api.vercel.app/api/movie/cinesubz/movie?url=${encodeURIComponent(selected.link)}`
        const movieRes = await axios.get(movieApi)
        const movie = movieRes.data.data
        const downloads = movie.downloadUrl || []

        if (downloads.length === 0)
          return conn.sendMessage(from, { text: `⚠️ No download links found for this movie.` }, { quoted: msg })

        let dlText = `🎬 *${movie.title}*\n⭐ IMDB: ${movie.imdb.value}\n━━━━━━━━━━━━━━━━━━\n`
        downloads.forEach((d, i) => { dlText += `📥 *${i + 1}. ${d.quality}* — ${d.size}\n` })
        dlText += `\n💬 Reply with the *quality number* to download.`

        const downloadMsg = await conn.sendMessage(
          from,
          {
            image: { url: movie.mainImage || selected.image },
            caption: dlText + `\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD`
          },
          { quoted: msg }
        )
        movieMap.set(downloadMsg.key.id, { selected, downloads })
      }

      // Select Quality
      else if (movieMap.has(repliedId)) {
        const { selected, downloads } = movieMap.get(repliedId)
        const num = parseInt(replyText)
        const chosen = downloads[num - 1]

        if (!chosen)
          return conn.sendMessage(from, { text: `❌ Invalid quality number.` }, { quoted: msg })

        await conn.sendMessage(from, { react: { text: '📦', key: msg.key } })

        // Detect file extension + mimetype
        let fileExt = path.extname(chosen.link).split('.').pop().toLowerCase()
        if (!fileExt) fileExt = 'mp4'
        const mimeType = fileExt === 'mkv' ? 'video/x-matroska' : 'video/mp4'

        // Use generateWAMessageContent to send as document
        const msgContent = await generateWAMessageContent({
          document: { url: chosen.link },
          mimetype: mimeType,
          fileName: `${selected.title} - ${chosen.quality}.${fileExt}`,
          caption:
            `🎥 *${selected.title}*\n📺 ${chosen.quality}\n💾 ${chosen.size}\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD`
        }, { upload: conn.waUploadToServer })

        const msgNode = generateWAMessageFromContent(from, msgContent, { quoted: msg })
        await conn.relayMessage(from, msgNode.message, { messageId: msgNode.key.id })
      }
    }

    conn.ev.on('messages.upsert', listener)

  } catch (e) {
    return conn.sendMessage(from, {
      text: `❌ *Error*\n\n${e.message}\n━━━━━━━━━━━━━━━━━━\n⚡ WhiteShadow-MD`
    }, { quoted: mek })
  }
})
