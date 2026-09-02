export type Goal = { id: number; title: string; progress: number; done: boolean; weekly: number[] }
export type Transaction = { id: number; type: 'income' | 'expense'; category: string; amount: number; month: string; date?: string }
export type DayNote = { text: string; done: boolean }
export type DayLog = { sleep: number; energy: number; mood: string; lesson: string; gratitude: string; thoughts: string }
export type Data = { goals: Goal[]; habits: Record<string, boolean[]>; habitsByMonth: Record<string, Record<string, boolean[]>>; schedule: Record<string, DayNote[]>; logs: Record<string, DayLog>; transactions: Transaction[]; financeColumns: string[]; habitNames: string[]; scheduleTimes: string[]; userName: string; monthResetKey: string }
export type User = { id: string; username: string; password: string; createdAt: number }
export type AuthContextType = { user: User | null; login: (username: string, password: string) => boolean; register: (username: string, password: string) => boolean; logout: () => void }
