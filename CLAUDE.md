# Ruflo — Claude Code Configuration

## Core Rules

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary — prefer editing existing files
- NEVER create documentation files unless explicitly requested
- NEVER save working files or tests to root — use `/src`, `/tests`, `/docs`, `/config`, `/scripts`
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files
- NEVER add a `Co-Authored-By` trailer to user commits unless this project's `.claude/settings.json` has `attribution.commit` set (#2078). The Claude Code Bash tool may suggest one in its default commit-message template — ignore it. `Co-Authored-By` is semantic authorship attribution under git/GitHub convention; the tool is the facilitator, not a co-author.
- Keep files under 500 lines
- Validate input at system boundaries

## System Configuration

| Setting | Value |
|---------|-------|
| `CLAUDE_FLOW_V3_ENABLED` | `true` |
| `CLAUDE_FLOW_HOOKS_ENABLED` | `true` |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | `1` |
| **Default Model** | `nemotron-3-ultra-550b-a55b` |
| **Routing Model** | `nemotron-3-super-120b-a12b` |
| **Swarm Topology** | `hierarchical-mesh` |
| **Max Agents** | `15` |
| **Memory Backend** | `hybrid` |
| **HNSW** | `Enabled` |
| **Neural** | `Enabled` |
| **Learning** | `Enabled` |
| **Auto-Scan** | `Enabled` |
| **CVE Check** | `Enabled` |

### Security
- Auto-scan on edit
- CVE check
- Threat model generation

### Permissions
- **Allow**: `Bash(npx @claude-flow*)`, `Bash(npx claude-flow*)`, `Bash(node .claude/*)`, `mcp__claude-flow__*`
- **Deny**: `Read(./.env)`, `Read(./.env.*)`

### Agent Teams
- **Mode**: `auto`
- **Task List**: `Enabled`
- **Mailbox**: `Enabled`
- **Auto-assign on idle**: `Enabled`
- **Train patterns on complete**: `Enabled`
- **Notify lead on complete**: `Enabled`

### Daemon
- **Auto-start**: `false`
- **Workers**: `map`, `audit`,(males/every-5-file-changes), `document` (api changes)
- **Schedules**:
  - `audit`: every `4h`, priority `critical`
  - `optimize`: every `2h`, priority `high`

## Task Lifecycle (Default Protocol)

**This setup is configured and active.** Do not wait for explicit permission. Assume every task needs the full stack.

### Pre-Flight Checklist
1. **Memory**: Search `memory_search_unified` for relevant prior work before doing anything
2. **Route**: Run `hooks_route` to determine the right agent stack
3. **Design**: If UI is involved, invoke `21st` + `ui-ux-pro-max` + `frontend-design`
4. **Scale Check**:
   - 1 file / simple edit → Direct tool use (Tier 1)
   - 2-3 files / feature → Named agent (`coder`, `tester`)
   - 3+ files / complex → **Must use workflow/swarm**
5. **Post-Task**: After completion, store the pattern to memory and dispatch relevant workers (`audit`, `optimize`, `document`)

### Invocation Rules
- **Always prefer workflows** for multi-file tasks. Say: "I'll use a workflow for this"
- **Always apply `ui-ux-pro-max`** rules to any UI output (accessibility, contrast, reduced-motion)
- **Always apply `frontend-design`** methodology (two-pass: plan → critique → build)
- **Always run `npm run build && npm test`** after code changes
- **Always search memory first** — the user has prior work stored
- **Never do single-pass coding for tasks >2 files**

### Never Do
- Skip skill review for UI work
- Skip memory storage after novel work
- Ask "should I use a workflow?" — use your judgment from the scale check above

## Agent Comms (SendMessage-First Coordination)

Named agents coordinate via `SendMessage`, not polling or shared state.

```
Lead (you) ←→ architect ←→ developer ←→ tester ←→ reviewer
              (named agents message each other directly)
```

### Spawning a Coordinated Team
```javascript
// ALL agents in ONE message, each knows WHO to message next
Agent({ prompt: "Research the codebase. SendMessage findings to 'architect'.",
  subagent_type: "researcher", name: "researcher", run_in_background: true })
Agent({ prompt: "Wait for 'researcher'. Design solution. SendMessage to 'coder'.",
  subagent_type: "system-architect", name: "architect", run_in_background: true })
Agent({ prompt: "Wait for 'architect'. Implement it. SendMessage to 'tester'.",
  subagent_type: "coder", name: "coder", run_in_background: true })
Agent({ prompt: "Wait for 'coder'. Write tests. SendMessage results to 'reviewer'.",
  subagent_type: "tester", name: "tester", run_in_background: true })
Agent({ prompt: "Wait for 'tester'. Review code quality and security.",
  subagent_type: "reviewer", name: "reviewer", run_in_background: true })

// Kick off the pipeline
SendMessage({ to: "researcher", summary: "Start", message: "[task context]" })
```

### Patterns
| Pattern | Flow | Use When |
|---------|------|----------|
| **Pipeline** | A → B → C → D | Sequential dependencies (feature dev) |
| **Fan-out** | Lead → A, B, C → Lead | Independent parallel work (research) |
| **Supervisor** | Lead ↔ workers | Ongoing coordination (complex refactor) |

### Rules
- ALWAYS name agents — `name: "role"` makes them addressable
- ALWAYS include comms instructions in prompts — who to message, what to send
- Spawn ALL agents in ONE message with `run_in_background: true`
- After spawning: STOP, tell user what's running, wait for results
- NEVER poll status — agents message back or complete automatically

## Swarm & Routing

