import { useState, useCallback } from 'react'
import type { Task } from '../types'

interface ReportData {
  summary: string
  riskLevel: '高' | '中' | '低'
  target: string
  scanTime: string
  totalRequests: number
  findings: {
    parameter: string
    technique: string
    dbms: string
    payload: string
    severity: '高' | '中' | '低'
    description: string
  }[]
  dataExposed: {
    database: string
    tables: number
    rows: number
  }[]
  fixSuggestions: {
    language: string
    issue: string
    code: string
  }[]
}

interface Props {
  task: Task | null
  onGenerateReport: (taskId: string) => void
}

function generateMockReport(task: Task): ReportData {
  return {
    summary: `对 ${task.url} 进行 SQL 注入扫描，发现 ${task.status === 'completed' ? 2 : 0} 个注入点，涉及 ${task.status === 'completed' ? 'MySQL 5.7' : '未知'} 数据库。`,
    riskLevel: '高',
    target: task.url,
    scanTime: new Date().toLocaleString('zh-CN'),
    totalRequests: 1284,
    findings: task.status === 'completed' ? [
      {
        parameter: 'id',
        technique: 'Boolean-based blind',
        dbms: 'MySQL 5.7',
        payload: 'id=1 AND 1=1',
        severity: '高',
        description: '参数 id 存在布尔盲注漏洞，可通过 AND/OR 语句判断条件真伪'
      },
      {
        parameter: 'name',
        technique: 'Error-based',
        dbms: 'MySQL 5.7',
        payload: "name=admin' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT @@version)))--",
        severity: '中',
        description: '参数 name 存在报错注入，可通过报错信息提取数据库内容'
      }
    ] : [],
    dataExposed: task.status === 'completed' ? [
      { database: 'myapp_db', tables: 3, rows: 780 },
      { database: 'information_schema', tables: 2, rows: 251 }
    ] : [],
    fixSuggestions: [
      {
        language: 'PHP',
        issue: '使用参数化查询替代字符串拼接',
        code: `// ❌ 有漏洞的写法
$query = "SELECT * FROM users WHERE id = " . $_GET['id'];

// ✅ 安全的写法 (PDO)
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute(['id' => $_GET['id']]);`
      },
      {
        language: 'Python (Flask)',
        issue: '使用 ORM 或参数化查询',
        code: `# ❌ 有漏洞的写法
query = f"SELECT * FROM users WHERE id = {request.args.get('id')}"

# ✅ 安全的写法
cursor.execute("SELECT * FROM users WHERE id = %s", (request.args.get('id'),))`
      },
      {
        language: 'Java',
        issue: '使用 PreparedStatement',
        code: `// ❌ 有漏洞的写法
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM users WHERE id = " + id);

// ✅ 安全的写法
PreparedStatement pstmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
pstmt.setString(1, id);
ResultSet rs = pstmt.executeQuery();`
      }
    ]
  }
}

