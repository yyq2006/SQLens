interface Props {
  active: string
  onChange: (label: string) => void
}

const NAV_MAIN = [
  { icon: '📂', label: '目标' },
  { icon: '📂', label: '注入' },
  { icon: '📂', label: '检测' },
  { icon: '📂', label: '绕过' },
  { icon: '📂', label: '枚举' },
  { icon: '📂', label: '优化' },
  { icon: '📝', label: '自定义参数' }
]

const NAV_SECONDARY = [
  { icon: '🎯', label: '历史记录' },
  { icon: '📊', label: '报告' },
  { icon: '⚙️', label: '设置' }
]

export function Sidebar({ active, onChange }: Props): JSX.Element {
  return (
    <aside className="w-48 bg-white border-r border-slate-200 flex flex-col shrink-0">
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV_MAIN.map((item) => (
          <div
            key={item.label}
            onClick={() => onChange(item.label)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer transition-colors duration-150 ${
              active === item.label
                ? 'bg-blue-50 text-blue-700 border-l-[3px] border-blue-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-2 space-y-0.5">
        {NAV_SECONDARY.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer text-slate-500 hover:bg-slate-50 transition-colors duration-150"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
