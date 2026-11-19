# Toolbox-NXG Session Log (`SESSIONLOG.md`)

Chronological record of workspace sessions, branch/build state, and completed work (newest first).

## 2026-11-19 — Handover from Gemini Antigravity to Claude Code

- Reviewed the workspace setup and global Antigravity rules (`~/.gemini/config/AGENTS.md`) read-only. Decisions: Antigravity and Claude Code both stay in use with `AGENTS.md` as the shared rules file, and the workspace commits stay on `origin/main` (no force-push).
- Found that `origin/main` carries 14 workspace commits, so the old "branch from `origin/main`" rule leaked workspace docs into `fix/notification-id-length` (`f4c8c182`). Changed [`AGENTS.md`](AGENTS.md) §3 to branch from `upstream/main` and added a worktree workflow (`/Users/thor/Projects/Toolbox-NXG-worktrees/`) so this checkout stays on `main`.
- Added [`CLAUDE.md`](CLAUDE.md) (`@AGENTS.md`), [`.claude/settings.json`](.claude/settings.json) (allows the 7 checks and read-only git/gh; asks before force/delete operations, PR creation, and reads of the reference clones), and `~/.claude/CLAUDE.md` (Part 1 of the Gemini global rules).
- Rebuilt the notification fix as `fix/notification-id-length-v2` (`2c7f5d9a`, cherry-pick of `f4c8c182`) on `upstream/main` (`bbc3d3f7`) in worktree `/Users/thor/Projects/Toolbox-NXG-worktrees/fix-notification-id-length`. Reviewed it and verified all 7 checks: `fmt` (`dprint check`), `lint`, `lint:css`, `lint:params`, `typecheck`, `test` (209 files / 2,668 tests), `build`. Not pushed. The old branch is kept pending approval to delete.

## 2026-11-18 — `AGENTS.md` Progressive-Disclosure Split

- Audited [`AGENTS.md`](AGENTS.md) and split `## 4. Session Log & Findings` into [`FINDINGS.md`](FINDINGS.md) (topic-organized technical reference, updated in place) and [`SESSIONLOG.md`](SESSIONLOG.md) (chronological log, newest first).
- Replaced Section 4 in [`AGENTS.md`](AGENTS.md) with conditional reference pointers and a rule keeping future logs/findings out of `AGENTS.md`.

## 2026-11-18 — Test Harness Audit & Live Auth Probe (`scripts/auth-probe.js`)

- Audited automated test coverage across [`package.json`](package.json), [`vitest.config.ts`](vitest.config.ts), [`.github/workflows/main.yml`](.github/workflows/main.yml), and prior session transcripts: confirmed zero live-browser automated tests and no Playwright installation (see [`FINDINGS.md`](FINDINGS.md)).
- Executed [`scripts/auth-probe.js`](scripts/auth-probe.js) on `/r/DKTEST` in Chrome's extension service worker DevTools console plus a follow-up check for `/r/DKTEST/comments/1snitqy.json?limit=1`: confirmed `32 / 32` `oauth.reddit.com` GET endpoints `ok` (`0` broken) plus expected `POST flairselector` and `POST /api/unsave` behavior.

## 2026-11-18 — Legacy Node 16 Removal & System-Wide `nvm` Default

- Removed legacy global Node `v16.13.2`, `npm`/`npx`/`corepack`, `yarn`/`yarnpkg`, and `taiko` from `/usr/local/`, along with `~/.config/yarn` and `~/Library/Caches/Yarn` (`~/Library/Caches/node-gyp/24.14.1` retained).
- Replaced the hardcoded `v24.14.1` pin in `~/.zshenv` with dynamic resolution of `$NVM_DIR/alias/default` (`24` → `v24.14.1`), re-prepended `_NVM_DEFAULT_BIN` in `~/.zprofile` after `/etc/zprofile` (`path_helper`) and `brew shellenv`, and removed `node`/`npm`/`yarn`/`npx` lazy wrappers in `~/.zshrc` (retaining lazy-loading for `nvm()` only).
- Verified `zsh -c`, `zsh -l -c`, and `zsh -i -c` all resolve `node`, `npm`, and `npx` directly to `/Users/thor/.nvm/versions/node/v24.14.1/bin` (`v24.14.1` / `npm 11.11.0`).
- Added local [`.nvmrc`](.nvmrc) (`v24.14.1`) and ignored `/.nvmrc` in [`.git/info/exclude`](.git/info/exclude) so it stays active across PR branches without polluting diffs or `git status` (verified `nvm use`, `npm run fmt`, and `npm run lint`).

