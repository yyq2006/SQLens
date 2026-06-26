import { useRef, useEffect } from 'react'
import type { LogEntry } from '../types'

interface Props {
  logs: LogEntry[]
  view: 'raw' | '精简'
  onViewChange: (v: 'raw' | '精简') => void
  status?: string
}

const LEVEL_COLORS: Record<string, string> = {
  SUCCESS: 'text-green-400',
  WARN: 'text-yellow-400',
  ERROR: 'text-red-400',
  INFO: 'text-slate-300'
}

export function LogViewer({ logs, view, onViewChange, status }: Props): JSX.Element {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 p-3 font-mono text-xs space-y-0.5">
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-2 sticky top-0 bg-slate-900 pb-1 z-10">
        <span className="text-slate-400 text-xs font-semibold">📋 日志</span>
        <div className="flex gap-1">
          {(['精简', 'raw'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`text-xs cursor-pointer px-1.5 py-0.5 rounded ${
                view === v ? 'text-cyan-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {v === '精简' ? '精简' : '原始'}
            </button>
          ))}
        </div>
      </div>

      {/* 日志内容 */}
      {logs.length === 0 ? (
        <div className="text-slate-500">等待扫描开始...</div>
      ) : (
        <>
          {logs.map((log, i) => (
            <div key={i}>
              <div className={LEVEL_COLORS[log.level] || 'text-slate-300'}>
                {view === '精简' ? (
                  <>
                    <span className="text-slate-600">[{log.time}] </span>
                    <span>[{log.level}] </span>
                    {log.message.length > 120 ? log.message.slice(0, 120) + '...' : log.message}
                  </>
                ) : (
                  <>
                    <span className="text-slate-600">[{log.time}] </span>
                    <span>[{log.level}] </span>
                    {log.message}
                  </>
                )}
              </div>
              {log.ai && view === '精简' && (
                <div className="mt-0.5 mb-1 ml-2 text-cyan-300 bg-cyan-950/40 rounded px-2 py-1 border-l-2 border-cyan-500 text-[11px]">
                  {log.ai}
                </div>
              )}
            </div>
          ))}
          {status && (
            <div className="text-slate-500 mt-2 border-t border-slate-800 pt-2">
              {status === 'running' ? '⏳ 扫描中...' :
               status === 'completed' ? '✅ 扫描完成' :
               status === 'failed' ? '❌ 扫描失败' :
               status === 'stopped' ? '⏹ 已手动停止' :
               '● 就绪'}
            </div>
          )}
        </>
      )}
      <div ref={endRef} />
    </div>
  )
}
