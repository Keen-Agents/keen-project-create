# KEEN PROJECT CREATE

> **KEEN PROJECT CREATE** is scaffold **Keen Agents Projects**.  

---

## 🚀 Overview

This package is a NPX command that creates ready for use project setup.  
It comes preconfigured with modern developer tools and practices:

- **Husky hooks** for Git workflow automation
- **Prettier** for code style and formatting

---
## 🌿 Usage
Standard template
```
npx keen-project-create <PROJECT_DIR>
```

VSCode template with prettrier and debugger
```
npx keen-project-create <PROJECT_DIR> vscode
```

Existing Keen projects can be re-run idempotently:

```
npx keen-project-create <EXISTING_KEEN_PROJECT_DIR>
```

The CLI treats a non-empty target as safe only when it already contains `keen.json`. In that case it copies missing template files without overwriting existing files, preserving agent `settings.json` values such as `agentName`, `agentId`, `sessionId`, `requestId`, `useParentDictionary`, and `dictionaryKey`. Arbitrary non-empty directories are still refused.

---

## 📝 Code Standards

We use **Prettier** to maintain consistent code style (spacing, formatting).

For the best experience:

- Install the Prettier VS Code plugin
- Make sure code is formatted before committing

## 🌿 Branching Strategy

Branch names must follow one of these formats:

```
- feature/KPC-<NUMBER>
- fix/KPC-<NUMBER>
- hotfix/KPC-<NUMBER>
- remove/KPC-<NUMBER>
- release/KPC-<NUMBER>
```

Where `<NUMBER>` is the ticket number.

## 📝 Commit Messages

Each commit message must follow this format:

```
KPC-<NUMBER>:<ADD|FIX|DELETE>: <MESSAGE>
```

```
NUMBER: Ticket number

ADD: A new feature

FIX: A feature was fixed

DELETE: Code cleaned or removed

MESSAGE: Short description of the change
```

Example:

```
KPC-123:ADD: Version X.X.X
```

## 🔀 Pull Requests

- After pushing, create a PR to the development branch
- A minimum of 2 reviewers must approve before merging
