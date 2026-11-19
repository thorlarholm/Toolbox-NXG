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
- **Temporary Files (`./scratch/`)**: Store temporary files and debug logs you may want to keep in project-local [`scratch/`](scratch/.gitkeep) instead of `/tmp`. Throwaway files may instead go in the agent harness's session scratch directory (e.g., Claude Code's scratchpad). Never leave `.js`/`.ts`/`.tsx` files in `./scratch/` during `npm run lint` since `eslint .` does not honor `.gitignore`.
- **Git Worktrees for PR Branches**: Keep this checkout on local `main` so `AGENTS.md`, `CLAUDE.md`, and `.claude/settings.json` (which exist only on `main`) stay present. Work on PR branches in worktrees under `/Users/thor/Projects/Toolbox-NXG-worktrees/<branch-slug>` (`git worktree add -b <branch> <path> upstream/main`, then `npm ci` inside it). Never create worktrees inside this repo tree (e.g., `.claude/worktrees/` or `./scratch/`), because `eslint .` would lint them. Building in a worktree writes to that worktree's `build/`, so this checkout's [`build/`](build/chrome/manifest.json) test build stays intact.

## 3. Contribution Workflow & Pull Request Hygiene

- **Remotes & Upstream-Clean Branching**:
  - `origin`: `git@github.com:thorlarholm/Toolbox-NXG.git`
  - `upstream`: `git@github.com:toolbox-nxg/Toolbox-NXG.git`
  - Local `main` and `origin/main` both hold workspace-only commits (`AGENTS.md`, `CLAUDE.md`, `FINDINGS.md`, `SESSIONLOG.md`, `TODO.md`, `.gitignore` `scratch/` entries, `scratch/.gitkeep`). `origin/main` is **not** a mirror of `upstream/main`.
  - Always create PR branches from `upstream/main` (`git fetch upstream && git switch -c <branch> upstream/main`), never from local `main` or `origin/main`, so workspace-only setup and documentation never leak into upstream PRs.
  - Before pushing or opening a PR, confirm `git log --oneline upstream/main..<branch>` lists only the intended commits.
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

## 4. Reference Docs (Read Only When Relevant)

- **Technical Findings** ([`FINDINGS.md`](FINDINGS.md)): Curated discoveries on local environment/builds, test harness, browser/DevTools MCP limits, and Reddit API auth behavior. Read only when working in those areas; update in place rather than appending duplicate entries.
- **Session History** ([`SESSIONLOG.md`](SESSIONLOG.md)): Chronological log of past sessions, branch/build state, and completed work (newest first). Read only when checking project status or past decisions.
- **Update Rule**: Never append session logs or findings to `AGENTS.md`. Record dated work in [`SESSIONLOG.md`](SESSIONLOG.md) and durable facts in [`FINDINGS.md`](FINDINGS.md) on local `main`.
