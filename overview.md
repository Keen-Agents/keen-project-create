# keen-project-create — Overview

> **One-liner:** NPM CLI scaffolder за bootstrap-ване на нов Keen agent project — копира template, инсталира dependencies, настройва git hooks.
> **Stack:** Node.js, ESM, npx CLI
> **Status:** Active
> **Last Updated:** 2026-02-19
> **Documented at commit:** `(вж. git log)` — 2026-02-19
> **Full Reference:** [reference.md](./reference.md)

---

## What Is This Service?

keen-project-create е **CLI инструментът за стартиране на нов Keen проект** — аналог на `create-react-app` или `npm init`. Разработчик пуска `npx keen-project-create <folder>` и получава готова структура за работа с Keen агенти.

Публикуван на NPM като `keen-project-create` (v1.0.18).

## What Does It Do?

- Копира **project template** (default или vscode) в посочена директория
- Прави **variable substitution** — замества `__APP_NAME__` с реалното проектно име
- Пуска `npm install` автоматично (инсталира dependencies вкл. `keen-builder`)
- Настройва **Husky git hooks** — commit message validation с pattern `KPC-<NUMBER>:<ADD|FIX|DELETE>: <message>`
- Генерира `keen.json` и `package.json` конфигурации за новия проект

## Inputs & Outputs

| Direction | What | Format | From / To |
|-----------|------|--------|-----------|
| Input | Target directory | CLI argument | Разработчик |
| Input | Template type (`vscode`) | Optional CLI argument | Разработчик |
| Output | Project files | Copied from template | Filesystem |
| Output | `npm install` | Child process | Node.js packages |
| Output | Git hooks | Husky `.husky/` | `.git/hooks/` |

## Key Relationships

```
Разработчик (terminal)
  ↓ npx keen-project-create <dir> [vscode]
keen-project-create CLI
  ↓ копира template
Нов Keen проект (с keen.json, scripts/, flows/)
  ↓ npm install → инсталира keen-builder
keen-project-watch-builder-pkg (npm package)
  ↓ npm run dev
File watcher + upload към Keen server
```

**Templates:**
- `default/` — базова структура без VSCode специфики
- `vscode/` — включва `.vscode/` конфигурация + keen-builder dependency

## When Does This Matter?

**Фаза: Discovery → Prototype**

- **Discovery:** Не директно, но проектите са setup-нати с този инструмент
- **Prototype:** Всеки нов клиентски проект започва с `npx keen-project-create`
- **Pilot/Production:** Не се използва — проектите вече съществуват

## What to Read Next

- Нужни са детайли за templates, CLI флагове, commit pattern? → [reference.md](./reference.md)
- Нужна е ориентация за file watcher (npm run dev)? → [keen-project-watch-builder/overview.md](../keen-project-watch-builder/overview.md)
- Нужна е ориентация за свързани сервизи? → [INDEX.md](../../INDEX.md)
