import { memo } from 'react'

import { useUiStore } from '@/stores/uiStore'

export const ShortcutHintBar = memo(function ShortcutHintBar() {
  const shortcutHintsVisible = useUiStore((s) => s.shortcutHintsVisible)
  const setShortcutHintsVisible = useUiStore((s) => s.setShortcutHintsVisible)

  if (!shortcutHintsVisible) return null

  return (
    <div className="border-t bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
      <span>
        <kbd className="font-mono">↑↓</kbd> 切换
        &nbsp;&nbsp;
        <kbd className="font-mono">Enter</kbd> 已审
        &nbsp;&nbsp;
        <kbd className="font-mono">F</kbd> 跟进
        &nbsp;&nbsp;
        <kbd className="font-mono">Space</kbd> 勾选
        &nbsp;&nbsp;
        <kbd className="font-mono">/</kbd> 搜索
      </span>
      <button
        type="button"
        aria-label="关闭快捷键提示"
        className="ml-4 leading-none opacity-60 hover:opacity-100 transition-opacity"
        onClick={() => setShortcutHintsVisible(false)}
      >
        ×
      </button>
    </div>
  )
})
