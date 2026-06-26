import '@fontsource/fira-code'
import '@fontsource/fira-sans'
import './style.css'

function App(): JSX.Element {
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      {/* 标题栏 */}
      <header className="h-9 bg-slate-900 text-white flex items-center px-4 select-none draggable shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 text-sm">🛡️</span>
          <span className="text-sm font-semibold tracking-wide" style={{ fontFamily: 'Fira Code' }}>
            SQLens
          </span>
          <span className="text-xs text-slate-500 ml-2">v1.0</span>
        </div>
      </header>

      {/* 主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 */}
        <aside className="w-48 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <nav className="flex-1 p-2 space-y-0.5">
            {[
              { icon: '📂', label: '目标', active: true },
              { icon: '📂', label: '注入' },
              { icon: '📂', label: '检测' },
              { icon: '📂', label: '绕过' },
              { icon: '📂', label: '枚举' },
              { icon: '📂', label: '优化' },
              { icon: '📝', label: '自定义参数' }
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer transition-colors duration-150 ${
                  item.active
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
            {[
              { icon: '🎯', label: '历史记录' },
              { icon: '📊', label: '报告' },
              { icon: '⚙️', label: '设置' }
            ].map((item) => (
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

        {/* 右侧主区域 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 操作栏 */}
          <div className="h-12 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-3 py-1.5">
              <span className="text-slate-400">🔗</span>
              <input
                type="text"
                placeholder="输入目标 URL，如 http://example.com/page?id=1"
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
              />
            </div>
            <button className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors cursor-pointer">
              ▶ 一键全自动
            </button>
            <button className="px-3 py-1.5 border border-slate-200 text-slate-600 text-sm rounded hover:bg-slate-50 transition-colors cursor-pointer">
              ⏹
            </button>
            <select className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-600 bg-white cursor-pointer">
              <option>快速检测</option>
              <option>深度枚举</option>
              <option>WAF 绕过</option>
              <option>登录扫描</option>
            </select>
          </div>

          {/* 任务标签页 */}
          <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-2 gap-0.5 shrink-0">
            {['任务 1', '任务 2'].map((tab, i) => (
              <div
                key={tab}
                className={`flex items-center gap-1.5 px-3 h-full text-xs cursor-pointer border-r border-slate-200 transition-colors ${
                  i === 0
                    ? 'bg-white text-blue-600 font-medium'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-green-500' : 'bg-slate-300'}`} />
                {tab}
              </div>
            ))}
            <div className="px-2 text-slate-400 text-xs cursor-pointer hover:text-slate-600">+</div>
          </div>

          {/* 中间内容 */}
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
                </div>
              </div>
              <div className="bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center justify-between px-3 py-2 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-500">📂 注入参数</span>
                  <span className="text-slate-400 text-xs">▸</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center justify-between px-3 py-2 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-500">📂 检测与绕过</span>
                  <span className="text-slate-400 text-xs">▸</span>
                </div>
              </div>
            </div>

            {/* 日志/结果区 */}
            <div className="w-1/2 flex flex-col overflow-hidden">
              {/* 日志 */}
              <div className="flex-1 overflow-y-auto p-3 bg-slate-900 font-mono text-xs space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-semibold">日志</span>
                  <div className="flex gap-2">
                    <button className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer px-1">原始</button>
                    <button className="text-xs text-cyan-400 cursor-pointer px-1 font-medium">精简</button>
                    <button className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer px-1">🧹</button>
                  </div>
                </div>
                <div className="text-green-400">[INFO] SQLens 已就绪</div>
                <div className="text-slate-500">[INFO] 等待扫描任务...</div>
              </div>

              {/* 结果 */}
              <div className="h-48 border-t border-slate-200 bg-white overflow-y-auto p-3">
                <span className="text-xs font-semibold text-slate-500">结果</span>
                <div className="mt-2 text-xs text-slate-400">等待扫描完成...</div>
              </div>
            </div>
          </div>

          {/* AI 聊天框 */}
          <div className="h-44 border-t border-slate-200 bg-white flex flex-col">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500">💬 对话</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex gap-2">
                <span className="text-xs shrink-0">🙋</span>
                <div className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1">
                  扫描这个网站有没有注入
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-xs shrink-0">🤖</span>
                <div className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 border-l-2 border-blue-500">
                  已分析完成，发现 id 参数存在 SQL 注入漏洞...
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100">
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

      {/* 底部状态栏 */}
      <footer className="h-7 bg-slate-900 text-slate-400 flex items-center px-4 gap-4 text-xs shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          sqlmapapi 已连接 (:8775)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          AI 在线
        </span>
        <span className="ml-auto text-slate-600">任务: [1▶] [2⏸]</span>
      </footer>
    </div>
  )
}

export default App
