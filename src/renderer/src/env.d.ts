/// <reference types="vite/client" />

interface AiAnalysisResult {
  paramNames: string[]
  likelyDb: string
  recommendLevel: number
  recommendRisk: number
  recommendTech: string
  hasWaf: boolean
  recommendTamper: string[]
  note: string
}

interface AiReportResult {
  summary: string
  riskLevel: string
  findings: string[]
  fixSuggestions: string[]
}

interface AiCommandResult {
  action: string
  params: Record<string, string>
  reply: string
}

interface Api {
  // sqlmapapi 管理
  startSqlmapApi: () => Promise<{ success: boolean; message: string }>
  stopSqlmapApi: () => Promise<{ success: boolean }>
  getSqlmapStatus: () => Promise<{ connected: boolean; port: number }>
  onSqlmapStatusChange: (callback: (connected: boolean) => void) => void
  removeSqlmapStatusChange: () => void

  // 扫描任务
  createTask: () => Promise<{ success: boolean; taskId: string; error?: string }>
  setOption: (taskId: string, options: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
  startScan: (taskId: string) => Promise<{ success: boolean; engineId?: string; error?: string }>
  stopScan: (taskId: string) => Promise<{ success: boolean; error?: string }>
  getStatus: (taskId: string) => Promise<{ status: string; success: boolean }>
  getData: (taskId: string) => Promise<{ data: unknown[]; success: boolean }>
  getLog: (taskId: string) => Promise<{ log: string[]; success: boolean }>

  // AI 服务
  getAiConfig: () => Promise<{ apiKey: string; baseUrl: string; model: string; enabled: boolean }>
  updateAiConfig: (config: { apiKey: string; baseUrl?: string; model?: string }) => Promise<{ success: boolean }>
  checkAi: () => Promise<{ available: boolean }>
  analyzeRequest: (url: string, data?: string) => Promise<{ success: boolean; data?: AiAnalysisResult; error?: string }>
  interpretLog: (logLine: string) => Promise<{ success: boolean; data?: string; error?: string }>
  generateReport: (scanSummary: string) => Promise<{ success: boolean; data?: AiReportResult; error?: string }>
  understandCommand: (command: string, context: string) => Promise<{ success: boolean; data?: AiCommandResult; error?: string }>

  // AI 流式聊天
  chat: (messages: { role: string; content: string }[]) => Promise<{ success: boolean; error?: string }>
  onChatToken: (callback: (token: string) => void) => void
  onChatDone: (callback: (full: string) => void) => void
  onChatError: (callback: (error: string) => void) => void
  removeChatListeners: () => void
}

declare global {
  interface Window {
    sqlens: Api
  }
}
