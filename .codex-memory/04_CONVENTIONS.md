# Conventions

## Code Style

- No build step; edit `index.html`, `Code.gs`, and synced `Код.js` directly.
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
- Synced Apps Script copy: `Код.js`.
- Apps Script manifest: `appsscript.json`.
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

- `clasp` is configured and should be used when OAuth session is valid.
- Before Apps Script push, copy the backend into both `Code.gs` and `Код.js`.
- Run `npm run check` before deploy.
- Push with `npm run gas:push`.
- Create a version with `npx @google/clasp version "short description"`.
- Deploy that version to the existing deployment ID:

```bash
npx @google/clasp deploy -i AKfycbwVBqxidw_gcAlGVIwIUBU5GIfLtzQ5ULk0fJ2VRpbAWdfI0a1eT37J8ASIxuJkeF0jLw -V <version>
```

- Verify the public Web App URL after deploy:

```text
https://script.google.com/macros/s/AKfycbwVBqxidw_gcAlGVIwIUBU5GIfLtzQ5ULk0fJ2VRpbAWdfI0a1eT37J8ASIxuJkeF0jLw/exec
```

- If `clasp` auth breaks, ask the user to reconnect Google access instead of guessing.

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

## Google Sheets Style

- Treat the live Google Sheets formatting as part of the product UI.
- Preserve the ETNA table style when adding or moving columns:
  - row 1: merged dark title band, white bold text;
  - row 2: cream section bands;
  - row 3: gold header row with white bold centered text;
  - body: Arial 10, compact rows, alternating white/gray backgrounds, borders, right-aligned currency cells.
- New columns must be placed in the correct business section, not appended casually to the end.
- For income fields, keep the `ДОХОДЫ` section together. `Яндекс еда` belongs between `Терминал 2` and `Безнал итого`.
- When code changes the sheet schema, update the live sheet via Google Sheets integration or an explicit Apps Script migration in the same work session.
- Do not ask the user for colors or table formatting parameters unless the style cannot be inferred. Read/copy the actual style from neighboring columns in the same section.
- Header cells must be horizontally and vertically centered; data cells must inherit the table body style, including alternating row backgrounds, borders, font, alignment, and number format.
- User may edit Google Sheets manually. Before changing sheet structure or formulas, read the live sheet first and treat it as the source of truth.
- For planned operating periods, prefilled rows with real dates in column A are valid. The form should update the row matching the selected date instead of relying on the first empty row.

## User Preferences

- Communicate in Russian.
- Be direct and honest about tradeoffs.
- Do not pretend a feature is safer or more complete than it is.
- Owner prefers pragmatic solutions over complex role systems when the simple flow is enough.
- No audit logging for owner changes is required for now.
- For historical data entry, use the same form under owner PIN rather than manual spreadsheet editing.
