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
    await db.sessions.put(session)
  },

  /** 获取所有会话（按创建时间降序） */
  async getAllSessions(): Promise<AnalysisSession[]> {
    return db.sessions.orderBy('created_at').reverse().toArray()
  },

  /** 获取指定会话 */
  async getSession(id: string): Promise<AnalysisSession | undefined> {
    return db.sessions.get(id)
  },

  /** 删除指定会话 */
  async deleteSession(id: string): Promise<void> {
    await db.sessions.delete(id)
  },

  /** 获取存储使用量估算（字节） */
  async estimateStorage(): Promise<number> {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate()
      return est.usage ?? 0
    }
    return 0
  },
}
