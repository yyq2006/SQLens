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
    <div className="flex-1 overflow-y-auto console-glass p-3 font-mono text-xs space-y-0.5">
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-2 sticky top-0 pb-1 z-10">
        <span className="text-slate-400 text-xs font-semibold tracking-wide">📋 日志</span>
        <div className="flex gap-1 bg-black/20 rounded-lg p-0.5">
          {(['精简', 'raw'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`text-xs cursor-pointer px-2 py-0.5 rounded-md transition-all ${
                view === v
                  ? 'bg-white/10 text-cyan-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {v === '精简' ? '精简' : '原始'}
            </button>
          ))}
        </div>
      </div>

      {/* 日志内容 */}
      {logs.length === 0 ? (
        <div className="text-slate-500 italic">等待扫描开始...</div>
      ) : (
        <>
          {logs.map((log, i) => (
            <div key={i}>
              <div className={`${LEVEL_COLORS[log.level] || 'text-slate-300'} leading-relaxed`}>
                <span className="text-slate-600">[{log.time}]</span>
                {' '}
                <span className={`text-[10px] px-1 rounded ${
                  log.level === 'SUCCESS' ? 'bg-green-900/30 text-green-400' :
                  log.level === 'WARN' ? 'bg-yellow-900/30 text-yellow-400' :
                  log.level === 'ERROR' ? 'bg-red-900/30 text-red-400' :
                  'bg-slate-700/30 text-slate-400'
                }`}>{log.level}</span>
                {' '}
                {view === '精简' && log.message.length > 120
                  ? log.message.slice(0, 120) + '...'
                  : log.message}
              </div>
              {log.ai && view === '精简' && (
                <div className="mt-1 mb-1.5 ml-2 ai-bubble text-[11px] leading-relaxed">
                  🤖 {log.ai}
                </div>
              )}
            </div>
          ))}
          {status && (
            <div className="text-slate-500 mt-3 pt-2 border-t border-white/5">
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
