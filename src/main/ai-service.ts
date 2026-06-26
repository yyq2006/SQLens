import { createHash, randomBytes } from 'crypto'

interface AiConfig {
  apiKey: string
  baseUrl: string
  model: string
  enabled: boolean
}

const DEFAULT_CONFIG: AiConfig = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  enabled: false
}

/** 简单的 AES-like 加密存储 API Key（非安全级，仅防明文泄露） */
function encrypt(text: string): string {
  if (!text) return ''
  const key = randomBytes(8).toString('hex')
  const buf = Buffer.from(text, 'utf-8')
  return key + ':' + buf.toString('base64')
}

function decrypt(encoded: string): string {
  if (!encoded) return ''
  const parts = encoded.split(':')
  if (parts.length < 2) return ''
  return Buffer.from(parts.slice(1).join(':'), 'base64').toString('utf-8')
}

export class AiService {
  private config: AiConfig
  private _initialized = false

  constructor() {
    // 尝试从环境变量读取
    this.config = {
      ...DEFAULT_CONFIG,
      apiKey: process.env['DEEPSEEK_API_KEY'] || '',
      enabled: !!process.env['DEEPSEEK_API_KEY']
    }
  }

  get initialized(): boolean {
    return this._initialized
  }

  /** 更新配置 */
  updateConfig(config: Partial<AiConfig>): void {
    this.config = { ...this.config, ...config }
    this.config.enabled = !!this.config.apiKey
    this._initialized = true
  }

  /** 获取配置（API Key 加密后返回） */
  getConfig(): Omit<AiConfig, 'apiKey'> & { apiKey: string } {
    return {
      ...this.config,
      apiKey: this.config.apiKey ? '••••' + this.config.apiKey.slice(-4) : ''
    }
  }

  /** 检查是否可用 */
  isAvailable(): boolean {
    return this.config.enabled && !!this.config.apiKey
  }

  /** 调用 AI API */
  private async callApi(systemPrompt: string, userMessage: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('AI 未配置，请先在设置中填入 API Key')
    }

    const res = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
      signal: AbortSignal.timeout(30000)
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      throw new Error(`AI API 错误 (${res.status}): ${err}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  /** 分析请求，推荐扫描参数 */
  async analyzeRequest(url: string, data?: string): Promise<{
    paramNames: string[]
    likelyDb: string
    recommendLevel: number
    recommendRisk: number
    recommendTech: string
    hasWaf: boolean
    recommendTamper: string[]
    note: string
  }> {
    const prompt = `你是一个 SQL 注入扫描分析专家。分析以下 HTTP 请求，输出 JSON 格式的扫描建议。

请求 URL: ${url}
${data ? `请求体: ${data}` : ''}

请分析并返回 JSON（不要有其他文字）:
{
  "paramNames": ["参数名列表"],
  "likelyDb": "可能的数据库类型，如 MySQL/PostgreSQL/Oracle/未知",
  "recommendLevel": 推荐扫描等级(1-5),
  "recommendRisk": 推荐风险等级(1-3),
  "recommendTech": "推荐注入技术组合，如 BEU",
  "hasWaf": true/false (是否有 WAF 特征),
  "recommendTamper": ["推荐的 tamper 脚本"],
  "note": "中文简要说明"
}`

    try {
      const text = await this.callApi(prompt, '请分析')
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('AI 返回格式异常')
      return JSON.parse(jsonMatch[0])
    } catch (err) {
      const error = err as Error
      throw new Error(`AI 分析失败: ${error.message}`)
    }
  }

  /** 解读日志 */
  async interpretLog(logLine: string): Promise<string> {
    const prompt = `你是一个 SQL 注入助手。用一句话（中文）解释这条日志，让初学者能听懂。

日志: ${logLine}

解释（15字以内）:`

    try {
      return await this.callApi(prompt, '')
    } catch {
      return ''
    }
  }

  /** 生成报告 */
  async generateReport(scanSummary: string): Promise<{
    summary: string
    riskLevel: string
    findings: string[]
    fixSuggestions: string[]
  }> {
    const prompt = `你是一个安全报告专家。根据以下扫描结果，输出 JSON 格式的报告。

扫描结果:
${scanSummary}

输出 JSON:
{
  "summary": "扫描总结（中文）",
  "riskLevel": "风险等级: 高/中/低",
  "findings": ["发现的问题列表"],
  "fixSuggestions": ["修复建议列表，包含代码示例"]
}`

    try {
      const text = await this.callApi(prompt, '')
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('AI 返回格式异常')
      return JSON.parse(jsonMatch[0])
    } catch (err) {
      const error = err as Error
      return {
        summary: `报告生成失败: ${error.message}`,
        riskLevel: '未知',
        findings: [],
        fixSuggestions: []
      }
    }
  }

  /** 自然语言指令理解 */
  async understandCommand(command: string, context: string): Promise<{
    action: string
    params: Record<string, string>
    reply: string
  }> {
    const prompt = `你是一个 SQL 注入工具的 AI 助手。用户输入了中文指令，请理解意图并输出 JSON。

当前上下文: ${context}
用户指令: ${command}

输出 JSON:
{
  "action": "scan/stop/export/enum/report/help/unknown",
  "params": {"url": "", "table": "", "format": ""},
  "reply": "给用户的回复（中文）"
}`

    try {
      const text = await this.callApi(prompt, '')
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('AI 返回格式异常')
      return JSON.parse(jsonMatch[0])
    } catch (err) {
      const error = err as Error
      return {
        action: 'unknown',
        params: {},
        reply: `❌ 无法理解指令: ${error.message}`
      }
    }
  }
}
