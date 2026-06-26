import type { ScanOptions } from '../types'
import { ParamGroup } from './ParamGroup'

interface Props {
  options: ScanOptions
  onChange: (update: Partial<ScanOptions>) => void
}

const TECH_LABELS: Record<string, string> = {
  B: 'Boolean 盲注',
  E: 'Error 注入',
  U: 'Union 注入',
  S: 'Stacked 查询',
  T: 'Time 盲注'
}

const DBMS_OPTIONS = ['', 'MySQL', 'Microsoft SQL Server', 'Oracle', 'PostgreSQL', 'SQLite', 'Microsoft Access', 'Firebird', 'IBM DB2', 'MariaDB']

export function InjectionParams({ options, onChange }: Props): JSX.Element {
  return (
    <ParamGroup label="📂 注入参数">
      {/* 测试参数 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-20 shrink-0">测试参数</span>
        <input
          value={options.testParam}
          onChange={(e) => onChange({ testParam: e.target.value })}
          placeholder="留空 = 全部参数"
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none placeholder-slate-400 focus:border-blue-400 font-mono"
        />
      </div>

      {/* 注入技术 */}
      <div>
        <span className="text-xs text-slate-500 block mb-1">注入技术</span>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(TECH_LABELS) as [string, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={options.tech.includes(key as 'B' | 'E' | 'U' | 'S' | 'T')}
                onChange={() => {
                  const tech = options.tech.includes(key as 'B' | 'E' | 'U' | 'S' | 'T')
                    ? options.tech.filter((t) => t !== key)
                    : [...options.tech, key as 'B' | 'E' | 'U' | 'S' | 'T']
                  onChange({ tech })
                }}
                className="accent-blue-600"
              />
              <span className="text-[11px] text-slate-600">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* DB类型 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-20 shrink-0">数据库</span>
        <select
          value={options.dbms}
          onChange={(e) => onChange({ dbms: e.target.value })}
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white cursor-pointer outline-none focus:border-blue-400"
        >
          {DBMS_OPTIONS.map((db) => <option key={db} value={db}>{db || '自动检测'}</option>)}
        </select>
      </div>

      {/* Level */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-20 shrink-0">Level</span>
        <input
          type="range" min="1" max="5"
          value={options.level}
          onChange={(e) => onChange({ level: parseInt(e.target.value) })}
          className="flex-1 accent-blue-600"
        />
        <span className="text-[11px] text-slate-500 w-4 text-right">{options.level}</span>
        <span className="text-[10px] text-slate-400">
          {['基础', '中等', '深入', '深度', '极限'][options.level - 1]}
        </span>
      </div>

      {/* Risk */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-20 shrink-0">Risk</span>
        <input
          type="range" min="1" max="3"
          value={options.risk}
          onChange={(e) => onChange({ risk: parseInt(e.target.value) })}
          className="flex-1 accent-orange-500"
        />
        <span className="text-[11px] text-slate-500 w-4 text-right">{options.risk}</span>
        <span className="text-[10px] text-slate-400">
          {['低风险', '中风险', '高风险'][options.risk - 1]}
        </span>
      </div>
    </ParamGroup>
  )
}
