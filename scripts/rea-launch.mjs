import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const entry = path.join(root, '.tools/rea/node_modules/rea-agents/scripts/rea.mjs')
const runtime =
  process.platform === 'win32'
    ? path.join(root, '.tools/runtime/node_modules/node-win-x64/bin/node.exe')
    : process.execPath
if (!existsSync(entry) || !existsSync(runtime)) {
  console.error(
    'REA local tools are missing. See docs/REA.md. OpenGuitar itself does not need REA.',
  )
  process.exit(1)
}
const child = spawn(runtime, [entry, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: root,
  windowsHide: true,
})
child.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    child.kill(signal)
  })
