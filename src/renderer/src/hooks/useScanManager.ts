import { useState, useCallback, useRef } from 'react'
import type { Task, LogEntry, ScanOptions, TaskStatus } from '../types'

export function useScanManager(aiEnabled = false) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const pollingRef = useRef<Map<string, boolean>>(new Map())
  const interpretedRef = useRef<Set<string>>(new Set())

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

  /** AI 解读日志（带缓存，避免重复调） */
  const interpretIfNeeded = useCallback(async (taskId: string, message: string): Promise<string | undefined> => {
    if (!aiEnabled) return undefined
    // 只解读关键日志
    const keyMsgs = ['identified', 'injection', '注入', 'SUCCESS', '参数', 'table', 'database', 'column', 'dump', '盲注', '报错']
    const isKey = keyMsgs.some((k) => message.toLowerCase().includes(k))
    if (!isKey) return undefined

    // 去重
    const cacheKey = `${taskId}:${message.slice(0, 50)}`
    if (interpretedRef.current.has(cacheKey)) return undefined
    interpretedRef.current.add(cacheKey)

    try {
      const result = await window.sqlens.interpretLog(message)
      if (result.success && result.data) return result.data
    } catch {
      // AI 解读失败不阻塞流程
    }
    return undefined
  }, [aiEnabled])

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

    const setResult = await window.sqlens.setOption(taskId, sqlmapOptions)
    if (!setResult.success) {
      addLog(taskId, 'ERROR', '设置参数失败')
      return
    }
    addLog(taskId, 'SUCCESS', '参数已配置')

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
        for (const line of logResult.log) {
          setTasks((prev) => {
            const idx = prev.findIndex((t) => t.id === taskId)
            if (idx === -1) return prev
            const current = prev[idx]
            if (current.logs.some((l) => l.message === line)) return prev

            const level: LogEntry['level'] =
              line.includes('[SUCCESS') || line.toLowerCase().includes('identified') ? 'SUCCESS' :
              line.includes('[WARNING') ? 'WARN' :
              line.includes('[ERROR') ? 'ERROR' : 'INFO'

            const clean = line.replace(/^\[.*?\]\s*/, '').trim()
            const updated = [...prev]
            updated[idx] = {
              ...current,
              logs: [...current.logs, { time: now(), level, message: clean }]
            }
            return updated
          })

          // AI 异步解读（不阻塞日志展示）
          if (aiEnabled) {
            const cleanLine = line.replace(/^\[.*?\]\s*/, '').trim()
            interpretIfNeeded(taskId, cleanLine).then((aiText) => {
              if (aiText) {
                setTasks((prev) => {
                  const idx = prev.findIndex((t) => t.id === taskId)
                  if (idx === -1) return prev
                  const updated = [...prev]
                  const logs = [...updated[idx].logs]
                  const lastLog = logs[logs.length - 1]
                  if (lastLog && lastLog.message === cleanLine && !lastLog.ai) {
                    logs[logs.length - 1] = { ...lastLog, ai: aiText }
                  }
                  updated[idx] = { ...updated[idx], logs }
                  return updated
                })
              }
            })
          }
        }
      }

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
  }, [addLog, aiEnabled, interpretIfNeeded])

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

  /** 移除任务 */
  const removeTask = useCallback((taskId: string) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === taskId)
      if (idx === -1) return prev
      const updated = [...prev]
      updated.splice(idx, 1)
      return updated
    })
    // 如果关闭的是当前活跃任务，切换到前一个
    setActiveIndex((prev) => {
      if (tasks.length <= 1) return 0
      const idx = tasks.findIndex((t) => t.id === taskId)
      if (idx <= prev && prev > 0) return prev - 1
      return prev >= tasks.length - 1 ? tasks.length - 2 : prev
    })
  }, [tasks.length])

  return {
    tasks, activeTask, activeIndex,
    setActiveIndex, createTask, startScan, stopScan, addLog, removeTask
  }
}
