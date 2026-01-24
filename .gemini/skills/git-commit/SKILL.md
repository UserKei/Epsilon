---
name: git-commit
description:
  Expertise in analyzing workspace changes, planning atomic commits, and maintaining semantic project history.
  Use when the user asks to "commit" changes, check "git status", or wants to save work.
---

# Git Commit Strategy & History Management

This skill defines the Agent's ability to analyze workspace changes, plan atomic commits, and maintain a semantic project history.

## 1. Change Analysis & Grouping
When faced with multiple changed files, do not commit them all at once. You must analyze `git status` and `git diff` and group files according to the following dimensions:
- **Dependencies**: `package.json`, `package-lock.json`, etc.
- **Configuration**: `.gitignore`, `tsconfig.json`, ESLint configs, build tool configs, etc.
- **Cleanup**: Removal of obsolete directories or files.
- **Features/Refactors**: Actual code changes (`src/`, `app/`), grouped by module or application.

## 2. Commit Message Format
Strictly follow the **Conventional Commits** specification:
`type(scope): description`

- **Type**: `feat` (new feature), `fix` (bug fix), `chore` (maintenance/dependency), `docs` (documentation), `style` (formatting), `refactor` (refactoring), `perf` (performance), `test` (test), `ci` (continuous integration).
- **Scope**: In a Monorepo, use precise directory paths as prefixes:
  - `root`: Root-level configuration.
  - `apps/web`: Specific web application.
  - `apps/api`: Specific API application.
- **Description**: Concise and clear, lowercase, no trailing period.

## 3. Output Guidelines
The Agent **must not execute** the commit command directly. It must output the following format for user reference:

1.  **Multi-group Output**: Break changes into logically independent command blocks.
2.  **Command Structure**: Each group must include `git add <specific files>` and `git commit -m "..."`.
3.  **Chinese Explanations**: **A brief explanation in Chinese must be provided before each group of commands, detailing the logic and reason for the grouping.**
4.  **No Auto-commit**: Unless explicitly requested by the user, the Agent is only responsible for outputting Shell commands and does not perform write operations.

## 4. Example Scenario: Re-initializing an Application
If an application is deleted and recreated via CLI (involving dependencies, configuration, and source code changes):

**Group 1: Dependency Changes**
Explanation: 独立提交应用依赖项的更新和锁定文件。
```bash
git add apps/web/package.json package-lock.json
git commit -m "chore(apps/web): upgrade dependencies and add tailwindcss"
```

**Group 2: Engineering Configuration**
Explanation: 提交构建工具、TypeScript 及 Lint 相关配置文件。
```bash
git add apps/web/next.config.js apps/web/tsconfig.json apps/web/eslint.config.js
git commit -m "chore(apps/web): update build and lint configuration"
```

**Group 3: Core Feature Implementation**
Explanation: 提交应用重建后的核心业务代码和 UI 结构。
```bash
git add apps/web/app apps/web/public
git commit -m "feat(apps/web): re-initialize web application with tailwind css"
```
