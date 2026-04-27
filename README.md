# wikibrew

Scaffold an LLM-maintained knowledge base in one command. Based on the [LLM Wiki](https://gist.github.com/karpathy/1dd0294ef9567971c1e4348a90d69285) pattern by Andrej Karpathy.

```
npx wikibrew my-wiki
```

You clip articles, drop in papers, and ask questions. The LLM reads sources, builds interlinked wiki pages, tracks entities and concepts, maintains a master index, and keeps everything consistent — automatically.

## What You Get

```
my-wiki/
├── raw/                    ← Source documents (you add these)
│   ├── sources/            ← Articles, papers, notes, transcripts
│   └── assets/             ← Images, diagrams, media
├── wiki/                   ← Knowledge layer (LLM maintains this)
│   ├── index.md            ← Master catalog of all pages
│   ├── log.md              ← Chronological operation record
│   ├── overview.md         ← Wiki purpose and scope
│   ├── open-questions.md   ← Research question tracker
│   ├── sources/            ← One summary per ingested source
│   ├── entities/           ← People, orgs, products, tools
│   ├── concepts/           ← Ideas, frameworks, theories
│   ├── synthesis/          ← Comparisons, analyses, themes
│   └── maintenance/        ← Health check reports
├── output/                 ← Generated artifacts
├── templates/              ← Page structure templates
├── CLAUDE.md               ← Agent config (selected during setup)
└── README.md
```

## Quick Start

```bash
# Create a new wiki
npx wikibrew my-wiki

# The interactive CLI asks:
#   1. Which AI agents you use (Copilot, Claude, Codex, Cursor, Gemini)
#   2. What the wiki is about (optional — focuses the wiki)
#   3. Which CLI tools to install (optional)
#   4. Whether to initialize git

# Open in Obsidian (or any markdown editor)
cd my-wiki

# Clip your first article with the Obsidian Web Clipper
# Then tell your LLM:
#   "Ingest the new source in raw/sources/"
```

## CLI Reference

```
wikibrew [project-name] [options]

Options:
  --agents <list>      Comma-separated: copilot,claude,codex,cursor,gemini,all,none
  --domain <text>      Wiki topic (e.g. "AI research", "personal finance")
  --git                Initialize a git repository
  --no-git             Skip git initialization
  --no-tools           Skip CLI tool installation prompts
  -h, --help           Show help
  -v, --version        Show version
```

### Examples

```bash
# Interactive (recommended for first time)
npx wikibrew my-wiki

# Non-interactive with all options
npx wikibrew my-wiki --agents copilot,claude --domain "AI research" --git

# Scaffold in the current directory
npx wikibrew . --agents all --git

# Scripted (CI, dotfiles, etc.)
npx wikibrew my-wiki --agents claude --domain "reading notes" --git --no-tools
```

## How It Works

The LLM Wiki pattern separates raw sources from processed knowledge:

1. **You add sources** — clip articles, drop PDFs, paste notes into `raw/sources/`
2. **LLM ingests** — reads the source, creates a summary page, updates entity/concept pages, adds wikilinks, updates the index. A single source typically touches 10-15 wiki pages.
3. **You ask questions** — the LLM searches the wiki to answer, synthesizes across sources, cites pages with `[[wikilinks]]`
4. **LLM maintains quality** — periodic lint checks find broken links, contradictions, orphan pages, and stale content

The key insight: **the LLM does all the grunt work** (summarizing, linking, indexing, maintaining), while **you curate** (choose sources, ask questions, direct focus).

## Supported Agents

The CLI creates the right config file(s) for your agent:

| Agent | Config File | How It Works |
|-------|-------------|--------------|
| **VS Code Copilot** | `.github/copilot-instructions.md` | Copilot reads this automatically in VS Code |
| **Claude Code** | `CLAUDE.md` | Claude Code reads this from project root |
| **Codex** | `AGENTS.md` | Codex reads this from project root |
| **Cursor** | `.cursor/rules/wikibrew.mdc` | Cursor loads rule files from `.cursor/rules/` |
| **Gemini CLI** | `GEMINI.md` | Gemini CLI reads this from project root |

Each config is self-contained — it includes the complete wiki schema, all three workflows (ingest, query, lint), and tool references. You can select multiple agents.

## Tools

The wiki works out of the box with just your LLM agent. These tools extend what's possible:

### Obsidian (Desktop App)

The best way to view and navigate your wiki. Free for personal use.

- **Install:** [obsidian.md](https://obsidian.md) → download for your OS
- **Setup:** Open → "Open folder as vault" → select your wiki directory
- **Why:** Graph view shows connections between pages. Backlinks panel shows what links to the current page. `[[wikilink]]` syntax works natively — click to navigate.

### Obsidian Web Clipper (Browser Extension)

Clip articles directly into `raw/sources/` with one click.

- **Install:** [Chrome Web Store](https://chromewebstore.google.com/detail/obsidian-web-clipper/cnjifjpddelmedmihgijeibhnjfabmlf) or [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/obsidian-web-clipper/)
- **Setup:** Configure the clip destination to your wiki's `raw/sources/` folder
- **Why:** Fastest way to get articles into your wiki. Preserves formatting, extracts metadata, saves images.

### summarize (CLI)

Summarize links, files, and media from the command line. Your LLM can call this to pre-process sources.

- **Install:** `npm i -g @steipete/summarize`
- **Verify:** `summarize --help`
- **Use when:** Processing video/audio content, previewing long documents before full ingest, fetching web content that the LLM can't access directly.

### qmd (CLI)

Local markdown search engine with hybrid BM25/vector search and LLM re-ranking. Also available as an MCP server.

- **Install:** `npm i -g @tobilu/qmd`
- **Verify:** `qmd --help`
- **Use when:** Your wiki grows beyond ~100 pages and `index.md` scanning becomes slow. The LLM will use this automatically when instructed.

### agent-browser (CLI)

Browser automation for web research. Lets your LLM browse the web when built-in tools aren't enough.

- **Install:** `npm i -g agent-browser && agent-browser install`
- **Verify:** `agent-browser --help`
- **Use when:** The LLM needs to research topics beyond your existing sources — filling data gaps, fact-checking claims, finding related work.

### Marp (Obsidian Plugin)

Turn synthesis pages into slide decks. Great for sharing insights.

- **Install:** Obsidian → Settings → Community plugins → Browse → search "Marp" → Install
- **Use when:** You want to present findings from synthesis pages. Add Marp frontmatter to any synthesis page.

### Dataview (Obsidian Plugin)

Query wiki pages using YAML frontmatter metadata. Build dynamic tables and lists.

- **Install:** Obsidian → Settings → Community plugins → Browse → search "Dataview" → Install
- **Use when:** You want to create dashboards — "all sources tagged AI", "entities updated this week", "concepts with only one source".

## Workflow Guide

### Starting a New Research Project

```
1. npx wikibrew quantum-computing --agents claude --domain "quantum computing"
2. Open in Obsidian
3. Clip 3-5 foundational articles with Web Clipper
4. "Ingest all new sources in raw/sources/"
5. "What are the main themes across these sources?"
6. Continue clipping and ingesting as you read more
```

### Daily Knowledge Building

```
1. Clip interesting articles throughout the day
2. End-of-day: "Ingest all new sources in raw/sources/"
3. "What new connections emerged from today's sources?"
4. "Run a quick lint check"
```

### Deep Research Session

```
1. "What do we know about [topic]?" — check existing knowledge
2. "What are the gaps in our coverage of [topic]?" — find what's missing
3. Use agent-browser or web search to find new sources
4. Clip and ingest new material
5. "Write a synthesis comparing [X] and [Y]"
6. "Save that as a synthesis page"
```

## Requirements

- Node.js 18+
- One or more supported AI agents

## License

MIT
