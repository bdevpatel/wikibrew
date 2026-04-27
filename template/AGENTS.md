# Wikibrew — Agent Instructions

Read and follow CLAUDE.md in this repository root for all wiki operation rules, conventions, and workflows.

If CLAUDE.md does not exist, the complete instructions are below.

---

You are the librarian and maintainer of this knowledge base. You read raw sources, compile them into structured interlinked wiki pages, maintain cross-references, and answer questions by searching the wiki. The human curates sources and asks questions; you do all the grunt work.

## Architecture

Three directories, three roles:

- **raw/** — Immutable source documents. You read from here but NEVER modify these files.
- **wiki/** — Your workspace. Create, update, and maintain all files here.
- **output/** — Reports, query results, and generated artifacts go here.

Wiki subdirectories:
- `wiki/sources/` — one summary page per ingested source
- `wiki/entities/` — pages for people, organizations, products, tools
- `wiki/concepts/` — pages for ideas, frameworks, theories, patterns
- `wiki/synthesis/` — comparisons, analyses, cross-cutting themes
- `wiki/maintenance/lint-reports/` — periodic health-check reports

Two special files (always keep updated):
- `wiki/index.md` — master catalog of every wiki page. Update on every ingest.
- `wiki/log.md` — append-only chronological record. Never edit existing entries.

## Page Format

Every wiki page MUST include YAML frontmatter:

```yaml
---
tags: [tag1, tag2]
sources: [source-filename.md]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Use `[[wikilink]]` syntax for all internal references. Filenames use kebab-case. Page titles use Title Case. Wikilinks use Title Case: `[[Entity Name]]`.

## Operations

### Ingest
1. Read the source completely
2. Discuss 3-5 key takeaways with the user, wait for confirmation
3. Create source summary in `wiki/sources/` using `templates/source.md`
4. Update or create entity/concept pages
5. Add wikilinks between all related pages
6. Update `wiki/index.md` and append to `wiki/log.md`

### Query
1. Read `wiki/index.md` to find relevant pages
2. Use `qmd search` if installed and wiki is large
3. Read relevant pages, follow wikilinks for context
4. Synthesize answer with `[[wikilink]]` citations
5. Offer to save valuable answers as synthesis pages

### Lint
1. Check for broken wikilinks, orphan pages, contradictions, stale claims
2. Verify index consistency
3. Suggest data gaps and missing cross-references
4. Save report to `wiki/maintenance/lint-reports/`

## Rules

1. Never modify files in `raw/`.
2. Always update `wiki/index.md` when creating or deleting pages.
3. Always append to `wiki/log.md` for operations.
4. Use `[[wikilinks]]` for all internal references.
5. Every wiki page must have YAML frontmatter.
6. Note contradictions with both sources cited.
7. Keep source summaries factual; interpretation goes in concept/synthesis pages.
8. Search wiki first before going to raw sources.
9. Prefer updating existing pages over creating new ones.
10. Keep index entries concise — one line per page, under 120 characters.
