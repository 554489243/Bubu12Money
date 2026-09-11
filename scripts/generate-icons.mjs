import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

async function generate() {
  const svg = join(publicDir, 'icon.svg')
  await sharp(svg).resize(192, 192).png().toFile(join(publicDir, 'icon-192.png'))
  await sharp(svg).resize(512, 512).png().toFile(join(publicDir, 'icon-512.png'))
  console.log('Icons generated!')
}

generate()
