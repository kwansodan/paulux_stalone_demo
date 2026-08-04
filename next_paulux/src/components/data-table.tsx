import { Loader } from "lucide-react";

type DataTableProps<T> = {
  columns: { key: keyof T | string; label: string; render?: (row: T) => React.ReactNode }[]
  data: T[]
  loading?: boolean
  emptyText?: string
}

export function DataTable<T>({ columns, data, loading, emptyText }: DataTableProps<T>) {
  if (loading) return <Loader className="text-center py-20 text-fuchsia-400 animate-spin" />


  if (!data.length) {
    return (
      <div className="flex flex-col items-center py-24 text-gray-400">
        <p>{emptyText ?? "No data found"}</p>
      </div>
    )
  }

  return (
    <div className="border rounded-xl overflow-x-auto">
      <table className="w-full text-sm ">
        <thead className="bg-gray-50 text-left text-sm font-medium">
          <tr >
            {columns.map(c => (
              <th key={c.key as string} className="px-4 py-3 font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody >
          {data.map((row, i) => (
            <tr key={i} className="border-t">
              {columns.map(col => (
                <td key={col.key as string} className="px-4 py-3">
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
