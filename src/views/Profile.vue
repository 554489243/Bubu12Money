<template>
  <div class="page">
    <div class="page-content">
      <div class="profile-header">
        <div class="avatar">📒</div>
        <div class="name">记账本</div>
        <div class="desc">简单好用的个人记账工具</div>
      </div>

      <div class="menu-section">
        <div class="menu-item" @click="$router.push('/books')">
          <div class="icon">📒</div>
          <div class="label">账本管理</div>
          <div class="arrow">›</div>
        </div>
        <div class="menu-item" @click="$router.push('/categories')">
          <div class="icon">🏷️</div>
          <div class="label">分类管理</div>
          <div class="arrow">›</div>
        </div>
      </div>

      <div class="menu-section">
        <div class="menu-item" @click="handleExport">
          <div class="icon">📤</div>
          <div class="label">导出数据</div>
          <div class="arrow">›</div>
        </div>
        <div class="menu-item" @click="handleImport">
          <div class="icon">📥</div>
          <div class="label">导入数据</div>
          <div class="arrow">›</div>
        </div>
        <div class="menu-item" @click="handleArchive">
          <div class="icon">📦</div>
          <div class="label">数据归档</div>
          <div class="archive-info">
            <span v-if="archivableCount > 0" class="archive-count">{{ archivableCount }} 条可归档</span>
            <span class="arrow">›</span>
          </div>
        </div>
      </div>

      <div class="menu-section">
        <div class="menu-item" @click="showToast('云端同步功能开发中')">
          <div class="icon">☁️</div>
          <div class="label">云端同步</div>
          <div class="arrow">›</div>
        </div>
        <div class="menu-item" @click="showToast('记账本 v1.0.0\nVue3 + Vant4 + Dexie.js')">
          <div class="icon">ℹ️</div>
          <div class="label">关于</div>
          <div class="arrow">›</div>
        </div>
      </div>

      <div class="version-tag">v1.0.0 · Vue3 + Vant4 + Dexie.js</div>
    </div>

    <!-- 隐藏的文件输入（PWA 兼容） -->
    <input ref="fileInput" type="file" accept=".json" class="file-input-hidden" @change="onFileSelected" />

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import TabBar from '@/components/TabBar.vue'
import { useRecordStore } from '@/stores/recordStore'
import { exportData, importData, downloadBackup, mergeData } from '@/api/backup'

const recordStore = useRecordStore()
const archivableCount = ref(0)
const fileInput = ref<HTMLInputElement>()

async function refreshArchivable() {
  archivableCount.value = await recordStore.countArchivable()
}

async function handleArchive() {
  if (archivableCount.value === 0) {
    showToast('暂无需要归档的数据')
    return
  }
  await showConfirmDialog({
    title: '数据归档',
    message: `将归档 ${archivableCount.value} 条 1 年前的记录到历史表，归档后只可查看不可编辑。`,
    confirmButtonText: '确认归档',
    confirmButtonColor: '#1989fa'
  })
  const count = await recordStore.doArchive()
  showToast(`已归档 ${count} 条记录`)
  archivableCount.value = 0
}

async function handleExport() {
  showToast('正在导出...')
  const data = await exportData()
  await downloadBackup(data)
  showToast('导出成功')
}

function handleImport() {
  fileInput.value?.click()
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!data.version || !data.records) {
      showToast('无效的备份文件')
      return
    }
    await showConfirmDialog({
      title: '导入数据',
      message: '将合并备份数据到当前账本（自动去重，不会丢失现有数据）',
      confirmButtonText: '合并导入',
      confirmButtonColor: '#1989fa'
    })
    const result = await mergeData(data)
    showToast(`导入完成：${result.records} 条记录，${result.categories} 个分类，${result.books} 个账本`)
    setTimeout(() => location.reload(), 1500)
  } catch (e: any) {
    showToast(e.message || '导入失败')
  } finally {
    input.value = ''
  }
}

onMounted(() => {
  refreshArchivable()
})
</script>

<style scoped>
.profile-header {
  background: linear-gradient(135deg, var(--primary), #40a9ff);
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  color: #fff;
  text-align: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(25, 137, 250, 0.3);
}
.profile-header .avatar {
  width: 60px; height: 60px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
  margin: 0 auto 10px;
}
.profile-header .name { font-size: 18px; font-weight: 700; }
.profile-header .desc { font-size: 12px; opacity: 0.8; margin-top: 4px; }

.menu-section {
  background: var(--card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow);
  margin-bottom: 12px;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.menu-item:last-child { border-bottom: none; }
.menu-item:active { background: var(--bg); }
.menu-item .icon { font-size: 20px; }
.menu-item .label { flex: 1; font-size: 14px; }
.menu-item .arrow { color: var(--text-secondary); font-size: 12px; }
.archive-info {
  display: flex;
  align-items: center;
  gap: 6px;
}
.archive-count {
  font-size: 11px;
  color: var(--warning);
  font-weight: 600;
}

.version-tag {
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* 文件输入：PWA 兼容隐藏（保持可点击） */
.file-input-hidden {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
