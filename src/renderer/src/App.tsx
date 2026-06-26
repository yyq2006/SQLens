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
import { RequestEditor } from './components/RequestEditor'
import { AiSettings } from './components/AiSettings'
import { BatchScanner } from './components/BatchScanner'
import { ChatPanel } from './components/ChatPanel'
import { DatabaseBrowser } from './components/DatabaseBrowser'
import { ReportViewer } from './components/ReportViewer'
import { HistoryPanel } from './components/HistoryPanel'
import { useScanManager } from './hooks/useScanManager'
import { useTheme } from './hooks/useTheme'

function App(): JSX.Element {
  // ---- 状态 ----
  const [url, setUrl] = useState('')
  const [options, setOptions] = useState<ScanOptions>(DEFAULT_OPTIONS)
  const [sqlmapConnected, setSqlmapConnected] = useState(false)
  const [activeSidebar, setActiveSidebar] = useState('目标')
  const [logView, setLogView] = useState<'raw' | '精简'>('精简')
  const [showEditor, setShowEditor] = useState(false)
  const [showAiSettings, setShowAiSettings] = useState(false)
  const [showBatchScanner, setShowBatchScanner] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(false)
  const { isDark, toggle: toggleTheme } = useTheme()

  const {
    tasks, activeTask, activeIndex,
    setActiveIndex, createTask, startScan, stopScan
  } = useScanManager(aiAvailable)

  // ---- sqlmapapi 连接 & AI 检查 ----
  useEffect(() => {
    const init = async (): Promise<void> => {
      const result = await window.sqlens.startSqlmapApi()
      setSqlmapConnected(result.success)
      const aiCheck = await window.sqlens.checkAi()
      setAiAvailable(aiCheck.available)
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

  // ---- 键盘快捷键 ----
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') { e.preventDefault(); toggleTheme() }
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); autoScan() }
      if (e.key === 'Escape') { setShowEditor(false); setShowAiSettings(false); setShowBatchScanner(false); setShowHistory(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [autoScan, toggleTheme])

  // ---- 一键全自动（带 AI 分析） ----
  const autoScan = useCallback(async () => {
    if (!url.trim() || !sqlmapConnected) return

    // AI 分析请求
    if (aiAvailable) {
      const aiResult = await window.sqlens.analyzeRequest(url)
      if (aiResult.success && aiResult.data) {
        const { data } = aiResult
        setOptions((prev) => ({
          ...prev,
          level: data.recommendLevel,
          risk: data.recommendRisk,
          tech: data.recommendTech.split('').filter((t): t is 'B' | 'E' | 'U' | 'S' | 'T' =>
            ['B', 'E', 'U', 'S', 'T'].includes(t)),
          tamper: data.hasWaf ? data.recommendTamper : prev.tamper
        }))
      }
    }

    // 创建并启动任务
    const taskId = await createTask(url)
    if (!taskId) return

    setTimeout(() => startScan(taskId, { ...options, url }), 300)
  }, [url, options, sqlmapConnected, aiAvailable, createTask, startScan])

  // ---- 模板切换 ----
  const applyTemplate = useCallback((name: string) => {
    const tmpl = SCAN_TEMPLATES.find((t) => t.name === name)
    if (tmpl) {
      setOptions((prev) => ({ ...prev, ...tmpl.options }))
    }
  }, [])

  // ---- 根据侧边栏切换 ----
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

  const handleSidebarChange = (label: string) => {
    setActiveSidebar(label)
    if (label === '设置') setShowAiSettings(true)
    if (label === '历史记录') setShowHistory(true)
  }
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
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="text-slate-500 hover:text-slate-300 text-xs px-1.5 py-0.5 rounded cursor-pointer"
            title={isDark ? '切换到亮色主题 (Ctrl+Shift+T)' : '切换到暗色主题 (Ctrl+Shift+T)'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <Sidebar active={activeSidebar} onChange={handleSidebarChange} />

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
            <button
              onClick={() => setShowEditor(true)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              📥 导入
            </button>
            <button
              onClick={() => setShowBatchScanner(true)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              📋 批量
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
              <div className="h-52 border-t border-slate-200 bg-white overflow-hidden">
                {activeSidebar === '报告' || activeSidebar === '报告' ? (
                  <ReportViewer
                    task={activeTask}
                    onGenerateReport={(taskId) => console.log('生成报告:', taskId)}
                  />
                ) : (
                  <DatabaseBrowser
                    task={activeTask}
                    onEnum={(taskId, opts) => {
                      // 重新扫描枚举数据
                      startScan(taskId, { ...options, url: activeTask?.url || '', ...opts } as any)
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* AI 聊天框 */}
          <ChatPanel
            aiAvailable={aiAvailable}
            onAction={(action, params) => {
              switch (action) {
                case 'scan':
                  if (params.url) setUrl(params.url)
                  setTimeout(() => autoScan(), 500)
                  break
                case 'stop':
                  if (activeTask) stopScan(activeTask.id)
                  break
                case 'template':
                  if (params.name) {
                    const tmpl = SCAN_TEMPLATES.find((t) => t.name === params.name)
                    if (tmpl) setOptions((prev) => ({ ...prev, ...tmpl.options }))
                  }
                  break
                case 'report':
                  break
              }
            }}
          />
        </main>
      </div>

      {/* 状态栏 */}
      <StatusBar sqlmapConnected={sqlmapConnected} aiOnline={aiAvailable} tasks={tasks} />

      {/* 请求编辑器弹窗 */}
      {showEditor && (
        <RequestEditor
          onApply={(parsed) => {
            if (parsed.url) setUrl(parsed.url)
            if (parsed.data || parsed.cookie || parsed.userAgent || parsed.headers) {
              setOptions((prev) => ({ ...prev, ...parsed }))
            }
            setShowEditor(false)
          }}
          onClose={() => setShowEditor(false)}
        />
      )}

      {/* AI 设置弹窗 */}
      {showAiSettings && (
        <AiSettings
          onClose={() => setShowAiSettings(false)}
          onSave={async () => {
            const check = await window.sqlens.checkAi()
            setAiAvailable(check.available)
            setShowAiSettings(false)
          }}
        />
      )}

      {/* 批量扫描弹窗 */}
      {showBatchScanner && (
        <BatchScanner
          onStartBatch={async (urls) => {
            for (let i = 0; i < urls.length; i++) {
              const taskId = await createTask(urls[i])
              if (taskId) {
                setTimeout(() => startScan(taskId, { ...options, url: urls[i] }), i * 1000)
              }
            }
          }}
          onClose={() => setShowBatchScanner(false)}
        />
      )}

      {/* 历史记录弹窗 */}
      {showHistory && (
        <HistoryPanel
          onSelect={(url) => setUrl(url)}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}

export default App
