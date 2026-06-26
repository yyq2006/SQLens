/// <reference types="vite/client" />

interface Api {
  startSqlmapApi: () => Promise<{ success: boolean; message: string }>
  stopSqlmapApi: () => Promise<{ success: boolean }>
  getSqlmapStatus: () => Promise<{ connected: boolean; port: number }>
  createTask: () => Promise<{ success: boolean; taskId: string }>
  setOption: (taskId: string, options: Record<string, unknown>) => Promise<{ success: boolean }>
  startScan: (taskId: string) => Promise<{ success: boolean; engineId?: string }>
  stopScan: (taskId: string) => Promise<{ success: boolean }>
  getStatus: (taskId: string) => Promise<{ status: string; success: boolean }>
  getData: (taskId: string) => Promise<{ data: unknown[]; success: boolean }>
  getLog: (taskId: string) => Promise<{ log: string[]; success: boolean }>
  onLog: (callback: (taskId: string, log: string) => void) => void
  removeLogListener: () => void
}

declare global {
  interface Window {
    sqlens: Api
  }
}
