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
        <div class="menu-item" @click="$router.push('/theme')">
          <div class="icon">🎨</div>
          <div class="label">主题设置</div>
          <div class="arrow">›</div>
        </div>
      </div>

      <div class="menu-section">
        <div class="menu-item" @click="$router.push('/manual')">
          <div class="icon">📖</div>
          <div class="label">用户手册</div>
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


    <!-- 导入弹窗 -->
    <van-popup v-model:show="showImportDialog" position="bottom" round :style="{ height: '70%' }">
      <div class="import-dialog">
        <div class="import-title">导入数据</div>
        <div class="import-desc">请粘贴之前导出的 JSON 备份内容：</div>
        <textarea ref="pasteArea" v-model="pasteContent" class="import-textarea" placeholder='{"version":1,"records":[...]}...' @paste="onPaste"></textarea>
        <div class="import-actions">
          <button class="btn-cancel" @click="showImportDialog = false">取消</button>
          <button class="btn-confirm" :disabled="!pasteContent.trim()" @click="doPasteImport">导入</button>
        </div>
      </div>
    </van-popup>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import TabBar from '@/components/TabBar.vue'
import { useRecordStore } from '@/stores/recordStore'
import { exportData, importData, downloadBackup, mergeData } from '@/api/backup'

const recordStore = useRecordStore()
const archivableCount = ref(0)

const showImportDialog = ref(false)
const pasteContent = ref('')
const pasteArea = ref<HTMLTextAreaElement>()

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
  const data = await exportData()
  const result = await downloadBackup(data)
  if (result === 'shared') {
    showToast('已分享备份文件')
  } else if (result === 'saved') {
    showToast('备份已保存')
  } else {
    showToast('请在弹出的窗口中保存文件')
  }
}

async function handleImport() {
  pasteContent.value = ''
  showImportDialog.value = true
  await nextTick()
  pasteArea.value?.focus()
}

async function doPasteImport() {
  const content = pasteContent.value?.trim()
  if (!content) {
    showToast('请先粘贴备份内容')
    return
  }
  showImportDialog.value = false
  try {
    const data = JSON.parse(content)
    if (!data.version || !data.records) {
      showToast('无效的备份文件')
      return
    }
    await showConfirmDialog({
      title: '导入数据',
      message: '将合并备份数据到当前账本（自动去重，不会丢失现有数据）',
      confirmButtonText: '合并导入',
      confirmButtonColor: 'var(--primary)'
    })
    const result = await mergeData(data)
    showToast(`导入完成：${result.records} 条记录，${result.categories} 个分类，${result.books} 个账本`)
    setTimeout(() => location.reload(), 1500)
  } catch (e: any) {
    showToast(e.message || '导入失败')
  }
}

function onPaste() {
  // 自动清理 JSON 内容（去除 markdown 代码块标记）
  setTimeout(() => {
    let content = pasteContent.value
    content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    pasteContent.value = content
  }, 0)
}

onMounted(() => {
  refreshArchivable()
})
</script>

<style scoped>
.profile-header {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  color: #fff;
  text-align: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
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

/* 导入弹窗 */
.import-dialog {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}
.import-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  text-align: center;
  margin-bottom: 6px;
}
.import-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
.import-textarea {
  flex: 1;
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  font-size: 12px;
  font-family: monospace;
  resize: none;
  background: var(--bg);
  color: var(--text);
  min-height: 200px;
}
.import-textarea:focus {
  outline: none;
  border-color: var(--primary);
}
.import-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
.btn-cancel {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
}
.btn-confirm {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: var(--radius);
  background: var(--primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
