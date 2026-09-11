import { db, Book } from './db'

export async function initDefaultBook() {
  const count = await db.books.count()
  if (count === 0) {
    await db.books.add({
      name: '日常',
      icon: '📱',
      color: '#1989fa',
      sort: 1,
      isDefault: true,
      hidden: false,
      createdAt: Date.now()
    })
  }
}

export async function getAllBooks() {
  return await db.books.orderBy('sort').toArray()
}

export async function getBookById(id: number) {
  return await db.books.get(id)
}

export async function getDefaultBook() {
  return await db.books.where('isDefault').equals(1).first()
}

export async function addBook(data: Omit<Book, 'id'>) {
  return await db.books.add(data)
}

export async function updateBook(id: number, data: Partial<Book>) {
  return await db.books.update(id, data)
}

export async function deleteBook(id: number) {
  // 删除账本及其全部记录
  await db.records.where('bookId').equals(id).delete()
  await db.books.delete(id)
}

export async function setDefaultBook(id: number) {
  await db.books.where('isDefault').equals(1).modify({ isDefault: false })
  await db.books.update(id, { isDefault: true })
}
