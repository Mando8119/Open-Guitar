# REA installation and verified scope

Checked November 16, 2026. REA is optional development tooling; it is absent from OpenGuitar's application dependencies and production assets.

## Package identity and local installation

The [official repository](https://github.com/morluto/rea) links the npm package `rea-agents`. `npm view rea-agents version repository.url maintainers engines dist.integrity --json` confirmed version **6.9.0**, repository `github.com/morluto/rea`, publisher/maintainer `morluto`, and package integrity. The [official installation procedure](https://github.com/morluto/rea/blob/main/docs/getting-started/installation.md) starts with `npx rea-agents setup` and separately previews agent changes.

The installed system Node is 24.14.0. REA 6.9.0 requires `^22.23.4 || ^24.22.1 || >=26.12.1`, so it runs with a separate project-local Node 24.22.1 executable. No global Node upgrade or agent configuration modification was made. On Windows, reproduce the project-local installation from the repository root:

```powershell
npm install --prefix .tools/rea --ignore-scripts --no-audit --no-fund rea-agents@6.9.0
npm install --prefix .tools/runtime --ignore-scripts --no-audit --no-fund node-win-x64@24.22.1
npm run rea -- --version
npm run rea -- setup --client codex --skill=false --dry-run --json
npm run rea:verify
```

The first installation skipped lifecycle scripts intentionally. REA's JavaScript analyzer runs; optional native providers such as Frida are not verified. `.tools/` is ignored by Git. Linux/macOS can use the launcher's current Node if it meets REA's engine requirement; they have not been exercised here.

## Configuration boundary

The official setup dry-run proposed changing `C:\Users\Worst\.codex\config.toml`. That global write was **not applied**, because this task requires separate approval for global agent configuration. Instead, the repository's supported `.codex/config.toml` contains the project-local server command `node scripts/rea-launch.mjs mcp`, working directory `.`, and timeouts matching the official setup plan. Launch Codex from this repository root. No Hopper installation or personal skill destination was approved or modified.

`codex mcp list --json` reports `rea` enabled with that launcher. The current conversation's directly exposed tool catalog does not include REA tools, so do not assume existing threads automatically gain them. Agents can invoke the verified CLI/launcher now. Reload/reopen a trusted project session to refresh MCP discovery; rerun the verification command after relocation or runtime changes.

## Evidence

- `node scripts/rea-launch.mjs --version` reported REA 6.9.0.
- `node scripts/verify-rea.mjs` completed a real stdio MCP initialize/initialized/tools-list exchange: server `rea` 6.9.0, protocol `2025-03-26`, **255 advertised tools**. Listing is not proof that each native provider is installed.
- `node scripts/rea-launch.mjs capabilities --json` returned provider capabilities and host limitations.
- `node scripts/rea-launch.mjs analyze-javascript-application src --json` analyzed this project's 18 selected JS/TS source files, returned sealed JavaScript application Evidence, and reported no integrity contradictions. The temporary result is in `.tools/rea-src-analysis.json` and describes that source snapshot, not future edits. Windows PowerShell redirected that result as UTF-16; prefer a Node output file or REA's `--evidence_output` for machine parsing.
- `doctor --client codex --json` is not globally healthy: the global registration/workflow skill and native analysis engines are missing. That doctor inspects the default personal configuration; it does not validate the repository-local alternative. No claim of Ghidra, IDA, Hopper, JADX, or Android inspection readiness is made.

REA was used only on project-owned source. Public product research used official public pages; no protected guitar-learning application was inspected. See [RESEARCH.md](RESEARCH.md).
