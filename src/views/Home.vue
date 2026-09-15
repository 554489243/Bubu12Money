<template>
  <div class="page">
    <!-- 账本选择 -->
    <div class="book-row">
      <BookSelector />
      <img src="/bubu.jpg" class="book-row-img" />
    </div>

    <div v-if="loading" class="loading-state">
      <van-loading size="24px" color="var(--primary)" />
      <span>加载中...</span>
    </div>

    <template v-else>
      <div class="page-content">
        <!-- 概览卡片 -->
        <div class="overview-card">
          <div class="overview-row">
            <div class="overview-item">
              <div class="label">支出</div>
              <div class="amount expense"><small>￥</small>{{ expenseYuan }}</div>
            </div>
            <div class="divider"></div>
            <div class="overview-item">
              <div class="label">收入</div>
              <div class="amount income"><small>￥</small>{{ incomeYuan }}</div>
            </div>
          </div>
          <div class="view-toggle">
            <span :class="{ active: view === 'week' }" @click="view = 'week'">本周</span>
            <span :class="{ active: view === 'month' }" @click="view = 'month'">本月</span>
            <span :class="{ active: view === 'year' }" @click="view = 'year'">本年</span>
          </div>
        </div>

        <!-- 趋势图 -->
        <div class="stats-card">
          <div class="stats-title">TREND</div>
          <div ref="trendChartRef" class="chart-container"></div>
        </div>

        <!-- 支出排名 -->
        <div class="stats-card">
          <div class="stats-title">EXPENSE</div>
          <div v-if="expenseCategoryStats.length === 0" class="chart-empty">暂无支出数据</div>
          <div v-else class="ranking-list">
            <div v-for="item in expenseCategoryStats" :key="item.categoryId" class="ranking-item">
              <div class="ranking-icon" :style="{ background: item.color + '18' }">{{ item.icon }}</div>
              <div class="ranking-info">
                <div class="ranking-name">{{ item.name }}</div>
                <div class="ranking-bar-bg"><div class="ranking-bar" :style="{ width: item.percent + '%', background: item.color }"></div></div>
              </div>
              <div class="ranking-value">￥{{ (item.amount / 100).toFixed(0) }}</div>
              <div class="ranking-pct">{{ item.percent }}%</div>
            </div>
          </div>
        </div>

        <!-- 收入排名 -->
        <div class="stats-card">
          <div class="stats-title">INCOME</div>
          <div v-if="incomeCategoryStats.length === 0" class="chart-empty">暂无收入数据</div>
          <div v-else class="ranking-list">
            <div v-for="item in incomeCategoryStats" :key="item.categoryId" class="ranking-item">
              <div class="ranking-icon" :style="{ background: item.color + '18' }">{{ item.icon }}</div>
              <div class="ranking-info">
                <div class="ranking-name">{{ item.name }}</div>
                <div class="ranking-bar-bg"><div class="ranking-bar" :style="{ width: item.percent + '%', background: item.color }"></div></div>
              </div>
              <div class="ranking-value">￥{{ (item.amount / 100).toFixed(0) }}</div>
              <div class="ranking-pct">{{ item.percent }}%</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { Loading } from 'vant'
import { useRecordStore } from '@/stores/recordStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useBookStore } from '@/stores/bookStore'
import { formatAmount } from '@/utils/format'
import { getCategoryColor } from '@/utils/colors'
import { getWeekRange, getYearRange } from '@/utils/date'
import { getCategoryStatsByDateRange, getTrendByDateRange } from '@/api/records'
import TabBar from '@/components/TabBar.vue'
import BookSelector from '@/components/BookSelector.vue'

const recordStore = useRecordStore()
const categoryStore = useCategoryStore()
const bookStore = useBookStore()
const view = ref('month')
const loading = ref(true)

// 图表引用
const trendChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null

const expenseCategoryStats = ref<{
  categoryId: number; name: string; icon: string; amount: number; percent: number; color: string
}[]>([])
const incomeCategoryStats = ref<{
  categoryId: number; name: string; icon: string; amount: number; percent: number; color: string
}[]>([])



// 按账本筛选的记录
const filteredRecords = computed(() => {
  if (bookStore.isAllBooks) return recordStore.records
  return recordStore.records.filter((r: any) => r.bookId === bookStore.currentBookId)
})

