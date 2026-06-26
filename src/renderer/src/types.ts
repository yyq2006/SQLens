/** 扫描参数配置 - 对应 sqlmapapi 的 option set */
export interface ScanOptions {
  // 目标与请求
  url: string
  method: 'GET' | 'POST'
  data: string
  cookie: string
  userAgent: string
  referer: string
  headers: Record<string, string>
  delay: number
  timeout: number
  retries: number
  proxy: string

  // 注入参数
  testParam: string
  tech: ('B' | 'E' | 'U' | 'S' | 'T')[]
  dbms: string
  level: number
  risk: number

  // 检测与绕过
  string: string
  regexp: string
  code: number
  textOnly: boolean
  titles: boolean
  tamper: string[]
  encoding: string

  // 枚举选项
  dbs: boolean
  tables: boolean
  columns: boolean
  dump: boolean
  dumpAll: boolean
  stop: number
  search: string

  // 优化
  threads: number
  keepAlive: boolean
  nullConnection: boolean
  optimize: boolean

  // 自定义
  customParams: string
}

export const DEFAULT_OPTIONS: ScanOptions = {
  url: '',
  method: 'GET',
  data: '',
  cookie: '',
  userAgent: '',
  referer: '',
  headers: {},
  delay: 0,
  timeout: 30,
  retries: 3,
  proxy: '',

  testParam: '',
  tech: ['B', 'E', 'U', 'S', 'T'],
  dbms: '',
  level: 1,
  risk: 1,

  string: '',
  regexp: '',
  code: 0,
  textOnly: false,
  titles: false,
  tamper: [],
  encoding: '',

  dbs: false,
  tables: false,
  columns: false,
  dump: false,
  dumpAll: false,
  stop: 0,
  search: '',

  threads: 1,
  keepAlive: true,
  nullConnection: false,
  optimize: true,

  customParams: ''
}

/** 扫描模板 */
export interface ScanTemplate {
  name: string
  label: string
  options: Partial<ScanOptions>
}

export const SCAN_TEMPLATES: ScanTemplate[] = [
  {
    name: 'quick',
    label: '快速检测',
    options: { level: 1, risk: 1, threads: 5, optimize: true }
  },
  {
    name: 'deep',
    label: '深度枚举',
    options: { level: 3, risk: 2, threads: 3, dumpAll: true, optimize: true }
  },
  {
    name: 'waf',
    label: 'WAF 绕过',
    options: {
      level: 2, risk: 1,
      tamper: ['space2comment', 'between'],
      delay: 1, threads: 1, optimize: false
    }
  },
  {
    name: 'login',
    label: '登录扫描',
    options: { level: 2, risk: 1, threads: 3, optimize: true }
  }
]

/** 任务状态 */
export type TaskStatus = 'idle' | 'running' | 'completed' | 'failed' | 'stopped'

export interface Task {
  id: string
  name: string
  url: string
  status: TaskStatus
  logs: LogEntry[]
}

export interface LogEntry {
  time: string
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR'
  message: string
  ai?: string
}
