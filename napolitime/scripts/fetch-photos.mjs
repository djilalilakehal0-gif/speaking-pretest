// Downloads the photos listed in photos.json as optimized WebP files (640px + 1280px wide)
// into public/img/. The files are committed, so builds never depend on the network.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const here = new URL('.', import.meta.url)
const out = new URL('../public/img/', import.meta.url)
const { photos } = JSON.parse(await readFile(new URL('photos.json', here), 'utf8'))
await mkdir(out, { recursive: true })

for (const [name, { id }] of Object.entries(photos)) {
  for (const w of [640, 1280]) {
    const file = new URL(`${name}-${w}.webp`, out)
    if (existsSync(file) && !process.argv.includes('--force')) continue
    const url = `https://images.unsplash.com/photo-${id}?w=${w}&q=72&fm=webp&fit=max`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status} for ${url}`)
    await writeFile(file, Buffer.from(await res.arrayBuffer()))
    console.log('saved', `${name}-${w}.webp`)
  }
}
