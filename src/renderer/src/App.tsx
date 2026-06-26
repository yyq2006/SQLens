import { useEffect, useState, useCallback, useRef } from 'react'
import '@fontsource/fira-code'
import '@fontsource/fira-sans'
import './style.css'

// ====== 类型定义 ======

interface Task {
  id: string
  name: string
  url: string
  status: 'idle' | 'running' | 'completed' | 'failed' | 'stopped'
  logs: LogEntry[]
}

interface LogEntry {
  time: string
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR'
  message: string
  ai?: string
}

// ====== 常量 ======

const NAV_ITEMS_MAIN = [
  { icon: '📂', label: '目标' },
  { icon: '📂', label: '注入' },
  { icon: '📂', label: '检测' },
  { icon: '📂', label: '绕过' },
  { icon: '📂', label: '枚举' },
  { icon: '📂', label: '优化' },
  { icon: '📝', label: '自定义参数' }
]

const NAV_ITEMS_SECONDARY = [
  { icon: '🎯', label: '历史记录' },
  { icon: '📊', label: '报告' },
  { icon: '⚙️', label: '设置' }
]

// ====== 工具函数 ======

function now(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false })
}

function logColor(level: string): string {
  switch (level) {
    case 'SUCCESS': return 'text-green-400'
    case 'WARN': return 'text-yellow-400'
    case 'ERROR': return 'text-red-400'
    default: return 'text-slate-300'
  }
}

function aiBubble(message: string): string {
  return `🤖 ${message}`
}

// ====== App 组件 ======

