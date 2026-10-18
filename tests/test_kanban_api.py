from fastapi.testclient import TestClient

from ttodo.api import create_app

STATUSES = [
    {"id": "status-backlog", "name": "Backlog", "sort_order": 0},
    {"id": "status-ready", "name": "Ready", "sort_order": 1},
    {"id": "status-progress", "name": "In Progress", "sort_order": 2},
    {"id": "status-done", "name": "Done", "sort_order": 3},
]


class FakeRepository:
    def __init__(self):
        self.issues = []

    def list_statuses(self):
        return STATUSES

    def get_status(self, name_or_id):
        return next(
            (item for item in STATUSES if item["id"] == name_or_id or item["name"] == name_or_id),
            None,
        )

    def list_issues(self, status_id=None, limit=100):
        result = [
            issue for issue in self.issues if not status_id or issue["status_id"] == status_id
        ]
        return result[:limit]

    def get_issue(self, issue_id):
        return next((issue for issue in self.issues if issue["id"] == issue_id), None)

    def normalize_issue(self, issue):
        status = next(item for item in STATUSES if item["id"] == issue["status_id"])
        return {
            "id": issue["id"],
            "title": issue["title"],
            "body": issue.get("body"),
            "status": status,
            "status_id": issue["status_id"],
            "due_date": issue.get("due_date"),
            "priority": issue.get("priority"),
            "labels": issue.get("labels", []),
            "assignees": issue.get("assignees", []),
            "created_at": issue.get("created_at"),
            "closed_at": issue.get("closed_at"),
        }

    def create_issue(self, payload, actor):
        issue = {
            "id": f"issue-{len(self.issues) + 1}",
            "created_at": "2026-10-19T00:00:00",
            **payload,
        }
        issue["assignees"] = payload.get("assignees", [])
        issue["labels"] = payload.get("labels", [])
        issue["priority"] = payload.get("priority")
        self.issues.append(issue)
        return self.normalize_issue(issue)

    def update_issue(self, issue_id, patch, actor):
        issue = self.get_issue(issue_id)
        if not issue:
            return None
        issue.update(patch)
        return self.normalize_issue(issue)

    def delete_issue(self, issue_id):
        issue = self.get_issue(issue_id)
        if not issue:
            return False
        self.issues.remove(issue)
        return True


def make_client():
    repository = FakeRepository()
    return TestClient(create_app(repository=repository)), repository


def test_statuses_and_board_are_readable():
    client, _ = make_client()
    assert [row["name"] for row in client.get("/api/statuses").json()] == [
        "Backlog",
        "Ready",
        "In Progress",
        "Done",
    ]
    board = client.get("/api/board").json()
    assert board["name"] == "Team 5 study mate"
    assert [column["issues"] for column in board["columns"]] == [[], [], [], []]


def test_create_list_and_filter_issue():
    client, _ = make_client()
    response = client.post(
        "/api/issues",
        json={
            "title": "Build the backend",
            "status": "Ready",
            "due_date": "2026-10-20",
            "assignees": ["Yejin"],
            "labels": ["assignment-7"],
            "priority": "high",
        },
    )
    assert response.status_code == 201
    created = response.json()
    assert created["status"]["name"] == "Ready"
    assert created["due_date"] == "2026-10-20"
    assert created["assignees"] == ["Yejin"]
    assert created["priority"] == "high"
    assert client.get("/api/issues?status=Ready").json()[0]["id"] == created["id"]
    assert (
        client.get("/api/board").json()["columns"][1]["issues"][0]["title"] == "Build the backend"
    )


def test_create_validates_status_and_required_fields():
    client, _ = make_client()
    assert (
        client.post("/api/issues", json={"title": "Bad status", "status": "Unknown"}).status_code
        == 404
    )
    assert client.post("/api/issues", json={"title": ""}).status_code == 422


def test_update_move_close_and_delete_issue():
    client, _ = make_client()
    issue = client.post("/api/issues", json={"title": "Draft docs"}).json()
    moved = client.patch(
        f"/api/issues/{issue['id']}", json={"status": "In Progress", "title": "Write docs"}
    )
    assert moved.status_code == 200
    assert moved.json()["title"] == "Write docs"
    assert moved.json()["status"]["name"] == "In Progress"
    done = client.patch(f"/api/issues/{issue['id']}", json={"status": "Done"})
    assert done.status_code == 200
    assert done.json()["closed_at"]
    assert client.delete(f"/api/issues/{issue['id']}").status_code == 204
    assert client.delete(f"/api/issues/{issue['id']}").status_code == 404


def test_empty_patch_and_invalid_filter_are_rejected():
    client, _ = make_client()
    issue = client.post("/api/issues", json={"title": "Task"}).json()
    assert client.patch(f"/api/issues/{issue['id']}", json={}).status_code == 422
    assert client.get("/api/issues?status=No%20column").status_code == 404
