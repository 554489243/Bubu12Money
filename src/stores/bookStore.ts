import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Book } from '@/api/db'
import * as booksApi from '@/api/books'

export const useBookStore = defineStore('book', () => {
  const books = ref<Book[]>([])
  const currentBookId = ref<number | null>(null)

  const currentBook = computed(() => {
    if (currentBookId.value === null) return null
    return books.value.find(b => b.id === currentBookId.value) || null
  })

  const isAllBooks = computed(() => currentBookId.value === null)

  const visibleBooks = computed(() => books.value.filter(b => !b.hidden))

  async function init() {
    await booksApi.initDefaultBook()
    await loadBooks()
  }

  const sortedBooks = computed(() => {
    return [...books.value].sort((a, b) => {
      if (a.isDefault) return -1
      if (b.isDefault) return 1
      return a.sort - b.sort
    })
  })

  async function loadBooks() {
    const list = await booksApi.getAllBooks()
    books.value = list
  }

  function setCurrentBook(bookId: number | null | undefined) {
    currentBookId.value = bookId ?? null
  }

  function getById(id: number) {
    return books.value.find(b => b.id === id)
  }

  async function addBook(data: Omit<Book, 'id'>) {
    const id = await booksApi.addBook(data)
    await loadBooks()
    return id
  }

  async function updateBook(id: number, data: Partial<Book>) {
    await booksApi.updateBook(id, data)
    await loadBooks()
  }

  async function deleteBook(id: number) {
    await booksApi.deleteBook(id)
    if (currentBookId.value === id) {
      currentBookId.value = null
    }
    await loadBooks()
  }

  async function setDefaultBook(id: number) {
    await booksApi.setDefaultBook(id)
    await loadBooks()
  }

  async function toggleHidden(id: number) {
    const book = books.value.find(b => b.id === id)
    if (book && !book.isDefault) {
      await updateBook(id, { hidden: !book.hidden })
    }
  }

  async function moveUp(id: number) {
    const sorted = [...books.value].sort((a, b) => a.sort - b.sort)
    const idx = sorted.findIndex(b => b.id === id)
    if (idx <= 0) return
    const prev = sorted[idx - 1]
    const curr = sorted[idx]
    if (curr.isDefault) return
    if (prev.isDefault) return
    // 交换 sort 值
    const tmpSort = curr.sort
    await updateBook(curr.id!, { sort: prev.sort })
    await updateBook(prev.id!, { sort: tmpSort })
    await loadBooks()
  }

  async function moveDown(id: number) {
    const sorted = [...books.value].sort((a, b) => a.sort - b.sort)
    const idx = sorted.findIndex(b => b.id === id)
    if (idx < 0 || idx >= sorted.length - 1) return
    const next = sorted[idx + 1]
    const curr = sorted[idx]
    if (curr.isDefault) return
    // 交换 sort 值
    const tmpSort = curr.sort
    await updateBook(curr.id!, { sort: next.sort })
    await updateBook(next.id!, { sort: tmpSort })
    await loadBooks()
  }

  return {
    books,
    sortedBooks,
    currentBookId,
    currentBook,
    isAllBooks,
    visibleBooks,
    init,
    loadBooks,
    setCurrentBook,
    getById,
    addBook,
    updateBook,
    deleteBook,
    setDefaultBook,
    toggleHidden,
    moveUp,
    moveDown
  }
})
