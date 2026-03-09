# Storybook Theme Pipeline — Bootstrap + Angular

Demo for a lecture: design team maintains a Bootstrap theme in Storybook, delivers to an Angular product project.

## Project Structure

Monorepo with two sub-projects:
- `Storybook/` — Bootstrap theme source + Storybook stories (Angular 19, Bootstrap 5, Storybook 8)
- `Demo_project/` — Angular app consuming the Bootstrap theme (Angular 19, Bootstrap 5)

Theme source: `Storybook/src/theme-bootstrap/custom.scss` (SCSS variable overrides)
Theme in Demo_project: `Demo_project/src/theme/custom.scss` (same SCSS, kept in sync with Storybook)

## Key Commands (run from root)

- `npm run storybook` — launch Storybook on :6006
- `npm run dev` — launch Demo_project on :5173

## Architecture Decisions

- All design tokens live in SCSS variable overrides (`custom.scss`) — single source of truth
- Bootstrap 5 Sass customization: override variables before importing Bootstrap modules
- Import order per Bootstrap docs: functions → variables → maps/mixins/root → utilities → components → utilities/api
- Angular standalone components with plain Bootstrap CSS classes in templates
- No tests — this is a demo project

## Gotchas

- Keep `custom.scss` in sync between Storybook and Demo_project
- When adding new Bootstrap components, add the corresponding `@import` to `custom.scss`
- `text-muted` is deprecated — use `text-body-secondary` instead

## Documentation

Local docs available in `docs/`:
- `docs/bootstrap_docs/` — Bootstrap 5 official docs (MDX)
- `docs/angular_docs/` — Angular official docs (MD)

## Sub-project files

- `.claude/agents/docs-expert.md` — docs verification agent (supports Bootstrap and Angular)
