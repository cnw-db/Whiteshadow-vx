const { cmd } = require('../command')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const fs = require('fs')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

cmd({
  pattern: 'phonk',
  alias: ['phonkplay', 'phonkdl'],
  react: '🎧',
  desc: 'Send phonk song to WhatsApp Channel',
  category: 'channel',
  use: '.phonk <youtube_url>/<channelJid>',
  filename: __filename
}, async (conn, mek, m, { reply, q }) => {
  try {
    // ─── ARGUMENT CHECK ───
    if (!q || !q.includes('/')) {
      return reply('⚠️ Usage:\n.phonk https://youtu.be/xxxx/120363397446799567@newsletter')
    }

    const [ytUrl, channelJidRaw] = q.split('/').map(v => v.trim())
    const channelJid = channelJidRaw || ''

    if (!channelJid.endsWith('@newsletter')) {
      return reply('❌ *Channel JID වැරදියි!* (@newsletter ending check කරන්න)')
    }

    if (!ytUrl.startsWith('http')) {
      return reply('❌ YouTube link එකක් දෙන්න.')
    }

    // ─── FETCH FROM SAVETUBE API ───
    const apiUrl = `https://savetube-api.vercel.app/download?url=${encodeURIComponent(ytUrl)}`
    const res = await fetch(apiUrl)
    if (!res.ok) return reply('❌ API connection failed.')

    const json = await res.json()
    if (!json.status || !json.result?.download_url) {
      return reply('❌ Audio data fetch failed.')
    }

    const meta = json.result

    // ─── THUMBNAIL ───
    let thumb = null
    try {
      if (meta.thumbnail) {
        const t = await fetch(meta.thumbnail)
        thumb = Buffer.from(await t.arrayBuffer())
      }
    } catch {}

    // ─── CAPTION ───
    const caption = `
*🎧 Phonk Hub | 🇱🇰 Trending Audio*

*🎵 Title:* ${meta.title || 'Unknown'}
*⏱ Duration:* ${meta.duration ? meta.duration + 's' : 'N/A'}

*🔥 Join Sri Lanka Best Phonk Channel*
*Phonk Hub 🍄 SL 🇱🇰*
    `.trim()

    // ─── SEND IMAGE CARD ───
    await conn.sendMessage(channelJid, {
      image: thumb,
      caption
    }, { quoted: mek })

    // ─── TEMP PATHS ───
    const tempDir = path.join(__dirname, '../temp')
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

    const mp3Path = path.join(tempDir, `${Date.now()}_phonk.mp3`)
    const opusPath = path.join(tempDir, `${Date.now()}_phonk.opus`)

    // ─── DOWNLOAD MP3 ───
    const audioRes = await fetch(meta.download_url)
    if (!audioRes.ok) return reply('❌ Audio download error.')

    const audioBuffer = Buffer.from(await audioRes.arrayBuffer())
    fs.writeFileSync(mp3Path, audioBuffer)

    // ─── CONVERT TO OPUS ───
    await new Promise((resolve, reject) => {
      ffmpeg(mp3Path)
        .audioCodec('libopus')
        .audioBitrate('64k')
        .format('opus')
        .save(opusPath)
        .on('end', resolve)
        .on('error', reject)
    })

    // ─── SEND VOICE NOTE ───
    await conn.sendMessage(channelJid, {
      audio: fs.readFileSync(opusPath),
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true
    }, { quoted: mek })

    // ─── CLEANUP ───
    try { fs.unlinkSync(mp3Path) } catch {}
    try { fs.unlinkSync(opusPath) } catch {}

    reply(`✅ Phonk sent to channel:\n${channelJid}`)

  } catch (e) {
    console.error('phonk error:', e)
    reply('⚠️ Error sending phonk track.')
  }
})
