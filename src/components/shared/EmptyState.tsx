import { TableCell, TableRow } from '@/components/ui/table'

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function EmptyTableRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-6 text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  )
}