### Agent Routing
| Task | Agents | Topology |
|------|--------|----------|
| Bug Fix | researcher, coder, tester | hierarchical |
| Feature | architect, coder, tester, reviewer | hierarchical |
| Refactor | architect, coder, reviewer | hierarchical |
| Performance | perf-engineer, coder | hierarchical |
| Security | security-architect, auditor | hierarchical |

### When to Swarm
- **YES**: 3+ files, new features, cross-module refactoring, API changes, security, performance
- **NO**: single file edits, 1-2 line fixes, docs updates, config changes, questions

### 3-Tier Model Routing
| Tier | Handler | Use Cases |
|------|---------|-----------|
| 1 | Agent Booster (WASM) | Simple transforms — skip LLM, use `Edit` directly |
| 2 | Haiku | Simple tasks, low complexity |
| 3 | Sonnet/Opus | Architecture, security, complex reasoning |

## Memory & Learning

### Before Any Task
```bash
npx @claude-flow/cli@latest memory search --query "[task keywords]" --namespace patterns
npx @claude-flow/cli@latest hooks route --task "[task description]"
```

### After Success
```bash
npx @claude-flow/cli@latest memory store --namespace patterns --key "[name]" --value "[what worked]"
npx @claude-flow/cli@latest hooks post-task --task-id "[id]" --success true --store-results true
```

### MCP Toolkit (use `ToolSearch("keyword")` to discover)
| Category | Key Tools |
|----------|-----------|
| **Memory** | `memory_store`, `memory_search`, `memory_search_unified` |
| **Bridge** | `memory_import_claude`, `memory_bridge_status` |
| **Swarm** | `swarm_init`, `swarm_status`, `swarm_health` |
| **Agents** | `agent_spawn`, `agent_list`, `agent_status` |
| **Hooks** | `hooks_route`, `hooks_post-task`, `hooks_worker-dispatch` |
| **Security** | `aidefence_scan`, `aidefence_is_safe`, `aidefence_has_pii` |
| **Hive-Mind** | `hive-mind_init`, `hive-mind_consensus`, `hive-mind_spawn` |

## Hooks & Event Triggers

| Lifecycle Event | Hook Target | Purpose |
|-----------------|-------------|---------|
| `PreToolUse` (Bash) | `hook-handler.cjs` | Pre-bash validation |
| `PreToolUse` (Write/Edit) | `hook-handler.cjs` | Pre-edit validation |
| `PostToolUse` (Write/Edit) | `hook-handler.cjs` | Post-edit tracking |
| `PostToolUse` (Bash) | `hook-handler.cjs` | Post-bash tracking |
| `UserPromptSubmit` | `hook-handler.cjs` | Route to optimal agent |
| `SessionStart` | `hook-handler.cjs` + `auto-memory-hook.mjs` | Restore session, import auto-memory |
| `SessionEnd` | `hook-handler.cjs` | Persist session state |
| `Stop` | `auto-memory-hook.mjs` | Sync memory on stop |
| `PreCompact` | `hook-handler.cjs` | Handle compaction (manual/auto) |
| `SubagentStart` | `hook-handler.cjs` | Track subagent status |
| `SubagentStop` | `hook-handler.cjs` | Track subagent completion |
| `Notification` | `hook-handler.cjs` | Handle notifications |

## Agents

### Core
- `coder`, `reviewer`, `tester`, `planner`, `researcher`

### Specialized
- **Architecture**: `system-architect`, `backend-dev`, `mobile-dev`
- **Security**: `security-architect`, `security-auditor`
- **Performance**: `performance-engineer`, `perf-analyzer`
- **Coordination**: `hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`
- **GitHub**: `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`

Any string works as a custom agent type.

## Background Workers

| Worker | Trigger |
|--------|---------|
| `audit` | After security changes |
| `optimize` | After performance work |
| `testgaps` | After adding features |
| `map` | Every 5+ file changes |
| `document` | After API changes |

```bash
npx @claude-flow/cli@latest hooks worker dispatch --trigger audit
```

## Build & Test

- ALWAYS run tests after code changes
- ALWAYS verify build succeeds before committing

```bash
npm run build && npm test
```

## Open Design Integration

Open Design (OD) is a local-first design workspace. Use it for all UI/component work when available.

### Reading
- `get_artifact(entry?)` — Fetch entry file + referenced siblings (up to depth 3). PREFER this.
- `get_file(path)` — Read a single known file.
- `search_files(query)` — Case-insensitive literal search.
- `list_files(since?)` — Get file metadata.

### Writing
- `create_artifact(name, content)` — Create a new design artifact.
- `write_file(path, content)` — Overwrite or create any project file.
- `delete_file(path)` — Remove a file.

### Generation
- `start_run(project?, prompt?, plugin?, skill?)` — Commission OD to generate or refine a design.
- `get_run(runId)` — Poll run status.

## CLI Quick Reference

```bash
npx @claude-flow/cli@latest init --wizard           # Setup
npx @claude-flow/cli@latest swarm init --v3-mode     # Start swarm
npx @claude-flow/cli@latest memory search --query "" # Vector search
npx @claude-flow/cli@latest hooks route --task ""    # Route to agent
npx @claude-flow/cli@latest hooks worker dispatch --trigger <worker>
npx @claude-flow/cli@latest doctor --fix             # Diagnostics
npx @claude-flow/cli@latest security scan            # Security scan
npx @claude-flow/cli@latest performance benchmark    # Benchmarks
```
26 commands, 140+ subcommands. Use `--help` on any command for details.

## Setup

```bash
claude mcp add claude-flow -- npx -y ruflo@latest mcp start
npx ruflo@latest doctor --fix
```

**Agent tool** handles execution (agents, files, code, git). **MCP tools** handle coordination (swarm, memory, hooks). **CLI** is the same via Bash.