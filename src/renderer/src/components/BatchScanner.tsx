import { useState } from 'react'

interface Props {
  onStartBatch: (urls: string[]) => void
  onClose: () => void
}

export function BatchScanner({ onStartBatch, onClose }: Props): JSX.Element {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'manual' | 'file'>('manual')

  const parseUrls = (): string[] => {
    return input
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http://') || l.startsWith('https://'))
  }

  const handleStart = () => {
    const urls = parseUrls()
    if (urls.length === 0) return
    onStartBatch(urls)
    onClose()
  }

  const urls = parseUrls()

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[560px] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 标题 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-700">📋 批量扫描</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg leading-none">✕</button>
        </div>

        {/* 模式切换 */}
        <div className="flex gap-1 px-4 pt-3">
          {([
            { key: 'manual', label: '手动输入' },
            { key: 'file', label: '导入文件' }
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
        <div className="p-4">
          {mode === 'manual' ? (
            <>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`http://example.com/page1?id=1
http://example.com/page2?name=admin
http://example.com/page3?cat=1`}
                className="w-full h-40 text-xs border border-slate-200 rounded px-3 py-2 font-mono outline-none focus:border-blue-400 resize-none placeholder-slate-300"
                spellCheck={false}
              />
              <div className="text-[10px] text-slate-400 mt-1">
                每行一个 URL，支持 http:// 或 https://
              </div>
            </>
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
              <div className="text-slate-400 text-sm mb-2">📁</div>
              <div className="text-xs text-slate-500 mb-2">点击选择文件或拖拽到此处</div>
              <input
                type="file"
                accept=".txt,.csv"
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:text-xs file:border file:border-slate-200 file:rounded file:bg-white file:cursor-pointer file:hover:bg-slate-50"
              />
              <div className="text-[10px] text-slate-400 mt-2">支持 .txt 文件，每行一个 URL</div>
            </div>
          )}
        </div>

        {/* 预览 */}
        {urls.length > 0 && (
          <div className="px-4 pb-2">
            <span className="text-xs text-slate-500">
              已识别 <span className="text-blue-600 font-medium">{urls.length}</span> 个有效 URL
            </span>
            <div className="mt-1 max-h-20 overflow-y-auto space-y-0.5">
              {urls.slice(0, 10).map((url, i) => (
                <div key={i} className="text-[11px] text-slate-600 font-mono truncate">{url}</div>
              ))}
              {urls.length > 10 && (
                <div className="text-[11px] text-slate-400">...还有 {urls.length - 10} 个</div>
              )}
            </div>
          </div>
        )}

        {/* 操作 */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-200">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
            取消
          </button>
          <button
            onClick={handleStart}
            disabled={urls.length === 0}
            className={`px-4 py-1.5 text-xs rounded cursor-pointer ${
              urls.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            🚀 开始扫描 {urls.length > 0 ? `(${urls.length} 个任务)` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
