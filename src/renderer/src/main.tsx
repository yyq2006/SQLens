import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'

// 错误边界 - 捕获渲染错误
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message + '\n' + error.stack }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('=== React 渲染错误 ===')
    console.error(error)
    console.error(info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', fontSize: 14 }}>
          <h2 style={{ color: '#ef4444' }}>❌ 渲染出错</h2>
          <pre style={{ background: '#1e293b', color: '#f1f5f9', padding: 16, borderRadius: 8, overflow: 'auto', maxHeight: '80vh' }}>
            {this.state.error}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
