import {
  Target,
  TestTube,
  ShieldAlert,
  ShieldBan,
  Database,
  Zap,
  Terminal,
  History,
  FileText,
  Settings,
  ChevronRight
} from 'lucide-react'

interface Props {
  active: string
  onChange: (label: string) => void
}

const NAV_MAIN = [
  { icon: Target, label: '目标' },
  { icon: TestTube, label: '注入' },
  { icon: ShieldAlert, label: '检测' },
  { icon: ShieldBan, label: '绕过' },
  { icon: Database, label: '枚举' },
  { icon: Zap, label: '优化' },
  { icon: Terminal, label: '自定义参数' }
]

const NAV_SECONDARY = [
  { icon: History, label: '历史记录' },
  { icon: FileText, label: '报告' },
  { icon: Settings, label: '设置' }
]

export function Sidebar({ active, onChange }: Props): JSX.Element {
  return (
    <aside className="w-48 sidebar-glass flex flex-col shrink-0">
      <nav className="flex-1 p-2.5 space-y-0.5">
        {NAV_MAIN.map((item) => {
          const Icon = item.icon
          const isActive = active === item.label
          return (
            <div
              key={item.label}
              onClick={() => onChange(item.label)}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg cursor-pointer transition-all duration-200 group ${
                isActive
                  ? 'bg-white/70 dark:bg-white/10 text-blue-700 dark:text-blue-300 font-medium shadow-sm border border-white/60 dark:border-white/5'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`} />
              <span className="text-sm">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3 h-3 ml-auto text-blue-400/60 dark:text-blue-500/60" />
              )}
            </div>
          )
        })}
      </nav>
      <div className="border-t border-white/40 dark:border-white/5 p-2.5 space-y-0.5">
        {NAV_SECONDARY.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              onClick={() => onChange(item.label)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg cursor-pointer text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-200 group"
            >
              <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-300" />
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
