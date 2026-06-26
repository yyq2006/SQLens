import { useState, useEffect } from 'react'

interface Props {
  onClose: () => void
  onSave: () => void
}

export function AiSettings({ onClose, onSave }: Props): JSX.Element {
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com')
  const [model, setModel] = useState('deepseek-chat')
  const [available, setAvailable] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState('')

  useEffect(() => {
    const load = async (): Promise<void> => {
      const config = await window.sqlens.getAiConfig()
      setBaseUrl(config.baseUrl)
      setModel(config.model)
      setAvailable(config.enabled)
    }
    load()
  }, [])

  const handleSave = async (): Promise<void> => {
    if (!apiKey.trim()) return
    await window.sqlens.updateAiConfig({
      apiKey: apiKey.trim(),
      baseUrl,
      model
    })
    setApiKey('')
    onSave()
  }

  const handleTest = async (): Promise<void> => {
    setTesting(true)
    setTestResult('测试中...')
    const result = await window.sqlens.analyzeRequest('http://example.com?id=1')
    setTesting(false)
    if (result.success) {
      setTestResult('✅ 连接成功！AI 可正常使用')
    } else {
      setTestResult(`❌ 失败: ${result.error}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[480px] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-700">🤖 AI 设置</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg leading-none">✕</button>
        </div>

        <div className="p-4 space-y-3">
          {/* API Key */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={available ? '已配置 (输入新 Key 覆盖)' : '输入 DeepSeek API Key'}
              className="w-full text-xs border border-slate-200 rounded px-3 py-2 outline-none focus:border-blue-400 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              可在 platform.deepseek.com 获取，也可用其他兼容 OpenAI API 的模型
            </span>
          </div>

          {/* Base URL */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">API 地址</label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded px-3 py-2 outline-none focus:border-blue-400 font-mono"
            />
          </div>

          {/* Model */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">模型</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded px-3 py-2 outline-none focus:border-blue-400 bg-white cursor-pointer"
            >
              <option value="deepseek-chat">DeepSeek Chat</option>
              <option value="deepseek-reasoner">DeepSeek Reasoner</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
            </select>
          </div>

          {/* 测试 */}
          {testResult && (
            <div className={`text-xs p-2 rounded ${testResult.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {testResult}
            </div>
          )}
        </div>

        <div className="flex justify-between px-4 py-3 border-t border-slate-200">
          <button
            onClick={handleTest}
            disabled={testing || !apiKey.trim()}
            className={`px-3 py-1.5 text-xs rounded cursor-pointer ${
              testing || !apiKey.trim()
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {testing ? '测试中...' : '🔌 测试连接'}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className={`px-4 py-1.5 text-xs rounded cursor-pointer ${
                apiKey.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              💾 保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
