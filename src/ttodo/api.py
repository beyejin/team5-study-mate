from collections.abc import Callable
from datetime import UTC, date, datetime
from typing import Any, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response, status
from pydantic import BaseModel, ConfigDict, Field

from ttodo.config import Settings
from ttodo.repository import RepositoryError, SupabaseRepository


class IssueCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    body: str | None = Field(default=None, max_length=5000)
    status: str = "Backlog"
    due_date: date | None = None
    assignees: list[str] = Field(default_factory=list)
    labels: list[str] = Field(default_factory=list)
    priority: Literal["low", "medium", "high"] | None = None
    milestone_id: str | None = None
    parent_issue_id: str | None = None


class IssueUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = Field(default=None, max_length=5000)
    status: str | None = None
    due_date: date | None = None
    assignees: list[str] | None = None
    labels: list[str] | None = None
    priority: Literal["low", "medium", "high"] | None = None
    milestone_id: str | None = None
    parent_issue_id: str | None = None


def create_app(
    repository: SupabaseRepository | None = None,
    settings_loader: Callable[[], Settings] = Settings.from_env,
) -> FastAPI:
    app = FastAPI(
        title="Team 5 Kanban API",
        description="Local API and CLI for Team 5's shared issues database.",
        version="0.1.0",
    )
    app.state.repository = repository
    app.state.settings_loader = settings_loader

    def repo(request: Request) -> SupabaseRepository:
        if request.app.state.repository is None:
            try:
                config = request.app.state.settings_loader()
            except RuntimeError as exc:
                raise HTTPException(status_code=503, detail=str(exc)) from exc
            request.app.state.repository = SupabaseRepository(
                config.supabase_url, config.supabase_key
            )
        return request.app.state.repository

    def call(operation: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        try:
            return operation(*args, **kwargs)
        except RepositoryError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/statuses")
    def list_statuses(repository: SupabaseRepository = Depends(repo)) -> list[dict[str, Any]]:
        return call(repository.list_statuses)

    @app.get("/api/board")
    def get_board(repository: SupabaseRepository = Depends(repo)) -> dict[str, Any]:
        statuses = call(repository.list_statuses)
        issues = [
            repository.normalize_issue(issue) for issue in call(repository.list_issues, None, 500)
        ]
        return {
            "name": "Team 5 study mate",
            "source_url": "https://github.com/users/beyejin/projects/1",
            "columns": [
                {
                    **board_status,
                    "issues": [
                        issue for issue in issues if issue.get("status_id") == board_status["id"]
                    ],
                }
                for board_status in statuses
            ],
        }

    @app.get("/api/issues")
    def list_issues(
        status_name: str | None = Query(default=None, alias="status"),
        limit: int = Query(default=100, ge=1, le=500),
        repository: SupabaseRepository = Depends(repo),
    ) -> list[dict[str, Any]]:
        status_id = None
        if status_name:
            board_status = call(repository.get_status, status_name)
            if not board_status:
                raise HTTPException(status_code=404, detail="Status not found")
            status_id = board_status["id"]
        return [
            repository.normalize_issue(issue)
            for issue in call(repository.list_issues, status_id, limit)
        ]

    @app.post("/api/issues", status_code=status.HTTP_201_CREATED)
    def create_issue(
        issue: IssueCreate,
        actor: str = Header(default="Codex", alias="X-Actor", max_length=80),
        repository: SupabaseRepository = Depends(repo),
    ) -> dict[str, Any]:
        board_status = call(repository.get_status, issue.status)
        if not board_status:
            raise HTTPException(status_code=404, detail="Status not found")
        payload = issue.model_dump(mode="json", exclude={"status"}, exclude_none=True)
        payload["status_id"] = board_status["id"]
        return call(repository.create_issue, payload, actor)

    @app.get("/api/issues/{issue_id}")
    def get_issue(issue_id: str, repository: SupabaseRepository = Depends(repo)) -> dict[str, Any]:
        issue = call(repository.get_issue, issue_id)
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        return repository.normalize_issue(issue)

    @app.patch("/api/issues/{issue_id}")
    def update_issue(
        issue_id: str,
        patch: IssueUpdate,
        actor: str = Header(default="Codex", alias="X-Actor", max_length=80),
        repository: SupabaseRepository = Depends(repo),
    ) -> dict[str, Any]:
        current = call(repository.get_issue, issue_id)
        if not current:
            raise HTTPException(status_code=404, detail="Issue not found")
        updates = patch.model_dump(mode="json", exclude_unset=True)
        if not updates:
            raise HTTPException(status_code=422, detail="Provide at least one field to update")
        if "status" in updates:
            requested_status = updates.pop("status")
            if not requested_status:
                raise HTTPException(status_code=422, detail="Status cannot be empty")
            board_status = call(repository.get_status, requested_status)
            if not board_status:
                raise HTTPException(status_code=404, detail="Status not found")
            updates["status_id"] = board_status["id"]
            if board_status["name"].casefold() == "done":
                updates["closed_at"] = datetime.now(UTC).replace(tzinfo=None).isoformat()
            else:
                updates["closed_at"] = None
        updated = call(repository.update_issue, issue_id, updates, actor)
        if not updated:
            raise HTTPException(status_code=404, detail="Issue not found")
        return updated

    @app.delete("/api/issues/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_issue(issue_id: str, repository: SupabaseRepository = Depends(repo)) -> Response:
        if not call(repository.delete_issue, issue_id):
            raise HTTPException(status_code=404, detail="Issue not found")
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    return app


app = create_app()