## 2026-11-17 — Upstream Rebase, Critical Review & Latency Edge-Case Fixes

- Fetched `upstream` (`bbc3d3f7`, 9 commits ahead of `328e06e6`), fast-forwarded `origin/main` to `bbc3d3f7`, rebased `perf/usernotes-popup-latency` (`194bf524` -> `78faa8a8`) onto `upstream/main` (`6268fb60`..`78faa8a8`), and rebased local `main` (`b8eee721` -> `24a3ec5d`) onto `upstream/main` (`85b113c3`..`24a3ec5d`).
- Audited all 4 `perf/usernotes-popup-latency` commits and implemented 4 topic commits fixing identified races, tradeoffs, and test gaps (`93781d89`..`e13b4e1a`):
  - `93781d89` (`perf(usernotes): expose hasMessageLinks helper to skip unneeded save waits`): Added `hasMessageLinks()` in `extension/data/modules/shared/usernotes/messageLinkCache.ts` and tests in `messageLinkCache.test.ts`.
  - `2048a387` (`fix(usernotes): await pending thing context on save and avoid macro/warning races`): Added `mayHaveMessageLink` and `thingContextPending`/`thingContextPromiseRef`/`selectedMacroRef` tracking in `AddUserNotePopup.tsx` so fast saves wait for pending `resolveThingContext` when needed, pre-resolution ban macros re-resolve once tokens arrive, and `<BanTokenWarning>` doesn't flash while pending; added tests in `AddUserNotePopup.test.tsx`.
  - `98f0200e` (`fix(usernotes): refine popup store hydration, background refresh, and link resolution`): Updated `dom.tsx` to hydrate cold stores in a single `getUserNotes(subreddit,)` call, run cache-respecting `onRefreshNotes` on warm stores (no-op when unchanged, updating on fresher `noteCache`/TTL), await `thingPromise` on `includeMessageLink` saves, and prefer normalized `resolvedThing.permalink`; added `extension/data/modules/usernotes/dom.test.tsx`.
  - `e13b4e1a` (`test(usernotes): cover purify skip, compat-on edge cases, and diff reference reuse`): Added missing unit tests in `moduleapi.test.ts` and `reconcile.test.ts`.
- Verified all 7 pre-PR checks on `perf/usernotes-popup-latency` (`e13b4e1a`, Node `v24.14.1`): `fmt`, `lint`, `lint:css`, `lint:params` (0 violations), `typecheck`, `test` (210 files / 2,683 tests), and `build` ([`build/chrome/`](build/chrome/manifest.json) + [`build/firefox/`](build/firefox/manifest.json)).
- Pushed `perf/usernotes-popup-latency` (`e13b4e1a`) to `origin/perf/usernotes-popup-latency` (PR against `toolbox-nxg:main` intentionally held pending manual browser testing) and returned `HEAD` to local `main` (leaving the `e13b4e1a` `build/` artifacts intact).

## 2026-11-14 — Chrome Build Verification, DevTools MCP Findings & Scratch Policy

- Verified [`build/chrome/`](build/chrome/manifest.json) (`v8.0.0.14`, built `2026-11-14 15:21`) compiled all 4 initial `perf/usernotes-popup-latency` commits (`078d527b`, `d81f7178`, `ac1f3897`, `194bf524`) while local `HEAD` stayed on workspace-only `main`.
- Tested `chrome-devtools` MCP `--autoConnect --categoryExtensions` against active Google Chrome (`157.0.8103.51`); disabled `--autoConnect`, removed `--logFile`, and disabled Chrome remote debugging after `select_page` timed out and caused UI freezes across 1,090+ tabs (see [`FINDINGS.md`](FINDINGS.md)).
- Added [`scratch/.gitkeep`](scratch/.gitkeep) (gitignoring `/scratch/*` except `!/scratch/.gitkeep` on local `main`) and standardized on project-local `./scratch/` instead of `/tmp` for temporary files.

