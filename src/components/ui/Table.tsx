import { ReactNode } from 'react'

export interface Column<T = Record<string, unknown>> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  headerClass?: string
  cellClass?: string
}

interface TableProps<T = Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

export function Table<T>({
  columns,
  data,
  rowKey,
  isLoading,
  emptyMessage = 'Sin registros',
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-[16px] border border-[rgba(0,0,0,0.08)] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[rgba(0,0,0,0.07)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  'px-4 py-3 text-left text-xs font-medium text-[#5F5E5A] uppercase tracking-wide whitespace-nowrap',
                  col.headerClass ?? '',
                ].join(' ')}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-[rgba(0,0,0,0.05)]">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-[#F0F0EE] rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-[#888780]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={[
                  'border-b border-[rgba(0,0,0,0.05)] last:border-0 transition-colors duration-100',
                  onRowClick ? 'cursor-pointer hover:bg-[#F8F8F6]' : '',
                ].join(' ')}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={['px-4 py-3 text-[#2C2C2A]', col.cellClass ?? ''].join(' ')}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
