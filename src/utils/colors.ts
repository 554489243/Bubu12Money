/**
 * 分类色彩系统
 * 每个分类有固定的 bg（图标背景）、text（文字颜色）、light（浅色背景）
 * 支出用暖色系、收入用绿色系，便于视觉区分
 */

export interface CategoryColor {
  bg: string
  text: string
  light: string
}

// 父分类色彩映射
export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  // 支出
  '餐饮': { bg: '#FF9800', text: '#E65100', light: '#FFF3E0' },
  '交通': { bg: '#2196F3', text: '#0D47A1', light: '#E3F2FD' },
  '购物': { bg: '#E91E63', text: '#880E4F', light: '#FCE4EC' },
  '居住': { bg: '#795548', text: '#3E2723', light: '#EFEBE9' },
  '娱乐': { bg: '#9C27B0', text: '#4A148C', light: '#F3E5F5' },
  '医疗': { bg: '#F44336', text: '#B71C1C', light: '#FFEBEE' },
  '教育': { bg: '#00BCD4', text: '#006064', light: '#E0F7FA' },
  '其他': { bg: '#607D8B', text: '#263238', light: '#ECEFF1' },
  // 收入
  '薪资': { bg: '#4CAF50', text: '#1B5E20', light: '#E8F5E9' },
  '理财': { bg: '#009688', text: '#004D40', light: '#E0F2F1' },
}

// 子分类色彩 — 继承父分类
export const CHILD_COLORS: Record<string, CategoryColor> = {
  // 餐饮
  '外食': { bg: '#FF9800', text: '#E65100', light: '#FFF3E0' },
  '买菜': { bg: '#8BC34A', text: '#33691E', light: '#F1F8E9' },
  '饮料': { bg: '#FF7043', text: '#BF360C', light: '#FBE9E7' },
  // 交通
  '充电': { bg: '#00BCD4', text: '#006064', light: '#E0F7FA' },
  '加油': { bg: '#2196F3', text: '#0D47A1', light: '#E3F2FD' },
  '打车': { bg: '#FFC107', text: '#FF6F00', light: '#FFF8E1' },
  '车贷': { bg: '#3F51B5', text: '#1A237E', light: '#E8EAF6' },
  '车险': { bg: '#009688', text: '#004D40', light: '#E0F2F1' },
  '停车费': { bg: '#607D8B', text: '#263238', light: '#ECEFF1' },
  // 购物
  '衣服': { bg: '#E91E63', text: '#880E4F', light: '#FCE4EC' },
  '鞋子': { bg: '#9C27B0', text: '#4A148C', light: '#F3E5F5' },
  '日用品': { bg: '#795548', text: '#3E2723', light: '#EFEBE9' },
  '美妆': { bg: '#F06292', text: '#880E4F', light: '#FCE4EC' },
  '零食': { bg: '#FF9800', text: '#E65100', light: '#FFF3E0' },
  // 居住
  '房租': { bg: '#795548', text: '#3E2723', light: '#EFEBE9' },
  '房贷': { bg: '#3F51B5', text: '#1A237E', light: '#E8EAF6' },
  '水电': { bg: '#00BCD4', text: '#006064', light: '#E0F7FA' },
  '物业': { bg: '#607D8B', text: '#263238', light: '#ECEFF1' },
  '维修': { bg: '#FF7043', text: '#BF360C', light: '#FBE9E7' },
  // 娱乐
  '游戏': { bg: '#9C27B0', text: '#4A148C', light: '#F3E5F5' },
  '电影': { bg: '#F44336', text: '#B71C1C', light: '#FFEBEE' },
  '聚会': { bg: '#FF9800', text: '#E65100', light: '#FFF3E0' },
  '运动': { bg: '#4CAF50', text: '#1B5E20', light: '#E8F5E9' },
  '宠物': { bg: '#8BC34A', text: '#33691E', light: '#F1F8E9' },
  // 医疗
  '药品': { bg: '#F44336', text: '#B71C1C', light: '#FFEBEE' },
  '挂号': { bg: '#2196F3', text: '#0D47A1', light: '#E3F2FD' },
  '检查': { bg: '#00BCD4', text: '#006064', light: '#E0F7FA' },
  '保险': { bg: '#009688', text: '#004D40', light: '#E0F2F1' },
  // 教育
  '学费': { bg: '#00BCD4', text: '#006064', light: '#E0F7FA' },
  '书本': { bg: '#795548', text: '#3E2723', light: '#EFEBE9' },
  '培训': { bg: '#009688', text: '#004D40', light: '#E0F2F1' },
  // 其他（支出）
  '礼金': { bg: '#F44336', text: '#B71C1C', light: '#FFEBEE' },
  '捐赠': { bg: '#4CAF50', text: '#1B5E20', light: '#E8F5E9' },
  '通讯': { bg: '#2196F3', text: '#0D47A1', light: '#E3F2FD' },
  '数码': { bg: '#9C27B0', text: '#4A148C', light: '#F3E5F5' },
  '旅行': { bg: '#FF9800', text: '#E65100', light: '#FFF3E0' },
  '烟酒': { bg: '#607D8B', text: '#263238', light: '#ECEFF1' },
  // 薪资
  '工资': { bg: '#4CAF50', text: '#1B5E20', light: '#E8F5E9' },
  '奖金': { bg: '#FF9800', text: '#E65100', light: '#FFF3E0' },
  '兼职': { bg: '#009688', text: '#004D40', light: '#E0F2F1' },
  // 理财
  '利息': { bg: '#009688', text: '#004D40', light: '#E0F2F1' },
  '分红': { bg: '#FF9800', text: '#E65100', light: '#FFF3E0' },
  '租金': { bg: '#795548', text: '#3E2723', light: '#EFEBE9' },
  // 其他（收入）
  '红包': { bg: '#F44336', text: '#B71C1C', light: '#FFEBEE' },
  '报销': { bg: '#2196F3', text: '#0D47A1', light: '#E3F2FD' },
  '退款': { bg: '#00BCD4', text: '#006064', light: '#E0F7FA' },
  '中奖': { bg: '#FF9800', text: '#E65100', light: '#FFF3E0' },
  '二手': { bg: '#8BC34A', text: '#33691E', light: '#F1F8E9' },
}

// 通用杂项颜色
const MISC_COLOR: CategoryColor = { bg: '#607D8B', text: '#263238', light: '#ECEFF1' }

/**
 * 获取分类颜色（优先匹配子分类，再匹配父分类，最后返回默认）
 */
export function getCategoryColor(name: string): CategoryColor {
  return CHILD_COLORS[name] || CATEGORY_COLORS[name] || MISC_COLOR
}

/**
 * 账本颜色预设
 */
export const BOOK_COLOR_PRESETS = [
  '#1989fa', '#07c160', '#ff976a', '#7232dd',
  '#ee0a24', '#00bcd4', '#795548', '#607d8b',
]
