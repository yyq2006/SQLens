import type { ScanOptions } from '../types'
import { ParamGroup } from './ParamGroup'

interface Props {
  options: ScanOptions
  onChange: (update: Partial<ScanOptions>) => void
}

export function OptimizeParams({ options, onChange }: Props): JSX.Element {
  return (
    <ParamGroup label="📂 优化">
      {/* 线程数 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-20 shrink-0">线程数</span>
        <input
          type="range" min="1" max="20"
          value={options.threads}
          onChange={(e) => onChange({ threads: parseInt(e.target.value) })}
          className="flex-1 accent-blue-600"
        />
        <span className="text-[11px] text-slate-500 w-6 text-right">{options.threads}</span>
      </div>

      {/* 保持连接 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={options.keepAlive}
          onChange={(e) => onChange({ keepAlive: e.target.checked })}
          className="accent-blue-600"
        />
        <span className="text-xs text-slate-600">保持 HTTP 连接 (Keep-Alive)</span>
      </label>

      {/* Null 连接 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={options.nullConnection}
          onChange={(e) => onChange({ nullConnection: e.target.checked })}
          className="accent-blue-600"
        />
        <span className="text-xs text-slate-600">Null 连接 (仅检索状态码)</span>
      </label>

      {/* 优化开关 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={options.optimize}
          onChange={(e) => onChange({ optimize: e.target.checked })}
          className="accent-blue-600"
        />
        <span className="text-xs text-slate-600">启用优化 (自动调优)</span>
      </label>
    </ParamGroup>
  )
}
