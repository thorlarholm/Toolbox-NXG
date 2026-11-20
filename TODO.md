# Tasks

- [ ] **Modmail: prevent left-menu search icon flash on `/mail/all`** _(new branch)_
  - **Symptom:** When opening `https://www.reddit.com/mail/all`, the search icon in the left navigation menu is briefly visible before being hidden. Confirmed on both the upstream extension and our local build (pre-existing behavior, not a branch regression).
  - **Scope:** Accomplish in a separate, dedicated branch (e.g., branched from `main`).
  - **Relevant code:**
    - `extension/data/modules/modmail/modmail.css` (`body.toolbox-modmail-search-top .modhub-layout-left-nav rpl-tooltip:has(svg[icon-name="search"])` hides the icon with `display: none !important`)
    - `extension/data/modules/modmail/dom.ts` (`createModmailHandlers` adds `toolbox-modmail-search-top` to `document.body.classList` when `searchAtTop` is enabled)
    - `extension/data/modules/modmail/index.ts` (module initializer runs on `/mail*` after module setup/settings load)

## Review for Claude

- [x] **Review: compact overlong notification `dedupeKey` values to `<= 500` chars** _(reviewed 2026-11-19; rebuilt clean on `upstream/main`, all 7 checks pass; renamed to `fix/notification-id-length` (local + origin) on 2026-11-20; PR not yet opened)_
  - **Verdict:** Correct. Compacted IDs are 217 chars (200-char prefix + `:` + 16-hex FNV-1a digest) and deterministic. No caller looks up notifications by the raw `dedupeKey` (consumers only use the returned ID), so compaction is safe.
  - **Done:** deleted the old contaminated local branch `fix/notification-id-length` (`f4c8c182`) on 2026-11-19.
  - **Context:** Consolidated notifier polls (`mq:consolidated:...` / `um:consolidated:...`) can exceed Chrome's 500-character limit on `chrome.notifications.create` IDs (`The notification's ID should be 500 characters or less`).
  - **Changes to review:**
    - `extension/data/background/handlers/notifications.ts` (`resolveNotificationID`, `hashDedupeKey`, `MAX_NOTIFICATION_ID_LENGTH`, `COMPACT_DEDUPE_PREFIX_LENGTH`)
    - `extension/data/background/handlers/notifications.test.ts` (500-char boundary and overlong deterministic compaction tests)
