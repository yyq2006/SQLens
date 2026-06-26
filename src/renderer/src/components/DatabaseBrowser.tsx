import { useState, useCallback } from 'react'
import type { Task } from '../types'

// ====== 类型 ======

interface DbNode {
  type: 'database' | 'table' | 'column'
  name: string
  children?: DbNode[]
  count?: number
  columns?: string[]
  expanded?: boolean
}

interface Props {
  task: Task | null
  onEnum: (taskId: string, options: Record<string, unknown>) => void
}

// ====== 组件 ======

export function DatabaseBrowser({ task, onEnum }: Props): JSX.Element {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<string[][] | null>(null)
  const [sqlInput, setSqlInput] = useState('')
  const [sqlResult, setSqlResult] = useState<string[][] | null>(null)
  const [activeTab, setActiveTab] = useState<'browse' | 'sql'>('browse')

  // 从 task logs 中解析出数据库结构（模拟数据，实际需从 sqlmapapi data 获取）
  // 实际项目中会从 task.data 中解析
  const mockTree: DbNode[] = [
    {
      type: 'database',
      name: 'information_schema',
      children: [
        { type: 'table', name: 'TABLES', columns: ['TABLE_NAME', 'TABLE_SCHEMA', 'ENGINE'], count: 89 },
        { type: 'table', name: 'COLUMNS', columns: ['COLUMN_NAME', 'DATA_TYPE', 'TABLE_NAME'], count: 162 }
      ]
    },
    {
      type: 'database',
      name: 'myapp_db',
      children: [
        { type: 'table', name: 'users', columns: ['id', 'username', 'password', 'email', 'role'], count: 124 },
        { type: 'table', name: 'orders', columns: ['id', 'user_id', 'product', 'amount', 'status'], count: 567 },
        { type: 'table', name: 'products', columns: ['id', 'name', 'price', 'stock'], count: 89 }
      ]
    }
  ]

  const [tree, setTree] = useState<DbNode[] | null>(task?.status === 'completed' ? mockTree : null)

  const toggleExpand = useCallback((path: number[]) => {
    setTree((prev) => {
      if (!prev) return prev
      const updated = structuredClone(prev)
      let node: DbNode | undefined
      let current: any = updated
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]]
      }
      if (current) current.expanded = !current.expanded
      return updated
    })
  }, [])

  const handlePreview = useCallback(async (tableName: string) => {
    setSelectedTable(tableName)
    // 模拟数据预览 - 实际会通过 sqlmapapi --dump 获取
    setPreviewData([
      ['id', 'username', 'password', 'role'],
      ['1', 'admin', '5d41402abc4b...', 'admin'],
      ['2', 'user1', 'e99a18c428cb...', 'user'],
      ['3', 'test', '098f6bcd4621...', 'user']
    ])
  }, [])

  const handleExport = useCallback((format: 'csv' | 'json' | 'excel') => {
    if (!previewData) return
    const headers = previewData[0]
    const rows = previewData.slice(1)

    let content = ''
    let filename = `${selectedTable || 'data'}.${format}`
    let mime = ''

    switch (format) {
      case 'csv':
        content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
        mime = 'text/csv'
        break
      case 'json':
        content = JSON.stringify(rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]]))), null, 2)
        mime = 'application/json'
        break
      case 'excel':
        content = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n')
        mime = 'text/tab-separated-values'
        filename = `${selectedTable || 'data'}.tsv`
        break
    }

    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [previewData, selectedTable])

  const handleExecuteSql = useCallback(async () => {
    if (!sqlInput.trim() || !task) return
    setSqlResult(null)

    // 通过 sqlmapapi 执行 SQL 查询
    // 实际逻辑: 创建新任务 + --sql-query
    if (task.id) {
      onEnum(task.id, { sqlQuery: sqlInput.trim() })
    }

    // 模拟结果展示
    setSqlResult([
      ['id', 'username', 'role'],
      ['1', 'admin', 'admin'],
      ['2', 'user1', 'user']
    ])
  }, [sqlInput, task, onEnum])

  // 渲染树节点
  const renderNode = (node: DbNode, path: number[], depth: number): JSX.Element => {
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={`${path.join('-')}`}>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-slate-50 text-xs ${
            depth === 0 ? 'font-medium text-slate-700' : 'text-slate-600'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (hasChildren) toggleExpand(path)
            if (node.type === 'table') handlePreview(node.name)
          }}
        >
          {/* 展开/折叠图标 */}
          {hasChildren ? (
            <span className={`text-slate-400 transition-transform text-[10px] ${node.expanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
          ) : (
            <span className="text-slate-300 text-[10px]">•</span>
          )}

          {/* 类型图标 */}
          <span>{node.type === 'database' ? '🗄️' : node.type === 'table' ? '📋' : '📄'}</span>

          {/* 名称 */}
          <span className="font-mono">{node.name}</span>

          {/* 计数 */}
          {node.count !== undefined && (
            <span className="text-[10px] text-slate-400 ml-1">({node.count} 行)</span>
          )}

          {/* 列信息 */}
          {node.columns && (
            <span className="text-[10px] text-slate-400 ml-1 truncate max-w-[200px]">
              {node.columns.join(', ')}
            </span>
          )}

          {/* 操作按钮 */}
          {node.type === 'table' && (
            <div className="ml-auto flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handlePreview(node.name)}
                className="text-[10px] text-blue-600 hover:text-blue-700 px-1 cursor-pointer"
              >
                🔍
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="text-[10px] text-green-600 hover:text-green-700 px-1 cursor-pointer"
              >
                📥
              </button>
            </div>
          )}
        </div>

        {/* 子节点 */}
        {node.expanded && node.children?.map((child, i) => renderNode(child, [...path, i], depth + 1))}
      </div>
    )
  }

  // 获取 scan data  
  if (!task) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-xs text-slate-400">请先完成一次扫描，结果将在此展示</div>
      </div>
    )
  }

  if (task.status !== 'completed' && task.status !== 'running') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-xs text-slate-400">
          {task.status === 'idle' ? '等待扫描开始...' : task.status === 'failed' ? '❌ 扫描失败' : '扫描中...'}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col text-xs">
      {/* Tab 切换 */}
      <div className="flex gap-1 border-b border-slate-200 px-2 shrink-0">
        {([
          { key: 'browse', label: '📂 浏览' },
          { key: 'sql', label: '💾 SQL' }
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-1.5 text-xs cursor-pointer border-b-2 transition-colors ${
              activeTab === key
                ? 'text-blue-600 border-blue-600 font-medium'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
        {/* 导出按钮 */}
        {previewData && (
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => handleExport('csv')} className="text-[10px] text-slate-500 hover:text-slate-700 px-1.5 py-1 cursor-pointer">CSV</button>
            <button onClick={() => handleExport('json')} className="text-[10px] text-slate-500 hover:text-slate-700 px-1.5 py-1 cursor-pointer">JSON</button>
          </div>
        )}
      </div>

      {/* 浏览 Tab */}
      {activeTab === 'browse' && (
        <div className="flex-1 flex overflow-hidden">
          {/* 树形 */}
          <div className="w-1/2 overflow-y-auto border-r border-slate-200 p-1">
            {tree ? tree.map((db, i) => renderNode(db, [i], 0)) : (
              <div className="text-xs text-slate-400 p-2">加载中...</div>
            )}
          </div>

          {/* 数据预览 */}
          <div className="w-1/2 overflow-auto">
            {previewData ? (
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 sticky top-0">
                    {previewData[0].map((h, i) => (
                      <th key={i} className="text-left px-2 py-1 text-slate-600 font-medium border-b border-slate-200 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(1, 101).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-0.5 text-slate-600 border-b border-slate-50 font-mono truncate max-w-[200px]">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-xs text-slate-400 p-2">点击左侧表名预览数据</div>
            )}
            {previewData && previewData.length > 101 && (
              <div className="text-[10px] text-slate-400 p-2 border-t border-slate-100">
                显示前 100 行，共 {previewData.length - 1} 行
              </div>
            )}
          </div>
        </div>
      )}

      {/* SQL Tab */}
      {activeTab === 'sql' && (
        <div className="flex-1 flex flex-col p-2">
          <div className="flex gap-2 mb-2">
            <input
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteSql()}
              placeholder="SELECT * FROM users WHERE role='admin'"
              className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 font-mono"
            />
            <button
              onClick={handleExecuteSql}
              disabled={!sqlInput.trim()}
              className={`px-3 py-1.5 text-xs rounded cursor-pointer ${
                sqlInput.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              ▶ 执行
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            {sqlResult ? (
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 sticky top-0">
                    {sqlResult[0].map((h, i) => (
                      <th key={i} className="text-left px-2 py-1 text-slate-600 font-medium border-b border-slate-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sqlResult.slice(1).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-0.5 text-slate-600 font-mono text-[11px]">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-xs text-slate-400 p-2">输入 SQL 语句并点击执行</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
