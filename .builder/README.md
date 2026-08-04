# Builder rules (`.builder/rules/`)

Cursor/Builder loads `*.mdc` files here as **always-on agent instructions** for this repo.

| File                                                   | Purpose                                      |
| ------------------------------------------------------ | -------------------------------------------- |
| [`deploy-app.mdc`](rules/deploy-app.mdc)               | How to deploy the SPA (Vercel-first)         |
| [`organize-ui.mdc`](rules/organize-ui.mdc)             | Keep React components small and maintainable |
| [`project-structure.mdc`](rules/project-structure.mdc) | Where to put pages, API code, and config     |
| [`api-and-backend.mdc`](rules/api-and-backend.mdc)     | API client, auth, and backend boundary       |

Human-oriented overview: see [`../AGENTS.md`](../AGENTS.md).
