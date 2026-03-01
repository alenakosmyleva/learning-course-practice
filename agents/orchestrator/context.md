# Context — Demo6 Storybook Theme Pipeline

## Key Principles
- **Demo purpose** — no overengineering, show pipeline working
- **All color tokens in palette.ts** — single source of truth for future Figma sync
- **Consult orchestrator** on complex vs simple decisions
- **Doc experts validate** — implementations must follow official docs

## Team
| Teammate | Role | Worktree |
|---------|------|----------|
| storybook-dev | Implements Storybook (Phase 0+1) | worktree-storybook |
| demo-dev | Implements Demo_project (Phase 2) | worktree-demo |
| mui-docs-expert | MUI documentation consultant (read-only) | — |
| sb-docs-expert | Storybook documentation consultant (read-only) | — |
| integrator | Phase 3 integration (later) | worktree-integration |

# Progress Log
- 03-01 17:00 → Team created, launching all initial teammates

# Active Agents
| Name | Task | Status |
|---|---|---|
| storybook-dev | Tasks #1-5 (Storybook) | launching |
| demo-dev | Tasks #6-8 (Demo_project) | launching |
| mui-docs-expert | MUI docs consultant | launching |
| sb-docs-expert | Storybook docs consultant | launching |

# Key Decisions
- All color tokens centralized in palette.ts (future Figma sync)
- Demo-level simplicity — no overengineering
- Doc experts validate before implementation
