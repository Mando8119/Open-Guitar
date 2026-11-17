# Agent architecture and execution evidence

The lead owns interfaces, architecture, integration, and verification. Up to three specialists work concurrently with explicit file ownership. `AGENTS.md` carries durable rules; `.codex/config.toml` and six `.codex/agents/*.toml` files use the documented project-local [custom-agent schema](https://learn.chatgpt.com/docs/agent-configuration/subagents). No global configuration or paid API provider was changed.

The installed CLI is `0.169.0-alpha.11.1`; its bundled catalog was inspected with `codex debug models --bundled`. This session exposes GPT-6.1 Sol, GPT-6.1 Terra, GPT-6 Astra, GPT-6 Sol, and GPT-6 Luna for explicit delegation. Catalog presence does not establish unlimited usage, monetary cost, or every account's entitlement. The lead's current model cannot be changed retroactively by a project config file; the checked-in default is GPT-6.1 Sol/high for future trusted project sessions.

| Specialist         | Verified assignment                                                                            | Model / reasoning      | Owned scope                                             |
| ------------------ | ---------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------- |
| Audio DSP          | Capture, YIN, Worker, unit tests, benchmarks; independent rhythm review                        | `gpt-6.1-sol` / medium | `src/audio`, `src/pitch`, audio tests, benchmark script |
| Frontend           | Responsive studio UI, lessons/tuner/settings/progress, integrations                            | `gpt-6.1-sol` / medium | App and application CSS                                 |
| Guitary / learning | Pure evaluation, curriculum, local storage, teaching/SVG and tests                             | `gpt-6.1-sol` / medium | learning, evaluation, storage, mascot                   |
| Documentation      | README, engineering guides, ADR, Android and portfolio notes                                   | `gpt-6-luna` / medium  | assigned documentation files                            |
| QA                 | Independent browser usability review                                                           | `gpt-6-luna` / medium  | read-only, temporary screenshots                        |
| Research           | A configured reusable read-only role; public-source research performed by lead in this session | not separately invoked | no source ownership                                     |

The initial spawn interface exposed task/model/reasoning controls, so initial implementations used explicit role instructions. After the client's mid-run update, all six project roles appeared in the callable `agent_type` selector with their configured models and reasoning. A final QA review was then invoked using `agent_type: "qa"`, verifying actual role discovery and invocation. `codex mcp list --json` also reports the project REA server enabled. The lead integrated changes in the shared workspace; bounded, nonoverlapping ownership avoided worktree merge overhead.

Every task defines objective, technical context, files, interfaces, acceptance criteria, tests, expected deliverables, and capability. Handoffs stay concise. Review uses compiler/lint/Vitest/Playwright/build/benchmarks before another model invocation. No fabricated token costs or claimed monetary savings are recorded.

Claude Code was not found on PATH. Authentication was not checked because no executable was available and external-account access was not authorized. `CLAUDE.md` and `docs/agent-handoffs/claude-review.md` provide optional review context. No cross-provider orchestration was installed.
