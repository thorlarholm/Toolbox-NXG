# Toolbox-NXG Workspace Guidelines (`AGENTS.md`)

## 1. Project Purpose & Repository Lineage

- **Purpose**: Review and enhance **Toolbox-NXG** by creating pull requests.
- **Fork (`origin`)**: `https://github.com/thorlarholm/Toolbox-NXG` (tracked by this workspace).
- **Upstream**: `https://github.com/toolbox-nxg/Toolbox-NXG` (actively maintained successor to `reddit-moderator-toolbox`).
- **Legacy Predecessor**: `https://github.com/toolbox-team/reddit-moderator-toolbox`.

## 2. Reference Clones (`../Toolbox-NXG-reference/`) & Read Rules

- External reference clones live outside this workspace tree at `/Users/thor/Projects/Toolbox-NXG-reference/`:
  - `/Users/thor/Projects/Toolbox-NXG-reference/Toolbox-NXG` (`https://github.com/toolbox-nxg/Toolbox-NXG.git`)
  - `/Users/thor/Projects/Toolbox-NXG-reference/reddit-moderator-toolbox` (`https://github.com/toolbox-team/reddit-moderator-toolbox.git`)
- **Why Outside the Repo**: Moved out of `./reference/` because ESLint 9 flat config (`eslint .` in `npm run lint`) does not honor `.gitignore` and otherwise lints inside local clones.
- **Do Not Read Without Instruction**: Never read any files inside `/Users/thor/Projects/Toolbox-NXG-reference/` unless explicitly instructed to do so by the user.

## 3. Contribution Workflow & Pull Request Hygiene

- **Remotes & Upstream-Clean Branching**:
  - `origin`: `https://github.com/thorlarholm/Toolbox-NXG.git`
  - `upstream`: `https://github.com/toolbox-nxg/Toolbox-NXG.git`
  - Local `main` holds workspace-only commits (`fc4694ae` onward for [`AGENTS.md`](AGENTS.md)).
  - Always create PR branches from `origin/main` (synced with `upstream/main`), never from local `main`, so workspace-only setup and documentation never leak into upstream PRs.
  - Keep PR branches focused strictly on the intended Toolbox-NXG review findings, fixes, or enhancements.
- **Upstream Etiquette & Reuse ([`docs/developer/contributing.md`](docs/developer/contributing.md))**:
  - Before coding new functionality, check [GitHub Issues](https://github.com/toolbox-nxg/toolbox-nxg/issues) or [/r/toolbox_nxg](https://www.reddit.com/r/toolbox_nxg) to confirm it is not already in progress or intentionally omitted.
  - Check for existing utilities before writing new helpers: refer to [`docs/developer/api/index.md`](docs/developer/api/index.md) (regenerable with `npm run docs:api`), [`docs/developer/module-architecture.md`](docs/developer/module-architecture.md), [`docs/developer/project-structure.md`](docs/developer/project-structure.md), and source JSDoc comments as ground truth.
- **Conventions & Documentation**:
  - Adhere to [`docs/developer/coding-style.md`](docs/developer/coding-style.md), [`docs/developer/param-conventions.md`](docs/developer/param-conventions.md), and [`docs/developer/config-popup-style-guide.md`](docs/developer/config-popup-style-guide.md).
  - Add JSDoc docstrings for all new functions.
- **Required Pre-PR Verification ([`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) & [`docs/developer/building.md`](docs/developer/building.md))**:
  - Requires Node `>= 24` (`v24.14.1` via nvm). Ensure dependencies are installed (`npm ci` / `npm install`) before running checks.
  - Verify all 7 checks pass:
    - `npm run fmt` (`dprint` formatting)
    - `npm run lint` (ESLint + `lint:guard`)
    - `npm run lint:css` (Stylelint)
    - `npm run lint:params` (parameter-order check)
    - `npm run typecheck`
    - `npm test`
    - `npm run build`

## 4. Session Log & Findings

### 2026-11-14 — Initial Workspace Setup & Contribution Workflow

- Cloned `https://github.com/thorlarholm/Toolbox-NXG.git` into `/Users/thor/Projects/Toolbox-NXG` (`main` at `328e06e6`) and added `upstream` (`https://github.com/toolbox-nxg/Toolbox-NXG.git`).
- Cloned `https://github.com/toolbox-nxg/Toolbox-NXG.git` (`main` at `328e06e6`) and `https://github.com/toolbox-team/reddit-moderator-toolbox.git` (`master` at `e87b919a`) originally into `./reference/`, then moved them outside the repo to `/Users/thor/Projects/Toolbox-NXG-reference/` (restoring [`.gitignore`](.gitignore) to upstream) after confirming `eslint .` traversed `./reference/` (392 ESLint errors inside `./reference/`, 0 in workspace files).
- Documented workspace purpose, reference read restrictions, and contribution workflow (from [`docs/developer/contributing.md`](docs/developer/contributing.md), [`docs/developer/building.md`](docs/developer/building.md), [`docs/developer/coding-style.md`](docs/developer/coding-style.md), and [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)) in [`AGENTS.md`](AGENTS.md).
- Pinned non-interactive `zsh` to nvm Node `v24.14.1` in `~/.zshenv`, configured `min-release-age=7` in `~/.npmrc`, installed packages via `npm ci`, and verified `lint:css`, `lint:params`, `typecheck`, `test` (204 files / 2647 tests), and `build` pass cleanly.
