import { create } from 'zustand'
import type { Order, ParseError, DataSummary } from '@/types/order'
import { parseCsv, readFileContent } from '@/services/csvParser'

interface OrderState {
  orders: Order[];
  parseErrors: ParseError[];
  summary: DataSummary;
  isLoading: boolean;
  hasData: boolean;

  /** 解析 CSV 文件 */
  loadFile: (file: File) => Promise<void>;
  /** 清除数据 */
  clear: () => void;
}

const initialSummary: DataSummary = {
  totalRows: 0,
  timeRange: null,
  accountCount: 0,
  symbolCount: 0,
  markets: [],
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  parseErrors: [],
  summary: initialSummary,
  isLoading: false,
  hasData: false,

  loadFile: async (file: File) => {
    set({ isLoading: true, parseErrors: [], orders: [] })
    try {
      const content = await readFileContent(file)
      const result = parseCsv(content)
      set({
        orders: result.orders,
        parseErrors: result.errors,
        summary: result.summary,
        hasData: result.orders.length > 0,
        isLoading: false,
      })
    } catch (err) {
      set({
        isLoading: false,
        parseErrors: [{ row: 0, column: '', message: `文件读取失败: ${err}` }],
      })
    }
  },

  clear: () => set({
    orders: [],
    parseErrors: [],
    summary: initialSummary,
    hasData: false,
  }),
}))
