import { useCallback, useState } from 'react'
import { Upload, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileDropzoneProps {
  onFile: (file: File) => void;
  isLoading: boolean;
}

export function FileDropzone({ onFile, isLoading }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file && file.name.endsWith('.csv')) {
        onFile(file)
      }
    },
    [onFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFile(file)
        e.target.value = '' // 允许重复选择同一文件
      }
    },
    [onFile]
  )

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors',
        isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        isLoading && 'pointer-events-none opacity-60'
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        {isLoading ? (
          <>
            <FileSpreadsheet className="h-10 w-10 animate-pulse text-primary" />
            <p className="text-sm font-medium">正在解析文件...</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">拖拽 CSV 文件到此处</p>
              <p className="text-xs text-muted-foreground mt-1">或点击选择文件</p>
            </div>
            <label className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              选择文件
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-xs text-muted-foreground">支持 UTF-8 / GBK 编码的 .csv 文件</p>
          </>
        )}
      </div>
    </div>
  )
}
