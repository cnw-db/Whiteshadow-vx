const fs = require('fs')
const axios = require('axios')
const FormData = require('form-data')
const { cmd } = require('../command')

cmd({
  pattern: 'enhance',
  alias: ['aiimgx','imgboost'],
  desc: 'Enhance an image using AI',
  type: 'tools',
  react: '✨',
  filename: __filename
}, async (conn, m, store, { from, q, reply, quoted }) => {
  try {
    // 1️⃣ Validate input
    if(!quoted || !quoted.imageMessage) 
      return reply('❌ Reply to an image with your prompt!')

    if(!q) return reply('❌ Please provide a prompt!')

    const prompt = q
    const imageBuffer = await conn.downloadMediaMessage(quoted)
    const tempPath = `/tmp/temp-${Date.now()}.jpg`
    fs.writeFileSync(tempPath, imageBuffer)

    // 2️⃣ Prepare FormData
    const formData = new FormData()
    formData.append('image', fs.createReadStream(tempPath))
    formData.append('prompt', prompt)

    const apiKey = process.env.API_KEY || 'WHITESHADOW-123456'
    const apiURL = 'https://nanobanana-api-whiteshadow.vercel.app/api/enhance'

    // 3️⃣ Axios POST request with timeout
    const res = await axios.post(apiURL, formData, {
      headers: {
        'x-api-key': apiKey,
        ...formData.getHeaders()
      },
      timeout: 60000 // 60s
    })

    // 4️⃣ Remove temp file safely
    fs.unlinkSync(tempPath)

    // 5️⃣ Send enhanced image
    if(res.data.status){
      conn.sendMessage(from, {
        image: { url: res.data.result.output },
        caption: `✨ Enhanced by AI\nCreator: Crater Chamod Nimsara`
      }, { quoted: m })
    } else {
      reply('❌ Failed: ' + (res.data.error || 'Unknown error'))
    }

  } catch(e){
    // 6️⃣ Catch any error to prevent crash
    reply('❌ Error: ' + e.message)
    try { fs.unlinkSync(tempPath) } catch{}
  }
})
