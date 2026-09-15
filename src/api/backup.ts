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
 * 导出所有数据为 JSON
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
 */
export async function mergeData(data: BackupData): Promise<{ records: number; categories: number; books: number }> {
  if (!data || !data.version) {
    throw new Error('无效的备份文件')
  }

  const result = { records: 0, categories: 0, books: 0 }

  await db.transaction('rw', db.records, db.records_history, db.categories, db.books, async () => {
    if (data.categories?.length) {
      const existing = await db.categories.toArray()
      const existingIds = new Set(existing.map(c => c.id))
      const newCats = data.categories.filter(c => !existingIds.has(c.id))
      if (newCats.length) {
        await db.categories.bulkAdd(newCats)
        result.categories = newCats.length
      }
    }

    if (data.books?.length) {
      const existing = await db.books.toArray()
      const existingIds = new Set(existing.map(b => b.id))
      const newBooks = data.books.filter(b => !existingIds.has(b.id))
      if (newBooks.length) {
        await db.books.bulkAdd(newBooks)
        result.books = newBooks.length
      }
    }

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
    await db.records.clear()
    await db.records_history.clear()
    await db.categories.clear()
    await db.books.clear()

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
  if (day !== 1 && day !== 15) return false

  const today = new Date().toISOString().slice(0, 10)
  const lastBackup = localStorage.getItem('lastAutoBackup')
  if (lastBackup === today) return false

  try {
    const data = await exportData()
    localStorage.setItem('autoBackup_' + today, JSON.stringify(data))
    localStorage.setItem('lastAutoBackup', today)
    return true
  } catch {
    return false
  }
}

/**
 * 下载备份文件
 * 返回 'shared' | 'saved' | 'popup' 表示使用的导出方式
 */
export async function downloadBackup(data: BackupData): Promise<'shared' | 'saved' | 'popup'> {
  const json = JSON.stringify(data, null, 2)
  const date = new Date().toISOString().slice(0, 10)
  const filename = `记账本备份_${date}.json`
  const blob = new Blob([json], { type: 'application/json' })

  // 方式1：系统分享面板
  if (navigator.share && navigator.canShare?.({
    files: [new File([blob], filename, { type: 'application/json' })]
  })) {
    try {
      await navigator.share({
        title: '记账本数据备份',
        text: `导出时间：${data.exportedAt}`,
        files: [new File([blob], filename, { type: 'application/json' })]
      })
      return 'shared'
    } catch {
      // 用户取消或失败，降级
    }
  }

  // 方式2：文件保存API
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON 备份文件', accept: { 'application/json': ['.json'] } }]
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return 'saved'
    } catch {
      // 用户取消或失败，降级
    }
  }

  // 方式3：返回 JSON 字符串，由调用方决定如何展示
  // 将数据存到临时变量，供 Profile.vue 弹窗使用
  ;(downloadBackup as any)._lastJson = json
  ;(downloadBackup as any)._lastFilename = filename
  return 'popup'
}
