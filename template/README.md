# {{WIKI_NAME}}

An LLM-maintained knowledge base — {{DOMAIN}}.

Built with [wikibrew](https://github.com/bdevpatel/wikibrew) following the [LLM Wiki](https://gist.github.com/karpathy/1dd0294ef9567971c1e4348a90d69285) pattern by Andrej Karpathy.

## Quick Start

1. **Add a source** — clip an article with [Obsidian Web Clipper](https://chromewebstore.google.com/detail/obsidian-web-clipper/cnjifjpddelmedmihgijeibhnjfabmlf) into `raw/sources/`, or just drop a PDF/markdown file there.

2. **Ingest it** — open your LLM agent and say:
   ```
   Ingest the new source in raw/sources/
   ```
   The LLM reads the source, discusses key takeaways with you, then creates/updates 10-15 wiki pages automatically.

3. **Ask questions** — query your growing knowledge base:
   ```
   What do my sources say about [topic]?
   Compare [X] and [Y] based on what we know.
   What are the open questions around [concept]?
   ```

4. **Lint periodically** — keep the wiki healthy:
   ```
   Run a health check on the wiki.
   ```

## Structure

```
raw/                    ← Source documents (immutable)
  sources/              ← Articles, papers, notes, transcripts
  assets/               ← Images, diagrams, media files
wiki/                   ← Knowledge layer (LLM-maintained)
  index.md              ← Master catalog of all pages
  log.md                ← Chronological operation record
  overview.md           ← Wiki purpose and scope
  open-questions.md     ← Research questions tracker
  sources/              ← One summary page per source
  entities/             ← People, orgs, products, tools
  concepts/             ← Ideas, frameworks, theories
  synthesis/            ← Comparisons, analyses, themes
  maintenance/          ← Health check reports
output/                 ← Generated reports and artifacts
templates/              ← Page structure templates
```

## Recommended Tools

These tools are optional, but highly recommended for a smooth workflow and to unlock the full power of your LLM-maintained wiki:

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
