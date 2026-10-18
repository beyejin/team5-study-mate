import json
import os
from datetime import date
from typing import Annotated, Any

import httpx
import typer

app = typer.Typer(help="Manage Team 5 kanban tasks through the local API.", no_args_is_help=True)


def _request(method: str, path: str, **kwargs: Any) -> Any:
    base_url = os.getenv("TTODO_API_URL", "http://127.0.0.1:8000").rstrip("/")
    headers = kwargs.pop("headers", {})
    if method in {"POST", "PATCH", "DELETE"}:
        headers.setdefault("X-Actor", os.getenv("TTODO_ACTOR", "Codex"))
    try:
        response = httpx.request(
            method, f"{base_url}{path}", timeout=10.0, headers=headers, **kwargs
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        try:
            detail = exc.response.json().get("detail", exc.response.text)
        except ValueError:
            detail = exc.response.text
        typer.echo(f"API error ({exc.response.status_code}): {detail}", err=True)
        raise typer.Exit(code=1) from exc
    except httpx.HTTPError as exc:
        typer.echo(f"Could not connect to API at {base_url}: {exc}", err=True)
        raise typer.Exit(code=1) from exc
    return None if response.status_code == 204 or not response.content else response.json()


def _print(value: Any, as_json: bool) -> None:
    if as_json:
        typer.echo(json.dumps(value, ensure_ascii=False, indent=2))
        return
    if isinstance(value, list):
        if not value:
            typer.echo("항목이 없습니다.")
        for row in value:
            if "title" in row:
                status_name = (row.get("status") or {}).get("name", "")
                assignees = ", ".join(row.get("assignees", []))
                suffix = f" · {assignees}" if assignees else ""
                typer.echo(f"{row.get('id', '')}  [{status_name}] {row['title']}{suffix}")
            else:
                typer.echo(f"{row.get('id', '')}  {row.get('name', '')}")
        return
    if isinstance(value, dict):
        typer.echo(f"{value.get('id', '')}  {value.get('title', value.get('name', '완료'))}")
        if value.get("status"):
            typer.echo(f"상태: {value['status'].get('name', '')}")
        return
    typer.echo("완료")


def _parse_due_date(value: str | None) -> str | None:
    if value is None:
        return None
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError as exc:
        raise typer.BadParameter("Use YYYY-MM-DD for a due date.") from exc


@app.command("statuses")
def statuses(as_json: Annotated[bool, typer.Option("--json", help="Print JSON.")] = False) -> None:
    _print(_request("GET", "/api/statuses"), as_json)


@app.command("board")
def board(as_json: Annotated[bool, typer.Option("--json", help="Print JSON.")] = False) -> None:
    value = _request("GET", "/api/board")
    if as_json:
        _print(value, True)
        return
    for column in value["columns"]:
        typer.echo(f"\n{column['name']} ({len(column['issues'])})")
        for issue in column["issues"]:
            typer.echo(f"  {issue['id']}  {issue['title']}")


@app.command("list")
def list_issues(
    status_name: Annotated[
        str | None, typer.Option("--status", help="Filter by status name.")
    ] = None,
    as_json: Annotated[bool, typer.Option("--json", help="Print JSON.")] = False,
) -> None:
    params = {"status": status_name} if status_name else None
    _print(_request("GET", "/api/issues", params=params), as_json)


@app.command("show")
def show_issue(
    issue_id: Annotated[str, typer.Argument(help="Issue UUID.")],
    as_json: Annotated[bool, typer.Option("--json", help="Print JSON.")] = False,
) -> None:
    _print(_request("GET", f"/api/issues/{issue_id}"), as_json)


@app.command("add")
def add_issue(
    title: Annotated[str, typer.Argument(help="Task title.")],
    status_name: Annotated[str, typer.Option("--status", help="Initial status.")] = "Backlog",
    body: Annotated[str | None, typer.Option("--body", help="Task description.")] = None,
    assignees: Annotated[
        list[str] | None, typer.Option("--assignee", help="Repeat for each assignee.")
    ] = None,
    due_date: Annotated[
        str | None, typer.Option("--due-date", help="Due date in YYYY-MM-DD.")
    ] = None,
    priority: Annotated[
        str | None, typer.Option("--priority", help="low, medium, or high.")
    ] = None,
    labels: Annotated[
        list[str] | None, typer.Option("--label", help="Repeat for each label.")
    ] = None,
    as_json: Annotated[bool, typer.Option("--json", help="Print JSON.")] = False,
) -> None:
    payload: dict[str, Any] = {
        "title": title,
        "status": status_name,
        "body": body,
        "assignees": assignees or [],
        "due_date": _parse_due_date(due_date),
        "priority": priority,
        "labels": labels or [],
    }
    result = _request(
        "POST",
        "/api/issues",
        json={key: value for key, value in payload.items() if value is not None},
    )
    _print(result, as_json)


@app.command("update")
def update_issue(
    issue_id: Annotated[str, typer.Argument(help="Issue UUID.")],
    title: Annotated[str | None, typer.Option("--title")] = None,
    body: Annotated[str | None, typer.Option("--body")] = None,
    status_name: Annotated[str | None, typer.Option("--status")] = None,
    assignees: Annotated[
        list[str] | None, typer.Option("--assignee", help="Replace the assignee list.")
    ] = None,
    due_date: Annotated[
        str | None, typer.Option("--due-date", help="Due date in YYYY-MM-DD.")
    ] = None,
    priority: Annotated[str | None, typer.Option("--priority")] = None,
    labels: Annotated[
        list[str] | None, typer.Option("--label", help="Replace the label list.")
    ] = None,
    as_json: Annotated[bool, typer.Option("--json", help="Print JSON.")] = False,
) -> None:
    patch = {
        "title": title,
        "body": body,
        "status": status_name,
        "assignees": assignees,
        "due_date": _parse_due_date(due_date),
        "priority": priority,
        "labels": labels,
    }
    patch = {key: value for key, value in patch.items() if value is not None}
    if not patch:
        raise typer.BadParameter("Provide at least one update option.")
    _print(_request("PATCH", f"/api/issues/{issue_id}", json=patch), as_json)


@app.command("move")
def move_issue(
    issue_id: Annotated[str, typer.Argument(help="Issue UUID.")],
    status_name: Annotated[str, typer.Argument(help="Destination status name.")],
    as_json: Annotated[bool, typer.Option("--json", help="Print JSON.")] = False,
) -> None:
    _print(_request("PATCH", f"/api/issues/{issue_id}", json={"status": status_name}), as_json)


@app.command("delete")
def delete_issue(issue_id: Annotated[str, typer.Argument(help="Issue UUID.")]) -> None:
    _request("DELETE", f"/api/issues/{issue_id}")
    typer.echo("작업을 삭제했습니다.")


def main() -> None:
    app()
