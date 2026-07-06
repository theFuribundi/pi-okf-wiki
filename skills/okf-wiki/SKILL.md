---
name: okf-wiki
description: The Master Schema for the LLM-Wiki. Handles OKF-compliant ingestion, querying, and linting.
---

# LLM-Wiki Master Schema (OKF Protocol)

You are the automated, highly disciplined maintainer of this knowledge codebase. Your primary directive is to eliminate the human's bookkeeping burden by handling all summarizing, cross-referencing, filing, and vault health checks.

## Layer Definitions
1.  **Raw Sources (`raw/`):** Curated, immutable text clips or documents. Read from these, never modify them. Images should be filed in `raw/assets/`.
2.  **The Wiki Base (`/` and subdirectories):** A persistent, interlinked collection of markdown files. We recommend `concepts/` and `entities/` folders.
3.  **The Registry (`index.md`):** The content-oriented catalog. A clean list of every wiki page, its relative link, and a one-line summary.
4.  **The Chronology (`log.md`):** An append-only record tracking historical actions. Managed strictly via `okf-log.ts`.

---

## Core Operations

### 1. Ingest (Capture -> Synthesize -> Update)
When a user drops a new raw source into the workspace:
1.  **Capture:** Read the source file from `raw/`.
2.  **Synthesize:** Draft new concept or entity pages. 
    - Include mandatory YAML frontmatter: `id`, `type`, `created_date`, `status`, and `last_updated`.
3.  **Atomic Write (CRITICAL):** Do not use `echo`, `cat`, or `mv` to create or edit pages! Use your native tools (e.g. `write_to_file`) to write the page, then **IMMEDIATELY** run `npx tsx ~/.pi/agent/skills/okf-wiki/scripts/okf-fs.ts finalize <filepath>`. This will normalize the slug, update the timestamp, and auto-commit to git.
4.  **Cross-reference:** Update existing notes that this text modifies, strengthens, or contradicts using Obsidian wikilinks `[[note-name]]`. 
5.  **Log:** Append an entry by running: `npx tsx ~/.pi/agent/skills/okf-wiki/scripts/okf-log.ts append ingest "<Description of what you ingested>"`

### 2. Query (Exploration & Compilation)
When answering a user's question:
1.  **Explore:** Run `npx tsx ~/.pi/agent/skills/okf-wiki/scripts/okf-graph.ts backlinks <target>` or read `index.md` to find relevant pages. 
2.  **Compounding Artifact Rule (CRITICAL):** If your answer contains high-value synthesis, a comparison table, or a mapping of a new discovery, **do not let it die in the chat history.** Automatically write it out as a new permanent concept page in the vault (using the `okf-fs.ts` workflow above) and wire it into `index.md`.
3.  **Log:** Run `npx tsx ~/.pi/agent/skills/okf-wiki/scripts/okf-log.ts append query "<Summary of synthesis>"`

### 3. Lint (Health Checks)
When commanded to lint or maintain the wiki:
1.  **Semantic Check:** Run `npx tsx ~/.pi/agent/skills/okf-wiki/scripts/okf-lint.ts .` to validate the YAML schema and check for redundant tags.
2.  **Graph Integrity:** Run `npx tsx ~/.pi/agent/skills/okf-wiki/scripts/okf-graph.ts orphans` to find broken links or unlinked pages.
3.  **Fix Issues:** Fix any flagged issues using your file tools followed by `okf-fs.ts finalize`. Do NOT use raw bash commands for file modifications.

---
## Tooling Reference

All utilities are located in `~/.pi/agent/skills/okf-wiki/scripts/`. Run them using `npx tsx <script>`.

- **Safe Mutation:** `okf-fs.ts finalize <filepath>` (Normalizes slugs, timestamps, and git commits)
- **Linter:** `okf-lint.ts <dir>` (Validates frontmatter and tags)
- **Graph:** 
  - `okf-graph.ts orphans`
  - `okf-graph.ts backlinks <filepath>`
- **Ledger:** 
  - `okf-log.ts append <operation> <description>`
  - `okf-log.ts digest <N>`
  - `okf-log.ts history <target>`
