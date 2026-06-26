import { useState, useCallback, useRef } from 'react'
import type { Task, LogEntry, ScanOptions, TaskStatus } from '../types'

export function useScanManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const pollingRef = useRef<Map<string, boolean>>(new Map())

  const now = (): string =>
    new Date().toLocaleTimeString('zh-CN', { hour12: false })

  const addLog = useCallback((taskId: string, level: LogEntry['level'], message: string, ai?: string) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === taskId)
      if (idx === -1) return prev
      const updated = [...prev]
      updated[idx] = {
        ...updated[idx],
        logs: [...updated[idx].logs, { time: now(), level, message, ai }]
      }
      return updated
    })
  }, [])

  const createTask = useCallback(async (url: string): Promise<string | null> => {
    const result = await window.sqlens.createTask()
    if (!result.success) return null

    const newTask: Task = {
      id: result.taskId,
      name: `任务 ${tasks.length + 1}`,
      url,
      status: 'idle',
      logs: [{ time: now(), level: 'INFO', message: `任务已创建 (${result.taskId})` }]
    }

    setTasks((prev) => [...prev, newTask])
    setActiveIndex(tasks.length)
    return result.taskId
  }, [tasks.length])

  const startScan = useCallback(async (taskId: string, options: ScanOptions) => {
    addLog(taskId, 'INFO', '正在配置扫描参数...')

    // 构建 sqlmap 参数
    const sqlmapOptions: Record<string, unknown> = { url: options.url }
    if (options.method === 'POST' && options.data) sqlmapOptions.data = options.data
    if (options.cookie) sqlmapOptions.cookie = options.cookie
    if (options.level > 1) sqlmapOptions.level = options.level
    if (options.risk > 1) sqlmapOptions.risk = options.risk
    if (options.tech.length < 5) sqlmapOptions.tech = options.tech.join('')
    if (options.dbms) sqlmapOptions.dbms = options.dbms
    if (options.tamper.length > 0) sqlmapOptions.tamper = options.tamper.join(',')
    if (options.threads > 1) sqlmapOptions.threads = options.threads
    if (options.delay > 0) sqlmapOptions.delay = options.delay
    if (options.timeout !== 30) sqlmapOptions.timeout = options.timeout
    if (options.proxy) sqlmapOptions.proxy = options.proxy
    if (options.dbs) sqlmapOptions.dbs = true
    if (options.tables) sqlmapOptions.tables = true
    if (options.columns) sqlmapOptions.columns = true
    if (options.dump) sqlmapOptions.dump = true
    if (options.stop > 0) sqlmapOptions.stop = options.stop
    if (options.optimize) sqlmapOptions.optimize = true

    // 发送参数
    const setResult = await window.sqlens.setOption(taskId, sqlmapOptions)
    if (!setResult.success) {
      addLog(taskId, 'ERROR', '设置参数失败')
      return
    }
    addLog(taskId, 'SUCCESS', '参数已配置')

    // 启动
    const startResult = await window.sqlens.startScan(taskId)
    if (!startResult.success) {
      addLog(taskId, 'ERROR', '启动扫描失败')
      return
    }

    setTasks((prev) => {
      const updated = [...prev]
      const idx = updated.findIndex((t) => t.id === taskId)
      if (idx !== -1) updated[idx] = { ...updated[idx], status: 'running' }
      return updated
    })
    addLog(taskId, 'SUCCESS', '扫描已启动')

    // 开始轮询
    pollLogs(taskId)
  }, [addLog])

  const pollLogs = useCallback(async (taskId: string) => {
    if (pollingRef.current.get(taskId)) return
    pollingRef.current.set(taskId, true)

    while (pollingRef.current.get(taskId)) {
      await new Promise((r) => setTimeout(r, 2000))

      const [statusResult, logResult] = await Promise.all([
        window.sqlens.getStatus(taskId).catch(() => null),
        window.sqlens.getLog(taskId).catch(() => null)
      ])

      if (logResult?.success && logResult.log.length > 0) {
        setTasks((prev) => {
          const idx = prev.findIndex((t) => t.id === taskId)
          if (idx === -1) return prev
          const current = prev[idx]
          const existing = new Set(current.logs.map((l) => l.message))

          const newLogs = logResult.log
            .filter((line: string) => !existing.has(line))
            .map((line: string) => {
              const level: LogEntry['level'] =
                line.includes('[SUCCESS') || line.toLowerCase().includes('identified') ? 'SUCCESS' :
                line.includes('[WARNING') ? 'WARN' :
                line.includes('[ERROR') ? 'ERROR' : 'INFO'
              return {
                time: now(),
                level,
                message: line.replace(/^\[.*?\]\s*/, '').trim()
              }
            })

          if (newLogs.length === 0) return prev
          const updated = [...prev]
          updated[idx] = { ...current, logs: [...current.logs, ...newLogs] }
          return updated
        })
      }

      // 检查结束
      if (statusResult?.success) {
        const finished = ['finished', 'stopped', 'error'].includes(statusResult.status)
        if (finished) {
          pollingRef.current.set(taskId, false)
          const statusMap: Record<string, TaskStatus> = {
            finished: 'completed', stopped: 'stopped', error: 'failed'
          }
          setTasks((prev) => {
            const updated = [...prev]
            const idx = updated.findIndex((t) => t.id === taskId)
            if (idx !== -1) updated[idx] = { ...updated[idx], status: statusMap[statusResult.status] || 'completed' }
            return updated
          })
          addLog(
            taskId,
            statusResult.status === 'finished' ? 'SUCCESS' : 'WARN',
            `扫描${statusResult.status === 'finished' ? '完成' : statusResult.status === 'stopped' ? '已停止' : '出错'}`
          )
          return
        }
      }
    }
  }, [addLog])

  const stopScan = useCallback(async (taskId: string) => {
    pollingRef.current.set(taskId, false)
    await window.sqlens.stopScan(taskId)
    setTasks((prev) => {
      const updated = [...prev]
      const idx = updated.findIndex((t) => t.id === taskId)
      if (idx !== -1) updated[idx] = { ...updated[idx], status: 'stopped' }
      return updated
    })
    addLog(taskId, 'WARN', '扫描已手动停止')
  }, [addLog])

  const activeTask = tasks[activeIndex]

  return {
    tasks, activeTask, activeIndex,
    setActiveIndex, createTask, startScan, stopScan, addLog
  }
}
