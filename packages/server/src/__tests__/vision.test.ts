import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import visionRoute from '../routes/vision'

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  name: '阿莫西林',
                  dosage: 500,
                  unit: 'mg',
                  usage_suggestion: '每日3次，饭后服用'
                })
              }
            }]
          })
        }
      }
    }))
  }
})

// Mock auth middleware — pass through
vi.mock('../middleware/auth', () => ({
  authMiddleware: vi.fn().mockImplementation(async (c: any, next: any) => await next())
}))

describe('POST /api/vision/identify', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.route('/api/vision', visionRoute)
  })

  it('returns 400 when no file uploaded', async () => {
    const req = new Request('http://localhost/api/vision/identify', {
      method: 'POST',
      body: new FormData()
    })
    const res = await app.fetch(req)
    expect(res.status).toBe(400)
  })

  it('returns JSON with name, dosage, unit, usage_suggestion on success', async () => {
    const formData = new FormData()
    const blob = new Blob(['fake-image-bytes'], { type: 'image/jpeg' })
    formData.append('image', blob, 'pill.jpg')

    const req = new Request('http://localhost/api/vision/identify', {
      method: 'POST',
      body: formData
    })
    const res = await app.fetch(req)
    expect(res.status).toBe(200)

    const body = await res.json() as any
    expect(body).toHaveProperty('name')
    expect(body).toHaveProperty('dosage')
    expect(body).toHaveProperty('unit')
    expect(body).toHaveProperty('usage_suggestion')
    expect(body.name).toBe('阿莫西林')
  })
})
