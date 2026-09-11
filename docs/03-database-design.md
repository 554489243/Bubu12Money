# 数据库设计

基于 Dexie.js（IndexedDB 封装），版本化管理 schema。

## 数据库定义

```ts
import Dexie, { Table } from 'dexie'

export interface Record {
  id?: number
  type: 'expense'          // 初版仅支出
  amount: number           // 金额，单位：分
  categoryId: number       // 关联分类 id
  date: string             // YYYY-MM-DD
  note?: string            // 备注，可选
  createdAt: number        // 创建时间戳
  updatedAt: number        // 修改时间戳
}

export interface Category {
  id?: number
  type: 'expense'          // 初版仅支出
  name: string             // 分类名称
  icon: string             // emoji 图标
  sort: number             // 排序值，越小越靠前
  builtin: boolean         // 是否内置（内置不可删除）
}

class BookkeepingDB extends Dexie {
  records!: Table<Record>
  categories!: Table<Category>

  constructor() {
    super('BookkeepingDB')
    this.version(1).stores({
      records: '++id, type, categoryId, date, createdAt',
      categories: '++id, type, sort'
    })
  }
}

export const db = new BookkeepingDB()
```

## 表结构

### records（账单表）

| 字段 | 类型 | 索引 | 说明 |
|------|------|------|------|
| id | number (自增) | 主键 | 唯一标识 |
| type | string | ✓ | 初版固定 'expense' |
| amount | number | - | 金额（分），如 1088 = ￥10.88 |
| categoryId | number | ✓ | 关联 categories.id |
| date | string | ✓ | 日期 YYYY-MM-DD |
| note | string | - | 备注，可为空 |
| createdAt | number | ✓ | 创建时间戳 |
| updatedAt | number | - | 修改时间戳 |

**索引设计说明：**
- `type + date`：按日期范围查询账单（月度统计）
- `categoryId`：按分类筛选
- `createdAt`：按时间倒序排列

### categories（分类表）

| 字段 | 类型 | 索引 | 说明 |
|------|------|------|------|
| id | number (自增) | 主键 | 唯一标识 |
| type | string | ✓ | 初版固定 'expense' |
| name | string | - | 分类名称 |
| icon | string | - | emoji 图标 |
| sort | number | ✓ | 排序值 |
| builtin | boolean | - | 是否内置 |

## 内置分类初始数据

```ts
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { type: 'expense', name: '餐饮', icon: '🍜', sort: 1,  builtin: true },
  { type: 'expense', name: '交通', icon: '🚗', sort: 2,  builtin: true },
  { type: 'expense', name: '购物', icon: '🛒', sort: 3,  builtin: true },
  { type: 'expense', name: '居住', icon: '🏠', sort: 4,  builtin: true },
  { type: 'expense', name: '娱乐', icon: '🎮', sort: 5,  builtin: true },
  { type: 'expense', name: '医疗', icon: '💊', sort: 6,  builtin: true },
  { type: 'expense', name: '教育', icon: '📚', sort: 7,  builtin: true },
  { type: 'expense', name: '通讯', icon: '📱', sort: 8,  builtin: true },
  { type: 'expense', name: '其他', icon: '📦', sort: 99, builtin: true },
]
```

## 数据约束

| 约束 | 说明 |
|------|------|
| 金额用「分」存储 | 避免 JS 浮点精度问题，显示时 ÷100 转「元」 |
| 内置分类不可删 | `builtin = true` 的分类不允许删除 |
| 金额 > 0 | 保存前校验，前端 + Store 双重校验 |
| 分类必须选择 | 记账时必须选择分类 |
| 日期格式 | 统一 YYYY-MM-DD（dayjs 格式化） |

## 版本管理策略

后续需要加字段时，通过 Dexie 版本升级：

```ts
// 示例：未来 v2 增加「标签」字段
this.version(2).stores({
  records: '++id, type, categoryId, date, createdAt, tag',
  categories: '++id, type, sort'
}).upgrade(trans => {
  return trans.table('records').toCollection().modify(record => {
    record.tag = '默认'  // 给存量数据赋默认值
  })
})
```

**原则：**
- 不预留无用字段
- 按需升级，版本号递增
- 升级时给存量数据赋默认值
