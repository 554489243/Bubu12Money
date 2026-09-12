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
 * 智能合并导入（不重复、不丢数据）
 * - 分类/账本：相同 ID 跳过，只补新的
 * - 记录：按 ID 合并，有则更新，无则添加
 */
export async function mergeData(data: BackupData): Promise<{ records: number; categories: number; books: number }> {
  if (!data || !data.version) {
    throw new Error('无效的备份文件')
  }

  const result = { records: 0, categories: 0, books: 0 }

  await db.transaction('rw', db.records, db.records_history, db.categories, db.books, async () => {
    // 分类：跳过已存在的
    if (data.categories?.length) {
      const existing = await db.categories.toArray()
      const existingIds = new Set(existing.map(c => c.id))
      const newCats = data.categories.filter(c => !existingIds.has(c.id))
      if (newCats.length) {
        await db.categories.bulkAdd(newCats)
        result.categories = newCats.length
      }
    }

    // 账本：跳过已存在的
    if (data.books?.length) {
      const existing = await db.books.toArray()
      const existingIds = new Set(existing.map(b => b.id))
      const newBooks = data.books.filter(b => !existingIds.has(b.id))
      if (newBooks.length) {
        await db.books.bulkAdd(newBooks)
        result.books = newBooks.length
      }
    }

    // 记录：按 ID 合并（有则更新，无则添加）
    if (data.records?.length) {
      await db.records.bulkPut(data.records)
      result.records = data.records.length
    }
    if (data.records_history?.length) {
      await db.records_history.bulkPut(data.records_history)
    }
  })

  return result
}
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
 * 自动备份（月初/月半检测，同一天只备一次）
 */
export async function autoBackup(): Promise<boolean> {
  const day = new Date().getDate()
  // 只在月初(1号)或月半(15号)触发
  if (day !== 1 && day !== 15) return false

  const today = new Date().toISOString().slice(0, 10)
  const lastBackup = localStorage.getItem('lastAutoBackup')
  // 今天已备份过，跳过
  if (lastBackup === today) return false

  try {
    const data = await exportData()
    await downloadBackup(data)
    localStorage.setItem('lastAutoBackup', today)
    return true
  } catch {
    return false
  }
}

/**
 * 下载备份文件（兼容 PWA）
 */
export async function downloadBackup(data: BackupData): Promise<void> {
  const json = JSON.stringify(data, null, 2)
  const date = new Date().toISOString().slice(0, 10)
  const filename = `记账本备份_${date}.json`
  const blob = new Blob([json], { type: 'application/json' })

  // PWA 移动端：使用系统分享面板
  if (navigator.share && navigator.canShare?.({
    files: [new File([blob], filename, { type: 'application/json' })]
  })) {
    try {
      await navigator.share({
        title: '记账本数据备份',
        text: `导出时间：${data.exportedAt}`,
        files: [new File([blob], filename, { type: 'application/json' })]
      })
      return
    } catch {
      // 用户取消分享，降级到普通下载
    }
  }

  // 降级：传统下载（桌面端）
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