function getRecordsByView() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
  switch (view.value) {
    case 'week': {
      const { start, end } = getWeekRange()
      return filteredRecords.value.filter((r: any) => r.date >= start && r.date <= end)
    }
    case 'year': {
      const { start, end } = getYearRange()
      return filteredRecords.value.filter((r: any) => r.date >= start && r.date <= end)
    }
    case 'month':
    default:
      return filteredRecords.value.filter((r: any) => r.date.startsWith(monthPrefix))
  }
}

const expenseYuan = computed(() => {
  const total = getRecordsByView().filter(r => r.type === 'expense').reduce((sum: number, r: any) => sum + r.amount, 0)
  return (total / 100).toFixed(2)
})

const incomeYuan = computed(() => {
  const total = getRecordsByView().filter((r: any) => r.type === 'income').reduce((sum: number, r: any) => sum + r.amount, 0)
  return (total / 100).toFixed(2)
})

const trendTitle = computed(() => {
  switch (view.value) {
    case 'week': return '本周'
    case 'year': return '本年'
    case 'month':
    default: return '本月'
  }
})

function getDateRange(): { start: string; end: string; trendGroup: 'day' | 'month'; trendLabel: (d: string) => string } {
  const now = new Date()
  switch (view.value) {
    case 'week': {
      const { start, end } = getWeekRange()
      return {
        start, end,
        trendGroup: 'day',
        trendLabel: (d: string) => dayjs(d).format('M/D')
      }
    }
    case 'year': {
      const { start, end } = getYearRange()
      return {
        start, end,
        trendGroup: 'month',
        trendLabel: (d: string) => dayjs(d + '-01').format('M月')
      }
    }
    case 'month':
    default: {
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const start = `${year}-${String(month).padStart(2, '0')}-01`
      const end = dayjs(start).endOf('month').format('YYYY-MM-DD')
      return {
        start, end,
        trendGroup: 'day',
        trendLabel: (d: string) => dayjs(d).format('D')
      }
    }
  }
}

async function renderCharts() {
  loading.value = true
  await recordStore.loadRecords()
  loading.value = false
  await nextTick()

  const bookId = bookStore.isAllBooks ? undefined : bookStore.currentBookId!
  const { start, end, trendGroup, trendLabel } = getDateRange()

  // 趋势图 - 柱状 + 收支差折线
  if (trendChartRef.value) {
    const trendData = await getTrendByDateRange(start, end, bookId, trendGroup)
    const filledData = fillDateGaps(trendData, start, end, trendGroup, trendLabel)
    if (trendChart) { trendChart.dispose(); trendChart = null }
    trendChart = echarts.init(trendChartRef.value, null, { renderer: 'canvas' })
    trendChart.setOption({
      grid: { top: 16, right: 16, bottom: 24, left: 40 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#eee', borderWidth: 1,
        textStyle: { color: '#333', fontSize: 12 },
        extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-radius: 6px;'
      },
      xAxis: {
        type: 'category',
        data: filledData.map(d => d.label),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, color: '#bbb' }
      },
      yAxis: { type: 'value', show: false },
      series: [
        {
          name: '支出', type: 'bar',
          data: filledData.map(d => d.expense),
          barWidth: 4,
          itemStyle: { color: '#1989fa', borderRadius: [2, 2, 0, 0] }
        },
        {
          name: '收入', type: 'bar',
          data: filledData.map(d => d.income),
          barWidth: 4,
          itemStyle: { color: '#07c160', borderRadius: [2, 2, 0, 0] }
        }
      ]
    })
  }

  // 支出排名数据
  {
    const stats = await getCategoryStatsByDateRange(start, end, 'expense', bookId)
    let total = 0
    stats.forEach(v => total += v)
    const legendData: typeof expenseCategoryStats.value = []
    // 按父分类聚合
    const parentMap = new Map<number, number>()
    stats.forEach((amount, categoryId) => {
      const parentId = categoryStore.getParentId(categoryId)
      parentMap.set(parentId, (parentMap.get(parentId) || 0) + amount)
    })
    parentMap.forEach((amount, parentId) => {
      const cat = categoryStore.getById(parentId)
      if (cat && amount > 0) {
        const color = getCategoryColor(cat.name).bg
        legendData.push({ categoryId: parentId, name: cat.name, icon: cat.icon, amount, percent: total > 0 ? Math.round((amount / total) * 100) : 0, color })
      }
    })
    expenseCategoryStats.value = legendData.sort((a, b) => b.amount - a.amount)
  }

  // 收入排名数据
  {
    const stats = await getCategoryStatsByDateRange(start, end, 'income', bookId)
    let total = 0
    stats.forEach(v => total += v)
    const legendData: typeof incomeCategoryStats.value = []
    // 按父分类聚合
    const parentMap = new Map<number, number>()
    stats.forEach((amount, categoryId) => {
      const parentId = categoryStore.getParentId(categoryId)
      parentMap.set(parentId, (parentMap.get(parentId) || 0) + amount)
    })
    parentMap.forEach((amount, parentId) => {
      const cat = categoryStore.getById(parentId)
      if (cat && amount > 0) {
        const color = getCategoryColor(cat.name).bg
        legendData.push({ categoryId: parentId, name: cat.name, icon: cat.icon, amount, percent: total > 0 ? Math.round((amount / total) * 100) : 0, color })
      }
    })
    incomeCategoryStats.value = legendData.sort((a, b) => b.amount - a.amount)
  }
  loading.value = false
}

