import { useState } from 'react'
import type { ScanOptions } from '../types'
import { ParamGroup } from './ParamGroup'

interface Props {
  options: ScanOptions
  onChange: (update: Partial<ScanOptions>) => void
}

const TAMPER_LIST = [
  'apostrophemask', 'apostrophenullencode', 'appendnullbyte',
  'base64encode', 'between', 'bluecoat', 'chardoubleencode',
  'charencode', 'charunicodeencode', 'concat2concatws',
  'equaltolike', 'escapequotes', 'greatest', 'halfversionedmorekeywords',
  'ifnull2ifisnull', 'modsecurityversioned', 'modsecurityzeroversioned',
  'multiplespaces', 'nonrecursivereplacement', 'percentage',
  'randomcase', 'randomcomments', 'space2comment', 'space2dash',
  'space2hash', 'space2morehash', 'space2mssqlblank', 'space2mssqlhash',
  'space2mysqlblank', 'space2mysqldash', 'space2plus', 'space2randomblank',
  'symboliclogical', 'unionalltounion', 'unmagicquotes', 'uppercase',
  'varnish', 'versionedkeywords', 'versionedmorekeywords', 'xforwardedfor'
].sort()

export function DetectionParams({ options, onChange }: Props): JSX.Element {
  const [search, setSearch] = useState('')

  const filtered = TAMPER_LIST.filter((t) => !search || t.toLowerCase().includes(search.toLowerCase()))

  return (
    <ParamGroup label="📂 检测与绕过">
      {/* 相似度阈值 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-20 shrink-0">相似度</span>
        <input
          type="range" min="0.5" max="1" step="0.02"
          value={0.98}
          className="flex-1 accent-blue-600"
        />
        <span className="text-[11px] text-slate-500 w-8 text-right">0.98</span>
      </div>

      {/* TextOnly */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={options.textOnly}
          onChange={(e) => onChange({ textOnly: e.target.checked })}
          className="accent-blue-600"
        />
        <span className="text-xs text-slate-600">仅比较文本内容 (忽略HTML标签)</span>
      </label>

      {/* Titles */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={options.titles}
          onChange={(e) => onChange({ titles: e.target.checked })}
          className="accent-blue-600"
        />
        <span className="text-xs text-slate-600">仅比较页面标题</span>
      </label>

      {/* Tamper 脚本 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Tamper 脚本 ({options.tamper.length} 已选)</span>
        </div>
        <div className="relative mb-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 tamper..."
            className="w-full text-[11px] border border-slate-200 rounded px-2 py-1.5 bg-white outline-none placeholder-slate-400 focus:border-blue-400"
          />
        </div>
        <div className="max-h-28 overflow-y-auto border border-slate-100 rounded p-1 space-y-0.5">
          {filtered.map((tamper) => (
            <label key={tamper} className="flex items-center gap-1.5 cursor-pointer px-1 py-0.5 hover:bg-slate-50 rounded">
              <input
                type="checkbox"
                checked={options.tamper.includes(tamper)}
                onChange={() => {
                  const newList = options.tamper.includes(tamper)
                    ? options.tamper.filter((t) => t !== tamper)
                    : [...options.tamper, tamper]
                  onChange({ tamper: newList })
                }}
                className="accent-blue-600 scale-75"
              />
              <span className="text-[11px] text-slate-600 font-mono">{tamper}</span>
            </label>
          ))}
          {filtered.length === 0 && <div className="text-[10px] text-slate-400 p-1">无匹配</div>}
        </div>
      </div>

      {/* 编码 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-20 shrink-0">编码</span>
        <select
          value={options.encoding}
          onChange={(e) => onChange({ encoding: e.target.value })}
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white cursor-pointer outline-none focus:border-blue-400"
        >
          <option value="">无</option>
          <option value="hex">Hex</option>
          <option value="base64">Base64</option>
          <option value="utf8">UTF-8</option>
        </select>
      </div>
    </ParamGroup>
  )
}
