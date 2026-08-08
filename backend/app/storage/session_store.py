from __future__ import annotations

from threading import Lock
from app.models.schemas import InterviewState

_sessions: dict[str, InterviewState] = {}
_lock = Lock()


class SessionStore:
    def get(self, session_id: str) -> InterviewState | None:
        with _lock:
            return _sessions.get(session_id)

    def save(self, state: InterviewState) -> None:
        with _lock:
            _sessions[state.session_id] = state

    def delete(self, session_id: str) -> None:
        with _lock:
            _sessions.pop(session_id, None)

    def clear(self) -> None:
        with _lock:
            _sessions.clear()


session_store = SessionStore()
