import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const child = spawn(process.execPath, [path.join(root, 'scripts/rea-launch.mjs'), 'mcp'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: root,
  windowsHide: true,
})
const pending = new Map()
let nextId = 0
let buffer = ''
const deadline = setTimeout(() => {
  console.error('REA MCP verification timed out')
  child.kill()
  process.exitCode = 1
}, 25_000)
function request(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, { resolve, reject })
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
  })
}
child.stdout.on('data', (chunk) => {
  buffer += chunk.toString()
  let newline
  while ((newline = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, newline)
    buffer = buffer.slice(newline + 1)
    try {
      const response = JSON.parse(line)
      const entry = pending.get(response.id)
      if (entry) {
        pending.delete(response.id)
        if (response.error) entry.reject(new Error(JSON.stringify(response.error)))
        else entry.resolve(response.result)
      }
    } catch {
      /* Non-protocol lines are not evidence of a successful handshake. */
    }
  }
})
child.stderr.on('data', () => {})
child.on('error', (error) => {
  console.error(error.message)
  clearTimeout(deadline)
  process.exitCode = 1
})
try {
  const initialize = await request('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'openguitar-verification', version: '0.1.0' },
  })
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
  const catalog = await request('tools/list', {})
  const safeTool = catalog.tools.find((tool) =>
    /^(get_capabilities|capabilities|list_targets|list_providers|provider_capabilities)$/.test(
      tool.name,
    ),
  )
  let called = null
  if (safeTool) {
    const result = await request('tools/call', { name: safeTool.name, arguments: {} })
    called = { name: safeTool.name, isError: result.isError ?? false }
    if (result.isError) throw new Error('Target-free MCP tool returned an error')
  }
  console.log(
    JSON.stringify(
      {
        server: initialize.serverInfo,
        protocol: initialize.protocolVersion,
        toolCount: catalog.tools.length,
        tools: catalog.tools.slice(0, 12).map((tool) => tool.name),
        targetFreeCandidates: catalog.tools
          .filter((tool) => /capabil|provider|list_|doctor/.test(tool.name))
          .map((tool) => ({ name: tool.name, required: tool.inputSchema?.required ?? [] })),
        called,
      },
      null,
      2,
    ),
  )
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  clearTimeout(deadline)
  child.stdin.end()
  child.kill()
}
