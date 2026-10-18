from typer.testing import CliRunner

from ttodo import cli

runner = CliRunner()


def test_cli_lists_status_filter_as_json(monkeypatch):
    calls = []

    def fake_request(method, path, **kwargs):
        calls.append((method, path, kwargs))
        return [{"id": "issue-1", "title": "Write docs", "status": {"name": "Ready"}}]

    monkeypatch.setattr(cli, "_request", fake_request)
    result = runner.invoke(cli.app, ["list", "--status", "Ready", "--json"])

    assert result.exit_code == 0
    assert '"title": "Write docs"' in result.stdout
    assert calls[0][0:2] == ("GET", "/api/issues")
    assert calls[0][2]["params"] == {"status": "Ready"}


def test_cli_add_serializes_due_date_and_priority(monkeypatch):
    calls = []

    def fake_request(method, path, **kwargs):
        calls.append((method, path, kwargs))
        return {"id": "issue-1", "title": "Build API", "status": {"name": "Backlog"}}

    monkeypatch.setattr(cli, "_request", fake_request)
    result = runner.invoke(
        cli.app,
        [
            "add",
            "Build API",
            "--due-date",
            "2026-10-20",
            "--priority",
            "high",
            "--label",
            "assignment-7",
            "--json",
        ],
    )

    assert result.exit_code == 0
    assert calls[0][0:2] == ("POST", "/api/issues")
    assert calls[0][2]["json"]["due_date"] == "2026-10-20"
    assert calls[0][2]["json"]["priority"] == "high"
    assert calls[0][2]["json"]["labels"] == ["assignment-7"]


def test_cli_move_uses_api_status_name(monkeypatch):
    calls = []
    monkeypatch.setattr(
        cli, "_request", lambda method, path, **kw: calls.append((method, path, kw)) or {}
    )
    result = runner.invoke(cli.app, ["move", "issue-1", "In Progress", "--json"])

    assert result.exit_code == 0
    assert calls[0] == ("PATCH", "/api/issues/issue-1", {"json": {"status": "In Progress"}})


def test_cli_show_fetches_one_issue(monkeypatch):
    calls = []
    monkeypatch.setattr(
        cli, "_request", lambda method, path, **kw: calls.append((method, path, kw)) or {}
    )
    result = runner.invoke(cli.app, ["show", "issue-1", "--json"])

    assert result.exit_code == 0
    assert calls[0] == ("GET", "/api/issues/issue-1", {})