function fillDateGaps(
  data: { label: string; expense: number; income: number }[],
  start: string, end: string,
  groupBy: 'day' | 'month',
  labelFn: (d: string) => string
): { label: string; expense: number; income: number }[] {
  const result: { label: string; expense: number; income: number }[] = []
  const dataMap = new Map(data.map(d => [d.label, d]))
  if (groupBy === 'day') {
    let current = dayjs(start)
    const endDate = dayjs(end)
    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      const key = current.format('YYYY-MM-DD')
      const existing = dataMap.get(key)
      result.push({ label: labelFn(key), expense: existing?.expense || 0, income: existing?.income || 0 })
      current = current.add(1, 'day')
    }
  } else {
    let current = dayjs(start).startOf('month')
    const endDate = dayjs(end).startOf('month')
    while (current.isBefore(endDate) || current.isSame(endDate, 'month')) {
      const key = current.format('YYYY-MM')
      const existing = dataMap.get(key)
      result.push({ label: labelFn(key), expense: existing?.expense || 0, income: existing?.income || 0 })
      current = current.add(1, 'month')
    }
  }
  return result
}

function handleResize() {
  trendChart?.resize()
}

onMounted(() => {
  renderCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
})

watch(() => bookStore.currentBookId, () => {
  renderCharts()
})

watch(view, () => {
  renderCharts()
})
</script>

<style scoped>
.overview-card {
  background: linear-gradient(135deg, var(--primary), #40a9ff);
  border-radius: var(--radius-lg);
  padding: 20px;
  color: #fff;
  margin: 12px;
  box-shadow: 0 4px 20px rgba(25, 137, 250, 0.3);
}
.book-row { padding: 12px 12px 8px; display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.book-row-img { width: 33px; height: 33px; border-radius: 6px; object-fit: cover; }
.overview-row { display: flex; align-items: center; gap: 16px; flex: 1; }
.overview-item .label { font-size: 12px; opacity: 0.8; margin-bottom: 4px; }
.overview-item .amount { font-size: 24px; font-weight: 700; letter-spacing: -1px; }
.overview-item .amount small { font-size: 14px; font-weight: 500; }
.overview-item .amount.income { color: #b7eb8f; }
.divider { width: 1px; height: 40px; background: rgba(255,255,255,0.3); }
.view-toggle { display: flex; background: rgba(255,255,255,0.2); border-radius: 10px; padding: 3px; margin-top: 12px; width: fit-content; }
.view-toggle span { padding: 5px 10px; border-radius: 8px; font-size: 12px; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
.view-toggle span.active { background: #fff; color: var(--primary); font-weight: 600; }

.loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; font-size: 14px; color: var(--text-secondary); }

.stats-card { background: #fff; border-radius: 24px; padding: 24px; margin: 0 12px 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.stats-subtitle { font-size: 11px; color: #999; margin-bottom: 12px; }
.stats-title { font-size: 12px; font-weight: 500; color: #999; margin-bottom: 16px; letter-spacing: 2px; text-transform: uppercase; }
.chart-wrapper { position: relative; }
.chart-container { width: 100%; aspect-ratio: 16 / 10; min-height: 160px; }
.ranking-bar { height: 100%; border-radius: 2px; transition: width 0.3s; }
.ranking-value { font-size: 14px; font-weight: 600; color: #333; white-space: nowrap; }
.ranking-pct { font-size: 11px; color: #999; width: 36px; text-align: right; }
.chart-empty { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 13px; }
.ranking-list { display: flex; flex-direction: column; gap: 12px; }
.ranking-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.ranking-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.ranking-info { flex: 1; min-width: 0; }
.ranking-name { font-size: 13px; font-weight: 500; color: #333; margin-bottom: 4px; }
.ranking-bar-bg { height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden; }
</style>
