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
  let tempPath
  try {
    let imageBuffer

    // 1️⃣ Validate input: quoted image or URL
    if(quoted && quoted.message && quoted.message.imageMessage){
      try {
        imageBuffer = await conn.downloadMediaMessage(quoted)
      } catch(e){
        return reply('❌ Cannot download image, try again. Error: ' + e.message)
      }
    } else if(q && q.startsWith('http')){
      try {
        const response = await axios.get(q, { responseType:'arraybuffer' })
        imageBuffer = Buffer.from(response.data, 'binary')
      } catch(e){
        return reply('❌ Cannot download image from URL. Error: ' + e.message)
      }
    } else {
      return reply('❌ Reply to an image or send a valid image URL with prompt!')
    }

    // 2️⃣ Check prompt
    if(!q) return reply('❌ Please provide a prompt for enhancement!')

    // 3️⃣ Save temp image
    tempPath = `/tmp/temp-${Date.now()}.jpg`
    fs.writeFileSync(tempPath, imageBuffer)

    // 4️⃣ Prepare form-data
    const formData = new FormData()
    formData.append('image', fs.createReadStream(tempPath))
    formData.append('prompt', q)

    const apiKey = process.env.API_KEY || 'WHITESHADOW-123456'
    const apiURL = 'https://nanobanana-api-whiteshadow.vercel.app/api/enhance'

    // 5️⃣ Call API with timeout
    const res = await axios.post(apiURL, formData, {
      headers: {
        'x-api-key': apiKey,
        ...formData.getHeaders()
      },
      timeout: 60000
    })

    // 6️⃣ Delete temp file
    fs.unlinkSync(tempPath)

    // 7️⃣ Send enhanced image
    if(res.data.status){
      conn.sendMessage(from, {
        image: { url: res.data.result.output },
        caption: `✨ Enhanced by AI\nCreator: Crater Chamod Nimsara`
      }, { quoted: m })
    } else {
      reply('❌ Failed: ' + (res.data.error || 'Unknown error'))
    }

  } catch(e){
    reply('❌ Error: ' + e.message)
    try { if(tempPath) fs.unlinkSync(tempPath) } catch{}
  }
})
