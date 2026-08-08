import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.storage.session_store import session_store

client = TestClient(app)

SAMPLE_CANDIDATE = {
    "member": {
        "id": "CAND-003",
        "name": "Emily Chen",
        "jobRole": "AI Engineer",
        "yearsExperience": 6,
        "education": "MS Artificial Intelligence",
        "status": "COMPLETED",
    },
    "missions": [
        {"day": 7, "title": "Embeddings Explained", "passed": True, "attempts": 1},
        {"day": 23, "title": "Model Context Protocol (MCP)", "passed": True, "attempts": 1},
    ],
    "signals": {"commitDays": 31, "missionsCompleted": 31, "missionsFirstTry": 30},
}


@pytest.fixture(autouse=True)
def clear_sessions():
    session_store.clear()
    yield
    session_store.clear()


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_start_interview():
    r = client.post("/api/interview", json={"sessionId": "test-1", "candidate": SAMPLE_CANDIDATE})
    assert r.status_code == 200
    data = r.json()
    assert data["done"] is False
    assert "reply" in data
    assert len(data["reply"]) > 10


def test_session_persistence():
    client.post("/api/interview", json={"sessionId": "test-2", "candidate": SAMPLE_CANDIDATE})
    r = client.post("/api/interview", json={"sessionId": "test-2", "message": "We used RAG with ChromaDB and evaluated with top-k retrieval."})
    assert r.status_code == 200
    assert r.json()["done"] is False


def test_missing_session():
    r = client.post("/api/interview", json={"sessionId": "missing", "message": "hello"})
    assert r.status_code == 404


def test_empty_message():
    client.post("/api/interview", json={"sessionId": "test-3", "candidate": SAMPLE_CANDIDATE})
    r = client.post("/api/interview", json={"sessionId": "test-3", "message": "   "})
    assert r.status_code == 422


def test_invalid_request():
    r = client.post("/api/interview", json={"sessionId": "test-4"})
    assert r.status_code == 422


def test_interview_completion():
    session_id = "test-complete"
    client.post("/api/interview", json={"sessionId": session_id, "candidate": SAMPLE_CANDIDATE})

    for i in range(12):
        r = client.post(
            "/api/interview",
            json={
                "sessionId": session_id,
                "message": (
                    f"We implemented RAG with vector search using ChromaDB, chunk size 512, "
                    f"top-k 5, measured latency at 200ms, and evaluated recall at 85%. "
                    f"I chose hybrid retrieval because of tradeoffs between SQL and semantic search. Turn {i}."
                ),
            },
        )
        if r.json().get("done"):
            break

    data = r.json()
    assert data["done"] is True
    assert data["reply"] == "Interview completed."
    feedback = data["feedback"]
    assert isinstance(feedback["summary"], str)
    assert isinstance(feedback["strengths"], list)
    assert isinstance(feedback["gaps"], list)
    assert isinstance(feedback["next"], list)
    assert len(feedback["summary"]) > 20


def test_surface_answer_gets_follow_up():
    session_id = "test-followup"
    client.post("/api/interview", json={"sessionId": session_id, "candidate": SAMPLE_CANDIDATE})
    r = client.post("/api/interview", json={"sessionId": session_id, "message": "Yes."})
    assert r.status_code == 200
    assert "deeper" in r.json()["reply"].lower() or "?" in r.json()["reply"]
