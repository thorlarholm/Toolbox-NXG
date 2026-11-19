# Tasks

- [ ] **Modmail: prevent left-menu search icon flash on `/mail/all`** _(new branch)_
  - **Symptom:** When opening `https://www.reddit.com/mail/all`, the search icon in the left navigation menu is briefly visible before being hidden. Confirmed on both the upstream extension and our local build (pre-existing behavior, not a branch regression).
  - **Scope:** Accomplish in a separate, dedicated branch (e.g., branched from `main`).
  - **Relevant code:**
    - `extension/data/modules/modmail/modmail.css` (`body.toolbox-modmail-search-top .modhub-layout-left-nav rpl-tooltip:has(svg[icon-name="search"])` hides the icon with `display: none !important`)
    - `extension/data/modules/modmail/dom.ts` (`createModmailHandlers` adds `toolbox-modmail-search-top` to `document.body.classList` when `searchAtTop` is enabled)
    - `extension/data/modules/modmail/index.ts` (module initializer runs on `/mail*` after module setup/settings load)

## Review for Claude

- [ ] **Review: compact overlong notification `dedupeKey` values to `<= 500` chars**
  - **Context:** Consolidated notifier polls (`mq:consolidated:...` / `um:consolidated:...`) can exceed Chrome's 500-character limit on `chrome.notifications.create` IDs (`The notification's ID should be 500 characters or less`).
  - **Changes to review:**
    - `extension/data/background/handlers/notifications.ts` (`resolveNotificationID`, `hashDedupeKey`, `MAX_NOTIFICATION_ID_LENGTH`, `COMPACT_DEDUPE_PREFIX_LENGTH`)
    - `extension/data/background/handlers/notifications.test.ts` (500-char boundary and overlong deterministic compaction tests)
