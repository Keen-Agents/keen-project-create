# keen-project-create — Full Reference

> **Quick Overview:** [overview.md](./overview.md)
> **Last Updated:** 2026-02-19
> **Documented at commit:** `(вж. git log)` — 2026-02-19

---

## Architecture & Pattern

NPM CLI tool. ESM module. Единичен `dist/index.mjs` файл (standalone executable). Публикуван на NPM registry.

**Package name:** `keen-project-create`
**Version:** `1.0.18`

---

## Usage

```bash
npx keen-project-create <project-dir>              # Default template
npx keen-project-create <project-dir> vscode       # VSCode template
```

---

## Templates

### `default/` Template
- Базова Keen project структура
- Stub scripts и flows

### `vscode/` Template
- Всичко от default + VSCode специфики:
  - `keen.json` — preconfigured project config
  - `keen-tools.json` — tools configuration
  - `package.json` с `keen-builder` като dependency
  - `.vscode/` — launch.json, settings.json (debug конфигурации)
  - Git hooks setup

---

## CLI Execution Flow

```
npx keen-project-create <dir> [type]
  1. Validate: dir трябва да е празна (или да не съществува)
  2. Copy template → target dir
  3. Variable substitution: __APP_NAME__ → проектно име
  4. npm install (child_process.spawn, non-blocking)
  5. Setup Husky git hooks
  6. Success message
```

---

## Commit Message Pattern (Husky hook)

Файл: `cli/check-commit-msg.js`

**Изисквания:**
```
KPC-<NUMBER>:<ADD|FIX|DELETE>: <message>
```

**Примери:**
- ✅ `KPC-123:ADD: Initial project setup`
- ✅ `KPC-456:FIX: Fix flow connection validation`
- ❌ `added new feature` (нарушава pattern)

---

## Build & Distribution

```bash
npm run build  # Webpack bundle → dist/index.mjs
npm publish    # Публикува на NPM
```

**Output:** `dist/index.mjs` (standalone, shebang: `#!/usr/bin/env node`)

---

## External Dependencies

| Package | Purpose |
|---------|---------|
| `husky` | Git hooks setup |
| `prettier` | Code formatting |

---

## QA Notes

| Label | Описание |
|-------|---------|
| ✅ Looks Sound | Валидира празна директория преди копиране |
| ✅ Looks Sound | `child_process.spawn` (non-blocking) за `npm install` |
| ✅ Looks Sound | Husky commit hooks — enforces commit standards в generated projects |
| ⚠️ **Risk** | **BUG**: Template type е hardcoded на `"vscode"` (line ~43 в `dist/index.mjs`) — `default` template е unreachable с CLI аргумент |
| ⚠️ Risk | Без validation на directory permissions преди копиране |
| ❓ Unclear Intent | Ако `default` template е unreachable, защо съществува? Legacy? |
