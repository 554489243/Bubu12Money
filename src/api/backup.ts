import { db, RecordItem, Category, Book } from './db'

export interface BackupData {
  version: number
  exportedAt: string
  records: RecordItem[]
  records_history: RecordItem[]
  categories: Category[]
  books: Book[]
}

/**
 * 导出所有数据为 JSON 文件
 */
export async function exportData(): Promise<BackupData> {
  const [records, records_history, categories, books] = await Promise.all([
    db.records.toArray(),
    db.records_history.toArray(),
    db.categories.toArray(),
    db.books.toArray()
  ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    records_history,
    categories,
    books
  }
}

/**
 * 从备份数据恢复（覆盖当前数据）
 */
export async function importData(data: BackupData): Promise<void> {
  if (!data || !data.version) {
    throw new Error('无效的备份文件')
  }

  await db.transaction('rw', db.records, db.records_history, db.categories, db.books, async () => {
    // 清空现有数据
    await db.records.clear()
    await db.records_history.clear()
    await db.categories.clear()
    await db.books.clear()

    // 恢复数据
    if (data.records?.length) await db.records.bulkAdd(data.records)
    if (data.records_history?.length) await db.records_history.bulkAdd(data.records_history)
    if (data.categories?.length) await db.categories.bulkAdd(data.categories)
    if (data.books?.length) await db.books.bulkAdd(data.books)
  })
}

/**
 * 下载备份文件
 */
export function downloadBackup(data: BackupData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const date = new Date().toISOString().slice(0, 10)
  a.download = `记账本备份_${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
