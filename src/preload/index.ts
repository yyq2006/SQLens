import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // sqlmapapi 管理
  startSqlmapApi: () => ipcRenderer.invoke('sqlmap:start'),
  stopSqlmapApi: () => ipcRenderer.invoke('sqlmap:stop'),
  getSqlmapStatus: () => ipcRenderer.invoke('sqlmap:status'),

  // sqlmapapi 状态变化推送
  onSqlmapStatusChange: (callback: (connected: boolean) => void) => {
    ipcRenderer.on('sqlmap:statusChange', (_event, connected) => callback(connected))
  },
  removeSqlmapStatusChange: () => {
    ipcRenderer.removeAllListeners('sqlmap:statusChange')
  },

  // 扫描任务
  createTask: () => ipcRenderer.invoke('scan:createTask'),
  setOption: (taskId: string, options: Record<string, unknown>) =>
    ipcRenderer.invoke('scan:setOption', taskId, options),
  startScan: (taskId: string) => ipcRenderer.invoke('scan:start', taskId),
  stopScan: (taskId: string) => ipcRenderer.invoke('scan:stop', taskId),
  getStatus: (taskId: string) => ipcRenderer.invoke('scan:status', taskId),
  getData: (taskId: string) => ipcRenderer.invoke('scan:data', taskId),
  getLog: (taskId: string) => ipcRenderer.invoke('scan:log', taskId)
}

contextBridge.exposeInMainWorld('sqlens', api)
