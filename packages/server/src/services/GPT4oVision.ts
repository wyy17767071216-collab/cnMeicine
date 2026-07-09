import OpenAI from 'openai'

const client = new OpenAI({
  apiKey:  process.env.DASHSCOPE_API_KEY ?? '',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
})

export interface VisionResult {
  name: string
  dosage: number
  unit: string
  usage_suggestion: string
}

const SYSTEM_PROMPT = `你是一个专业的药品识别助手。
分析用户上传的药品图片，提取以下信息并以 JSON 格式返回：
{
  "name": "药品名称（中文）",
  "dosage": 数字（剂量数值）,
  "unit": "单位（mg/ml/片/粒）",
  "usage_suggestion": "简短的用法建议（中文，≤50字）"
}
如无法识别，name 返回 "未知药品"，其他字段返回合理默认值。
只返回 JSON，不要其他文字。`

export async function identifyDrug(imageBase64: string, mimeType: string): Promise<VisionResult> {
  const completion = await client.chat.completions.create({
    model: 'qwen-vl-plus',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` }
          },
          { type: 'text', text: '请识别这个药品' }
        ]
      }
    ],
    max_tokens: 256
  })

  const raw = completion.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(raw)
  return {
    name:             String(parsed.name ?? '未知药品'),
    dosage:           Number(parsed.dosage ?? 0),
    unit:             String(parsed.unit ?? 'mg'),
    usage_suggestion: String(parsed.usage_suggestion ?? '')
  }
}
