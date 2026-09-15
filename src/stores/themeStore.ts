import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface ThemeConfig {
  primary: string
  success: string
  danger: string
  bg: string
  card: string
  text: string
  textSecondary: string
  border: string
}

export interface ThemePreset {
  name: string
  config: ThemeConfig
}

const STORAGE_KEY = 'themeConfig'

const defaultTheme: ThemeConfig = {
  primary: '#1989fa',
  success: '#07c160',
  danger: '#ee0a24',
  bg: '#f5f6f8',
  card: '#ffffff',
  text: '#323233',
  textSecondary: '#969799',
  border: '#ebedf0',
}

export const presets: ThemePreset[] = [
  {
    name: '经典蓝白',
    config: { ...defaultTheme }
  },
  {
    name: '暗夜黑金',
    config: {
      primary: '#f0b90b',
      success: '#07c160',
      danger: '#ff4d4f',
      bg: '#141414',
      card: '#1f1f1f',
      text: '#f5f5f5',
      textSecondary: '#888888',
      border: '#333333',
    }
  },
  {
    name: '莫兰迪',
    config: {
      primary: '#a8b5c2',
      success: '#86a873',
      danger: '#c49a8a',
      bg: '#e8e4df',
      card: '#f5f2ed',
      text: '#4a4a4a',
      textSecondary: '#8a8a8a',
      border: '#d0cbc4',
    }
  },
  {
    name: '抹茶绿',
    config: {
      success: '#86a873',
      primary: '#7eb87e',
      danger: '#d4867a',
      bg: '#f0f5ed',
      card: '#ffffff',
      text: '#3d4a3a',
      textSecondary: '#7a8a78',
      border: '#d4e0cf',
    }
  },
]

function loadFromStorage(): ThemeConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { ...defaultTheme }
}

function applyToDOM(config: ThemeConfig) {
  const root = document.documentElement
  root.style.setProperty('--primary', config.primary)
  root.style.setProperty('--success', config.success)
  root.style.setProperty('--danger', config.danger)
  root.style.setProperty('--bg', config.bg)
  root.style.setProperty('--card', config.card)
  root.style.setProperty('--text', config.text)
  root.style.setProperty('--text-secondary', config.textSecondary)
  root.style.setProperty('--border', config.border)

  // 计算衍生色
  root.style.setProperty('--primary-light', config.primary + '18')
  root.style.setProperty('--success-light', config.success + '18')
  root.style.setProperty('--danger-light', config.danger + '15')
}

export const useThemeStore = defineStore('theme', () => {
  const config = ref<ThemeConfig>(loadFromStorage())
  const activePresetIndex = ref(-1)

  // 初始化应用
  applyToDOM(config.value)

  // 保存到 localStorage
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
    applyToDOM(config.value)
    // 更新 activePresetIndex
    const idx = presets.findIndex(p =>
      JSON.stringify(p.config) === JSON.stringify(config.value)
    )
    activePresetIndex.value = idx
  }

  // 应用预设
  function applyPreset(index: number) {
    config.value = { ...presets[index].config }
    activePresetIndex.value = index
    save()
  }

  // 重置
  function reset() {
    config.value = { ...defaultTheme }
    activePresetIndex.value = 0
    save()
  }

  // 初始化时检测当前是哪个预设
  const idx = presets.findIndex(p =>
    JSON.stringify(p.config) === JSON.stringify(config.value)
  )
  activePresetIndex.value = idx

  return {
    config,
    activePresetIndex,
    presets,
    save,
    applyPreset,
    reset,
  }
})
