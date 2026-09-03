import { useState } from 'react'
import { useAuth } from './AuthContext'
import { LogIn, UserPlus, AlertCircle, Target, KeyRound, ArrowLeft } from 'lucide-react'

type AuthMode = 'login' | 'register' | 'recovery'

export function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login, register, resetPassword } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === 'recovery') {
      if (newPassword.length < 4) {
        setError('Новый пароль должен быть минимум 4 символа')
        return
      }
      if (!resetPassword(username, newPassword)) {
        setError('Пользователь с таким именем не найден')
        return
      }
      setSuccess('Пароль успешно изменён. Теперь можно войти.')
      setPassword('')
      setNewPassword('')
      return
    }

    if (mode === 'register') {
      if (password.length < 4) {
        setError('Пароль должен быть минимум 4 символа')
        return
      }
      if (!register(username, password)) {
        setError('Ошибка регистрации. Проверьте, что пользователь не существует')
        return
      }
    } else if (!login(username, password)) {
      setError('Неверное имя пользователя или пароль')
      return
    }

    setUsername('')
    setPassword('')
  }

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
    setPassword('')
    setNewPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-purple-400 to-pink-400 p-3 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Мой трекер</h1>
            <p className="text-slate-400">
              {mode === 'recovery' ? 'Восстановление доступа' : 'Управляй своим временем и целями'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2 items-start">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-emerald-300 text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Имя пользователя</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите имя пользователя"
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                required
              />
            </div>

            {mode !== 'recovery' && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                />
                {mode === 'register' && <p className="text-slate-400 text-xs mt-1">Минимум 4 символа</p>}
              </div>
            )}

            {mode === 'recovery' && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Новый пароль</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Придумайте новый пароль"
                  minLength={4}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                />
                <p className="text-slate-400 text-xs mt-1">Минимум 4 символа</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 mt-6"
            >
              {mode === 'register' ? (
                <><UserPlus className="w-5 h-5" />Создать аккаунт</>
              ) : mode === 'recovery' ? (
                <><KeyRound className="w-5 h-5" />Изменить пароль</>
              ) : (
                <><LogIn className="w-5 h-5" />Войти</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-slate-400 text-sm space-y-3">
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => switchMode('recovery')}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition flex items-center justify-center gap-2 mx-auto"
                >
                  <KeyRound className="w-4 h-4" />Забыли пароль?
                </button>
                <div>
                  Нет аккаунта?{' '}
                  <button type="button" onClick={() => switchMode('register')} className="text-purple-400 hover:text-purple-300 font-semibold transition">
                    Зарегистрироваться
                  </button>
                </div>
              </>
            )}

            {mode === 'register' && (
              <div>
                Уже есть аккаунт?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-purple-400 hover:text-purple-300 font-semibold transition">
                  Войти
                </button>
              </div>
            )}

            {mode === 'recovery' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-purple-400 hover:text-purple-300 font-semibold transition flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />Вернуться ко входу
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">v0.1.0 • Личный трекер целей, привычек и финансов</p>
      </div>
    </div>
  )
}