## 2026-11-14 — Usernotes (`N`-Tag) Popup Latency Optimization

- Created PR branch `perf/usernotes-popup-latency` from `origin/main` (`328e06e6`) and implemented the 4-commit optimization roadmap:
  - `078d527b` (`perf(usernotes): skip purifyObject walk over inflated usernotes tree`): Scoped `purifyObject` in `readNxgUsernotes` to `notes.types` only (`extension/data/modules/shared/usernotes/moduleapi.ts`, `moduleapi.test.ts`).
  - `d81f7178` (`perf(usernotes): open AddUserNotePopup without waiting on thing or mod lookups`): Removed blocking `getApiThingInfo` and `getModeratorListResult` awaits before opening [`AddUserNotePopup.tsx`](extension/data/modules/usernotes/components/AddUserNotePopup.tsx) from [`dom.tsx`](extension/data/modules/usernotes/dom.tsx), passing `resolveTargetIsMod` and `resolveThingContext`, guarding user-edited ban messages with `banMessageDirtyRef`, and adding tests in [`AddUserNotePopup.test.tsx`](extension/data/modules/usernotes/components/AddUserNotePopup.test.tsx).
  - `ac1f3897` (`perf(usernotes): avoid forced refresh on mount and parallelize compat reads`): Switched popup mount to cache-first `getUserNotes(subreddit,)` (`onRefreshNotes` only when `!cachedSubState`), parallelized `readShardedUsernotes` + `readLegacyUsersForDiff` via `Promise.all`, and short-circuited `diffLegacyNotes` in [`reconcile.ts`](extension/data/util/wiki/schemas/usernotes/reconcile.ts) before `structuredClone(nxgUsers,)` when `computeLegacyDiff` has no adds or archived keys.
  - `194bf524` (`perf(usernotes): skip redundant wiki re-read in updateUserNotes save`): Added `alreadyReconciled` parameter to `doSaveUserNotes` (set `true` from `doUpdateUserNotes`) to eliminate the second shard/legacy read cycle on compat-on saves.
- Verified all checks on `perf/usernotes-popup-latency` (`Node v24.14.1`): `npm run typecheck`, `npm run lint`, `npm run fmt`, `npm run lint:css`, `npm run lint:params` (0 violations), `npm run test` (204 files / 2650 tests), and `npm run build:chrome`.
- Pushed `perf/usernotes-popup-latency` (`194bf524`) to `origin/perf/usernotes-popup-latency`, switched `origin` and `upstream` remotes to SSH (`git@github.com:...`), and checked out local `main`.

## 2026-11-14 — Initial Workspace Setup & Contribution Workflow

- Cloned `https://github.com/thorlarholm/Toolbox-NXG.git` into `/Users/thor/Projects/Toolbox-NXG` (`main` at `328e06e6`) and added `upstream` (`https://github.com/toolbox-nxg/Toolbox-NXG.git`).
- Cloned `https://github.com/toolbox-nxg/Toolbox-NXG.git` (`main` at `328e06e6`) and `https://github.com/toolbox-team/reddit-moderator-toolbox.git` (`master` at `e87b919a`) originally into `./reference/`, then moved them outside the repo to `/Users/thor/Projects/Toolbox-NXG-reference/` (restoring [`.gitignore`](.gitignore) to upstream) after confirming `eslint .` traversed `./reference/` (392 ESLint errors inside `./reference/`, 0 in workspace files).
- Documented workspace purpose, reference read restrictions, and contribution workflow (from [`docs/developer/contributing.md`](docs/developer/contributing.md), [`docs/developer/building.md`](docs/developer/building.md), [`docs/developer/coding-style.md`](docs/developer/coding-style.md), and [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)) in [`AGENTS.md`](AGENTS.md).
- Pinned non-interactive `zsh` to nvm Node `v24.14.1` in `~/.zshenv`, configured `min-release-age=7` in `~/.npmrc`, installed packages via `npm ci`, and verified all 7 checks pass cleanly (`fmt`, `lint`, `lint:css`, `lint:params`, `typecheck`, `test` [204 files / 2647 tests], `build`).
- Verified `gh` CLI authenticated as `thorlarholm` and **Google Chrome** installed for unpacked `build/chrome/` testing (**Firefox** not currently installed locally).
