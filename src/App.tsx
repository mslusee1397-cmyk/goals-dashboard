import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Activity, ArrowDownLeft, ArrowUpRight, BarChart3, Check, ChevronLeft, ChevronRight, Download, Flame, LogOut, Plus, RotateCcw, Sparkles, Target, Trash2, Wallet, X } from 'lucide-react'
import { useAuth } from './AuthContext'
import { LoginPage } from './AuthPages'
import type { Data, Goal, Transaction, DayNote, DayLog } from './types'

const monthDays = 31
const habitNames = ['Зарядка', 'Чтение', 'Вода', 'Сон 8 ч', 'Медитация', 'Спорт', 'Без сахара']
const habitColors = ['cyan', 'blue', 'mint', 'violet', 'orange', 'coral', 'yellow']
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const scheduleTimes = Array.from({ length: 17 }, (_, index) => `${String(index + 7).padStart(2, '0')}:00`)
const categories = ['Еда', 'Транспорт', 'Развлечения', 'Одежда', 'Здоровье', 'Другое']
const defaultFinanceColumns = [...categories, 'Зарплата']
const emptyLog: DayLog = { sleep: 8, energy: 7, mood: '😊', lesson: '', gratitude: '', thoughts: '' }
const getCurrentMonth = () => new Date().toISOString().slice(0, 7)
const getInitialData = (): Data => {
  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const currentMonth = getCurrentMonth()
  return {
    goals: [{ id: 1, title: 'Запустить личный проект', progress: 0, done: false, weekly: [0, 0, 0, 0] }, { id: 2, title: 'Прочитать 2 книги', progress: 0, done: false, weekly: [0, 0, 0, 0] }, { id: 3, title: 'Накопить подушку', progress: 0, done: false, weekly: [0, 0, 0, 0] }],
    habits: Object.fromEntries(habitNames.map((name) => [name, Array(monthDays).fill(false)])),
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
    const base: Data = { 
      ...initialData, 
      ...saved, 
      goals, 
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
      logs: { [todayKey]: emptyLog }, 
      transactions: base.transactions.filter(t => t.type === 'income' && t.amount > 0),
      monthResetKey: currentMonth 
    } 
  } catch { 
    return initialData 
  } 
}
function dateKey(offset: number) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10) }
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
  const [weekOffset, setWeekOffset] = useState(0)
  const [financeMonth, setFinanceMonth] = useState(() => localStorage.getItem(`focus-point-month-${user.id}`) || getCurrentMonth())
  const [newGoal, setNewGoal] = useState('')
  const [newFinanceColumn, setNewFinanceColumn] = useState('')
  const [journalDate, setJournalDate] = useState(dateKey(0))
  const [showTransaction, setShowTransaction] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newHabit, setNewHabit] = useState('')
  const [newScheduleTime, setNewScheduleTime] = useState('')
  const [transaction, setTransaction] = useState({ type: 'expense' as 'income' | 'expense', category: 'Еда', amount: '' })
  const habitNames = data.habitNames
  const scheduleTimes = data.scheduleTimes
  const today = new Date().getDate()
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
  const habitDone = Object.values(data.habits).flat().filter(Boolean).length
  const habitTotal = data.habitNames.length * monthDays
  const weeklyHabitPercent = Math.round((data.habitNames.reduce((sum, name) => sum + (data.habits[name] || []).slice(0, 7).filter(Boolean).length, 0) / (data.habitNames.length * 7)) * 100)
  const monthTransactions = data.transactions.filter(transaction => transaction.month === financeMonth)
  const income = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const expenseByCategory = data.financeColumns.map(category => ({ category, amount: monthTransactions.filter(t => t.type === 'expense' && t.category === category).reduce((s, t) => s + t.amount, 0) })).filter(item => item.amount)
  const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + i + weekOffset * 7); return d })
  const weekKey = weekDates[0].toISOString().slice(0, 10)
  const schedule = weekdays.map((_, dayIndex) => data.scheduleTimes.map((_, timeIndex) => data.schedule[String(dayIndex)]?.[timeIndex] || ({ text: '', done: false })))
  const setSchedule = (dayIndex: number, timeIndex: number, patch: Partial<DayNote>) => update({ schedule: { ...data.schedule, [String(dayIndex)]: schedule[dayIndex].map((item, i) => i === timeIndex ? { ...item, ...patch } : item) } })
  const addHabit = () => { const name = newHabit.trim(); if (!name || data.habitNames.length >= 10 || data.habitNames.includes(name)) return; update({ habitNames: [...data.habitNames, name], habits: { ...data.habits, [name]: Array(monthDays).fill(false) } }); setNewHabit('') }
  const removeHabit = (name: string) => { if (data.habitNames.length <= 1) return; update({ habitNames: data.habitNames.filter(item => item !== name), habits: Object.fromEntries(Object.entries(data.habits).filter(([key]) => key !== name)) }) }
  const addScheduleTime = () => { const time = newScheduleTime.trim(); if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || data.scheduleTimes.includes(time) || data.scheduleTimes.length >= 12) return; update({ scheduleTimes: [...data.scheduleTimes, time].sort(), schedule: Object.fromEntries(Object.entries(data.schedule).map(([day, entries]) => [day, [...entries, { text: '', done: false }]])) }); setNewScheduleTime('') }
  const removeScheduleTime = (timeIndex: number) => { if (data.scheduleTimes.length <= 1) return; update({ scheduleTimes: data.scheduleTimes.filter((_, index) => index !== timeIndex), schedule: Object.fromEntries(Object.entries(data.schedule).map(([day, entries]) => [day, entries.filter((_, index) => index !== timeIndex)])) }) }
  const addGoal = () => { if (!newGoal.trim() || data.goals.length >= 6) return; update({ goals: [...data.goals, { id: Date.now(), title: newGoal.trim(), progress: 0, done: false, weekly: [0, 0, 0, 0] }] }); setNewGoal('') }
  const addTransaction = () => { const amount = Number(transaction.amount); if (transaction.amount.trim() === '' || amount < 0) return; update({ transactions: [...data.transactions, { id: Date.now(), type: transaction.type, category: transaction.category, amount, month: financeMonth }] }); setTransaction({ ...transaction, amount: '' }); setShowTransaction(false) }
  const addFinanceColumn = () => { const name = newFinanceColumn.trim(); if (!name || data.financeColumns.length >= 10 || data.financeColumns.includes(name)) return; update({ financeColumns: [...data.financeColumns, name] }); setNewFinanceColumn('') }
  const renameFinanceColumn = (oldName: string, newName: string) => { const name = newName.trim(); if (!name || data.financeColumns.includes(name) && name !== oldName) return; update({ financeColumns: data.financeColumns.map(column => column === oldName ? name : column), transactions: data.transactions.map(item => item.category === oldName ? { ...item, category: name } : item) }) }
  const removeFinanceColumn = (name: string) => { if (data.financeColumns.length <= 1 || !window.confirm(`Удалить колонку «${name}» и связанные операции?`)) return; update({ financeColumns: data.financeColumns.filter(column => column !== name), transactions: data.transactions.filter(item => item.category !== name) }) }
  const exportData = () => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'focus-point-data.json'; link.click(); URL.revokeObjectURL(link.href) }
  const reset = () => { if (window.confirm('Сбросить все данные дашборда?')) setData(initialData) }
  return <main><header className="topbar"><div className="brand"><div className="brand-mark"><Sparkles size={18} /></div><div><strong>Мой трекер</strong><span>личная система продуктивности</span></div></div><div className="top-actions"><span className="today-label">{new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })}</span><span className="profile">@{user.username}</span><button className="icon-button" title="Настройки всех функций" onClick={() => setShowSettings(value => !value)}><BarChart3 size={18} /></button><button className="icon-button" title="Экспорт JSON" onClick={exportData}><Download size={18} /></button><button className="icon-button" title="Сбросить данные" onClick={reset}><RotateCcw size={18} /></button><button className="icon-button" title="Выход" onClick={logout}><LogOut size={18} /></button></div></header>{showSettings && <LegacySettingsPanel data={data} update={update} newHabit={newHabit} setNewHabit={setNewHabit} addHabit={addHabit} removeHabit={removeHabit} newScheduleTime={newScheduleTime} setNewScheduleTime={setNewScheduleTime} addScheduleTime={addScheduleTime} removeScheduleTime={removeScheduleTime} />}
    <div className="content"><div className="welcome"><div><span className="eyebrow">Понедельник, 24 августа</span><h1>Держи курс, <em>{user.username}.</em></h1><p>Маленькие шаги складываются в большие изменения.</p></div><div className="daily-score"><div className="score-ring"><span>{Math.round((goalPercent + weeklyHabitPercent) / 2)}<small>%</small></span></div><span>фокус дня</span></div></div>
      <div className="stats"><Stat icon={<Target />} label="Цели" value={`${goalPercent}%`} detail="средний прогресс" color="blue" /><Stat icon={<Flame />} label="Привычки" value={`${Math.round(habitDone / habitTotal * 100)}%`} detail="выполнено за месяц" color="mint" /><Stat icon={<Activity />} label="Расписание" value={`${Math.round(schedule.flat().filter(item => item.done).length / (data.scheduleTimes.length * 7) * 100)}%`} detail="повторяющийся план" color="orange" /></div>
      <div className="dashboard-grid"><Card title="Цели месяца" eyebrow={`${data.goals.length} из 6 целей`} icon={<Target size={20} />} className="goals-card"><div className="total-progress"><div><strong>{goalPercent}%</strong><span>общий прогресс</span></div><div className="progress-track"><i style={{ width: `${goalPercent}%` }} /></div></div><div className="goals-list">{data.goals.map(goal => <div className="goal-row" key={goal.id}><button className={`check ${goal.done ? 'checked' : ''}`} onClick={() => update({ goals: data.goals.map(item => item.id === goal.id ? { ...item, done: !item.done } : item) })}>{goal.done && <Check size={13} />}</button><div className="goal-main"><div className="goal-title"><span>{goal.title}</span><b>{goal.done ? 100 : goal.progress}%</b></div><div className="progress-track"><i style={{ width: `${goal.done ? 100 : goal.progress}%` }} /></div></div><button className="delete-button" title="Удалить цель" onClick={() => update({ goals: data.goals.filter(item => item.id !== goal.id) })}><Trash2 size={15} /></button></div>)}</div><div className="add-inline"><input value={newGoal} onChange={e => setNewGoal(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGoal()} placeholder="Добавить новую цель..." /><button onClick={addGoal} title="Добавить цель"><Plus size={17} /></button></div></Card>
        <Card title="Привычки" eyebrow={getMonthName(getCurrentMonth())} icon={<Flame size={20} />} className="habits-card"><div className="habit-summary"><div><strong>{Math.round(habitDone / habitTotal * 100)}%</strong><span>выполнено за месяц</span></div><div className="legend"><i className="dot done" /> выполнено <i className="dot today-dot" /> сегодня</div></div><div className="habit-table"><div className="habit-corner" />{Array.from({ length: monthDays }, (_, i) => <span className={`day-number ${i + 1 === today ? 'current' : ''}`} key={i}>{i + 1}</span>)}{habitNames.map((name, habitIndex) => <div className="habit-line" key={name}><span className="habit-name"><i className={`habit-dot ${habitColors[habitIndex]}`} />{name}</span>{data.habits[name].map((done, day) => <button key={day} className={`habit-cell ${done ? 'filled' : ''} ${day + 1 === today ? 'current' : ''}`} onClick={() => update({ habits: { ...data.habits, [name]: data.habits[name].map((v, i) => i === day ? !v : v) } })}>{done && <Check size={11} />}</button>)}</div>)}</div></Card>
        <Card title="Расписание на неделю" eyebrow={`${weekDates[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} — ${weekDates[6].toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`} icon={<Activity size={20} />} className="schedule-card"><div className="week-controls"><span>Повторяющийся план по времени</span><div><button className="icon-button" title="Предыдущая неделя" onClick={() => setWeekOffset(v => v - 1)}><ChevronLeft size={17} /></button><button className="icon-button" title="Следующая неделя" onClick={() => setWeekOffset(v => v + 1)}><ChevronRight size={17} /></button></div></div><div className="schedule-table"><div className="time-corner">Время</div>{weekdays.map((day, index) => <div className={`schedule-header ${weekDates[index].toDateString() === new Date().toDateString() ? 'is-today' : ''}`} key={day}><span>{day}</span><b>{weekDates[index].getDate()}</b></div>)}{scheduleTimes.map((time, timeIndex) => <div className="schedule-row" key={time}><span className="schedule-time">{time}</span>{schedule.map((day, dayIndex) => <div className={`schedule-slot ${weekDates[dayIndex].toDateString() === new Date().toDateString() ? 'is-today' : ''}`} key={`${dayIndex}-${time}`}><textarea value={day[timeIndex].text} onChange={e => setSchedule(dayIndex, timeIndex, { text: e.target.value })} placeholder="Заметка" /><label><input type="checkbox" checked={day[timeIndex].done} onChange={e => setSchedule(dayIndex, timeIndex, { done: e.target.checked })} /><span>{day[timeIndex].done ? 'Готово' : 'Выполнено'}</span></label></div>)}</div>)}</div></Card>
        <Card title="Финансы" eyebrow={`${data.financeColumns.length} из 10 колонок`} icon={<Wallet size={20} />} className="finance-card"><div className="money-summary"><div><span>Доходы</span><strong className="income">+{income.toLocaleString('ru-RU')} ₽</strong></div><div><span>Расходы</span><strong className="expense">-{expenses.toLocaleString('ru-RU')} ₽</strong></div><div><span>Остаток</span><strong>{(income - expenses).toLocaleString('ru-RU')} ₽</strong></div></div><div className="finance-columns"><div className="finance-columns-head"><span>Настройка колонок</span><small>Названия сохраняются автоматически</small></div><div className="column-list">{data.financeColumns.map(column => <div className="column-item" key={column}><input value={column} onChange={e => renameFinanceColumn(column, e.target.value)} onBlur={e => renameFinanceColumn(column, e.target.value)} /><button className="delete-button" title="Удалить колонку" onClick={() => removeFinanceColumn(column)}><Trash2 size={14} /></button></div>)}</div><div className="add-column"><input value={newFinanceColumn} maxLength={24} onChange={e => setNewFinanceColumn(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFinanceColumn()} placeholder={data.financeColumns.length >= 10 ? 'Достигнут лимит 10 колонок' : 'Новая колонка...'} disabled={data.financeColumns.length >= 10} /><button onClick={addFinanceColumn} disabled={data.financeColumns.length >= 10} title="Добавить колонку"><Plus size={16} /></button></div></div><ExpenseChart items={expenseByCategory} /><button className="primary-button" onClick={() => setShowTransaction(true)}><Plus size={16} /> Добавить операцию</button>{showTransaction && <div className="transaction-form"><button className="close-button" onClick={() => setShowTransaction(false)}><X size={16} /></button><select value={transaction.type} onChange={e => setTransaction({ ...transaction, type: e.target.value as 'income' | 'expense' })}><option value="expense">Расход</option><option value="income">Доход</option></select><select value={transaction.category} onChange={e => setTransaction({ ...transaction, category: e.target.value })}>{data.financeColumns.map(c => <option key={c}>{c}</option>)}</select><input type="number" value={transaction.amount} onChange={e => setTransaction({ ...transaction, amount: e.target.value })} placeholder="Сумма, ₽" /><button className="primary-button" onClick={addTransaction}>Сохранить</button></div>}</Card>
        <Card title="День" eyebrow="ДНЕВНИК" icon={<Sparkles size={20} />} className="journal-card"><div className="journal-calendar">{Array.from({ length: monthDays }, (_, i) => { const currentMonth = getCurrentMonth(); const key = `${currentMonth}-${String(i + 1).padStart(2, '0')}`; return <button className={`${journalDate === key ? 'selected' : ''} ${data.logs[key] ? 'has-note' : ''}`} key={key} onClick={() => setJournalDate(key)}>{i + 1}</button> })}</div><div className="sliders"><Range label="Сон" value={journal.sleep} onChange={sleep => updateJournal({ sleep })} color="blue" /><Range label="Энергия" value={journal.energy} onChange={energy => updateJournal({ energy })} color="mint" /></div><div className="moods"><span>Настроение</span>{['😊', '😐', '😢', '🔥'].map(mood => <button className={journal.mood === mood ? 'selected' : ''} key={mood} onClick={() => updateJournal({ mood })}>{mood}</button>)}</div><div className="journal-fields"><textarea value={journal.lesson} onChange={e => updateJournal({ lesson: e.target.value })} placeholder="Урок дня" /><textarea value={journal.gratitude} onChange={e => updateJournal({ gratitude: e.target.value })} placeholder="За что благодарна" /><textarea className="wide" value={journal.thoughts} onChange={e => updateJournal({ thoughts: e.target.value })} placeholder="Мысли и наблюдения" /></div></Card>
      </div><NameEditor data={data} update={update} userId={user.id} /><FinanceMonthPicker userId={user.id} /><footer><span>Данные сохраняются автоматически</span><span>Точка фокуса · 2026</span></footer></div>{/* analytics is represented by the summary row and live aggregates */}</main>
}
function Stat({ icon, label, value, detail, color }: { icon: ReactNode; label: string; value: string; detail: string; color: string }) { return <div className="stat"><span className={`stat-icon ${color}`}>{icon}</span><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div> }
function Range({ label, value, onChange, color }: { label: string; value: number; onChange: (value: number) => void; color: string }) { return <label className="range"><span>{label}<b>{value}/10</b></span><input type="range" min="1" max="10" value={value} onChange={e => onChange(Number(e.target.value))} style={{ accentColor: color === 'blue' ? '#2563eb' : '#0ea5a4' }} /></label> }
function ExpenseChart({ items }: { items: { category: string; amount: number }[] }) { const canvasRef = useRef<HTMLCanvasElement>(null); const max = Math.max(...items.map(i => i.amount), 1); useEffect(() => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d')!; ctx.clearRect(0, 0, canvas.width, canvas.height); items.forEach((item, index) => { const x = 12 + index * (canvas.width - 24) / Math.max(items.length, 1); const height = item.amount / max * 86; ctx.fillStyle = ['#2563eb', '#0ea5a4', '#f59e0b', '#ef6a6a', '#7c6be8', '#94a3b8'][index]; ctx.roundRect(x, 100 - height, 22, height, 5); ctx.fill(); ctx.fillStyle = '#8995a7'; ctx.font = '10px sans-serif'; ctx.fillText(item.category.slice(0, 5), x - 2, 118) }) }, [items, max]); return <div className="chart-wrap"><canvas ref={canvasRef} width="300" height="125" /><div className="chart-total"><ArrowDownLeft size={14} /> расходы по категориям</div></div> }

function NameEditor({ data, update, userId }: { data: Data; update: (patch: Partial<Data>) => void; userId: string }) { return <div className="name-editor"><span>Ваше имя</span><input value={data.userName} onChange={e => update({ userName: e.target.value })} placeholder="Введите имя" /></div> }

function FinanceMonthPicker({ userId }: { userId: string }) { const [month, setMonth] = useState(() => localStorage.getItem(`focus-point-month-${userId}`) || getCurrentMonth()); const changeMonth = (value: string) => { setMonth(value); localStorage.setItem(`focus-point-month-${userId}`, value); window.dispatchEvent(new CustomEvent('finance-month-change', { detail: value })) }; return <label className="month-picker"><span>Финансы за месяц</span><input type="month" value={month} onChange={e => changeMonth(e.target.value)} /></label> }

function LegacySettingsPanel({ data, update, newHabit, setNewHabit, addHabit, removeHabit, newScheduleTime, setNewScheduleTime, addScheduleTime, removeScheduleTime }: { data: Data; update: (patch: Partial<Data>) => void; newHabit: string; setNewHabit: (value: string) => void; addHabit: () => void; removeHabit: (name: string) => void; newScheduleTime: string; setNewScheduleTime: (value: string) => void; addScheduleTime: () => void; removeScheduleTime: (index: number) => void }) { return <section className="settings-panel"><div className="settings-head"><div><span className="eyebrow">УПРАВЛЕНИЕ ДАННЫМИ</span><h2>Настройки трекера</h2></div><span className="settings-note">Изменения сохраняются автоматически</span></div><div className="settings-grid"><div><h3>Цели и прогресс</h3>{data.goals.map(goal => <div className="setting-row" key={goal.id}><input value={goal.title} onChange={e => update({ goals: data.goals.map(item => item.id === goal.id ? { ...item, title: e.target.value } : item) })} /><input type="number" min="0" max="100" value={goal.progress} onChange={e => update({ goals: data.goals.map(item => item.id === goal.id ? { ...item, progress: Math.min(100, Math.max(0, Number(e.target.value))) } : item) })} /><button className="delete-button" title="Удалить цель" onClick={() => update({ goals: data.goals.filter(item => item.id !== goal.id) })}><Trash2 size={14} /></button></div>)}</div><div><h3>Привычки <small>{data.habitNames.length}/10</small></h3>{data.habitNames.map(name => <div className="setting-row" key={name}><input value={name} readOnly /><button className="delete-button" onClick={() => removeHabit(name)}><Trash2 size={14} /></button></div>)}<div className="setting-add"><input value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHabit()} placeholder="Добавить привычку" /><button onClick={addHabit}><Plus size={15} /></button></div></div><div><h3>Временные слоты <small>{data.scheduleTimes.length}/12</small></h3>{data.scheduleTimes.map((time, index) => <div className="setting-row" key={time}><input value={time} readOnly /><button className="delete-button" onClick={() => removeScheduleTime(index)}><Trash2 size={14} /></button></div>)}<div className="setting-add"><input value={newScheduleTime} onChange={e => setNewScheduleTime(e.target.value)} onKeyDown={e => e.key === 'Enter' && addScheduleTime()} placeholder="Например, 21:00" /><button onClick={addScheduleTime}><Plus size={15} /></button></div></div><div><h3>Доходы и расходы</h3>{data.transactions.map(item => <div className="setting-row transaction-row" key={item.id}><span className={item.type === 'income' ? 'income' : 'expense'}>{item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString('ru-RU')} ₽</span><span>{item.category}</span><button className="delete-button" onClick={() => update({ transactions: data.transactions.filter(transactionItem => transactionItem.id !== item.id) })}><Trash2 size={14} /></button></div>)}</div></div></section> }

export default App