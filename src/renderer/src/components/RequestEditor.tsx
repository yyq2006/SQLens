import { useState } from 'react'
import type { ScanOptions } from '../types'

interface Props {
  onApply: (options: Partial<ScanOptions>) => void
  onClose: () => void
}

/** 解析 cURL 命令 */
function parseCurl(curl: string): Partial<ScanOptions> {
  const result: Partial<ScanOptions> = {}

  // Method
  if (curl.includes('--data') || curl.includes('-d ')) {
    result.method = 'POST'
  }

  // URL
  const urlMatch = curl.match(/curl\s+['"]?(https?:\/\/[^\s'"]+)['"]?/)
  if (urlMatch) result.url = urlMatch[1]

  // Cookie
  const cookieMatch = curl.match(/-H\s+['"]Cookie:\s*([^'"]+)['"]/)
  if (cookieMatch) result.cookie = cookieMatch[1]

  // User-Agent
  const uaMatch = curl.match(/-H\s+['"]User-Agent:\s*([^'"]+)['"]/)
  if (uaMatch) result.userAgent = uaMatch[1]

  // POST data
  const dataMatch = curl.match(/--data(?:-raw)?\s+['"]([^'"]+)['"]/)
  if (dataMatch) result.data = dataMatch[1]

  return result
}

/** 解析原始 HTTP 请求 */
function parseRawHttp(raw: string): Partial<ScanOptions> {
  const result: Partial<ScanOptions> = {}
  const lines = raw.split('\n')

  // 第一行: METHOD URL HTTP/1.1
  const firstLine = lines[0]
  if (firstLine) {
    const parts = firstLine.split(' ')
    const method = parts[0]
    if (method === 'POST' || method === 'GET') {
      result.method = method as 'GET' | 'POST'
    }
    // 提取 host 拼 URL
    const path = parts[1] || ''
    const hostLine = lines.find((l) => l.toLowerCase().startsWith('host:'))
    if (hostLine) {
      const host = hostLine.split(':')[1]?.trim() || ''
      result.url = `http://${host}${path}`
    }
  }

  // Headers
  let bodyStart = false
  const bodyLines: string[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) { bodyStart = true; continue }
    if (!bodyStart) {
      const sep = line.indexOf(':')
      if (sep > 0) {
        const key = line.slice(0, sep).trim()
        const val = line.slice(sep + 1).trim()
        if (key.toLowerCase() === 'cookie') result.cookie = val
        if (key.toLowerCase() === 'user-agent') result.userAgent = val
        if (key.toLowerCase() === 'referer') result.referer = val
      }
    } else {
      bodyLines.push(line)
    }
  }

  if (bodyLines.length > 0) {
    result.data = bodyLines.join('\n')
    result.method = 'POST'
  }

  return result
}

/** 解析 Burp Suite 请求 */
function parseBurpRequest(raw: string): Partial<ScanOptions> {
  // Burp 导出格式类似原始 HTTP，但可能有 base64 编码
  return parseRawHttp(raw)
}

export function RequestEditor({ onApply, onClose }: Props): JSX.Element {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'raw' | 'curl' | 'burp'>('raw')

  const handleParse = () => {
    if (!input.trim()) return

    let parsed: Partial<ScanOptions> = {}

    switch (mode) {
      case 'curl':
        parsed = parseCurl(input)
        break
      case 'burp':
        parsed = parseBurpRequest(input)
        break
      default:
        parsed = parseRawHttp(input)
        break
    }

    onApply(parsed)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-[640px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-700">📤 导入请求</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg leading-none">✕</button>
        </div>

        {/* 模式切换 */}
        <div className="flex gap-1 px-4 pt-3">
          {([
            { key: 'raw', label: '原始 HTTP' },
            { key: 'curl', label: 'cURL 命令' },
            { key: 'burp', label: 'Burp Suite' }
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`px-3 py-1 text-xs rounded cursor-pointer ${
                mode === key ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 输入区 */}
        <div className="flex-1 p-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'curl'
                ? `curl -X POST https://example.com/login \\
  -H "Cookie: PHPSESSID=abc123" \\
  -H "User-Agent: Mozilla/5.0" \\
  --data "username=admin&password=test"`
                : `POST /page?id=1 HTTP/1.1
Host: example.com
Cookie: PHPSESSID=abc123
User-Agent: Mozilla/5.0

id=1&name=admin`
            }
            className="w-full h-48 text-xs border border-slate-200 rounded px-3 py-2 font-mono outline-none focus:border-blue-400 resize-none placeholder-slate-300"
            spellCheck={false}
          />
        </div>

        {/* 提示 */}
        <div className="px-4 pb-1">
          <span className="text-[10px] text-slate-400">
            粘贴 {mode === 'curl' ? 'cURL 命令' : mode === 'burp' ? 'Burp Suite 请求' : '原始 HTTP 请求'}，自动解析 URL/Cookie/Header/Body
          </span>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-200">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
            取消
          </button>
          <button
            onClick={handleParse}
            disabled={!input.trim()}
            className={`px-4 py-1.5 text-xs rounded cursor-pointer ${
              input.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            ✅ 解析并应用
          </button>
        </div>
      </div>
    </div>
  )
}
