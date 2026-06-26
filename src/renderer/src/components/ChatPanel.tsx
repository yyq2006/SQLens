import { useState, useRef, useEffect, useCallback } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface Props {
  aiAvailable: boolean
  onAction: (action: string, params: Record<string, string>) => void
}

function formatTime(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false })
}

export function ChatPanel({ aiAvailable, onAction }: Props): JSX.Element {
  const greeting = aiAvailable
    ? '你好！我是 **SQLens AI 助手**。你可以：\n\n- 粘贴 URL 让我帮你分析\n- 说「扫描这个网站」启动扫描\n- 说「停止」中断当前任务\n- 说「生成报告」总结结果'
    : 'AI 未配置，请先在设置中填入 API Key 后再使用聊天功能。'

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: greeting, timestamp: formatTime() }
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  // 自动滚动
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamContent])

  // 监听流式事件
  useEffect(() => {
    window.sqlens.onChatToken((token) => {
      setStreamContent((prev) => prev + token)
    })
    window.sqlens.onChatDone((full) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: full, timestamp: formatTime() }])
      setStreamContent('')
      setStreaming(false)

      // 解析操作标记
      const actionMatch = full.match(/\[ACTION:(\w+)(.*?)\]/)
      if (actionMatch) {
        const action = actionMatch[1]
        const paramsStr = actionMatch[2].trim()
        const params: Record<string, string> = {}
        if (paramsStr) {
          paramsStr.split(/\s+/).forEach((p) => {
            const [k, v] = p.split('=')
            if (k && v) params[k] = v
          })
        }
        onAction(action, params)
      }
    })
    window.sqlens.onChatError((err) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: `❌ ${err}`, timestamp: formatTime() }])
      setStreamContent('')
      setStreaming(false)
    })
    return () => {
      window.sqlens.removeChatListeners()
    }
  }, [onAction])

  const send = useCallback(async () => {
    if (!input.trim() || streaming || !aiAvailable) return

    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg, timestamp: formatTime() }])
    setStreaming(true)
    setStreamContent('')

    // 构建消息历史
    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    history.push({ role: 'user', content: userMsg })

    await window.sqlens.chat(history)
  }, [input, streaming, aiAvailable, messages])

  // 简单的 markdown 渲染
  const renderMessage = (content: string): string => {
    return content
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-slate-800 text-green-300 p-2 rounded text-[11px] overflow-x-auto my-1 font-mono"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-red-500 px-1 rounded text-[11px] font-mono">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="h-44 border-t border-slate-200 bg-white flex flex-col shrink-0">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 shrink-0">
        <span className="text-xs font-semibold text-slate-500">💬 AI 助手</span>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${aiAvailable ? 'bg-green-500' : 'bg-slate-400'}`} />
          <span className="text-[10px] text-slate-400">{aiAvailable ? '在线' : '离线'}</span>
        </div>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-1.5 ${msg.role === 'user' ? '' : ''}`}>
            <span className="shrink-0 mt-0.5">{msg.role === 'user' ? '🙋' : '🤖'}</span>
            <div className={`rounded px-2 py-1 ${
              msg.role === 'user'
                ? 'bg-slate-50 text-slate-600'
                : 'bg-blue-50 text-blue-800 border-l-2 border-blue-400'
            }`}>
              <span dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }} />
              <div className="text-[10px] text-slate-400 mt-0.5">{msg.timestamp}</div>
            </div>
          </div>
        ))}

        {/* 流式内容 */}
        {streaming && streamContent && (
          <div className="flex gap-1.5">
            <span className="shrink-0 mt-0.5">🤖</span>
            <div className="bg-blue-50 text-blue-800 rounded px-2 py-1 border-l-2 border-blue-400">
              <span dangerouslySetInnerHTML={{ __html: renderMessage(streamContent) }} />
              <span className="animate-pulse ml-0.5">▍</span>
            </div>
          </div>
        )}

        {streaming && !streamContent && (
          <div className="flex gap-1.5">
            <span className="shrink-0">🤖</span>
            <div className="text-blue-500">
              <span className="animate-pulse">思考中...</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* 输入区 */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-slate-100 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={aiAvailable ? '输入指令，如: 扫描这个网站、停止、生成报告' : 'AI 未配置，请先在设置中填入 API Key'}
          disabled={!aiAvailable}
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 outline-none placeholder-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={send}
          disabled={!input.trim() || streaming || !aiAvailable}
          className={`px-3 py-1.5 text-xs rounded cursor-pointer ${
            input.trim() && !streaming && aiAvailable
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {streaming ? '...' : '发送'}
        </button>
      </div>
    </div>
  )
}
