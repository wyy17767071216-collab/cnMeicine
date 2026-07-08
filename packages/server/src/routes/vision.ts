import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { identifyDrug } from '../services/GPT4oVision'

const vision = new Hono()

vision.use('/*', authMiddleware)

vision.post('/identify', async (c) => {
  const body = await c.req.parseBody()
  const file = body['image']

  if (!file || typeof file === 'string') {
    return c.json({ error: 'No image file provided' }, 400)
  }

  const arrayBuffer = await (file as File).arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const mimeType = (file as File).type || 'image/jpeg'

  const result = await identifyDrug(base64, mimeType)
  return c.json(result)
})

export default vision
