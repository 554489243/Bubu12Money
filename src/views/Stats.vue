<template>
  <div class="page">
    <div class="stats-header">
      <BookSelector />
    </div>

    <div v-if="loading" class="loading-state">
      <van-loading size="24px" color="var(--primary)" />
      <span>加载中...</span>
    </div>

    <div v-show="!loading" class="page-content">
      <div class="stats-card">
        <div class="stats-title">近6个月收支趋势</div>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>

      <div class="stats-card">
        <div class="stats-title">支出分类占比</div>
        <div v-if="expenseCategoryStats.length > 0" ref="pieChartRef" class="chart-container"></div>
        <div v-else class="chart-empty">暂无支出数据</div>
        <div v-if="expenseCategoryStats.length > 0" class="pie-legend">
          <div v-for="item in expenseCategoryStats" :key="item.categoryId" class="legend-item">
            <div class="legend-dot" :style="{ background: item.color }"></div>
            <span class="legend-name">{{ item.name }}</span>
            <span class="legend-value">{{ formatAmount(item.amount) }}</span>
            <span class="legend-percent">{{ item.percent }}%</span>
          </div>
        </div>
      </div>

      <div class="stats-card">
        <div class="stats-title">收入分类占比</div>
        <div v-if="incomeCategoryStats.length > 0" ref="incomePieChartRef" class="chart-container"></div>
        <div v-else class="chart-empty">暂无收入数据</div>
        <div v-if="incomeCategoryStats.length > 0" class="pie-legend">
          <div v-for="item in incomeCategoryStats" :key="item.categoryId" class="legend-item">
            <div class="legend-dot" :style="{ background: item.color }"></div>
            <span class="legend-name">{{ item.name }}</span>
            <span class="legend-value">{{ formatAmount(item.amount) }}</span>
            <span class="legend-percent">{{ item.percent }}%</span>
          </div>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import { Loading } from 'vant'
import { useRecordStore } from '@/stores/recordStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useBookStore } from '@/stores/bookStore'
import { formatAmount } from '@/utils/format'
import { getLast6MonthsData, getCategoryStats } from '@/api/records'
import TabBar from '@/components/TabBar.vue'
import BookSelector from '@/components/BookSelector.vue'

const recordStore = useRecordStore()
const categoryStore = useCategoryStore()
const bookStore = useBookStore()

const trendChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
const incomePieChartRef = ref<HTMLElement>()
const loading = ref(true)
let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
let incomePieChart: echarts.ECharts | null = null

const expenseCategoryStats = ref<{
  categoryId: number
  name: string
  amount: number
  percent: number
  color: string
}[]>([])

const incomeCategoryStats = ref<{
  categoryId: number
  name: string
  amount: number
  percent: number
  color: string
}[]>([])

const EXPENSE_COLORS = ['#1989fa', '#69b1ff', '#95de64', '#ff976a', '#ffd666', '#b37feb', '#ff7875', '#36cfc9', '#597ef7']
const INCOME_COLORS = ['#07c160', '#6dd480', '#95de64', '#b7eb8f', '#d9f7be']

