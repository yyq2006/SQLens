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
      case 'completed': return '✅'
      case 'failed': return '❌'
      case 'stopped': return '⏸'
      default: return '○'
    }
  }

  return (
    <footer className="h-7 bg-slate-900 text-slate-400 flex items-center px-4 gap-4 text-xs shrink-0">
      <span className="flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${sqlmapConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        sqlmapapi {sqlmapConnected ? '已连接 (:8775)' : '未连接'}
      </span>
      <span className="flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${aiOnline ? 'bg-green-500' : 'bg-slate-600'}`} />
        AI {aiOnline ? '在线' : '离线'}
      </span>
      <span className="ml-auto text-slate-600">
        {tasks.length > 0 ? (
          tasks.map((t, i) => (
            <span key={t.id} className="mr-2">
              [{i + 1}{statusIcon(t.status)}]
            </span>
          ))
        ) : '无活跃任务'}
      </span>
    </footer>
  )
}
