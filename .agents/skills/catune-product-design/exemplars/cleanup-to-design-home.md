# Exemplar: Cleanup To `src/design`

## Decision

Catune removed historical PRD/docs/prototype/web surfaces and made `src/design` the single UI home.

## Why It Should Repeat

- The user works best by running `npm run dev` and editing the actual App.
- Multiple prototype surfaces caused Agent confusion and duplicate design decisions.
- One UI root makes code search, refactors, and vibe coding faster.

## Good Follow-up

- Add reusable UI to `src/design/components`.
- Add base primitives to `src/design/primitives`.
- Add shared visual decisions to `src/design/theme`.
- Add product design guidance to this skill instead of recreating large docs.

## Avoid

- Reintroducing `web/` for new UI experiments.
- Creating static HTML prototypes.
- Adding separate docs for decisions that should live in `AGENTS.md` or this skill.

