# Conventions

## Code Style

- No build step; edit `index.html` and `Code.gs` directly.
- Vanilla JavaScript.
- CSS variables in `:root`.
- Existing code mostly uses 2-space indentation inside JS blocks, compact helper functions, and single quotes for JS strings.
- Keep code close to existing style instead of introducing a framework.
- Use `rg` for search.
- Use `apply_patch` for manual edits.
- Keep comments short and useful.

## Naming

- Main frontend file: `index.html`.
- Main Apps Script backend: `Code.gs`.
- Old backend backup: `apps_script_1.js`.
- Spreadsheet template: `etna_smeny.xlsx`.
- Documentation: `docs/*.md`.
- Codex project memory: `.codex-memory/NN_NAME.md`.

## Git

- Current working branch: `main`.
- Repo: `https://github.com/Etna-35/RestForm`.
- Historical workflow says prefer `codex/*` branches and PRs.
- User explicitly allowed doing work in the current branch earlier.
- Commit messages are English imperative style:
  - `Fix mobile date picker and tap zoom`
  - `Restrict old shift date edits`
  - `Fix retro-entry flow and restore form handlers after rebase`

Before push:

```bash
git status --short
npm run check
git add ...
git commit -m "..."
git push origin main
```

## Apps Script Deployment

- If `Code.gs` changes, do not assume deploy is complete.
- User manually creates a new Apps Script deployment.
- User sends the new Web App URL.
- Codex updates `window.APPS_SCRIPT_URL` in `index.html`.
- Then run checks, commit, push.

## Security

- Never commit GitHub PAT.
- Never commit Telegram Bot Token.
- Never commit private Telegram Chat IDs.
- Avoid storing real employee / owner PIN values in docs.
- Public repo means operational secrets must be in Apps Script Properties or Google Sheets access-controlled settings, not in public docs.

## UI Preferences

- Keep the existing ETNA visual language:
  - dark theme;
  - gold accent;
  - mobile-first;
  - compact operational form, not marketing layout.
- Do not overcomplicate calendar UI; native system date picker is intentional.
- Use simple fullscreen blocker for old-date protection.
- Keep text direct and operational.

## User Preferences

- Communicate in Russian.
- Be direct and honest about tradeoffs.
- Do not pretend a feature is safer or more complete than it is.
- Owner prefers pragmatic solutions over complex role systems when the simple flow is enough.
- No audit logging for owner changes is required for now.
- For historical data entry, use the same form under owner PIN rather than manual spreadsheet editing.
