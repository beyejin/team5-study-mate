---
name: team-kanban
description: Track substantial Codex work in the Team 5 shared kanban board when working in team5-study-mate.
---

# Team Kanban Work Tracking

Use the `ttodo` CLI through the local Team 5 API to register meaningful work and keep its status current.

## Workflow

1. Check that the API is running with `uv run ttodo statuses --json`.
2. At the start of a substantial task, create one concise issue in `In Progress`. Use `--assignee` only when the responsible teammate is known. Include a due date only when the task has one.
3. Add useful labels and a priority only when they help the team sort work. Do not create one card per tiny edit.
4. Keep the returned issue UUID. Update the same issue as work changes; move it to `Done` only after implementation and verification are complete.
5. If the API is unavailable, report that tracking could not be updated. Do not write directly to Supabase or guess identifiers.

## Commands

```powershell
uv run ttodo add "Implement assignment 7 API and CLI" --status "In Progress" --priority high --label assignment-7 --json
uv run ttodo move <issue-id> "Done"
uv run ttodo update <issue-id> --title "Updated task title"
uv run ttodo board
```

The CLI calls only `TTODO_API_URL` (default `http://127.0.0.1:8000`). Never put Supabase secret keys in prompts, command arguments, issue content, or Git files.
