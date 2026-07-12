# TODOS

## Testing

### Add direct unit tests for hooks and remove coverage exclusion

**What:** `vite.config.ts` excludes `**/hooks/**` from coverage, and none of the 4 hooks (`use-drag-drop.ts`, `use-pan-zoom.ts`, `use-slider.ts`, `use-contest-mode.ts`) have dedicated unit test files — they're only exercised indirectly through `comparison.test.tsx` interaction tests.

**Why:** A regression in hook logic (wheel-zoom clamping, panning guards, drag-drop state, slider clamping) could ship without coverage catching it, since the exclusion hides any drop in real coverage for that directory.

**Context:** Found during `/ship` pre-landing review (2026-07-12) on the migrate-from-monorepo branch. Use `@testing-library/react`'s `renderHook` to test each hook directly: wheel-zoom clamping and listener cleanup on unmount (`use-pan-zoom.ts`), mouse-down/move/up panning guarded by `zoom > minZoom`, drag-enter/leave/over state transitions (`use-drag-drop.ts`), slider position clamping (`use-slider.ts`), and contest match progression (`use-contest-mode.ts`). Once covered, remove the `coverage.exclude: ['**/hooks/**']` entry in `vite.config.ts`.

**Effort:** M
**Priority:** P1
**Depends on:** None
