from typing import Any

import httpx

ISSUE_SELECT = (
    "id,title,body,status_id,milestone_id,parent_issue_id,due_date,created_at,closed_at,"
    "statuses(id,name,sort_order),"
    "issue_assignees(user_id,users(id,username)),"
    "issue_labels(label_id,labels(id,name,color))"
)


class RepositoryError(RuntimeError):
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code


class SupabaseRepository:
    """PostgREST access to the existing issues, statuses, users, and labels tables."""

    def __init__(self, url: str, key: str, transport: httpx.BaseTransport | None = None):
        headers = {"apikey": key}
        if not key.startswith(("sb_secret_", "sb_publishable_")):
            headers["Authorization"] = f"Bearer {key}"
        self._client = httpx.Client(
            base_url=f"{url.rstrip('/')}/rest/v1",
            headers=headers,
            timeout=httpx.Timeout(10.0, connect=5.0),
            transport=transport,
        )

    def close(self) -> None:
        self._client.close()

    def _request(self, method: str, table: str, **kwargs: Any) -> Any:
        try:
            response = self._client.request(method, f"/{table}", **kwargs)
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            message = "Supabase rejected the request. Check the table schema, key, and permissions."
            try:
                detail = exc.response.json().get("message")
                if detail:
                    message = str(detail)
            except (ValueError, AttributeError):
                pass
            raise RepositoryError(exc.response.status_code, message) from exc
        except httpx.HTTPError as exc:
            raise RepositoryError(503, "Could not connect to Supabase.") from exc
        if response.status_code == 204 or not response.content:
            return None
        return response.json()

    def list_statuses(self) -> list[dict[str, Any]]:
        return self._request(
            "GET", "statuses", params={"select": "id,name,sort_order", "order": "sort_order.asc"}
        )

    def get_status(self, status_name_or_id: str) -> dict[str, Any] | None:
        for column in ("id", "name"):
            rows = self._request(
                "GET",
                "statuses",
                params={
                    "select": "id,name,sort_order",
                    column: f"eq.{status_name_or_id}",
                    "limit": "1",
                },
            )
            if rows:
                return rows[0]
        return None

    def list_issues(self, status_id: str | None = None, limit: int = 100) -> list[dict[str, Any]]:
        params: dict[str, str] = {
            "select": ISSUE_SELECT,
            "order": "created_at.desc",
            "limit": str(limit),
        }
        if status_id:
            params["status_id"] = f"eq.{status_id}"
        return self._request("GET", "issues", params=params)

    def get_issue(self, issue_id: str) -> dict[str, Any] | None:
        rows = self._request(
            "GET", "issues", params={"select": ISSUE_SELECT, "id": f"eq.{issue_id}", "limit": "1"}
        )
        return rows[0] if rows else None

    def _get_or_create_user(self, username: str) -> str:
        username = username.strip()
        rows = self._request(
            "GET",
            "users",
            params={"select": "id,username", "username": f"eq.{username}", "limit": "1"},
        )
        if rows:
            return rows[0]["id"]
        created = self._request(
            "POST",
            "users",
            json={"username": username},
            headers={"Prefer": "return=representation"},
        )
        return created[0]["id"]

    def _get_or_create_label(self, name: str) -> str:
        name = name.strip()
        rows = self._request(
            "GET", "labels", params={"select": "id,name", "name": f"eq.{name}", "limit": "1"}
        )
        if rows:
            return rows[0]["id"]
        color = {
            "priority:low": "#64748b",
            "priority:medium": "#0ea5e9",
            "priority:high": "#ef4444",
        }.get(name, "#64748b")
        created = self._request(
            "POST",
            "labels",
            json={"name": name, "color": color},
            headers={"Prefer": "return=representation"},
        )
        return created[0]["id"]

    def _set_assignees(self, issue_id: str, assignees: list[str]) -> None:
        current = self._request(
            "GET", "issue_assignees", params={"select": "user_id", "issue_id": f"eq.{issue_id}"}
        )
        wanted = {self._get_or_create_user(name) for name in assignees if name.strip()}
        existing = {row["user_id"] for row in current}
        for user_id in wanted - existing:
            self._request(
                "POST",
                "issue_assignees",
                json={"issue_id": issue_id, "user_id": user_id},
                headers={"Prefer": "return=minimal"},
            )
        for user_id in existing - wanted:
            self._request(
                "DELETE",
                "issue_assignees",
                params={"issue_id": f"eq.{issue_id}", "user_id": f"eq.{user_id}"},
                headers={"Prefer": "return=minimal"},
            )

    def _set_labels(self, issue_id: str, names: list[str]) -> None:
        current = self._request(
            "GET", "issue_labels", params={"select": "label_id", "issue_id": f"eq.{issue_id}"}
        )
        existing = {row["label_id"] for row in current}
        wanted = {self._get_or_create_label(name) for name in names if name.strip()}
        for label_id in wanted - existing:
            self._request(
                "POST",
                "issue_labels",
                json={"issue_id": issue_id, "label_id": label_id},
                headers={"Prefer": "return=minimal"},
            )
        for label_id in existing - wanted:
            self._request(
                "DELETE",
                "issue_labels",
                params={"issue_id": f"eq.{issue_id}", "label_id": f"eq.{label_id}"},
                headers={"Prefer": "return=minimal"},
            )

    def _record_status_change(
        self, issue_id: str, from_status: str | None, to_status: str, actor: str
    ) -> None:
        user_id = self._get_or_create_user(actor)
        self._request(
            "POST",
            "status_history",
            json={
                "issue_id": issue_id,
                "from_status_id": from_status,
                "to_status_id": to_status,
                "changed_by": user_id,
            },
            headers={"Prefer": "return=minimal"},
        )

    @staticmethod
    def normalize_issue(issue: dict[str, Any]) -> dict[str, Any]:
        label_names = [
            relation["labels"]["name"]
            for relation in issue.get("issue_labels") or []
            if relation.get("labels") and relation["labels"].get("name")
        ]
        assignees = [
            relation["users"]["username"]
            for relation in issue.get("issue_assignees") or []
            if relation.get("users") and relation["users"].get("username")
        ]
        priority = next(
            (name.split(":", 1)[1] for name in label_names if name.startswith("priority:")), None
        )
        return {
            "id": issue["id"],
            "title": issue["title"],
            "body": issue.get("body"),
            "status": issue.get("statuses"),
            "status_id": issue["status_id"],
            "milestone_id": issue.get("milestone_id"),
            "parent_issue_id": issue.get("parent_issue_id"),
            "due_date": issue.get("due_date"),
            "priority": priority,
            "labels": sorted(name for name in label_names if not name.startswith("priority:")),
            "assignees": sorted(assignees),
            "created_at": issue.get("created_at"),
            "closed_at": issue.get("closed_at"),
        }

    def create_issue(self, payload: dict[str, Any], actor: str) -> dict[str, Any]:
        payload = payload.copy()
        assignees = payload.pop("assignees", [])
        labels = payload.pop("labels", [])
        priority = payload.pop("priority", None)
        issue_payload = {key: value for key, value in payload.items() if value is not None}
        created = self._request(
            "POST", "issues", json=issue_payload, headers={"Prefer": "return=representation"}
        )[0]
        issue_id = created["id"]
        try:
            self._record_status_change(issue_id, None, created["status_id"], actor)
            self._set_assignees(issue_id, assignees)
            self._set_labels(issue_id, labels + ([f"priority:{priority}"] if priority else []))
        except RepositoryError:
            self._request(
                "DELETE",
                "issues",
                params={"id": f"eq.{issue_id}"},
                headers={"Prefer": "return=minimal"},
            )
            raise
        return self.normalize_issue(self.get_issue(issue_id) or created)

    def update_issue(
        self, issue_id: str, patch: dict[str, Any], actor: str
    ) -> dict[str, Any] | None:
        current = self.get_issue(issue_id)
        if not current:
            return None
        patch = patch.copy()
        current_status = current.get("status_id")
        assignees = patch.pop("assignees", None)
        labels = patch.pop("labels", None)
        has_priority = "priority" in patch
        priority = patch.pop("priority", None)
        if labels is not None or has_priority:
            current_labels = [
                relation["labels"]["name"]
                for relation in current.get("issue_labels", [])
                if relation.get("labels") and not relation["labels"]["name"].startswith("priority:")
            ]
            current_priority = next(
                (
                    relation["labels"]["name"].split(":", 1)[1]
                    for relation in current.get("issue_labels", [])
                    if relation.get("labels") and relation["labels"]["name"].startswith("priority:")
                ),
                None,
            )
            labels = current_labels if labels is None else labels
            if not has_priority:
                priority = current_priority
            self._set_labels(issue_id, labels + ([f"priority:{priority}"] if priority else []))
        if assignees is not None:
            self._set_assignees(issue_id, assignees)
        updates = patch.copy()
        if updates:
            self._request(
                "PATCH",
                "issues",
                params={"id": f"eq.{issue_id}"},
                json=updates,
                headers={"Prefer": "return=minimal"},
            )
        new_status = updates.get("status_id", current_status)
        if new_status != current_status:
            self._record_status_change(issue_id, current_status, new_status, actor)
        refreshed = self.get_issue(issue_id)
        return self.normalize_issue(refreshed) if refreshed else None

    def delete_issue(self, issue_id: str) -> bool:
        rows = self._request(
            "DELETE",
            "issues",
            params={"id": f"eq.{issue_id}", "select": "id"},
            headers={"Prefer": "return=representation"},
        )
        return bool(rows)