async function renderCharts() {
  await recordStore.loadRecords()
  loading.value = false
  await nextTick()

  const bookId = bookStore.isAllBooks ? undefined : bookStore.currentBookId!

  // 趋势图
  if (trendChartRef.value) {
    const data = await getLast6MonthsData(bookId)
    console.log('趋势图数据:', data)
    trendChart = echarts.init(trendChartRef.value, null, { renderer: 'canvas' })
    trendChart.setOption({
      grid: { top: 20, right: 20, bottom: 30, left: 60 },
      legend: { data: ['支出', '收入'], top: 0, textStyle: { fontSize: 11 } },
      xAxis: {
        type: 'category',
        data: data.map(d => d.label),
        axisLabel: { fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 11,
          formatter: (v: number) => '￥' + (v / 100).toFixed(0)
        }
      },
      series: [
        {
          name: '支出',
          type: 'bar',
          data: data.map(d => d.expense),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#40a9ff' },
              { offset: 1, color: '#1989fa' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: 16
        },
        {
          name: '收入',
          type: 'bar',
          data: data.map(d => d.income),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#6dd480' },
              { offset: 1, color: '#07c160' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: 16
        }
      ]
    })
  }

  // 支出饼图
  if (pieChartRef.value) {
    const now = new Date()
    const stats = await getCategoryStats(now.getFullYear(), now.getMonth() + 1, 'expense', bookId)
    console.log('支出饼图数据:', stats)

    let total = 0
    stats.forEach(v => total += v)

    const pieData: { name: string; value: number; itemStyle: { color: string } }[] = []
    const legendData: typeof expenseCategoryStats.value = []
    let colorIdx = 0

    stats.forEach((amount, categoryId) => {
      const cat = categoryStore.getById(categoryId)
      if (cat && amount > 0) {
        const color = EXPENSE_COLORS[colorIdx % EXPENSE_COLORS.length]
        pieData.push({ name: cat.name, value: amount, itemStyle: { color } })
        legendData.push({
          categoryId,
          name: `${cat.icon} ${cat.name}`,
          amount,
          percent: total > 0 ? Math.round((amount / total) * 100) : 0,
          color
        })
        colorIdx++
      }
    })

    expenseCategoryStats.value = legendData.sort((a, b) => b.amount - a.amount)

    if (pieData.length > 0) {
      pieChart = echarts.init(pieChartRef.value, null, { renderer: 'canvas' })
      pieChart.setOption({
        series: [{
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['50%', '50%'],
          data: pieData,
          label: { show: false },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' }
          }
        }]
      })
    }
  }

  // 收入饼图
  if (incomePieChartRef.value) {
    const now = new Date()
    const stats = await getCategoryStats(now.getFullYear(), now.getMonth() + 1, 'income', bookId)
    console.log('收入饼图数据:', stats)

    let total = 0
    stats.forEach(v => total += v)

    const pieData: { name: string; value: number; itemStyle: { color: string } }[] = []
    const legendData: typeof incomeCategoryStats.value = []
    let colorIdx = 0

    stats.forEach((amount, categoryId) => {
      const cat = categoryStore.getById(categoryId)
      if (cat && amount > 0) {
        const color = INCOME_COLORS[colorIdx % INCOME_COLORS.length]
        pieData.push({ name: cat.name, value: amount, itemStyle: { color } })
        legendData.push({
          categoryId,
          name: `${cat.icon} ${cat.name}`,
          amount,
          percent: total > 0 ? Math.round((amount / total) * 100) : 0,
          color
        })
        colorIdx++
      }
    })

    incomeCategoryStats.value = legendData.sort((a, b) => b.amount - a.amount)

    if (pieData.length > 0) {
      incomePieChart = echarts.init(incomePieChartRef.value, null, { renderer: 'canvas' })
      incomePieChart.setOption({
        series: [{
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['50%', '50%'],
          data: pieData,
          label: { show: false },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' }
          }
        }]
      })
    }
  }
}

function handleResize() {
  trendChart?.resize()
  pieChart?.resize()
  incomePieChart?.resize()
}

onMounted(() => {
  renderCharts()
  window.addEventListener('resize', handleResize)
})

watch(() => bookStore.currentBookId, () => {
  renderCharts()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  pieChart?.dispose()
  incomePieChart?.dispose()
})
</script>

<style scoped>
.stats-header {
  padding: 12px 12px 5px 12px;
}
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; font-size: 14px; color: var(--text-secondary); }
.stats-card {
  background: var(--card);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
}
.stats-title { font-size: 14px; font-weight: 700; margin-bottom: 16px; }
.chart-container { width: 100%; aspect-ratio: 16 / 10; min-height: 160px; }
.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  color: var(--text-secondary);
  font-size: 13px;
}

.pie-legend { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.legend-name { flex: 1; }
.legend-value { font-weight: 600; }
.legend-percent { color: var(--text-secondary); width: 36px; text-align: right; }
</style>
