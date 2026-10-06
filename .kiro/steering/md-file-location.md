---
inclusion: always
---

# Markdown File Location

All markdown (`.md`) files must be saved to the `docs/md/` directory at the workspace root.

- **Never** create `.md` files in the workspace root or in any other subdirectory unless the file is a standard config-driven exception (e.g. `README.md` explicitly required by a tool at a specific path).
- When generating documentation, summaries, guides, changelogs, or any other markdown content, always use the path `docs/md/<FILENAME>.md`.
- The `docs/md/` directory already exists — do not create it again.
