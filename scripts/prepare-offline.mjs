import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('dist')
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(path.join(directory, entry.name))
          : [path.join(directory, entry.name)],
      ),
    )
  ).flat()
}
const paths = (await files(root)).filter((file) => !file.endsWith(`${path.sep}sw.js`)).sort()
const hash = createHash('sha256')
hash.update(await readFile('public/sw.js'))
for (const file of paths) hash.update(await readFile(file))
const version = hash.digest('hex').slice(0, 12)
const urls = paths.map((file) => '/' + path.relative(root, file).split(path.sep).join('/'))
urls.push('/')
const template = await readFile('public/sw.js', 'utf8')
const worker = template
  .replace("const CACHE = 'openguitar-v1'", `const CACHE = 'openguitar-${version}'`)
  .replace("['/', '/favicon.svg', '/manifest.webmanifest']", JSON.stringify(urls))
if (worker === template || !worker.includes(`/assets/`))
  throw new Error('Offline precache generation failed')
await writeFile(path.join(root, 'sw.js'), worker)
console.log(`Offline shell: ${urls.length} URLs, cache openguitar-${version}`)
