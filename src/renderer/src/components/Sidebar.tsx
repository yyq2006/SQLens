import { Target, TestTube, ShieldAlert, ShieldBan, Database, Zap, Terminal, History, FileText, Settings } from 'lucide-react'

interface Props { active: string; onChange: (label: string) => void }

const MAIN = [
  { icon: Target, label: '目标' }, { icon: TestTube, label: '注入' },
  { icon: ShieldAlert, label: '检测' }, { icon: ShieldBan, label: '绕过' },
  { icon: Database, label: '枚举' }, { icon: Zap, label: '优化' },
  { icon: Terminal, label: '自定义参数' }
]
const SECONDARY = [
  { icon: History, label: '历史记录' }, { icon: FileText, label: '报告' },
  { icon: Settings, label: '设置' }
]

export function Sidebar({ active, onChange }: Props): JSX.Element {
  return (
    <aside className="w-48 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col shrink-0">
      <nav className="flex-1 p-2 space-y-0.5">
        {MAIN.map((item) => {
          const Icon = item.icon
          const isActive = active === item.label
          return (
            <div key={item.label} onClick={() => onChange(item.label)}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </div>
          )
        })}
      </nav>
      <div className="border-t border-slate-200 dark:border-slate-700 p-2 space-y-0.5">
        {SECONDARY.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} onClick={() => onChange(item.label)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg cursor-pointer text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <Icon className="w-4 h-4 text-slate-400" />
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
