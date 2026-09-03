import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './AuthContext'
import './styles.css'
import './mobile.css'

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Focus Point runtime error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: '100vh', padding: '32px 20px', background: '#fafbf9', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: 24, background: '#fff', border: '1px solid #e7ebf2', borderRadius: 16 }}>
            <h1 style={{ marginTop: 0 }}>Мой трекер</h1>
            <p>Приложение столкнулось с ошибкой при запуске.</p>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding: 16, background: '#f5f7fa', borderRadius: 10, fontSize: 13 }}>{this.state.error.message}</pre>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 16px', border: 0, borderRadius: 9, background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
              Перезагрузить
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

const root = document.getElementById('root')

if (root) {
  createRoot(root).render(
    <StrictMode>
      <AppErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppErrorBoundary>
    </StrictMode>
  )
}

// Service worker is intentionally disabled for the web build.
// It could cache an old index.html/JS bundle and cause a blank screen after deploys.