function App(): JSX.Element {
  // ---- 状态 ----
  const [url, setUrl] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTaskIndex, setActiveTaskIndex] = useState(0)
  const [sqlmapConnected, setSqlmapConnected] = useState(false)
  const [scannerReady, setScannerReady] = useState(false)
  const [logView, setLogView] = useState<'raw' | '精简'>('精简')
  const [activeSidebar, setActiveSidebar] = useState('目标')
  const logEndRef = useRef<HTMLDivElement>(null)

  // ---- 自动滚动日志 ----
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [tasks, activeTaskIndex])

  // ---- sqlmapapi 状态监听 ----
  useEffect(() => {
    const checkStatus = async (): Promise<void> => {
      try {
        const status = await window.sqlens.getSqlmapStatus()
        setSqlmapConnected(status.connected)
      } catch {
        setSqlmapConnected(false)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 5000)

    window.sqlens.onSqlmapStatusChange((connected) => {
      setSqlmapConnected(connected)
    })

    return () => {
      clearInterval(interval)
      window.sqlens.removeSqlmapStatusChange()
    }
  }, [])

  // ---- 启动 sqlmapapi ----
  useEffect(() => {
    const init = async (): Promise<void> => {
      const result = await window.sqlens.startSqlmapApi()
      setSqlmapConnected(result.success)
      addLogToActiveTask(result.success ? 'INFO' : 'WARN',
        result.success
          ? `sqlmapapi 已连接 - ${result.message}`
          : `sqlmapapi 连接失败: ${result.message}`
      )
    }
    init()
  }, [])

  // ---- 辅助: 向当前活跃任务添加日志 ----
  const addLogToActiveTask = useCallback((level: LogEntry['level'], message: string, ai?: string) => {
    setTasks((prev) => {
      if (prev.length === 0) return prev
      const updated = [...prev]
      const current = { ...updated[activeTaskIndex] }
      current.logs = [...current.logs, { time: now(), level, message, ai }]
      updated[activeTaskIndex] = current
      return updated
    })
  }, [activeTaskIndex])

  // ---- 创建新任务 ----
  const createTask = useCallback(async (): Promise<void> => {
    if (!url.trim()) return

    const result = await window.sqlens.createTask()
    if (!result.success) {
      addLogToActiveTask('ERROR', `创建任务失败: ${result.error}`)
      return
    }

    const taskId = result.taskId
    const newTask: Task = {
      id: taskId,
      name: `任务 ${tasks.length + 1}`,
      url: url,
      status: 'idle',
      logs: [{ time: now(), level: 'INFO', message: `任务已创建 (${taskId})` }]
    }

    setTasks((prev) => [...prev, newTask])
    setActiveTaskIndex(tasks.length)
    setScannerReady(true)
  }, [url, tasks.length, addLogToActiveTask])

  // ---- 开始扫描 ----
  const startScan = useCallback(async (): Promise<void> => {
    if (tasks.length === 0) return

    const task = tasks[activeTaskIndex]
    if (!task || task.status === 'running') return

    // 设置参数
    const setResult = await window.sqlens.setOption(task.id, {
      url: task.url
    })
    if (!setResult.success) {
      addLogToActiveTask('ERROR', `设置参数失败`)
      return
    }
    addLogToActiveTask('INFO', '参数已配置')

    // 启动扫描
    const startResult = await window.sqlens.startScan(task.id)
    if (!startResult.success) {
      addLogToActiveTask('ERROR', `启动扫描失败`)
      return
    }

    // 更新状态
    setTasks((prev) => {
      const updated = [...prev]
      updated[activeTaskIndex] = { ...updated[activeTaskIndex], status: 'running' }
      return updated
    })
    addLogToActiveTask('SUCCESS', `扫描已启动`)

    // 开始轮询日志
    pollLogs(task.id)
  }, [tasks, activeTaskIndex, addLogToActiveTask])

  // ---- 停止扫描 ----
  const stopScan = useCallback(async (): Promise<void> => {
    if (tasks.length === 0) return
    const task = tasks[activeTaskIndex]
    if (!task || task.status !== 'running') return

    await window.sqlens.stopScan(task.id)
    setTasks((prev) => {
      const updated = [...prev]
      updated[activeTaskIndex] = { ...updated[activeTaskIndex], status: 'stopped' }
      return updated
    })
    addLogToActiveTask('WARN', '扫描已停止')
  }, [tasks, activeTaskIndex, addLogToActiveTask])

  // ---- 轮询日志 ----
  const pollLogs = useCallback(async (taskId: string): Promise<void> => {
    let running = true
    while (running) {
      await new Promise((r) => setTimeout(r, 2000))

      const [statusResult, logResult] = await Promise.all([
        window.sqlens.getStatus(taskId),
        window.sqlens.getLog(taskId)
      ])

      if (logResult.success && logResult.log.length > 0) {
        setTasks((prev) => {
          const idx = prev.findIndex((t) => t.id === taskId)
          if (idx === -1) return prev
          const updated = [...prev]
          const current = { ...updated[idx] }

          // 只添加新日志（去重）
          const existingMessages = new Set(current.logs.map((l) => l.message))
          for (const line of logResult.log) {
            if (!existingMessages.has(line)) {
              const level: LogEntry['level'] =
                line.includes('[SUCCESS') || line.includes('identified') ? 'SUCCESS' :
                line.includes('[WARNING') ? 'WARN' :
                line.includes('[ERROR') ? 'ERROR' : 'INFO'
              current.logs = [...current.logs, {
                time: now(),
                level,
                message: line.replace(/^\[.*?\]\s*/, '')
              }]
              existingMessages.add(line)
            }
          }
          updated[idx] = current
          return updated
        })
      }

      // 检查任务是否结束
      if (statusResult.success && (statusResult.status === 'finished' || statusResult.status === 'stopped' || statusResult.status === 'error')) {
        running = false
        setTasks((prev) => {
          const updated = [...prev]
          const idx = updated.findIndex((t) => t.id === taskId)
          if (idx !== -1) {
            const statusMap: Record<string, Task['status']> = {
              finished: 'completed',
              stopped: 'stopped',
              error: 'failed'
            }
            updated[idx] = {
              ...updated[idx],
              status: statusMap[statusResult.status] || 'completed'
            }
          }
          return updated
        })
        addLogToActiveTask(
          statusResult.status === 'finished' ? 'SUCCESS' : 'WARN',
          `扫描${statusResult.status === 'finished' ? '完成' : statusResult.status === 'stopped' ? '已停止' : '出错'}`
        )
      }
    }
  }, [addLogToActiveTask])

  // ---- 一键全自动 ----
  const autoScan = useCallback(async (): Promise<void> => {
    await createTask()
    // 等待任务创建完成
    setTimeout(() => startScan(), 500)
  }, [createTask, startScan])

  // ---- 当前活跃任务 ----
  const activeTask = tasks[activeTaskIndex]

  // ---- 渲染 ----
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden select-none"
         style={{ fontFamily: 'Fira Sans, system-ui, sans-serif' }}>
      {/* ====== 标题栏 ====== */}
      <header className="h-9 bg-slate-900 text-white flex items-center px-4 draggable shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 text-sm">🛡️</span>
          <span className="text-sm font-semibold tracking-wide" style={{ fontFamily: 'Fira Code' }}>
            SQLens
          </span>
          <span className="text-xs text-slate-600 ml-1">v1.0</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* ====== 左侧侧边栏 ====== */}
        <aside className="w-48 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <nav className="flex-1 p-2 space-y-0.5">
            {NAV_ITEMS_MAIN.map((item) => (
              <div
                key={item.label}
                onClick={() => setActiveSidebar(item.label)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer transition-colors duration-150 ${
                  activeSidebar === item.label
                    ? 'bg-blue-50 text-blue-700 border-l-[3px] border-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
          <div className="border-t border-slate-200 p-2 space-y-0.5">
            {NAV_ITEMS_SECONDARY.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer text-slate-500 hover:bg-slate-50 transition-colors duration-150"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ====== 右侧主区域 ====== */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* ---- 操作栏 ---- */}
          <div className="h-12 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-3 py-1.5">
              <span className="text-slate-400 shrink-0">🔗</span>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && autoScan()}
                placeholder="输入目标 URL，如 http://example.com/page?id=1"
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
              />
            </div>
            <button
              onClick={autoScan}
              disabled={!url.trim() || !sqlmapConnected}
              className={`px-4 py-1.5 text-sm font-medium rounded transition-colors cursor-pointer ${
                url.trim() && sqlmapConnected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              ▶ 一键全自动
            </button>
            <button
              onClick={stopScan}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded hover:bg-slate-50 transition-colors cursor-pointer"
            >
              ⏹
            </button>
            <select className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-600 bg-white cursor-pointer">
              <option>快速检测</option>
              <option>深度枚举</option>
              <option>WAF 绕过</option>
            </select>
          </div>

          {/* ---- 任务标签页 ---- */}
          <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-2 gap-0.5 shrink-0">
            {tasks.map((task, i) => (
              <div
                key={task.id}
                onClick={() => setActiveTaskIndex(i)}
                className={`flex items-center gap-1.5 px-3 h-full text-xs cursor-pointer border-r border-slate-200 transition-colors ${
                  i === activeTaskIndex
                    ? 'bg-white text-blue-600 font-medium'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  task.status === 'running' ? 'bg-green-500 animate-pulse' :
                  task.status === 'completed' ? 'bg-green-500' :
                  task.status === 'failed' ? 'bg-red-500' :
                  task.status === 'stopped' ? 'bg-yellow-500' :
                  'bg-slate-300'
                }`} />
                {task.name}
              </div>
            ))}
            <div className="px-2 text-slate-400 text-xs cursor-pointer hover:text-slate-600">+</div>
          </div>

          {/* ---- 中间内容 ---- */}
          <div className="flex-1 flex overflow-hidden">
            {/* 参数面板 */}
            <div className="w-1/2 border-r border-slate-200 overflow-y-auto p-3 space-y-2 bg-white">
              <div className="bg-slate-50 rounded border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-100 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-700" style={{ fontFamily: 'Fira Code' }}>
                    📂 目标与请求
                  </span>
                  <span className="text-slate-400 text-xs">▾</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-16 shrink-0">Method</span>
                    <select className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white cursor-pointer">
                      <option>GET</option>
                      <option>POST</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-16 shrink-0">Cookie</span>
                    <input className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white outline-none placeholder-slate-400" placeholder="可选" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-16 shrink-0">延时</span>
                    <input type="range" min="0" max="10" className="flex-1" />
                  </div>
                </div>
              </div>
              {['注入参数', '检测与绕过', '枚举选项', '优化'].map((group) => (
                <div key={group} className="bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-center justify-between px-3 py-2 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-500">📂 {group}</span>
                    <span className="text-slate-400 text-xs">▸</span>
                  </div>
                </div>
              ))}
              <div className="mt-3">
                <div className="text-xs font-semibold text-slate-500 mb-1">📝 自定义参数</div>
                <input className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none placeholder-slate-400 font-mono"
                       placeholder="--tamper=space2comment --level=3" />
              </div>
            </div>

            {/* 日志/结果区 */}
            <div className="w-1/2 flex flex-col overflow-hidden">
              {/* 日志 */}
              <div className="flex-1 overflow-y-auto bg-slate-900 p-3 font-mono text-xs space-y-0.5">
                <div className="flex items-center justify-between mb-2 sticky top-0 bg-slate-900 pb-1">
                  <span className="text-slate-400 text-xs font-semibold">日志</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setLogView('raw')}
                      className={`text-xs cursor-pointer px-1.5 py-0.5 rounded ${
                        logView === 'raw' ? 'text-cyan-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      原始
                    </button>
                    <button
                      onClick={() => setLogView('精简')}
                      className={`text-xs cursor-pointer px-1.5 py-0.5 rounded ${
                        logView === '精简' ? 'text-cyan-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      精简
                    </button>
                  </div>
                </div>

                {activeTask ? (
                  <>
                    {activeTask.logs.map((log, i) => (
                      <div key={i}>
                        <div className={logColor(log.level)}>
                          <span className="text-slate-600">[{log.time}] </span>
                          <span>[{log.level}] </span>
                          {log.message}
                        </div>
                        {log.ai && (
                          <div className="mt-0.5 mb-1 ml-2 text-cyan-300 bg-cyan-950/50 rounded px-2 py-1 border-l-2 border-cyan-500">
                            {log.ai}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="text-slate-600">
                      {activeTask.status === 'running' ? '⏳ 扫描中...' :
                       activeTask.status === 'completed' ? '✅ 扫描完成' :
                       activeTask.status === 'failed' ? '❌ 扫描失败' :
                       activeTask.status === 'stopped' ? '⏹ 已停止' :
                       '等待开始...'}
                    </div>
                  </>
                ) : (
                  <div className="text-slate-600">输入 URL 并点击扫描开始</div>
                )}
                <div ref={logEndRef} />
              </div>

              {/* 结果 */}
              <div className="h-44 border-t border-slate-200 bg-white overflow-y-auto p-3">
                <span className="text-xs font-semibold text-slate-500">📊 结果</span>
                <div className="mt-2 text-xs text-slate-400">
                  {activeTask
                    ? (activeTask.status === 'completed' ? '扫描完成，结果将在这里展示' : '等待扫描完成...')
                    : '等待扫描完成...'}
                </div>
              </div>
            </div>
          </div>

          {/* ---- AI 聊天框 ---- */}
          <div className="h-36 border-t border-slate-200 bg-white flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-1 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500">💬 对话</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
              <div className="flex gap-2">
                <span className="shrink-0">🙋</span>
                <div className="text-slate-600 bg-slate-50 rounded px-2 py-1">扫描这个网站有没有注入</div>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0">🤖</span>
                <div className="text-blue-700 bg-blue-50 rounded px-2 py-1 border-l-2 border-blue-500">
                  {sqlmapConnected
                    ? '已就绪！输入 URL 或粘贴数据包，点击「一键全自动」开始扫描'
                    : '正在连接 sqlmapapi 服务...'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 border-t border-slate-100">
              <input
                type="text"
                placeholder="输入指令..."
                className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 outline-none placeholder-slate-400"
              />
              <button className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors cursor-pointer">
                发送
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ====== 底部状态栏 ====== */}
      <footer className="h-7 bg-slate-900 text-slate-400 flex items-center px-4 gap-4 text-xs shrink-0">
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${sqlmapConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          sqlmapapi {sqlmapConnected ? '已连接 (:8775)' : '未连接'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          AI 在线
        </span>
        <span className="ml-auto text-slate-600">
          {tasks.length > 0
            ? tasks.map((t, i) => (
                <span key={t.id} className="mr-2">
                  [{i + 1}
                  {t.status === 'running' ? '▶' :
                   t.status === 'completed' ? '✅' :
                   t.status === 'failed' ? '❌' :
                   t.status === 'stopped' ? '⏸' : '○'}]
                </span>
              ))
            : '无活跃任务'}
        </span>
      </footer>
    </div>
  )
}

export default App
