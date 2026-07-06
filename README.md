# OKF-Wiki Skill

An autonomous, autonomous-agent-driven knowledge base skill built on Google's Open Knowledge Format (OKF). This skill equips your LLM agent with the precise instructions and TypeScript utilities needed to safely maintain a massive, compounding wiki graph.

## Features
- **Atomic Writes & Git Auto-Versioning:** The agent never corrupts files. Edits are handled atomically and automatically committed to Git.
- **Compounding Artifacts:** The agent is instructed to never let a good synthesis die in the chat. It automatically saves high-value insights back into the graph.
- **Strict OKF Schema:** Enforces `id`, `type`, `created_date`, `status`, and `last_updated` on every file.
- **Graph Integrity:** Detects orphans, generates backlinks, and safely updates Obsidian `[[wikilinks]]` when files move.
- **Ledger Management:** Maintains a strict, parseable `log.md` chronology of every wiki change.

## Installation

The easiest way to install this skill globally is using the official Pi package manager:

```bash
pi install npm:@d1g1tlprim8/pi-okf-wiki
```

*(Pi will automatically download the skill, register it globally, and install all necessary dependencies).*

### Manual Installation (From Source)
If you are cloning this repository directly from GitHub to modify the source code yourself:
1. Clone the repository anywhere on your machine (e.g., your Desktop or `~/Projects`).
   ```bash
   git clone https://github.com/theFuribundi/pi-okf-wiki.git
   ```
2. Navigate to where you cloned it, and install it locally using the Pi CLI:
   ```bash
   pi install ./pi-okf-wiki
   ```
*(Pi will remember this exact local path, so any edits you make to the source code will immediately reflect in your agent's behavior without needing to move files).*

## Usage

Simply run your agent (e.g. Pi) inside any empty directory where you want to start a wiki.

1. **Ingest a Document:** Create a `raw/` folder and drop an article into it. Ask the agent: *"Read the article in raw/ and ingest it into the wiki."*
2. **Explore:** Ask the agent: *"What is the history of the concept [X]?"*
3. **Lint:** Ask the agent: *"Run a lint and health check on the graph."*

## Utilities Overview (For Agents)

These scripts are located in `scripts/` and are called by the agent to perform safe mutations.

- `tsx okf-fs.ts finalize <filepath>`: Normalizes slugs, stamps timestamps, and commits to git.
- `tsx okf-lint.ts <dir>`: Validates frontmatter schema and tags.
- `tsx okf-graph.ts orphans|backlinks`: Checks the integrity of graph edges.
- `tsx okf-log.ts append|digest|history`: Interacts with the `log.md` ledger.

## Roadmap

- **Advanced Semantic Search:** Currently, the agent relies on traversing `index.md` to navigate the graph. In a future update, we plan to implement a native, TypeScript-based advanced search architecture (such as BM25, RRF, or GraphRAG) to ensure instant, highly accurate retrieval even when the knowledge graph scales to tens of thousands of nodes.
