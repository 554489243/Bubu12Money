# 开发架构

## 技术栈

| 层面 | 选型 | 版本 | 理由 |
|------|------|------|------|
| 框架 | Vue3 | ^3.4 | 组合式 API，用户擅长 |
| 构建 | Vite | ^5 | 极速 HMR，PWA 插件生态完善 |
| UI 组件 | Vant4 | ^4 | 移动端优先，含 SwipeCell、DatePicker、Toast |
| 状态管理 | Pinia | ^2 | Vue3 官方推荐，轻量 |
| 本地数据库 | Dexie.js | ^4 | IndexedDB 封装，API 友好 |
| 图表 | ECharts | ^5 | 功能强大，支持柱状图、饼图 |
| PWA | vite-plugin-pwa | ^0.20 | 离线缓存，manifest 自动生成 |
| 路由 | Vue Router | ^4 | 官方路由 |

## 数据流图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vue Components                            │
│                                                                  │
│   Home.vue    Edit.vue    List.vue    Stats.vue    Profile.vue   │
└──────────┬───────────┬──────────┬──────────┬──────────┬──────────┘
           │           │          │          │          │
           │ dispatch  │ dispatch │ dispatch │ dispatch │ read
           │ actions   │ actions │ actions │ actions  │ state
           ▼           ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Pinia Stores                              │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  recordStore      │  │  categoryStore   │  │    uiStore    │  │
│  │  - records[]      │  │  - categories[]  │  │  - activeTab  │  │
│  │  - add()          │  │  - init()        │  │  - filterMonth│  │
│  │  - update()       │  │  - getAll()      │  │  - filterCate │  │
│  │  - delete()       │  │                  │  │               │  │
│  │  - getByMonth()   │  │                  │  │               │  │
│  │  - getByDate()    │  │                  │  │               │  │
│  └────────┬─────────┘  └────────┬─────────┘  └───────────────┘  │
└───────────┼─────────────────────┼───────────────────────────────┘
            │                     │
            │ CRUD operations     │ read
            ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Dexie.js                                 │
│                                                                  │
│  db.version(1).stores({                                          │
│    records: '++id, type, categoryId, date, createdAt',           │
│    categories: '++id, type, sort'                                │
│  })                                                              │
│                                                                  │
│  db.records.add() / .where('date').equals() / .orderBy()         │
│  db.categories.toArray()                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ IndexedDB API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        IndexedDB                                 │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │  Object Store:       │  │  Object Store:       │               │
│  │  records             │  │  categories          │               │
│  │  ─────────────────── │  │  ─────────────────── │               │
│  │  {id,type,amount,    │  │  {id,type,name,      │               │
│  │   categoryId,date,   │  │   icon,sort,builtin} │               │
│  │   note,createdAt}    │  │                      │               │
│  └─────────────────────┘  └─────────────────────┘               │
│                                                                  │
│  Browser-native persistent storage (no server, no network)       │
└─────────────────────────────────────────────────────────────────┘
```

### 数据流说明

1. **用户操作**：在 Vue 组件中触发（如点击保存按钮）
2. **Pinia Action**：组件调用 Store 的 action（如 `recordStore.addRecord()`）
3. **Dexie 操作**：Action 内部调用 Dexie API（如 `db.records.add()`）
4. **IndexedDB 持久化**：数据写入浏览器本地存储
5. **响应式更新**：Dexie 操作完成后，Pinia state 更新，组件自动重新渲染

## 项目目录结构

```
bookkeeping/
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── api/
│   │   ├── db.ts              # Dexie 数据库定义
│   │   ├── records.ts         # 账单 CRUD 封装
│   │   └── categories.ts      # 分类数据封装
│   ├── components/
│   │   ├── AmountKeyboard.vue # 金额输入键盘
│   │   ├── CategoryGrid.vue   # 分类选择网格
│   │   ├── RecordItem.vue     # 账单列表项
│   │   └── EmptyState.vue     # 空状态
│   ├── views/
│   │   ├── Home.vue           # 主页
│   │   ├── Edit.vue           # 记账
│   │   ├── List.vue           # 明细
│   │   ├── Stats.vue          # 统计
│   │   └── Profile.vue        # 我的
│   ├── stores/
│   │   ├── recordStore.ts     # 账单状态
│   │   ├── categoryStore.ts   # 分类状态
│   │   └── uiStore.ts         # UI 状态（筛选、标签页）
│   ├── utils/
│   │   ├── format.ts          # 金额格式化（分→元）
│   │   └── date.ts            # 日期工具
│   ├── router/
│   │   └── index.ts           # 路由配置
│   ├── App.vue
│   └── main.ts
├── docs/                      # 项目文档
│   ├── 01-requirements.md
│   ├── 02-architecture.md
│   ├── 03-database-design.md
│   ├── 04-prototypes.html
│   ├── 05-development-log.md
│   └── README.md
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## PWA 配置方案

```ts
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: '记账本',
    short_name: '记账',
    theme_color: '#1989fa',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}']
  }
})
```

## 部署方案

- **平台**：GitHub Pages（零成本）或 Vercel（零成本 + 全球 CDN）
- **流程**：`git push` → GitHub Actions 自动构建部署
- **域名**：默认 `username.github.io/bookkeeping`，可绑定自定义域名

## 依赖清单

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.0",
    "vant": "^4.9.0",
    "dexie": "^4.0.0",
    "echarts": "^5.5.0",
    "dayjs": "^1.11.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "vite-plugin-pwa": "^0.20.0",
    "typescript": "^5.4.0"
  }
}
```
