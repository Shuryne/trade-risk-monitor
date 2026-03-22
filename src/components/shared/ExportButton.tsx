import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface ExportButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function ExportButton({ label, onClick, disabled }: ExportButtonProps) {
  return (
    <Button size="sm" onClick={onClick} disabled={disabled} className="gap-1">
      <Download className="h-4 w-4" />
      {label}
    </Button>
  )
}
