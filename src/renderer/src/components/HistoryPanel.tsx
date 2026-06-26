import { useState, useEffect } from 'react'
import { storage, type HistoryRecord } from '../storage'

interface Props {
  onSelect: (url: string) => void
  onClose: () => void
}

export function HistoryPanel({ onSelect, onClose }: Props): JSX.Element {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    setRecords(storage.getHistory())
  }, [])

  const filtered = filter
    ? records.filter((r) => r.url.toLowerCase().includes(filter.toLowerCase()))
    : records

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-[560px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">🎯 扫描历史</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg leading-none">✕</button>
        </div>

        <div className="px-4 pt-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="搜索 URL..."
            className="w-full text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-700 outline-none placeholder-slate-400 dark:text-slate-200"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-8">
              {records.length === 0 ? '暂无扫描记录' : '无匹配结果'}
            </div>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                onClick={() => { onSelect(r.url); onClose() }}
                className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  r.status === 'completed' ? 'bg-green-500' :
                  r.status === 'failed' ? 'bg-red-500' :
                  r.status === 'stopped' ? 'bg-yellow-500' : 'bg-slate-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-slate-700 dark:text-slate-200 truncate">{r.url}</div>
                  <div className="text-[10px] text-slate-400">
                    {r.timestamp} · 发现 {r.findingsCount} 个注入点
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                  r.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  r.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                }`}>{r.status}</span>
              </div>
            ))
          )}
        </div>

        {records.length > 0 && (
          <div className="flex justify-between items-center px-4 py-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400">共 {records.length} 条记录</span>
            <button
              onClick={() => { storage.clearHistory(); setRecords([]) }}
              className="text-[10px] text-red-500 hover:text-red-600 cursor-pointer"
            >
              清空全部
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
