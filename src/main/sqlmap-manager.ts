import { ChildProcess, spawn } from 'child_process'
import { join } from 'path'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'

interface SqlmapApiConfig {
  host: string
  port: number
  autoStart: boolean
  pythonPath: string
  sqlmapPath: string
}

const defaultConfig: SqlmapApiConfig = {
  host: '127.0.0.1',
  port: 8775,
  autoStart: true,
  pythonPath: 'python',
  sqlmapPath: ''
}

export class SqlmapApiManager {
  private config: SqlmapApiConfig
  private process: ChildProcess | null = null
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null
  private onStatusChange: ((connected: boolean) => void) | null = null

  constructor(config: Partial<SqlmapApiConfig> = {}) {
    this.config = { ...defaultConfig, ...config }

    // 内置 sqlmap 路径（优先 pip 包，其次源码）
    if (!this.config.sqlmapPath) {
      const resourcePath = is.dev
        ? join(app.getAppPath(), 'resources', 'sqlmap_pkg', 'sqlmap')
        : join(process.resourcesPath, 'sqlmap_pkg', 'sqlmap')
      this.config.sqlmapPath = resourcePath
    }
  }

  get baseUrl(): string {
    return `http://${this.config.host}:${this.config.port}`
  }

  get connected(): boolean {
    return this.process !== null && this.process.exitCode === null
  }

  /** 注册状态变化回调 */
  onStatusChangeCallback(cb: (connected: boolean) => void): void {
    this.onStatusChange = cb
  }

  /** 尝试启动 sqlmapapi 进程 */
  async start(): Promise<{ success: boolean; message: string }> {
    // 先检查远端是否已有运行中的 sqlmapapi
    const remoteOk = await this.ping()
    if (remoteOk) {
      this.notifyStatus(true)
      return { success: true, message: `已连接至 ${this.baseUrl}` }
    }

    if (!this.config.autoStart) {
      return {
        success: false,
        message: `未检测到 sqlmapapi 服务 (${this.baseUrl})，且自动启动已关闭`
      }
    }

    // 尝试自动启动
    try {
      const sqlmapApiScript = join(this.config.sqlmapPath, 'sqlmapapi.py')

      // 检查 sqlmap 是否可用
      const fs = require('fs')
      if (!fs.existsSync(sqlmapApiScript)) {
        return { success: false, message: `未找到 sqlmapapi.py (已查找: ${sqlmapApiScript})` }
      }

      this.process = spawn(this.config.pythonPath, [sqlmapApiScript, '-s', '-H', this.config.host, '-p', String(this.config.port)], {
        cwd: this.config.sqlmapPath,
        stdio: ['pipe', 'pipe', 'pipe']
      })

      this.process.stdout?.on('data', (data: Buffer) => {
        const msg = data.toString()
        console.log(`[sqlmapapi] ${msg}`)
      })

      this.process.stderr?.on('data', (data: Buffer) => {
        console.error(`[sqlmapapi] ${data.toString()}`)
      })

      this.process.on('exit', (code) => {
        console.log(`[sqlmapapi] 进程退出 (code: ${code})`)
        this.process = null
        this.notifyStatus(false)

        // 3 秒后自动重连
        setTimeout(() => this.start(), 3000)
      })

      // 等待服务启动
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 500))
        const ok = await this.ping()
        if (ok) {
          this.notifyStatus(true)
          return { success: true, message: `sqlmapapi 已启动 (${this.baseUrl})` }
        }
      }

      return { success: false, message: 'sqlmapapi 启动超时' }
    } catch (err) {
      const error = err as Error
      return { success: false, message: `启动 sqlmapapi 失败: ${error.message}` }
    }
  }

  /** 停止 sqlmapapi 进程 */
  async stop(): Promise<{ success: boolean }> {
    if (this.process) {
      this.process.kill('SIGTERM')
      this.process = null
    }
    this.notifyStatus(false)
    return { success: true }
  }

  /** Ping 检测服务是否存活 */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/task/new`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000)
      })
      if (!response.ok) return false
      return true
    } catch {
      return false
    }
  }

  /** 开始健康检查轮询 */
  startHealthCheck(intervalMs = 10000): void {
    this.stopHealthCheck()
    this.healthCheckInterval = setInterval(async () => {
      const ok = await this.ping()
      this.notifyStatus(ok)
      if (!ok && this.config.autoStart && !this.process) {
        console.log('[sqlmapapi] 服务断开，尝试重新连接...')
        this.start()
      }
    }, intervalMs)
  }

  /** 停止健康检查 */
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  private notifyStatus(connected: boolean): void {
    this.onStatusChange?.(connected)
  }

  /** 清理 */
  dispose(): void {
    this.stopHealthCheck()
    this.stop()
  }
}
