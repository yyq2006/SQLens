import { Wifi, WifiOff, Cpu } from 'lucide-react'
import type { Task } from '../types'

interface Props {
  sqlmapConnected: boolean
  aiOnline: boolean
  tasks: Task[]
}

export function StatusBar({ sqlmapConnected, aiOnline, tasks }: Props): JSX.Element {
  const statusIcon = (s: string): string => {
    switch (s) {
      case 'running': return '▶'
      case 'completed': return '✓'
      case 'failed': return '✗'
      case 'stopped': return '■'
      default: return '○'
    }
  }

  return (
    <footer className="h-7 footer-gradient text-slate-400 flex items-center px-4 gap-3 text-xs shrink-0 border-t border-slate-800">
      <span className="flex items-center gap-1.5">
        {sqlmapConnected
          ? <Wifi className="w-3 h-3 text-green-400" />
          : <WifiOff className="w-3 h-3 text-red-400" />
        }
        <span>sqlmapapi {sqlmapConnected ? '已连接' : '未连接'}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Cpu className={`w-3 h-3 ${aiOnline ? 'text-green-400' : 'text-slate-600'}`} />
        <span>AI {aiOnline ? '在线' : '离线'}</span>
      </span>
      <span className="ml-auto text-slate-600 text-[10px]">
        {tasks.length > 0 ? (
          <span className="flex items-center gap-2">
            {tasks.map((t, i) => (
              <span key={t.id} className={t.status === 'running' ? 'text-green-400' : ''}>
                #{i + 1}{statusIcon(t.status)}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-slate-600">就绪 — 输入 URL 开始扫描</span>
        )}
      </span>
    </footer>
  )
}
