import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import visionRoute from './routes/vision'
import pushRoute   from './routes/push'
import { CronService } from './services/CronService'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE']
}))

app.route('/api/vision', visionRoute)
app.route('/api/push',   pushRoute)

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

const PORT = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  CronService.start()
})

export default app
