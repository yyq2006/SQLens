import type { ScanOptions } from '../types'
import { ParamGroup } from './ParamGroup'

interface Props {
  options: ScanOptions
  onChange: (update: Partial<ScanOptions>) => void
}

export function EnumParams({ options, onChange }: Props): JSX.Element {
  return (
    <ParamGroup label="📂 枚举选项">
      {/* 枚举数据库 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={options.dbs}
          onChange={(e) => onChange({ dbs: e.target.checked })}
          className="accent-blue-600"
        />
        <span className="text-xs text-slate-600">枚举数据库</span>
      </label>

      {/* 枚举表 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={options.tables}
          onChange={(e) => onChange({ tables: e.target.checked })}
          className="accent-blue-600"
        />
        <span className="text-xs text-slate-600">枚举表</span>
      </label>

      {/* 枚举列 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={options.columns}
          onChange={(e) => onChange({ columns: e.target.checked })}
          className="accent-blue-600"
        />
        <span className="text-xs text-slate-600">枚举列</span>
      </label>

      {/* 分隔线 */}
      <div className="border-t border-slate-100 pt-2 space-y-2.5">
        {/* Dump 数据 */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.dump}
            onChange={(e) => onChange({ dump: e.target.checked })}
            className="accent-blue-600"
          />
          <span className="text-xs text-slate-600">导出数据 (Dump)</span>
        </label>

        {/* Dump All */}
        {options.dump && (
          <label className="flex items-center gap-2 cursor-pointer ml-5">
            <input
              type="checkbox"
              checked={options.dumpAll}
              onChange={(e) => onChange({ dumpAll: e.target.checked })}
              className="accent-blue-600"
            />
            <span className="text-xs text-slate-600">全部数据库</span>
          </label>
        )}

        {/* 行数限制 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-20 shrink-0">行数限制</span>
          <input
            type="number" min="0"
            value={options.stop}
            onChange={(e) => onChange({ stop: parseInt(e.target.value) || 0 })}
            placeholder="0 = 全部"
            className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none focus:border-blue-400"
          />
        </div>

        {/* 搜索字段 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-20 shrink-0">搜索字段</span>
          <input
            value={options.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="如: pass, user, email"
            className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none placeholder-slate-400 focus:border-blue-400"
          />
        </div>
      </div>
    </ParamGroup>
  )
}
