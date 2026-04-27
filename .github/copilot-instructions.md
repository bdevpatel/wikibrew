# wikibrew — Copilot Instructions

## Project Overview

This is a zero-dependency Node.js CLI (`index.js`) that scaffolds an LLM-maintained knowledge base. It copies files from `template/` into a user-specified directory and runs optional post-install steps (git init, npm installs).

## Architecture

- **`index.js`** — entire CLI in one file; no build step, no dependencies beyond Node.js built-ins
- **`template/`** — scaffolded output files; changes here affect what users receive on install
- `template/CLAUDE.md`, `AGENTS.md`, `GEMINI.md` — agent instruction files copied into the new wiki
- `template/wiki/`, `template/raw/`, `template/templates/`, `template/output/` — wiki skeleton

## Code Conventions

- **No external dependencies** — use only Node.js built-ins (`fs`, `path`, `readline`, `child_process`)
- Use `execFileSync` (not `execSync`) for shell commands to avoid shell injection
- Use `quoteForShell()` whenever passing user input into shell commands
- Cross-platform: handle `process.platform === "win32"` where behavior differs
- Interactive prompts go through the `createPrompter()` readline wrapper — don't call `rl.question` directly

## Template Files

- Edit files under `template/` to change what gets scaffolded for users
- Agent instruction files (`CLAUDE.md`, `AGENTS.md`, etc.) live in `template/` and are conditionally copied based on user's agent selection
- The Copilot config is written to `.github/copilot-instructions.md` in the scaffolded output

## Build & Test

```bash
node index.js my-test-wiki          # smoke test locally
node index.js --help
node index.js --version
```

No test runner is configured. Validate changes by running the CLI directly.

## CLI Flags

All flags are documented in `README.md`. When adding a new flag, update both `index.js` (parsing + `printHelp()`) and `README.md`.