function exportHtml(report: ReportData): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>SQLens 安全扫描报告</title>
<style>
body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
h1 { color: #0369a1; border-bottom: 2px solid #0369a1; padding-bottom: 8px; }
table { width: 100%; border-collapse: collapse; margin: 16px 0; }
th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
th { background: #f8fafc; font-weight: 600; }
pre { background: #1e293b; color: #4ade80; padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 13px; }
.risk-high { color: #ef4444; font-weight: bold; }
.risk-medium { color: #f59e0b; font-weight: bold; }
.risk-low { color: #22c55e; font-weight: bold; }
</style></head>
<body>
<h1>🛡️ SQLens 安全扫描报告</h1>
<p><strong>目标:</strong> ${report.target}</p>
<p><strong>扫描时间:</strong> ${report.scanTime}</p>
<p><strong>风险等级:</strong> <span class="risk-${report.riskLevel === '高' ? 'high' : report.riskLevel === '中' ? 'medium' : 'low'}">${report.riskLevel}</span></p>
<p>${report.summary}</p>

<h2>📋 发现的注入点</h2>
<table><tr><th>参数</th><th>类型</th><th>数据库</th><th>严重程度</th></tr>
${report.findings.map(f => `<tr><td>${f.parameter}</td><td>${f.technique}</td><td>${f.dbms}</td><td class="risk-${f.severity === '高' ? 'high' : 'medium'}">${f.severity}</td></tr>`).join('')}
</table>

<h2>📊 受影响的数据</h2>
<table><tr><th>数据库</th><th>表数</th><th>数据行数</th></tr>
${report.dataExposed.map(d => `<tr><td>${d.database}</td><td>${d.tables}</td><td>${d.rows}</td></tr>`).join('')}
</table>

<h2>🛡️ 修复建议</h2>
${report.fixSuggestions.map(s => `<h3>${s.language} - ${s.issue}</h3><pre>${s.code}</pre>`).join('')}

<p style="margin-top:40px;color:#94a3b8;font-size:12px">由 SQLens v1.0 自动生成</p>
</body></html>`
}

function exportMarkdown(report: ReportData): string {
  let md = `# 🛡️ SQLens 安全扫描报告\n\n`
  md += `**目标:** ${report.target}  \n`
  md += `**扫描时间:** ${report.scanTime}  \n`
  md += `**风险等级:** ${report.riskLevel}  \n`
  md += `${report.summary}\n\n`

  md += `## 📋 发现的注入点\n\n`
  md += `| 参数 | 类型 | 数据库 | 严重程度 |\n`
  md += `|------|------|--------|--------|\n`
  report.findings.forEach(f => { md += `| ${f.parameter} | ${f.technique} | ${f.dbms} | ${f.severity} |\n` })
  md += `\n`

  md += `## 📊 受影响的数据\n\n`
  md += `| 数据库 | 表数 | 数据行数 |\n`
  md += `|--------|------|--------|\n`
  report.dataExposed.forEach(d => { md += `| ${d.database} | ${d.tables} | ${d.rows} |\n` })
  md += `\n`

  md += `## 🛡️ 修复建议\n\n`
  report.fixSuggestions.forEach(s => {
    md += `### ${s.language} - ${s.issue}\n\n`
    md += "```" + s.language.toLowerCase() + "\n" + s.code + "\n```\n\n"
  })

  md += `---\n*由 SQLens v1.0 自动生成*\n`
  return md
}

export function ReportViewer({ task, onGenerateReport }: Props): JSX.Element {
  const [report, setReport] = useState<ReportData | null>(null)

  const handleGenerate = useCallback(() => {
    if (!task) return
    const data = generateMockReport(task)
    setReport(data)
    if (task.id) onGenerateReport(task.id)
  }, [task, onGenerateReport])

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!task || task.status !== 'completed') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-xs text-slate-400">
          {!task ? '暂无扫描结果' : task.status === 'failed' ? '❌ 扫描失败' : '等待扫描完成...'}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-3 overflow-y-auto text-xs">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700">📊 安全扫描报告</span>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 cursor-pointer"
          >
            {report ? '🔄 重新生成' : '📄 生成报告'}
          </button>
        </div>
      </div>

      {report ? (
        <>
          {/* 概览 */}
          <div className="bg-slate-50 rounded border border-slate-200 p-3 mb-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] text-slate-500 mb-0.5">目标</div>
                <div className="text-xs text-slate-700 font-mono truncate">{report.target}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-0.5">扫描时间</div>
                <div className="text-xs text-slate-700">{report.scanTime}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-0.5">风险等级</div>
                <div className={`text-xs font-bold ${
                  report.riskLevel === '高' ? 'text-red-600' :
                  report.riskLevel === '中' ? 'text-yellow-600' : 'text-green-600'
                }`}>{report.riskLevel}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-600">{report.summary}</div>
          </div>

          {/* 注入点列表 */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-slate-600 mb-1">📋 发现的注入点 ({report.findings.length})</div>
            <div className="space-y-1">
              {report.findings.map((f, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded p-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-mono font-bold text-slate-700">{f.parameter}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      f.severity === '高' ? 'bg-red-100 text-red-700' :
                      f.severity === '中' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>{f.severity}</span>
                    <span className="text-[10px] text-slate-400">{f.technique}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{f.description}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Payload: {f.payload}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 受影响数据 */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-slate-600 mb-1">📊 受影响的数据</div>
            <table className="w-full text-[11px] border-collapse">
              <thead><tr className="bg-slate-50">
                <th className="text-left px-2 py-1 text-slate-600 border-b border-slate-200">数据库</th>
                <th className="text-left px-2 py-1 text-slate-600 border-b border-slate-200">表数</th>
                <th className="text-left px-2 py-1 text-slate-600 border-b border-slate-200">数据行数</th>
              </tr></thead>
              <tbody>
                {report.dataExposed.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-2 py-1 font-mono text-slate-700">{d.database}</td>
                    <td className="px-2 py-1 text-slate-600">{d.tables}</td>
                    <td className="px-2 py-1 text-slate-600">{d.rows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 修复建议 */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-slate-600 mb-1">🛡️ 修复建议</div>
            <div className="space-y-2">
              {report.fixSuggestions.map((s, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded overflow-hidden">
                  <div className="px-2 py-1 bg-slate-50 text-xs font-medium text-slate-600 border-b border-slate-200">
                    {s.language} — {s.issue}
                  </div>
                  <pre className="p-2 text-[11px] font-mono text-green-400 bg-slate-900 overflow-x-auto">{s.code}</pre>
                </div>
              ))}
            </div>
          </div>

          {/* 导出按钮 */}
          <div className="flex gap-2 mt-2 pt-3 border-t border-slate-200">
            <button
              onClick={() => downloadFile(exportHtml(report), `SQLens_Report_${Date.now()}.html`, 'text/html')}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              📄 导出 HTML
            </button>
            <button
              onClick={() => downloadFile(exportMarkdown(report), `SQLens_Report_${Date.now()}.md`, 'text/markdown')}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              📝 导出 Markdown
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-xs text-slate-400 mb-3">点击「生成报告」按钮自动生成安全报告</div>
            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 cursor-pointer"
            >
              📄 生成报告
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
