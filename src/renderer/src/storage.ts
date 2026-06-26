/** 简单持久化存储（基于 localStorage，后续可替换为 SQLite） */

const PREFIX = 'sqlens_'

export interface HistoryRecord {
  id: string
  url: string
  timestamp: string
  duration: string
  status: string
  findingsCount: number
  config: string
}

export const storage = {
  /** 保存扫描历史 */
  saveHistory(task: { url: string; status: string; logs: unknown[] }): void {
    const records = this.getHistory()
    const record: HistoryRecord = {
      id: Date.now().toString(36),
      url: task.url,
      timestamp: new Date().toLocaleString('zh-CN'),
      duration: '--',
      status: task.status,
      findingsCount: task.logs.filter((l: any) => l.level === 'SUCCESS').length,
      config: ''
    }
    records.unshift(record)
    // 保留最近 50 条
    localStorage.setItem(PREFIX + 'history', JSON.stringify(records.slice(0, 50)))
  },

  /** 获取扫描历史 */
  getHistory(): HistoryRecord[] {
    try {
      const raw = localStorage.getItem(PREFIX + 'history')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  },

  /** 清空历史 */
  clearHistory(): void {
    localStorage.removeItem(PREFIX + 'history')
  },

  /** 保存设置 */
  saveSettings(key: string, value: string): void {
    localStorage.setItem(PREFIX + 'setting_' + key, value)
  },

  /** 读取设置 */
  getSettings(key: string, defaultValue = ''): string {
    return localStorage.getItem(PREFIX + 'setting_' + key) || defaultValue
  }
}
