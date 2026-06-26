import { useEffect, useState, useCallback } from 'react'
import '@fontsource/fira-code'
import '@fontsource/fira-sans'
import './style.css'
import { type ScanOptions, DEFAULT_OPTIONS, SCAN_TEMPLATES } from './types'
import { Sidebar } from './components/Sidebar'
import { RequestParams } from './components/RequestParams'
import { InjectionParams } from './components/InjectionParams'
import { DetectionParams } from './components/DetectionParams'
import { EnumParams } from './components/EnumParams'
import { OptimizeParams } from './components/OptimizeParams'
import { CustomParams } from './components/CustomParams'
import { LogViewer } from './components/LogViewer'
import { StatusBar } from './components/StatusBar'
import { useScanManager } from './hooks/useScanManager'

function App(): JSX.Element {
  // ---- 状态 ----
  const [url, setUrl] = useState('')
  const [options, setOptions] = useState<ScanOptions>(DEFAULT_OPTIONS)
  const [sqlmapConnected, setSqlmapConnected] = useState(false)
  const [aiOnline] = useState(true)
  const [activeSidebar, setActiveSidebar] = useState('目标')
  const [logView, setLogView] = useState<'raw' | '精简'>('精简')
  const [aiMessage, setAiMessage] = useState('已就绪！输入 URL 或粘贴数据包，点击「一键全自动」开始扫描')
  const [aiInput, setAiInput] = useState('')

  const {
    tasks, activeTask, activeIndex,
    setActiveIndex, createTask, startScan, stopScan
  } = useScanManager()

  // ---- sqlmapapi 连接 ----
  useEffect(() => {
    const init = async (): Promise<void> => {
      const result = await window.sqlens.startSqlmapApi()
      setSqlmapConnected(result.success)
    }
    init()

    const interval = setInterval(async () => {
      const status = await window.sqlens.getSqlmapStatus()
      setSqlmapConnected(status.connected)
    }, 5000)

    window.sqlens.onSqlmapStatusChange((connected) => {
      setSqlmapConnected(connected)
    })

    return () => {
      clearInterval(interval)
      window.sqlens.removeSqlmapStatusChange()
    }
  }, [])

  // ---- 一键全自动 ----
  const autoScan = useCallback(async () => {
    if (!url.trim() || !sqlmapConnected) return

    const taskId = await createTask(url)
    if (!taskId) {
      setAiMessage('❌ 创建任务失败，请检查 sqlmapapi 是否正常运行')
      return
    }

    // 应用当前配置，等一会让任务创建好
    setTimeout(() => startScan(taskId, { ...options, url }), 300)
    setAiMessage(`✅ 已启动扫描: ${url}`)
  }, [url, options, sqlmapConnected, createTask, startScan])

  // ---- 模板切换 ----
  const applyTemplate = useCallback((name: string) => {
    const tmpl = SCAN_TEMPLATES.find((t) => t.name === name)
    if (tmpl) {
      setOptions((prev) => ({ ...prev, ...tmpl.options }))
      setAiMessage(`已应用模板: ${tmpl.label}`)
    }
  }, [])

  // ---- AI 对话发送 ----
  const sendAiMessage = useCallback(() => {
    if (!aiInput.trim()) return
    const msg = aiInput.trim()
    setAiInput('')

    if (msg.includes('扫') || msg.includes('scan')) {
      // 尝试从消息中提取 URL
      const urlMatch = msg.match(/https?:\/\/[^\s]+/)
      if (urlMatch) {
        setUrl(urlMatch[0])
        setTimeout(() => autoScan(), 100)
      } else if (url) {
        autoScan()
      }
      setAiMessage('🔍 正在扫描...')
    } else if (msg.includes('停')) {
      if (activeTask) stopScan(activeTask.id)
      setAiMessage('⏹ 已停止扫描')
    } else if (msg.includes('模板')) {
      setAiMessage('可用模板: 快速检测 / 深度枚举 / WAF绕过 / 登录扫描')
    } else {
      setAiMessage(`🤔 我理解您的指令了，但尚未实现该功能的自动解析。请尝试: "扫描这个网站"、"停止"、"应用模板"`)
    }
  }, [aiInput, url, autoScan, activeTask, stopScan])

  // ---- 根据侧边栏切换滚动到对应参数区 ----
  const sidebarToParam = (label: string): string => {
    const map: Record<string, string> = {
      '目标': '目标与请求',
      '注入': '注入参数',
      '检测': '检测与绕过',
      '绕过': '检测与绕过',
      '枚举': '枚举选项',
      '优化': '优化',
      '自定义参数': '自定义参数'
    }
    return map[label] || '目标与请求'
  }

  // ---- 渲染 ----
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden select-none"
         style={{ fontFamily: 'Fira Sans, system-ui, sans-serif' }}>
      {/* 标题栏 */}
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
        {/* 侧边栏 */}
        <Sidebar active={activeSidebar} onChange={setActiveSidebar} />

        {/* 主区域 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 操作栏 */}
          <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
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
              onClick={() => activeTask && stopScan(activeTask.id)}
              disabled={!activeTask || activeTask.status !== 'running'}
              className={`px-3 py-1.5 text-sm rounded transition-colors cursor-pointer ${
                activeTask?.status === 'running'
                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                  : 'border border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              ⏹ 停止
            </button>
            <select
              onChange={(e) => e.target.value && applyTemplate(e.target.value)}
              defaultValue=""
              className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-600 bg-white cursor-pointer"
            >
              <option value="" disabled>选择模板</option>
              {SCAN_TEMPLATES.map((t) => (
                <option key={t.name} value={t.name}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* 任务标签页 */}
          <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-2 gap-0.5 shrink-0">
            {tasks.map((task, i) => (
              <div
                key={task.id}
                onClick={() => setActiveIndex(i)}
                className={`flex items-center gap-1.5 px-3 h-full text-xs cursor-pointer border-r border-slate-200 transition-colors ${
                  i === activeIndex
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

          {/* 中间内容 */}
          <div className="flex-1 flex overflow-hidden">
            {/* 参数面板 */}
            <div className="w-1/2 border-r border-slate-200 overflow-y-auto p-3 space-y-2 bg-white">
              <RequestParams options={options} onChange={(u) => setOptions((p) => ({ ...p, ...u }))} />
              <InjectionParams options={options} onChange={(u) => setOptions((p) => ({ ...p, ...u }))} />
              <DetectionParams options={options} onChange={(u) => setOptions((p) => ({ ...p, ...u }))} />
              <EnumParams options={options} onChange={(u) => setOptions((p) => ({ ...p, ...u }))} />
              <OptimizeParams options={options} onChange={(u) => setOptions((p) => ({ ...p, ...u }))} />
              <CustomParams options={options} onChange={(u) => setOptions((p) => ({ ...p, ...u }))} />
            </div>

            {/* 日志/结果区 */}
            <div className="w-1/2 flex flex-col overflow-hidden">
              <LogViewer
                logs={activeTask?.logs || []}
                view={logView}
                onViewChange={setLogView}
                status={activeTask?.status}
              />

              {/* 结果 */}
              <div className="h-44 border-t border-slate-200 bg-white overflow-y-auto p-3">
                <span className="text-xs font-semibold text-slate-500">📊 结果</span>
                <div className="mt-2 text-xs text-slate-400">
                  {activeTask
                    ? (activeTask.status === 'completed'
                      ? '扫描完成，结果功能将在后续版本中实现'
                      : '等待扫描完成...')
                    : '暂无扫描结果'}
                </div>
              </div>
            </div>
          </div>

          {/* AI 聊天框 */}
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
                <div className={`rounded px-2 py-1 border-l-2 ${sqlmapConnected ? 'text-blue-700 bg-blue-50 border-blue-500' : 'text-orange-700 bg-orange-50 border-orange-500'}`}>
                  {sqlmapConnected ? aiMessage : '正在连接 sqlmapapi 服务...'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 border-t border-slate-100">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                placeholder="输入指令，如: 扫描这个网站"
                className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 outline-none placeholder-slate-400"
              />
              <button
                onClick={sendAiMessage}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors cursor-pointer"
              >
                发送
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* 状态栏 */}
      <StatusBar sqlmapConnected={sqlmapConnected} aiOnline={aiOnline} tasks={tasks} />
    </div>
  )
}

export default App
