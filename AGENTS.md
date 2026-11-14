# Toolbox-NXG Workspace Guidelines (`AGENTS.md`)

## 1. Project Purpose & Repository Lineage
- **Purpose**: Review and enhance **Toolbox-NXG** by creating pull requests.
- **Fork (`origin`)**: `https://github.com/thorlarholm/Toolbox-NXG` (tracked by this workspace).
- **Upstream**: `https://github.com/toolbox-nxg/Toolbox-NXG` (actively maintained successor to `reddit-moderator-toolbox`).
- **Legacy Predecessor**: `https://github.com/toolbox-team/reddit-moderator-toolbox`.

## 2. `./reference/` Directory Rules & Verification Awareness
- `./reference/` is excluded from git tracking via [`.gitignore`](.gitignore) (`/reference`).
- Local reference clones may exist under `./reference/`:
  - `./reference/Toolbox-NXG` (`https://github.com/toolbox-nxg/Toolbox-NXG.git`)
  - `./reference/reddit-moderator-toolbox` (`https://github.com/toolbox-team/reddit-moderator-toolbox.git`)
- **Do Not Read Without Instruction**: Never read any files inside `./reference/` unless explicitly instructed to do so by the user.
- **Functionality Verification Awareness**: Be aware that a local clone may be present in `./reference/` when running functionality verifications (e.g., workspace-wide searches, test runners, linters, type checks, or builds). Ensure verification commands and tool globs scope to the workspace source and do not inadvertently include or report on `./reference/`.

## 3. Pull Request Hygiene
- Keep pull request branches focused strictly on the intended Toolbox-NXG review findings, fixes, or enhancements.
- Avoid bundling local workspace-only setup or documentation into upstream PR branches unless explicitly intended.

## 4. Session Log & Findings
### 2026-11-14 — Initial Workspace Setup
- Cloned `https://github.com/thorlarholm/Toolbox-NXG.git` into `/Users/thor/Projects/Toolbox-NXG` (`main` at `328e06e6`).
- Cloned `https://github.com/toolbox-nxg/Toolbox-NXG.git` (`main` at `328e06e6`) and `https://github.com/toolbox-team/reddit-moderator-toolbox.git` (`master` at `e87b919a`) into `./reference/`.
- Excluded `/reference` in [`.gitignore`](.gitignore).
- Documented workspace purpose, verification awareness, and `./reference/` read restrictions in [`AGENTS.md`](AGENTS.md).
