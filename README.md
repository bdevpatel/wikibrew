<h1 align="center">Wikibrew</h1>

<p align="center"><strong>Build an LLM-maintained knowledge base in one command.</strong></p>

<p align="center">
  <a href="https://github.com/bdevpatel/wikibrew/releases"><img alt="version" src="https://img.shields.io/badge/version-1.0.0-7C3AED"></a>
  <a href="https://github.com/bdevpatel/wikibrew/stargazers"><img alt="stars" src="https://img.shields.io/github/stars/bdevpatel/wikibrew?style=flat"></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-22C55E"></a>
  <img alt="node" src="https://img.shields.io/badge/node-%3E%3D18-0EA5E9">
</p>

`wikibrew` scaffolds a complete wiki workspace where your AI agent can continuously ingest sources, link concepts and entities, maintain structure, and help you query insights over time—while still letting you create your own pages, notes, and custom sections whenever you want.

Inspired by Andrej Karpathy's [LLM Wiki pattern](https://gist.github.com/karpathy/1dd0294ef9567971c1e4348a90d69285).

## Table of Contents

- [Why Wikibrew](#why-wikibrew)
- [Quick Start](#quick-start)
- [What Gets Scaffolded](#what-gets-scaffolded)
- [CLI Reference](#cli-reference)
- [Supported AI Agents](#supported-ai-agents)
- [Recommended Tooling](#recommended-tooling)
- [Workflow Examples](#workflow-examples)
- [Requirements](#requirements)
- [License](#license)

## Why Wikibrew

Most note systems stop at storage. `wikibrew` is built for continuous knowledge operations:

- **Source-first workflow** — keep raw material separate from synthesized knowledge
- **LLM-driven maintenance** — summaries, wikilinks, indexing, and consistency checks
- **Agent-ready configuration** — generates instructions for your preferred coding/research agents
- **Portable markdown structure** — works with Obsidian and plain editors

## Quick Start

```bash
npx wikibrew my-wiki
cd my-wiki
```

During setup, the CLI can prompt for:

1. AI agents to support (Copilot, Claude, Codex, Cursor, Gemini)
2. Domain/topic for the wiki (optional)
3. Optional CLI tools to install
4. Git initialization

Then clip or add your first source into `raw/sources/`, and ask your LLM:

> "Ingest new sources from `raw/sources/` and update the wiki."

## What Gets Scaffolded

```text
my-wiki/
├── raw/                    # Source documents you collect
│   ├── sources/            # Articles, papers, notes, transcripts
│   └── assets/             # Images, diagrams, media
├── wiki/                   # Human + LLM maintained knowledge layer
│   ├── index.md            # Master map of pages
│   ├── log.md              # Chronological operations log
│   ├── overview.md         # Scope and purpose
│   ├── open-questions.md   # Active research tracker
│   ├── sources/            # One page per source
│   ├── entities/           # People, orgs, tools, products
│   ├── concepts/           # Ideas, methods, frameworks
│   ├── synthesis/          # Cross-source analysis pages
│   └── maintenance/        # Lint and health reports
├── templates/              # Reusable page templates
├── output/                 # Generated artifacts
└── README.md
```

## CLI Reference

```text
wikibrew [project-name] [options]
```

| Option | Description |
|---|---|
| `--agents <list>` | Comma-separated list: `copilot,claude,codex,cursor,gemini,all,none` |
| `--domain <text>` | Wiki topic (e.g. `"AI research"`, `"personal finance"`) |
| `--git` | Initialize a git repository |
| `--no-git` | Skip git initialization |
| `--no-tools` | Skip CLI tool installation prompts |
| `--uninstall-tools` | Open interactive prompt to uninstall wikibrew CLI tools |
| `-h`, `--help` | Show help |
| `-v`, `--version` | Show version |

### Examples

```bash
# Interactive (recommended)
npx wikibrew my-wiki

# Non-interactive
npx wikibrew my-wiki --agents copilot,claude --domain "AI research" --git

# Scaffold in current directory
npx wikibrew . --agents all --git

# Scripted setup (CI / dotfiles)
npx wikibrew my-wiki --agents claude --domain "reading notes" --git --no-tools

# Uninstall previously installed helper tools
npx wikibrew --uninstall-tools
```

## Supported AI Agents

| Agent | Config File | Behavior |
|---|---|---|
| VS Code Copilot | `.github/copilot-instructions.md` | Loaded automatically by Copilot Chat |
| Claude Code | `CLAUDE.md` | Loaded from project root |
| Codex | `AGENTS.md` | Loaded from project root |
| Cursor | `.cursor/rules/wikibrew.mdc` | Loaded as Cursor rule file |
| Gemini CLI | `GEMINI.md` | Loaded from project root |

Each generated instruction file is self-contained and includes schema, ingest/query/lint workflows, and operational guidance.

## Recommended Tooling

- **Obsidian** — best markdown graph/navigation experience ([obsidian.md](https://obsidian.md))
- **Obsidian Web Clipper** — quick source capture into `raw/sources/`
- **summarize CLI** — fast preprocessing for links/files/media ([docs](https://www.npmjs.com/package/@steipete/summarize))
- **qmd CLI** — scalable markdown retrieval (hybrid search + rerank) ([docs](https://www.npmjs.com/package/@tobilu/qmd))
- **agent-browser CLI** — browser automation for web research ([docs](https://www.npmjs.com/package/agent-browser))
- **Marp / Dataview (Obsidian plugins)** — presentations and metadata dashboards

## Workflow Examples

### New Research Project

```text
1) npx wikibrew quantum-computing --agents claude --domain "quantum computing"
2) Add 3-5 foundational sources
3) Ask LLM to ingest all new sources
4) Request a synthesis page of main themes
5) Iterate with additional sources and focused questions
```

### Daily Knowledge Loop

```text
1) Clip sources during the day
2) Ingest in one batch
3) Ask for "new connections" across today's additions
4) Run a quick wiki lint/health pass
```

## Requirements

- Node.js 18+
- At least one supported AI agent

## License

MIT — see `LICENSE`.
