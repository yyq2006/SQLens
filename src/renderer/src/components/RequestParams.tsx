import type { ScanOptions } from '../types'
import { ParamGroup } from './ParamGroup'

interface Props {
  options: ScanOptions
  onChange: (update: Partial<ScanOptions>) => void
}

const METHODS = ['GET', 'POST']
const EXAMPLE_HEADERS = [
  { key: 'X-Forwarded-For', value: '127.0.0.1' },
  { key: 'Origin', value: 'https://example.com' }
]

export function RequestParams({ options, onChange }: Props): JSX.Element {
  const filledCount = [
    options.cookie, options.userAgent, options.referer,
    options.delay > 0, options.timeout !== 30, options.retries !== 3, options.proxy
  ].filter(Boolean).length

  return (
    <ParamGroup label="📂 目标与请求" count={filledCount}>
      {/* Method */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-16 shrink-0">Method</span>
        <select
          value={options.method}
          onChange={(e) => onChange({ method: e.target.value as 'GET' | 'POST' })}
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white cursor-pointer outline-none focus:border-blue-400"
        >
          {METHODS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      {/* POST Data */}
      {options.method === 'POST' && (
        <div className="flex items-start gap-2">
          <span className="text-xs text-slate-500 w-16 shrink-0 mt-1">Data</span>
          <textarea
            value={options.data}
            onChange={(e) => onChange({ data: e.target.value })}
            placeholder="id=1&name=admin"
            rows={2}
            className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none placeholder-slate-400 focus:border-blue-400 resize-none font-mono"
          />
        </div>
      )}

      {/* Cookie */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-16 shrink-0">Cookie</span>
        <input
          value={options.cookie}
          onChange={(e) => onChange({ cookie: e.target.value })}
          placeholder="PHPSESSID=abc123"
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none placeholder-slate-400 focus:border-blue-400 font-mono"
        />
      </div>

      {/* User-Agent */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-16 shrink-0">User-Agent</span>
        <input
          value={options.userAgent}
          onChange={(e) => onChange({ userAgent: e.target.value })}
          placeholder="随机 (留空自动生成)"
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none placeholder-slate-400 focus:border-blue-400"
        />
      </div>

      {/* Referer */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-16 shrink-0">Referer</span>
        <input
          value={options.referer}
          onChange={(e) => onChange({ referer: e.target.value })}
          placeholder="可选"
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none placeholder-slate-400 focus:border-blue-400"
        />
      </div>

      {/* Headers */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500 w-16">Headers</span>
          <button className="text-[10px] text-blue-600 hover:text-blue-700 cursor-pointer">+ 添加</button>
        </div>
        <div className="space-y-1">
          {Object.entries(options.headers).length === 0 ? (
            <div className="text-[10px] text-slate-400 italic">点击「+ 添加」自定义请求头</div>
          ) : (
            Object.entries(options.headers).map(([key, val]) => (
              <div key={key} className="flex gap-1">
                <input value={key} readOnly className="flex-1 text-[11px] border border-slate-200 rounded px-1.5 py-1 bg-slate-50 font-mono" />
                <input value={val} readOnly className="flex-1 text-[11px] border border-slate-200 rounded px-1.5 py-1 bg-slate-50 font-mono" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* 分隔线 */}
      <div className="border-t border-slate-100 pt-2 space-y-2.5">
        {/* 延时 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-16 shrink-0">延时</span>
          <input
            type="range" min="0" max="10" step="0.5"
            value={options.delay}
            onChange={(e) => onChange({ delay: parseFloat(e.target.value) })}
            className="flex-1 accent-blue-600"
          />
          <span className="text-[11px] text-slate-500 w-8 text-right">{options.delay}s</span>
        </div>

        {/* 超时 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-16 shrink-0">超时</span>
          <input
            type="number" min="1" max="120"
            value={options.timeout}
            onChange={(e) => onChange({ timeout: parseInt(e.target.value) || 30 })}
            className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none focus:border-blue-400"
          />
          <span className="text-[11px] text-slate-500">秒</span>
        </div>

        {/* 重试 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-16 shrink-0">重试</span>
          <input
            type="number" min="0" max="10"
            value={options.retries}
            onChange={(e) => onChange({ retries: parseInt(e.target.value) || 0 })}
            className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none focus:border-blue-400"
          />
          <span className="text-[11px] text-slate-500">次</span>
        </div>

        {/* 代理 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-16 shrink-0">代理</span>
          <input
            value={options.proxy}
            onChange={(e) => onChange({ proxy: e.target.value })}
            placeholder="http://127.0.0.1:8080"
            className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none placeholder-slate-400 focus:border-blue-400 font-mono"
          />
        </div>
      </div>
    </ParamGroup>
  )
}
