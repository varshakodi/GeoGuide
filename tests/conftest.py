import pytest

from ai import pipeline


@pytest.fixture(autouse=True)
def isolated_retrieval_log(tmp_path, monkeypatch):
    """Tests use mocked retrievals; keep them out of the real retrieval log."""
    monkeypatch.setattr(pipeline, "LOG", tmp_path / "retrieval_log.jsonl")
