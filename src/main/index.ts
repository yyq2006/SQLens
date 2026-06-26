import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { SqlmapApiManager } from './sqlmap-manager'
import { AiService } from './ai-service'

let mainWindow: BrowserWindow | null = null
const sqlmapManager = new SqlmapApiManager({
  autoStart: true,
  pythonPath: 'python'
})
const aiService = new AiService()

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'SQLens',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ====== IPC Handlers ======

// sqlmapapi 管理
ipcMain.handle('sqlmap:start', async () => {
  return await sqlmapManager.start()
})

ipcMain.handle('sqlmap:stop', async () => {
  return await sqlmapManager.stop()
})

ipcMain.handle('sqlmap:status', async () => {
  const connected = await sqlmapManager.ping()
  return { connected, port: 8775 }
})

// sqlmapapi 状态变化推送到渲染进程
sqlmapManager.onStatusChangeCallback((connected) => {
  mainWindow?.webContents.send('sqlmap:statusChange', connected)
})

// 扫描任务 (REST 代理)
ipcMain.handle('scan:createTask', async () => {
  try {
    const res = await fetch(`${sqlmapManager.baseUrl}/task/new`, { method: 'POST' })
    const data = await res.json()
    return { success: data.success, taskId: data.taskid }
  } catch (err) {
    const error = err as Error
    return { success: false, taskId: '', error: error.message }
  }
})

ipcMain.handle('scan:setOption', async (_event, taskId: string, options: Record<string, unknown>) => {
  try {
    const res = await fetch(`${sqlmapManager.baseUrl}/option/${taskId}/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    })
    const data = await res.json()
    return { success: data.success }
  } catch (err) {
    const error = err as Error
    return { success: false, error: error.message }
  }
})

ipcMain.handle('scan:start', async (_event, taskId: string) => {
  try {
    const res = await fetch(`${sqlmapManager.baseUrl}/scan/${taskId}/start`, { method: 'POST' })
    const data = await res.json()
    return { success: data.success, engineId: data.engineid }
  } catch (err) {
    const error = err as Error
    return { success: false, error: error.message }
  }
})

ipcMain.handle('scan:stop', async (_event, taskId: string) => {
  try {
    const res = await fetch(`${sqlmapManager.baseUrl}/scan/${taskId}/stop`)
    const data = await res.json()
    return { success: data.success }
  } catch (err) {
    const error = err as Error
    return { success: false, error: error.message }
  }
})

ipcMain.handle('scan:status', async (_event, taskId: string) => {
  try {
    const res = await fetch(`${sqlmapManager.baseUrl}/scan/${taskId}/status`)
    const data = await res.json()
    return { status: data.status, success: data.success }
  } catch (err) {
    const error = err as Error
    return { status: 'error', success: false, error: error.message }
  }
})

ipcMain.handle('scan:data', async (_event, taskId: string) => {
  try {
    const res = await fetch(`${sqlmapManager.baseUrl}/scan/${taskId}/data`)
    const data = await res.json()
    return { data: data.data, success: data.success }
  } catch (err) {
    const error = err as Error
    return { data: [], success: false, error: error.message }
  }
})

ipcMain.handle('scan:log', async (_event, taskId: string) => {
  try {
    const res = await fetch(`${sqlmapManager.baseUrl}/scan/${taskId}/log`)
    const data = await res.json()
    return { log: data.log, success: data.success }
  } catch (err) {
    const error = err as Error
    return { log: [], success: false, error: error.message }
  }
})

// ====== AI IPC Handlers ======

ipcMain.handle('ai:getConfig', () => {
  return aiService.getConfig()
})

ipcMain.handle('ai:updateConfig', (_event, config: { apiKey: string; baseUrl?: string; model?: string }) => {
  aiService.updateConfig(config)
  return { success: true }
})

ipcMain.handle('ai:check', () => {
  return { available: aiService.isAvailable() }
})

ipcMain.handle('ai:analyzeRequest', async (_event, url: string, data?: string) => {
  try {
    const result = await aiService.analyzeRequest(url, data)
    return { success: true, data: result }
  } catch (err) {
    const error = err as Error
    return { success: false, error: error.message }
  }
})

ipcMain.handle('ai:interpretLog', async (_event, logLine: string) => {
  try {
    const result = await aiService.interpretLog(logLine)
    return { success: true, data: result }
  } catch {
    return { success: false, error: '解读失败' }
  }
})

ipcMain.handle('ai:generateReport', async (_event, scanSummary: string) => {
  try {
    const result = await aiService.generateReport(scanSummary)
    return { success: true, data: result }
  } catch (err) {
    const error = err as Error
    return { success: false, error: error.message }
  }
})

ipcMain.handle('ai:understandCommand', async (_event, command: string, context: string) => {
  try {
    const result = await aiService.understandCommand(command, context)
    return { success: true, data: result }
  } catch (err) {
    const error = err as Error
    return { success: false, error: error.message }
  }
})

// ====== App Lifecycle ======

app.whenReady().then(async () => {
  createWindow()

  // 自动启动 sqlmapapi
  const result = await sqlmapManager.start()
  console.log(`[SQLens] ${result.message}`)

  if (result.success) {
    sqlmapManager.startHealthCheck()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  sqlmapManager.dispose()
})
