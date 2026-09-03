import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Activity, ArrowDownLeft, ArrowUpRight, BarChart3, Check, Download, Flame, LogOut, Plus, RotateCcw, Sparkles, Target, Trash2, Wallet, X } from 'lucide-react'
import { useAuth } from './AuthContext'
import { LoginPage } from './AuthPages'
import type { Data, Goal, Transaction, DayNote, DayLog } from './types'

const getDaysInMonth = (month = new Date()) => new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
const monthDays = getDaysInMonth()
const habitNames = ['Зарядка', 'Чтение', 'Вода', 'Сон 8 ч', 'Медитация', 'Спорт', 'Без сахара']
const habitColors = ['cyan', 'blue', 'mint', 'violet', 'orange', 'coral', 'yellow']
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const scheduleTimes = Array.from({ length: 17 }, (_, index) => `${String(index + 7).padStart(2, '0')}:00`)
const categories = ['Еда', 'Транспорт', 'Развлечения', 'Одежда', 'Здоровье', 'Другое']
const defaultFinanceColumns = [...categories]
const incomeCategories = ['Зарплата', 'Подработка', 'Подарок', 'Продажа', 'Другое']
const emptyLog: DayLog = { sleep: 8, energy: 7, mood: '😊', lesson: '', gratitude: '', thoughts: '' }
const getCurrentMonth = () => new Date().toISOString().slice(0, 7)
const getInitialData = (): Data => {
  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const currentMonth = getCurrentMonth()
  return {
    goals: [{ id: 1, title: 'Запустить личный проект', progress: 0, done: false, weekly: [0, 0, 0, 0] }, { id: 2, title: 'Прочитать 2 книги', progress: 0, done: false, weekly: [0, 0, 0, 0] }, { id: 3, title: 'Накопить подушку', progress: 0, done: false, weekly: [0, 0, 0, 0] }],
    habits: Object.fromEntries(habitNames.map((name) => [name, Array(monthDays).fill(false)])),
    habitsByMonth: { [currentMonth]: Object.fromEntries(habitNames.map((name) => [name, Array(monthDays).fill(false)])) },
    schedule: {}, logs: { [todayKey]: emptyLog },
    transactions: [], financeColumns: defaultFinanceColumns, habitNames, scheduleTimes, userName: 'Людмила', monthResetKey: currentMonth
  }
}
const initialData = getInitialData()

