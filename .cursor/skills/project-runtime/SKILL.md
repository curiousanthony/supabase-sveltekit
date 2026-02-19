---
name: project-runtime
description: This project uses bun as the package manager. Use when running scripts, installing dependencies, adding/removing packages, or suggesting any package-manager commands.
---

# Project Runtime: Use Bun

This repository uses **bun** as the package manager. Always use `bun` instead of `npm`, `yarn`, or `pnpm` when suggesting or running commands in this project.

---

## When to Use

Apply this skill when:

- Running scripts (e.g. `bun run dev`, `bun run build`, `bun run db:generate`, `bun run check`).
- Installing dependencies (`bun install`).
- Adding or removing packages (`bun add`, `bun remove`).
- The user or the agent is about to run any package-manager-style command.

---

## Commands

| Instead of npm / yarn / pnpm | Use |
|-----------------------------|-----|
| `npm install`               | `bun install` |
| `npm run <script>`          | `bun run <script>` |
| `npm add <pkg>`             | `bun add <pkg>` |
| `npm remove <pkg>`          | `bun remove <pkg>` |
| `npx <cmd>`                 | `bunx <cmd>` |

Never suggest `npm`, `yarn`, or `pnpm` for this project unless the user explicitly asks for an alternative.
