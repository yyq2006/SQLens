import { useState, useEffect } from 'react'

interface Props {
  onClose: () => void
  onSave: () => void
}

const PRESET_MODELS = [
  { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash (默认)' },
  { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat (旧版, 即将废弃)' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'custom', label: '自定义模型...' }
]

export function AiSettings({ onClose, onSave }: Props): JSX.Element {
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com')
  const [model, setModel] = useState('deepseek-v4-flash')
  const [customModel, setCustomModel] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('deepseek-v4-flash')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState('')
  const [hasConfig, setHasConfig] = useState(false)

  useEffect(() => {
    const load = async (): Promise<void> => {
      const config = await window.sqlens.getAiConfig()
      setBaseUrl(config.baseUrl)
      setModel(config.model || 'deepseek-v4-flash')
      setHasConfig(config.enabled)

      // 判断当前模型是否在预设列表中
      const preset = PRESET_MODELS.find((p) => p.value === config.model)
      if (preset) {
        setSelectedPreset(preset.value)
      } else if (config.model) {
        setSelectedPreset('custom')
        setCustomModel(config.model)
      }
    }
    load()
  }, [])

  const getEffectiveModel = (): string => {
    return selectedPreset === 'custom' ? customModel : selectedPreset
  }

  const handleSave = async (): Promise<void> => {
    const effectiveModel = getEffectiveModel()
    if (!effectiveModel) return
    if (selectedPreset === 'custom' && !customModel.trim()) return
    if (!apiKey.trim() && !hasConfig) return

    await window.sqlens.updateAiConfig({
      apiKey: apiKey.trim() || undefined,
      baseUrl,
      model: effectiveModel
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
      setTestResult(`❌ ${result.error}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-[520px] flex flex-col border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">🤖 AI 模型配置</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* API Key */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1.5">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasConfig ? '已配置，输入新 Key 覆盖' : '输入 API Key'}
              className="w-full text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 outline-none focus:border-blue-400 font-mono dark:text-slate-200"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              可在 platform.deepseek.com 获取，支持 OpenAI 兼容接口
            </span>
          </div>

          {/* Base URL */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1.5">API 地址</label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 outline-none focus:border-blue-400 font-mono dark:text-slate-200"
            />
          </div>

          {/* 模型选择 */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1.5">模型</label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 outline-none focus:border-blue-400 cursor-pointer dark:text-slate-200"
            >
              {PRESET_MODELS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            {selectedPreset === 'custom' && (
              <input
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="输入自定义模型名称，如 gpt-4-turbo"
                className="w-full text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 mt-2 bg-white dark:bg-slate-900 outline-none focus:border-blue-400 font-mono dark:text-slate-200"
              />
            )}
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div className={`text-xs p-2.5 rounded-lg ${
              testResult.includes('✅') ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
              'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300'
            }`}>
              {testResult}
            </div>
          )}

          {/* 当前生效模型 */}
          {model && (
            <div className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
              当前模型: <span className="font-mono text-slate-600 dark:text-slate-300">{model}</span>
              <span className="ml-2 text-slate-400">|</span>
              {hasConfig
                ? <span className="text-green-500 ml-2">● 已配置</span>
                : <span className="text-slate-400 ml-2">未配置</span>
              }
            </div>
          )}
        </div>

        <div className="flex justify-between items-center px-5 py-3.5 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleTest}
            disabled={testing || (!apiKey.trim() && !hasConfig)}
            className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
              testing || (!apiKey.trim() && !hasConfig)
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {testing ? '测试中...' : '🔌 测试连接'}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim() && !hasConfig}
              className={`px-4 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                apiKey.trim() || hasConfig
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
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
