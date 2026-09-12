import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import {
  Icon,
  Popup,
  DatePicker,
  SwipeCell,
  Picker,
  NumberKeyboard,
  Field,
  Cell,
  CellGroup,
  NavBar,
  Button,
  Tag,
  Col,
  Row,
  Loading
} from 'vant'
import 'vant/lib/index.css'
import './styles/global.css'
import { maintainArchive } from './api/records'
import { autoBackup } from './api/backup'

// 启动时自动归档旧数据（静默）
maintainArchive()

// 启动时检测自动备份（月初/月半，静默下载）
autoBackup()

const app = createApp(App)
app.use(createPinia())
app.use(router)

// 注册 Vant 组件（仅组件，不含 ConfirmDialog/Toast 等函数式 API）
const vantComponents = [Icon, Popup, DatePicker, SwipeCell, Picker, NumberKeyboard, Field, Cell, CellGroup, NavBar, Button, Tag, Col, Row, Loading]
vantComponents.forEach(comp => app.use(comp))

app.mount('#app')
