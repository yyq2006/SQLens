import { useEffect, useState, useCallback } from 'react'
import '@fontsource/fira-code'
import '@fontsource/fira-sans'
import {
  Shield,
  Sun,
  Moon,
  Link,
  Play,
  Square,
  Upload,
  List,
  ChevronDown,
  Sparkles
} from 'lucide-react'
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
import { GlassButton, GlassDangerButton } from './components/GlassComponents'
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
  return (
      <div className="h-screen w-screen flex flex-col overflow-hidden select-none bg-ambient"
           style={{ fontFamily: 'Fira Sans, system-ui, sans-serif' }}>
      {/* 标题栏 */}
      <header className="h-10 header-gradient text-white flex items-center px-4 draggable shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-wide" style={{ fontFamily: 'Fira Code' }}>
            SQLens
          </span>
          <span className="text-[10px] text-slate-500 font-mono">v1.0</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-800/50 rounded-md px-2 py-1">
            <kbd className="text-slate-500 bg-slate-900 px-1 rounded text-[9px] font-mono">⌘</kbd>
            <span>+</span>
            <kbd className="text-slate-500 bg-slate-900 px-1 rounded text-[9px] font-mono">⏎</kbd>
            <span className="text-slate-500 ml-0.5">启动扫描</span>
          </div>
          <button
            onClick={toggleTheme}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title={isDark ? '切换到亮色主题 (Ctrl+Shift+T)' : '切换到暗色主题 (Ctrl+Shift+T)'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 - 玻璃态 */}
        <Sidebar active={activeSidebar} onChange={handleSidebarChange} />

        {/* 主区域 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 操作栏 - 玻璃液态 */}
          <div className="h-14 glass-strong dark:glass-dark flex items-center px-4 gap-2.5 shrink-0 rounded-none border-x-0 border-t-0">
            <div className="flex-1 flex items-center gap-2 input-glass px-3 py-1.5">
              <Link className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && autoScan()}
                placeholder="输入目标 URL，如 http://example.com/page?id=1"
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
            <GlassButton
              onClick={autoScan}
              disabled={!url.trim() || !sqlmapConnected}
              className="flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>一键全自动</span>
            </GlassButton>
            <GlassDangerButton
              onClick={() => activeTask && stopScan(activeTask.id)}
              disabled={!activeTask || activeTask.status !== 'running'}
              className="flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5" />
              <span>停止</span>
            </GlassDangerButton>
            <div className="flex items-center gap-1 border-l border-white/20 dark:border-white/5 pl-2.5">
              <button onClick={() => setShowEditor(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 text-sm rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 transition-all cursor-pointer"
                title="导入请求">
                <Upload className="w-4 h-4" />
                <span className="text-xs hidden lg:inline">导入</span>
              </button>
              <button onClick={() => setShowBatchScanner(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 text-sm rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 transition-all cursor-pointer"
                title="批量扫描">
                <List className="w-4 h-4" />
                <span className="text-xs hidden lg:inline">批量</span>
              </button>
            </div>
            <div className="relative">
              <select onChange={(e) => e.target.value && applyTemplate(e.target.value)} defaultValue=""
                className="appearance-none text-sm glass rounded-lg px-3 py-2 pr-8 text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-white/50 dark:hover:bg-white/5 transition-all outline-none">
                <option value="" disabled>选择模板</option>
                {SCAN_TEMPLATES.map((t) => (<option key={t.name} value={t.name}>{t.label}</option>))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* 任务标签页 - 玻璃 */}
          <div className="h-8 tab-glass flex items-center px-2 gap-0.5 shrink-0">
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
