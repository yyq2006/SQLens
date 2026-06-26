import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  label: string
  defaultOpen?: boolean
  count?: number
  children: ReactNode
}

export function ParamGroup({ label, defaultOpen = true, count, children }: Props): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="glass-card overflow-hidden">
      <div
        onClick={() => setOpen(!open)}
        className="panel-header flex items-center justify-between px-3.5 py-2.5"
      >
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">{label}</span>
        <div className="flex items-center gap-2">
          {count !== undefined && count > 0 && (
            <span className="text-[10px] bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full px-1.5 py-0.5 backdrop-blur-sm">{count}</span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
        </div>
      </div>
      {open && <div className="p-3.5 space-y-2.5">{children}</div>}
    </div>
  )
}
