import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RuleConfig } from '@/types/rule'
import { DEFAULT_RULE_CONFIGS } from '@/utils/constants'

interface RuleConfigState {
  configs: RuleConfig[];

  /** 更新单条规则配置 */
  updateConfig: (ruleId: string, updates: Partial<RuleConfig>) => void;
  /** 恢复所有规则为默认值 */
  resetToDefaults: () => void;
  /** 获取指定规则配置 */
  getConfig: (ruleId: string) => RuleConfig | undefined;
}

export const useRuleConfigStore = create<RuleConfigState>()(
  persist(
    (set, get) => ({
      configs: structuredClone(DEFAULT_RULE_CONFIGS),

      updateConfig: (ruleId, updates) => {
        set(state => ({
          configs: state.configs.map(c =>
            c.rule_id === ruleId ? { ...c, ...updates } : c
          ),
        }))
      },

      resetToDefaults: () => {
        set({ configs: structuredClone(DEFAULT_RULE_CONFIGS) })
      },

      getConfig: (ruleId) => {
        return get().configs.find(c => c.rule_id === ruleId)
      },
    }),
    {
      name: 'trade-risk-rule-config',
    }
  )
)
