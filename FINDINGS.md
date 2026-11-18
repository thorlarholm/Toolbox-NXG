# Toolbox-NXG Workspace Findings (`FINDINGS.md`)

Curated technical discoveries for this workspace. Update entries in place when facts change rather than appending chronological history.

## 1. Local Environment & Build State

- **Node & `nvm`**: Node `v24.14.1` is the system-wide default via `$NVM_DIR/alias/default` (`~/.zshenv` and `~/.zprofile` prepend it ahead of `path_helper` and `brew shellenv`; `~/.zshrc` lazy-loads `nvm()` only). Local [`.nvmrc`](.nvmrc) (`v24.14.1`) is excluded via [`.git/info/exclude`](.git/info/exclude). Legacy global Node 16, `yarn`, and `taiko` under `/usr/local/` have been removed; `~/.npmrc` sets `min-release-age=7`.
- **CLI & Browsers**: `gh` is authenticated as `thorlarholm`. **Google Chrome** is installed for testing unpacked [`build/chrome/`](build/chrome/manifest.json); **Firefox** is not installed locally.
- **Build Artifact Caution**: [`build/chrome/`](build/chrome/manifest.json) and [`build/firefox/`](build/firefox/manifest.json) may hold an unmerged PR branch's build for manual testing (e.g., `perf/usernotes-popup-latency` at `e13b4e1a`). Do not run `npm run build` / `npm run build:chrome` on local `main` if you want to preserve that PR test build.

## 2. ESLint 9 & `./scratch/` Constraints

- **ESLint 9 flat config (`eslint .`) does not honor `.gitignore`**:
  - External reference clones live outside the repo at `/Users/thor/Projects/Toolbox-NXG-reference/` (originally `./reference/` triggered 392 ESLint errors).
  - Never leave `.js`/`.ts`/`.tsx` files in [`scratch/`](scratch/.gitkeep) when running `npm run lint`.

## 3. Test Harness & Browser Automation

- **No live-browser automated tests**: All automated tests (`npm test` and [`.github/workflows/main.yml`](.github/workflows/main.yml)) run under Vitest ([`vitest.config.ts`](vitest.config.ts)) using `happy-dom` (default) or `node` (35 files via `// @vitest-environment node`).
- **Playwright is not installed**: Neither the repo nor the global Node `v24.14.1` environment has Playwright installed (`@vitest/browser-playwright` in [`package-lock.json`](package-lock.json) is only an optional `vitest` peer dependency from upstream `4eb66c97`).
- **`chrome-devtools` MCP limitations**:
  - `--autoConnect --categoryExtensions` against an active Chrome session (`157.0.8103.51`) with 1,090+ tabs caused UI freezes, CPU spikes, and a 3-minute `select_page` timeout (`context deadline exceeded`). `--autoConnect` and `--logFile` were removed from `~/.gemini/config/mcp_config.json`, and Chrome remote debugging was disabled.
  - Isolated MCP Chrome profiles hit Reddit's `"Prove your humanity"` login CAPTCHA. Use manual unpacked-extension testing in your main Chrome profile for authenticated UI verification, and reserve `chrome-devtools` MCP for isolated single-tab sessions.

## 4. Reddit API Auth & `scripts/auth-probe.js`

Verified on `2026-11-18` against `/r/DKTEST` in Chrome's extension service worker DevTools console (`32 / 32` `oauth.reddit.com` GET endpoints `ok`, `0` broken):

- **Token exchange & modhash**: `POST /svc/shreddit/token` returned `200`; `old /api/me.json` returned `200` with `modhash present: true`.
- **Cookie-only endpoints (`403` Shreddit HTML when `Bearer` is sent)**:
  - `/api/info.json`, `/r/<sub>/api/info.json`, and `/r/<sub>/comments/<id>.json`.
- **Bearer-required endpoints**:
  - `404` HTML on cookie-only → `200` JSON with bearer: `/r/<sub>/api/user_flair_v2`, `/r/<sub>/api/link_flair_v2`.
  - `403` HTML on cookie-only → `200` JSON with bearer: `/api/mod/conversations/unread/count`, `/api/mod/notes`, `/api/mod/notes/recent`, `/api/v1/<sub>/removal_reasons`.
- **All-mode endpoints (`200` on cookie, bearer, and cookie+bearer)**:
  - `/api/v1/me`, `/subreddits/mine/moderator.json`, `/r/<sub>/about*.json`, `/r/<sub>/hot.json`, `/r/<sub>/wiki/*`, and `/user/<name>*`.
- **Mutations & `POST` behavior**:
  - `POST /r/<sub>/api/flairselector` returns HTML on cookie-only vs. JSON on bearer/`cookie+bearer` (matching [`initialOAuthMode`](extension/data/background/handlers/webrequest.ts) using `'bearer'` for non-reads).
  - `POST /api/unsave` (`id=t3_0`) returns `403` without `X-Modhash` vs. `400` with bearer or `cookie + X-Modhash` on `oauth`/`old`.
- **Probe script quirk**: Line 59 of [`scripts/auth-probe.js`](scripts/auth-probe.js) fetches `https://old.reddit.com/r/${sub}/new.json?limit=1` to discover `postId`, which returned `403` Shreddit HTML (skipping `/comments/${postId}.json`), while `old.reddit.com/r/<sub>/wiki/pages.json` and `oauth.reddit.com` listings returned `200`. Querying `oauth.reddit.com` or hardcoding `postId` in a pasted copy covers that endpoint.
