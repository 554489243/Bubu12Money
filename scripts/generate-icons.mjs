/**
 * 从 public/main-icon.png 生成全平台 PWA 桌面图标。
 *
 * 用法：npm run icons
 *
 * 设计要点（2026-09-18 定稿，与 APK 版口径一致）：
 * - 源图是小熊 + 右侧「记下来」文字的**完整图**，不裁不抠，原样保留。
 * - **整张图等比缩到画布的 50%**，居中，四周填满与源图背景一致的底色。
 *   为什么要缩：Android / iOS 的桌面图标会被厂商遮罩（圆形 / 圆角矩形）
 *   裁切，内容占满整幅就会被切到边角。缩到一半后，任何遮罩形状都碰不到它。
 * - 底色铺满 + 不透明，避免透明区域在 iOS 上被渲染成黑块。
 *
 * 换源图后直接跑本脚本即可，无需改代码（不依赖任何硬编码的裁剪坐标）。
 *
 * 本脚本只产出「桌面图标」，不影响 index.html 里的 favicon 引用。
 */
import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const sourceBuf = await readFile(join(publicDir, 'main-icon.png'))

const meta = await sharp(sourceBuf).metadata()
console.log(`源图 ${meta.width}x${meta.height}`)

/** 内容占画布的比例 —— 其余全部留作底色 */
const CONTENT_RATIO = 0.5

/**
 * 统一底色。**必须与源图自身的背景色完全一致**，否则内容缩小后
 * 会露出一块色差方块，看起来像贴了张纸。
 * 当前源图内容区是一整块 #FAFAFA 灰白底（只有四角透明），故取 #FAFAFA。
 * 换源图后请重新取色确认。
 */
const BG = '#FAFAFA'

/** 把整张源图等比缩到画布的 CONTENT_RATIO 并居中，四周铺满统一底色 */
async function composeIcon(size) {
  const content = Math.max(1, Math.round(size * CONTENT_RATIO))
  const inner = await sharp(sourceBuf)
    .resize(content, content, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
  return sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: inner, gravity: 'centre' }])
    .png()
    .toBuffer()
}

/** 生成圆角 SVG mask */
function maskFor(size, radiusRatio) {
  const r = Math.round(size * radiusRatio)
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`
  )
}

/** 圆角版（四角透明） */
async function roundedPng(size, radiusRatio = 0.225) {
  const base = await composeIcon(size)
  return sharp(base)
    .composite([{ input: maskFor(size, radiusRatio), blend: 'dest-in' }])
    .png()
    .toBuffer()
}

/** 圆角 + 不透明（给 iOS apple-touch：iOS 对透明通道处理很差，会渲染成黑色） */
async function roundedOpaquePng(size, radiusRatio = 0.18) {
  const base = await composeIcon(size)
  return sharp(base)
    .composite([{ input: maskFor(size, radiusRatio), blend: 'dest-in' }])
    .flatten({ background: BG })
    .png()
    .toBuffer()
}

/** 满幅直角 + 不透明（给 Android maskable，不许有透明边，否则裁形状时露白边） */
async function flatPng(size) {
  return composeIcon(size)
}

async function write(name, buf) {
  await writeFile(join(publicDir, name), buf)
  console.log(`  ✓ ${name}  ${buf.length} B`)
}

// 圆角版：Android 主屏 / 高分屏
for (const size of [144, 192, 256, 384, 512]) {
  await write(`icon-${size}.png`, await roundedPng(size))
}

// apple-touch：圆角 + 不透明（iOS 主屏）
for (const size of [152, 167, 180]) {
  await write(`icon-${size}.png`, await roundedOpaquePng(size))
}

// maskable：满幅直角 + 不透明（Android 自适应图标）
await write('icon-maskable-512.png', await flatPng(512))

// 32x32 保留供 favicon 使用（内容对齐，避免与桌面图标观感不一致）
await write('icon-32.png', await roundedPng(32))

console.log(`\n桌面图标已生成（源：public/main-icon.png，整图缩至 ${CONTENT_RATIO * 100}%，四周填 ${BG}）`)
