import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const svgPath = join(publicDir, 'icon.svg')

const svgSource = readFileSync(svgPath, 'utf8')

// 圆角版（原样）——给 manifest 的常规图标用
const roundedSvg = Buffer.from(svgSource)

// 满幅无圆角版——给 iOS apple-touch-icon / maskable 用。
// iOS 会自己加圆角，且对透明通道处理很差（透明区域会变黑）；
// Android 的 maskable 需要内容能撑满安全区，也不能留圆角。
const fullBleedSvg = Buffer.from(svgSource.replace('rx="112"', 'rx="0"'))

// 尺寸必须与 vite.config.ts 的 manifest.icons、index.html 的 link 标签一一对应
const regular = [32, 144, 192, 256, 384, 512]
const appleIcons = [152, 167, 180]

async function generate() {
  for (const size of regular) {
    await sharp(roundedSvg, { density: 384 })
      .resize(size, size)
      .png()
      .toFile(join(publicDir, `icon-${size}.png`))
    console.log(`  icon-${size}.png (圆角)`)
  }

  for (const size of appleIcons) {
    await sharp(fullBleedSvg, { density: 384 })
      .resize(size, size)
      .flatten({ background: '#f59e0b' })
      .png()
      .toFile(join(publicDir, `icon-${size}.png`))
    console.log(`  icon-${size}.png (apple-touch, 满幅不透明)`)
  }

  await sharp(fullBleedSvg, { density: 384 })
    .resize(512, 512)
    .flatten({ background: '#f59e0b' })
    .png()
    .toFile(join(publicDir, 'icon-maskable-512.png'))
  console.log('  icon-maskable-512.png (maskable)')

  console.log('\n所有图标已生成')
}

generate().catch((e) => {
  console.error('生成失败:', e)
  process.exit(1)
})
