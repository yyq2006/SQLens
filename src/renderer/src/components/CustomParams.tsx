import type { ScanOptions } from '../types'
import { ParamGroup } from './ParamGroup'

interface Props {
  options: ScanOptions
  onChange: (update: Partial<ScanOptions>) => void
}

export function CustomParams({ options, onChange }: Props): JSX.Element {
  return (
    <ParamGroup label="📝 自定义参数" defaultOpen={false}>
      <div className="space-y-1">
        <span className="text-[11px] text-slate-500">
          直接输入原生 sqlmap 参数，自动拼接到命令末尾
        </span>
        <input
          value={options.customParams}
          onChange={(e) => onChange({ customParams: e.target.value })}
          placeholder="--tamper=between --level=3 --random-agent"
          className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white outline-none placeholder-slate-400 focus:border-blue-400 font-mono"
        />
        <div className="text-[10px] text-slate-400">
          示例: <code className="bg-slate-100 px-1 rounded">--tamper=space2comment</code>
          {' '}<code className="bg-slate-100 px-1 rounded">--flush-session</code>
        </div>
      </div>
    </ParamGroup>
  )
}
