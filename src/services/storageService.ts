import Dexie, { type EntityTable } from 'dexie'
import type { AnalysisSession } from '@/types/risk'

class TradeRiskDB extends Dexie {
  sessions!: EntityTable<AnalysisSession, 'id'>

  constructor() {
    super('TradeRiskDB')
    this.version(1).stores({
      sessions: 'id, date, created_at',
    })
  }
}

const db = new TradeRiskDB()

export const storageService = {
  /** 保存分析会话 */
  async saveSession(session: AnalysisSession): Promise<void> {
    try {
      await db.sessions.put(session)
    } catch (err) {
      console.error('Failed to save session:', err)
    }
  },

  /** 获取所有会话（按创建时间降序） */
  async getAllSessions(): Promise<AnalysisSession[]> {
    try {
      return await db.sessions.orderBy('created_at').reverse().toArray()
    } catch (err) {
      console.error('Failed to load sessions:', err)
      return []
    }
  },

  /** 获取指定会话 */
  async getSession(id: string): Promise<AnalysisSession | undefined> {
    try {
      return await db.sessions.get(id)
    } catch (err) {
      console.error('Failed to get session:', err)
      return undefined
    }
  },

  /** 删除指定会话 */
  async deleteSession(id: string): Promise<void> {
    try {
      await db.sessions.delete(id)
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  },

  /** 获取存储使用量估算（字节） */
  async estimateStorage(): Promise<number> {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate()
        return est.usage ?? 0
      }
    } catch (err) {
      console.error('Failed to estimate storage:', err)
    }
    return 0
  },
}
