# Context — Demo6 Storybook Theme Pipeline

## Status: COMPLETE

## Key Principles
- **Demo purpose** — no overengineering, show pipeline working
- **All color tokens in palette.ts** — single source of truth for future Figma sync

# Progress Log
- 03-01 17:00 → Team created, launched storybook-dev, demo-dev, mui-docs-expert, sb-docs-expert
- 03-01 17:05 ✓ demo-dev: Demo_project scaffold + pages + routing (commit 516c76c)
- 03-01 17:06 ✓ storybook-dev: Storybook project + theme + stories + tsup (commit 87637af)
- 03-01 17:08 → integrator: launched for Phase 3 verification
- 03-01 17:10 ✓ integrator: full pipeline verified — build:theme, deliver:theme, both dev servers start clean

# Commits on main
| Hash | Description |
|------|------------|
| 09f00c9 | Initial commit: docs, orchestrator config, plan |
| 516c76c | feat: add Demo_project with pages and routing |
| 87637af | feat: add Storybook project with theme, tsup build, and stories |

# Key Decisions
- All color tokens centralized in palette.ts (future Figma sync)
- Storybook 8.x + Vite 6.x (v7 too new for storybook adapter)
- tsup outputs .d.mts (ESM) — works fine with Demo_project imports
- Demo-level simplicity throughout
