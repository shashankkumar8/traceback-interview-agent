from __future__ import annotations

from app.models.schemas import InterviewState

_sessions: dict[str, InterviewState] = {}


class SessionStore:
    def get(self, session_id: str) -> InterviewState | None:
        return _sessions.get(session_id)

    def save(self, state: InterviewState) -> None:
        _sessions[state.session_id] = state

    def delete(self, session_id: str) -> None:
        _sessions.pop(session_id, None)

    def clear(self) -> None:
        _sessions.clear()


session_store = SessionStore()