function loadData(userId: string): Data { 
  try { 
    const saved = JSON.parse(localStorage.getItem(`focus-point-${userId}`) || '') as Partial<Data> & { log?: DayLog }; 
    const oldTimes = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']; 
    const savedTimes = saved.scheduleTimes?.length && JSON.stringify(saved.scheduleTimes) !== JSON.stringify(oldTimes) ? saved.scheduleTimes : scheduleTimes; 
    const goals = (saved.goals || initialData.goals).map(goal => ({ ...goal, weekly: goal.weekly?.length === 4 ? goal.weekly : [0, 0, 0, 0] })); 
    const currentMonth = getCurrentMonth()
    const transactions = (saved.transactions || initialData.transactions).map(item => ({ ...item, month: item.month || currentMonth })); 
    const todayKey = new Date().toISOString().slice(0, 10)
    const currentHabitDays = getDaysInMonth(new Date(`${currentMonth}-01T12:00:00`))
    const migratedHabits = saved.habitsByMonth || { [currentMonth]: saved.habits || Object.fromEntries((saved.habitNames || habitNames).map(name => [name, Array(currentHabitDays).fill(false)])) }
    const normalizedHabitsByMonth = Object.fromEntries(Object.entries(migratedHabits).map(([month, habits]) => { const days = getDaysInMonth(new Date(`${month}-01T12:00:00`)); return [month, Object.fromEntries((saved.habitNames || habitNames).map(name => [name, Array.from({ length: days }, (_, i) => (habits as Record<string, boolean[]>)[name]?.[i] || false)]))] }))
    if (!normalizedHabitsByMonth[currentMonth]) normalizedHabitsByMonth[currentMonth] = Object.fromEntries((saved.habitNames || habitNames).map(name => [name, Array(currentHabitDays).fill(false)]))
    const base: Data = { 
      ...initialData, 
      ...saved, 
      goals, 
      habitsByMonth: normalizedHabitsByMonth,
      habits: normalizedHabitsByMonth[currentMonth],
      transactions: transactions.filter(t => t.month === currentMonth),
      logs: saved.logs || { [todayKey]: emptyLog }, 
      schedule: saved.schedule || {}, 
      financeColumns: saved.financeColumns?.length ? saved.financeColumns : defaultFinanceColumns, 
      habitNames: saved.habitNames?.length ? saved.habitNames : habitNames, 
      scheduleTimes: savedTimes, 
      userName: saved.userName || initialData.userName, 
      monthResetKey: saved.monthResetKey || currentMonth 
    }; 
    return base.monthResetKey === currentMonth ? base : { 
      ...base, 
      goals: base.goals.map(goal => ({ ...goal, progress: 0, done: false, weekly: [0, 0, 0, 0] })), 
      habits: Object.fromEntries(base.habitNames.map(name => [name, Array(monthDays).fill(false)])),
      habitsByMonth: { ...base.habitsByMonth, [currentMonth]: Object.fromEntries(base.habitNames.map(name => [name, Array(monthDays).fill(false)])) }, 
      logs: { [todayKey]: emptyLog }, 
      transactions: base.transactions.filter(t => t.type === 'income' && t.amount > 0),
      monthResetKey: currentMonth 
    } 
  } catch { 
    return initialData 
  } 
}
function dateKey(offset: number) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10) }
function getHabitStreak(days: boolean[]) { let streak = 0; for (let i = days.length - 1; i >= 0; i--) { if (!days[i]) break; streak++ } return streak }
function getBestHabitStreak(days: boolean[]) { let best = 0; let current = 0; days.forEach(done => { current = done ? current + 1 : 0; best = Math.max(best, current) }); return best }
function getMonthName(monthStr: string): string { const [year, month] = monthStr.split('-'); const date = new Date(Number(year), Number(month) - 1); return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).toUpperCase() }
function Card({ title, eyebrow, icon, children, className = '' }: { title: string; eyebrow?: string; icon: ReactNode; children: ReactNode; className?: string }) { return <section className={`card ${className}`}><div className="card-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><span className="card-icon">{icon}</span></div>{children}</section> }
function App() {
  const { user, logout } = useAuth()

  if (!user) {
    return <LoginPage />
  }

  return <Dashboard user={user} logout={logout} />
}

function Dashboard({ user, logout }: { user: { id: string; username: string }; logout: () => void }) {
  const [data, setData] = useState<Data>(() => loadData(user.id))
  const [habitMonth, setHabitMonth] = useState(getCurrentMonth())
  const [financeMonth, setFinanceMonth] = useState(() => localStorage.getItem(`focus-point-month-${user.id}`) || getCurrentMonth())
  const [newGoal, setNewGoal] = useState('')
  const [newFinanceColumn, setNewFinanceColumn] = useState('')
  const [journalDate, setJournalDate] = useState(dateKey(0))
  const [showTransaction, setShowTransaction] = useState(false)
  const [showFinanceSettings, setShowFinanceSettings] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newHabit, setNewHabit] = useState('')
  const [newScheduleTime, setNewScheduleTime] = useState('')
  const [transaction, setTransaction] = useState({ type: 'expense' as 'income' | 'expense', category: 'Еда', amount: '', date: dateKey(0) })
  const habitNames = data.habitNames
  const habitDays = getDaysInMonth(new Date(`${habitMonth}-01T12:00:00`))
  const habitsForMonth = data.habitsByMonth?.[habitMonth] || Object.fromEntries(habitNames.map(name => [name, Array(habitDays).fill(false)]))
  const scheduleTimes = data.scheduleTimes
  const today = habitMonth === getCurrentMonth() ? new Date().getDate() : -1
  const journal = data.logs[journalDate] || emptyLog
  const updateGoalWeeks = (goal: Goal, value: string) => { const weekly = value.split(',').map(part => Math.min(100, Math.max(0, Number(part.trim()) || 0))).slice(0, 4); if (weekly.length !== 4) return; update({ goals: data.goals.map(item => item.id === goal.id ? { ...item, weekly, progress: weekly[3] } : item) }) }
  useEffect(() => localStorage.setItem(`focus-point-${user.id}`, JSON.stringify(data)), [data, user.id])
  useEffect(() => { const handleMonthChange = (event: Event) => setFinanceMonth((event as CustomEvent<string>).detail); window.addEventListener('finance-month-change', handleMonthChange); return () => window.removeEventListener('finance-month-change', handleMonthChange) }, [])
  useEffect(() => {
    if (!showSettings) return
    const rows = document.querySelectorAll<HTMLElement>('.transaction-row')
    const handlers = Array.from(rows).map((row, index) => {
      const handler = (event: Event) => {
        if ((event.target as HTMLElement).closest('button, input, select')) return
        const item = data.transactions[index]
        if (!item) return
        const value = window.prompt(`Изменить сумму операции «${item.category}»`, String(item.amount))
        if (value === null) return
        const amount = Number(value)
        if (value.trim() !== '' && amount >= 0) update({ transactions: data.transactions.map(transaction => transaction.id === item.id ? { ...transaction, amount } : transaction) })
      }
      row.addEventListener('click', handler)
      return { row, handler }
    })
    return () => handlers.forEach(({ row, handler }) => row.removeEventListener('click', handler))
  }, [showSettings, data.transactions])
  useEffect(() => {
    const rows = document.querySelectorAll<HTMLElement>('.goal-row')
    const handlers = Array.from(rows).map((row, index) => {
      const handler = () => { const goal = data.goals[index]; if (!goal) return; const value = window.prompt('Прогресс по неделям, например: 25, 50, 75, 100', goal.weekly.join(', ')); if (value !== null) updateGoalWeeks(goal, value) }
      row.addEventListener('dblclick', handler)
      return { row, handler }
    })
    rows.forEach((row, index) => row.setAttribute('data-weeks', `Недели: ${(data.goals[index]?.weekly || []).join('% · ')}%`))
    return () => handlers.forEach(({ row, handler }) => row.removeEventListener('dblclick', handler))
  }, [data.goals])
  const update = (patch: Partial<Data>) => setData(current => ({ ...current, ...patch }))
  const updateJournal = (patch: Partial<DayLog>) => update({ logs: { ...data.logs, [journalDate]: { ...journal, ...patch } } })
  const goalPercent = Math.round(data.goals.reduce((sum, goal) => sum + (goal.done ? 100 : goal.progress), 0) / Math.max(data.goals.length, 1))
  const habitDone = Object.values(habitsForMonth).flat().filter(Boolean).length
  const habitTotal = data.habitNames.length * habitDays
  const habitStats = data.habitNames.map(name => ({ name, current: getHabitStreak(habitsForMonth[name] || []), best: getBestHabitStreak(habitsForMonth[name] || []) }))
  const topStreak = habitStats.sort((a, b) => b.best - a.best)[0]
  const weeklyHabitPercent = Math.round((data.habitNames.reduce((sum, name) => sum + (habitsForMonth[name] || []).slice(Math.max(0, today - 7), Math.max(0, today)).filter(Boolean).length, 0) / Math.max(data.habitNames.length * Math.min(7, habitDays), 1)) * 100)
  const monthTransactions = data.transactions.filter(transaction => transaction.month === financeMonth)
  const income = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const expenseByCategory = data.financeColumns.map(category => ({ category, amount: monthTransactions.filter(t => t.type === 'expense' && t.category === category).reduce((s, t) => s + t.amount, 0) })).filter(item => item.amount)
  // Расписание — постоянный шаблон недели. В нём сохраняется сам план, а не отдельные недели.
  const currentWeekdayIndex = (new Date().getDay() + 6) % 7
  const schedule = weekdays.map((_, dayIndex) => data.scheduleTimes.map((_, timeIndex) => data.schedule[String(dayIndex)]?.[timeIndex] || ({ text: '', done: false })))
  const setSchedule = (dayIndex: number, timeIndex: number, patch: Partial<DayNote>) => update({ schedule: { ...data.schedule, [String(dayIndex)]: schedule[dayIndex].map((item, i) => i === timeIndex ? { ...item, ...patch } : item) } })
  const addHabit = () => { const name = newHabit.trim(); if (!name || data.habitNames.length >= 10 || data.habitNames.includes(name)) return; const nextNames = [...data.habitNames, name]; const nextByMonth = Object.fromEntries(Object.entries(data.habitsByMonth || {}).map(([month, habits]) => [month, { ...habits, [name]: Array(getDaysInMonth(new Date(`${month}-01T12:00:00`))).fill(false) }])); update({ habitNames: nextNames, habits: { ...data.habits, [name]: Array(monthDays).fill(false) }, habitsByMonth: nextByMonth }); setNewHabit('') }
  const removeHabit = (name: string) => { if (data.habitNames.length <= 1) return; const nextByMonth = Object.fromEntries(Object.entries(data.habitsByMonth || {}).map(([month, habits]) => [month, Object.fromEntries(Object.entries(habits).filter(([key]) => key !== name))])); update({ habitNames: data.habitNames.filter(item => item !== name), habits: Object.fromEntries(Object.entries(data.habits).filter(([key]) => key !== name)), habitsByMonth: nextByMonth }) }
  const addScheduleTime = () => { const time = newScheduleTime.trim(); if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || data.scheduleTimes.includes(time) || data.scheduleTimes.length >= 12) return; update({ scheduleTimes: [...data.scheduleTimes, time].sort(), schedule: Object.fromEntries(Object.entries(data.schedule).map(([day, entries]) => [day, [...entries, { text: '', done: false }]])) }); setNewScheduleTime('') }
  const removeScheduleTime = (timeIndex: number) => { if (data.scheduleTimes.length <= 1) return; update({ scheduleTimes: data.scheduleTimes.filter((_, index) => index !== timeIndex), schedule: Object.fromEntries(Object.entries(data.schedule).map(([day, entries]) => [day, entries.filter((_, index) => index !== timeIndex)])) }) }
  const addGoal = () => { if (!newGoal.trim() || data.goals.length >= 6) return; update({ goals: [...data.goals, { id: Date.now(), title: newGoal.trim(), progress: 0, done: false, weekly: [0, 0, 0, 0] }] }); setNewGoal('') }
  const openTransaction = (type: 'income' | 'expense') => {
    const availableCategories = type === 'income' ? incomeCategories : data.financeColumns
    setTransaction({ type, category: availableCategories[0] || 'Другое', amount: '', date: dateKey(0) })
    setShowTransaction(true)
  }
  const addTransaction = () => {
    const amount = Number(transaction.amount)
    if (transaction.amount.trim() === '' || amount <= 0) return
    update({ transactions: [...data.transactions, { id: Date.now(), type: transaction.type, category: transaction.category, amount, month: financeMonth, date: transaction.date }] })
    setShowTransaction(false)
  }
  const addFinanceColumn = () => { const name = newFinanceColumn.trim(); if (!name || data.financeColumns.length >= 10 || data.financeColumns.includes(name)) return; update({ financeColumns: [...data.financeColumns, name] }); setNewFinanceColumn('') }
  const renameFinanceColumn = (oldName: string, newName: string) => { const name = newName.trim(); if (!name || data.financeColumns.includes(name) && name !== oldName) return; update({ financeColumns: data.financeColumns.map(column => column === oldName ? name : column), transactions: data.transactions.map(item => item.category === oldName ? { ...item, category: name } : item) }) }
  const removeFinanceColumn = (name: string) => { if (data.financeColumns.length <= 1 || !window.confirm(`Удалить колонку «${name}» и связанные операции?`)) return; update({ financeColumns: data.financeColumns.filter(column => column !== name), transactions: data.transactions.filter(item => item.category !== name) }) }
  const exportData = () => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'focus-point-data.json'; link.click(); URL.revokeObjectURL(link.href) }
  const reset = () => { if (window.confirm('Сбросить все данные дашборда?')) setData(initialData) }
  return <main><header className="topbar"><div className="brand"><div className="brand-mark"><Sparkles size={18} /></div><div><strong>Мой трекер</strong><span>личная система продуктивности</span></div></div><div className="top-actions"><span className="today-label">{new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })}</span><span className="profile">@{user.username}</span><button className="icon-button" title="Настройки всех функций" onClick={() => setShowSettings(value => !value)}><BarChart3 size={18} /></button><button className="icon-button" title="Экспорт JSON" onClick={exportData}><Download size={18} /></button><button className="icon-button" title="Сбросить данные" onClick={reset}><RotateCcw size={18} /></button><button className="icon-button" title="Выход" onClick={logout}><LogOut size={18} /></button></div></header>{showSettings && <LegacySettingsPanel data={data} update={update} newHabit={newHabit} setNewHabit={setNewHabit} addHabit={addHabit} removeHabit={removeHabit} newScheduleTime={newScheduleTime} setNewScheduleTime={setNewScheduleTime} addScheduleTime={addScheduleTime} removeScheduleTime={removeScheduleTime} />}
    <div className="content"><div className="welcome"><div><span className="eyebrow">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</span><h1>Держи курс, <em>{user.username}.</em></h1><p>Маленькие шаги складываются в большие изменения. {topStreak?.best ? `Лучшая серия: ${topStreak.name} — ${topStreak.best} дн. 🔥` : 'Начни сегодня и создай свою первую серию! 🔥'}</p></div><div className="daily-score"><div className="score-ring"><span>{Math.round((goalPercent + weeklyHabitPercent) / 2)}<small>%</small></span></div><span>фокус дня</span></div></div>
      <div className="stats"><Stat icon={<Target />} label="Цели" value={`${goalPercent}%`} detail="средний прогресс" color="blue" /><Stat icon={<Flame />} label="Привычки" value={`${Math.round(habitDone / Math.max(habitTotal, 1) * 100)}%`} detail="выполнено за месяц" color="mint" /><Stat icon={<Activity />} label="Расписание" value={`${Math.round(schedule.flat().filter(item => item.text.trim()).length / Math.max(data.scheduleTimes.length * 7, 1) * 100)}%`} detail="заполнено в шаблоне" color="orange" /></div>
      <div className="dashboard-grid"><Card title="Цели месяца" eyebrow={`${data.goals.length} из 6 целей`} icon={<Target size={20} />} className="goals-card"><div className="total-progress"><div><strong>{goalPercent}%</strong><span>общий прогресс</span></div><div className="progress-track"><i style={{ width: `${goalPercent}%` }} /></div></div><div className="goals-list">{data.goals.map(goal => <div className="goal-row" key={goal.id}><button className={`check ${goal.done ? 'checked' : ''}`} onClick={() => update({ goals: data.goals.map(item => item.id === goal.id ? { ...item, done: !item.done } : item) })}>{goal.done && <Check size={13} />}</button><div className="goal-main"><div className="goal-title"><span>{goal.title}</span><b>{goal.done ? 100 : goal.progress}%</b></div><div className="progress-track"><i style={{ width: `${goal.done ? 100 : goal.progress}%` }} /></div></div><button className="delete-button" title="Удалить цель" onClick={() => update({ goals: data.goals.filter(item => item.id !== goal.id) })}><Trash2 size={15} /></button></div>)}</div><div className="add-inline"><input value={newGoal} onChange={e => setNewGoal(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGoal()} placeholder="Добавить новую цель..." /><button onClick={addGoal} title="Добавить цель"><Plus size={17} /></button></div></Card>
        <Card title="Привычки" eyebrow={getMonthName(habitMonth)} icon={<Flame size={20} />} className="habits-card">
          <div className="habit-month-control">
            <label><span>Месяц</span><input type="month" value={habitMonth} onChange={e => setHabitMonth(e.target.value)} /></label>
            <small>Отмечай привычки одним нажатием — история сохраняется по месяцам</small>
          </div>

          <div className="habits-overview">
            <div className="habits-overview-main"><strong>{Math.round(habitDone / Math.max(habitTotal, 1) * 100)}%</strong><span>выполнено за месяц</span></div>
            <div><b>{habitDone}</b><span>отметок</span></div>
            <div><b>{topStreak?.best || 0} 🔥</b><span>лучшая серия</span></div>
            <div><b>{habitNames.length}</b><span>привычек</span></div>
          </div>

          <div className="habit-cards">
            {habitNames.map((name, habitIndex) => {
              const days = habitsForMonth[name] || Array(habitDays).fill(false)
              const doneCount = days.filter(Boolean).length
              const currentStreak = getHabitStreak(days)
              const bestStreak = getBestHabitStreak(days)
              return <section className="habit-item-card" key={name}>
                <div className="habit-item-head">
                  <div className="habit-title-wrap"><i className={`habit-dot large ${habitColors[habitIndex]}`} /><div><h3>{name}</h3><span>{doneCount} из {habitDays} дней • сейчас {currentStreak} дн. подряд</span></div></div>
                  <div className="habit-item-streak"><span>Лучшая серия</span><b>🔥 {bestStreak}</b></div>
                </div>
                <div className="habit-days-grid">
                  {days.map((done, day) => <button key={day} className={`habit-day-button ${done ? 'filled' : ''} ${day + 1 === today ? 'today' : ''}`} onClick={() => {
                    const next = days.map((v, i) => i === day ? !v : v)
                    const nextMonth = { ...habitsForMonth, [name]: next }
                    update({ habits: habitMonth === getCurrentMonth() ? nextMonth : data.habits, habitsByMonth: { ...data.habitsByMonth, [habitMonth]: nextMonth } })
                  }} title={`${day + 1} ${getMonthName(habitMonth)}`}>
                    <span>{day + 1}</span>{done && <Check size={12} />}
                  </button>)}
                </div>
              </section>
            })}
          </div>
        </Card>
        <Card title="Постоянное расписание" eyebrow="ФИКСИРОВАННЫЙ ШАБЛОН НЕДЕЛИ" icon={<Activity size={20} />} className="schedule-card"><div className="week-controls"><span>Заполняется один раз и автоматически повторяется каждую неделю</span><small>Изменения сохраняются сразу</small></div><div className="schedule-table"><div className="time-corner">Время</div>{weekdays.map((day, index) => <div className={`schedule-header ${index === currentWeekdayIndex ? 'is-today' : ''}`} key={day}><span>{day}</span>{index === currentWeekdayIndex && <b>Сегодня</b>}</div>)}{scheduleTimes.map((time, timeIndex) => <div className="schedule-row" key={time}><span className="schedule-time">{time}</span>{schedule.map((day, dayIndex) => <div className={`schedule-slot ${dayIndex === currentWeekdayIndex ? 'is-today' : ''}`} key={`${dayIndex}-${time}`}><textarea value={day[timeIndex].text} onChange={e => setSchedule(dayIndex, timeIndex, { text: e.target.value })} placeholder="Что запланировано?" /><span className="schedule-fixed-label">Повторяется еженедельно</span></div>)}</div>)}</div></Card>
        <Card title="Финансы" eyebrow="ДОХОДЫ И РАСХОДЫ" icon={<Wallet size={22} />} className="finance-card">
          <div className="finance-toolbar">
            <div>
              <span className="finance-period-label">Финансы за месяц</span>
              <input className="finance-month-input" type="month" value={financeMonth} onChange={e => { setFinanceMonth(e.target.value); localStorage.setItem(`focus-point-month-${user.id}`, e.target.value) }} />
            </div>
            <button className="finance-settings-button" onClick={() => setShowFinanceSettings(value => !value)}>Настроить категории</button>
          </div>

          <div className="money-summary money-summary-large">
            <div className="money-card income-card"><span>Доходы</span><strong className="income">+{income.toLocaleString('ru-RU')} ₽</strong><small>за выбранный месяц</small></div>
            <div className="money-card expense-card"><span>Расходы</span><strong className="expense">−{expenses.toLocaleString('ru-RU')} ₽</strong><small>за выбранный месяц</small></div>
            <div className="money-card balance-card"><span>Остаток</span><strong>{(income - expenses).toLocaleString('ru-RU')} ₽</strong><small>доступно сейчас</small></div>
          </div>

          <div className="finance-action-buttons">
            <button className="income-button" onClick={() => openTransaction('income')}><ArrowUpRight size={20} /> Добавить доход</button>
            <button className="expense-button" onClick={() => openTransaction('expense')}><ArrowDownLeft size={20} /> Добавить расход</button>
          </div>

          {showTransaction && <div className="transaction-modal-backdrop" onClick={() => setShowTransaction(false)}>
            <div className="transaction-modal" onClick={e => e.stopPropagation()}>
              <div className="transaction-modal-head">
                <div><span className="eyebrow">{transaction.type === 'income' ? 'НОВАЯ ОПЕРАЦИЯ' : 'НОВАЯ ОПЕРАЦИЯ'}</span><h3>{transaction.type === 'income' ? 'Добавить доход' : 'Добавить расход'}</h3></div>
                <button className="close-button" onClick={() => setShowTransaction(false)}><X size={20} /></button>
              </div>
              <label className="amount-field"><span>Сумма</span><input autoFocus type="number" min="1" inputMode="decimal" value={transaction.amount} onChange={e => setTransaction({ ...transaction, amount: e.target.value })} placeholder="Например, 1500" /><b>₽</b></label>
              <label className="form-field"><span>Категория</span><select value={transaction.category} onChange={e => setTransaction({ ...transaction, category: e.target.value })}>{(transaction.type === 'income' ? incomeCategories : data.financeColumns).map(c => <option key={c}>{c}</option>)}</select></label>
              <label className="form-field"><span>Дата</span><input type="date" value={transaction.date} onChange={e => setTransaction({ ...transaction, date: e.target.value })} /></label>
              <button className={transaction.type === 'income' ? 'save-income' : 'save-expense'} onClick={addTransaction}>Сохранить {transaction.type === 'income' ? 'доход' : 'расход'}</button>
            </div>
          </div>}

          {showFinanceSettings && <div className="finance-columns">
            <div className="finance-columns-head"><div><strong>Категории расходов</strong><small>Они нужны только для удобного выбора расходов</small></div></div>
            <div className="column-list">{data.financeColumns.map(column => <div className="column-item" key={column}><input value={column} onChange={e => renameFinanceColumn(column, e.target.value)} onBlur={e => renameFinanceColumn(column, e.target.value)} /><button className="delete-button" title="Удалить категорию" onClick={() => removeFinanceColumn(column)}><Trash2 size={14} /></button></div>)}</div>
            <div className="add-column"><input value={newFinanceColumn} maxLength={24} onChange={e => setNewFinanceColumn(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFinanceColumn()} placeholder="Новая категория..." /><button onClick={addFinanceColumn} title="Добавить категорию"><Plus size={16} /></button></div>
          </div>}

          <div className="finance-lower">
            <div className="transactions-list">
              <div className="section-title"><strong>Последние операции</strong><span>{monthTransactions.length} операций</span></div>
              {monthTransactions.length === 0 ? <div className="empty-transactions">Пока нет операций. Добавь первый доход или расход кнопками выше.</div> : monthTransactions.slice().sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? ''))).slice(0,6).map(item => <div className="finance-transaction" key={item.id}><span className={item.type === 'income' ? 'transaction-icon income' : 'transaction-icon expense'}>{item.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}</span><div><b>{item.category}</b><small>{item.date ? new Date(`${item.date}T12:00:00`).toLocaleDateString('ru-RU') : 'Дата не указана'}</small></div><strong className={item.type === 'income' ? 'income' : 'expense'}>{item.type === 'income' ? '+' : '−'}{item.amount.toLocaleString('ru-RU')} ₽</strong></div>)}
            </div>
            <ExpenseChart items={expenseByCategory} />
          </div>
        </Card>
        <Card title="День" eyebrow="ДНЕВНИК" icon={<Sparkles size={20} />} className="journal-card"><div className="journal-calendar">{Array.from({ length: monthDays }, (_, i) => { const currentMonth = getCurrentMonth(); const key = `${currentMonth}-${String(i + 1).padStart(2, '0')}`; return <button className={`${journalDate === key ? 'selected' : ''} ${data.logs[key] ? 'has-note' : ''}`} key={key} onClick={() => setJournalDate(key)}>{i + 1}</button> })}</div><div className="sliders"><Range label="Сон" value={journal.sleep} onChange={sleep => updateJournal({ sleep })} color="blue" /><Range label="Энергия" value={journal.energy} onChange={energy => updateJournal({ energy })} color="mint" /></div><div className="moods"><span>Настроение</span>{['😊', '😐', '😢', '🔥'].map(mood => <button className={journal.mood === mood ? 'selected' : ''} key={mood} onClick={() => updateJournal({ mood })}>{mood}</button>)}</div><div className="journal-fields"><textarea value={journal.lesson} onChange={e => updateJournal({ lesson: e.target.value })} placeholder="Урок дня" /><textarea value={journal.gratitude} onChange={e => updateJournal({ gratitude: e.target.value })} placeholder="За что благодарна" /><textarea className="wide" value={journal.thoughts} onChange={e => updateJournal({ thoughts: e.target.value })} placeholder="Мысли и наблюдения" /></div></Card>
      </div><NameEditor data={data} update={update} userId={user.id} /><footer><span>Данные сохраняются автоматически</span><span>Точка фокуса · 2026</span></footer></div>{/* analytics is represented by the summary row and live aggregates */}</main>
}
function Stat({ icon, label, value, detail, color }: { icon: ReactNode; label: string; value: string; detail: string; color: string }) { return <div className="stat"><span className={`stat-icon ${color}`}>{icon}</span><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div> }
function Range({ label, value, onChange, color }: { label: string; value: number; onChange: (value: number) => void; color: string }) { return <label className="range"><span>{label}<b>{value}/10</b></span><input type="range" min="1" max="10" value={value} onChange={e => onChange(Number(e.target.value))} style={{ accentColor: color === 'blue' ? '#2563eb' : '#0ea5a4' }} /></label> }
function ExpenseChart({ items }: { items: { category: string; amount: number }[] }) { const canvasRef = useRef<HTMLCanvasElement>(null); const max = Math.max(...items.map(i => i.amount), 1); useEffect(() => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d')!; ctx.clearRect(0, 0, canvas.width, canvas.height); items.forEach((item, index) => { const x = 12 + index * (canvas.width - 24) / Math.max(items.length, 1); const height = item.amount / max * 86; ctx.fillStyle = ['#2563eb', '#0ea5a4', '#f59e0b', '#ef6a6a', '#7c6be8', '#94a3b8'][index]; ctx.roundRect(x, 100 - height, 22, height, 5); ctx.fill(); ctx.fillStyle = '#8995a7'; ctx.font = '10px sans-serif'; ctx.fillText(item.category.slice(0, 5), x - 2, 118) }) }, [items, max]); return <div className="chart-wrap"><canvas ref={canvasRef} width="300" height="125" /><div className="chart-total"><ArrowDownLeft size={14} /> расходы по категориям</div></div> }

function NameEditor({ data, update, userId }: { data: Data; update: (patch: Partial<Data>) => void; userId: string }) { return <div className="name-editor"><span>Ваше имя</span><input value={data.userName} onChange={e => update({ userName: e.target.value })} placeholder="Введите имя" /></div> }


function LegacySettingsPanel({ data, update, newHabit, setNewHabit, addHabit, removeHabit, newScheduleTime, setNewScheduleTime, addScheduleTime, removeScheduleTime }: { data: Data; update: (patch: Partial<Data>) => void; newHabit: string; setNewHabit: (value: string) => void; addHabit: () => void; removeHabit: (name: string) => void; newScheduleTime: string; setNewScheduleTime: (value: string) => void; addScheduleTime: () => void; removeScheduleTime: (index: number) => void }) { return <section className="settings-panel"><div className="settings-head"><div><span className="eyebrow">УПРАВЛЕНИЕ ДАННЫМИ</span><h2>Настройки трекера</h2></div><span className="settings-note">Изменения сохраняются автоматически</span></div><div className="settings-grid"><div><h3>Цели и прогресс</h3>{data.goals.map(goal => <div className="setting-row" key={goal.id}><input value={goal.title} onChange={e => update({ goals: data.goals.map(item => item.id === goal.id ? { ...item, title: e.target.value } : item) })} /><input type="number" min="0" max="100" value={goal.progress} onChange={e => update({ goals: data.goals.map(item => item.id === goal.id ? { ...item, progress: Math.min(100, Math.max(0, Number(e.target.value))) } : item) })} /><button className="delete-button" title="Удалить цель" onClick={() => update({ goals: data.goals.filter(item => item.id !== goal.id) })}><Trash2 size={14} /></button></div>)}</div><div><h3>Привычки <small>{data.habitNames.length}/10</small></h3>{data.habitNames.map(name => <div className="setting-row" key={name}><input value={name} readOnly /><button className="delete-button" onClick={() => removeHabit(name)}><Trash2 size={14} /></button></div>)}<div className="setting-add"><input value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHabit()} placeholder="Добавить привычку" /><button onClick={addHabit}><Plus size={15} /></button></div></div><div><h3>Временные слоты <small>{data.scheduleTimes.length}/12</small></h3>{data.scheduleTimes.map((time, index) => <div className="setting-row" key={time}><input value={time} readOnly /><button className="delete-button" onClick={() => removeScheduleTime(index)}><Trash2 size={14} /></button></div>)}<div className="setting-add"><input value={newScheduleTime} onChange={e => setNewScheduleTime(e.target.value)} onKeyDown={e => e.key === 'Enter' && addScheduleTime()} placeholder="Например, 21:00" /><button onClick={addScheduleTime}><Plus size={15} /></button></div></div><div><h3>Доходы и расходы</h3>{data.transactions.map(item => <div className="setting-row transaction-row" key={item.id}><span className={item.type === 'income' ? 'income' : 'expense'}>{item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString('ru-RU')} ₽</span><span>{item.category}</span><button className="delete-button" onClick={() => update({ transactions: data.transactions.filter(transactionItem => transactionItem.id !== item.id) })}><Trash2 size={14} /></button></div>)}</div></div></section> }

export default App