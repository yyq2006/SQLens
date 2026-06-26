import { useState, type ReactNode } from 'react'

interface Props {
  label: string
  defaultOpen?: boolean
  count?: number
  children: ReactNode
}

export function ParamGroup({ label, defaultOpen = true, count, children }: Props): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded border border-slate-200 overflow-hidden">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between px-3 py-2 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors select-none"
      >
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          {count !== undefined && count > 0 && (
            <span className="text-[10px] bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">{count}</span>
          )}
          <span className="text-slate-400 text-xs transition-transform" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
            ▾
          </span>
        </div>
      </div>
      {open && <div className="p-3 space-y-2.5">{children}</div>}
    </div>
  )
}
