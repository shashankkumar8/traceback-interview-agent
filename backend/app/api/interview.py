import logging
from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from app.config import settings
from app.interview.engine import InterviewEngine
from app.models.schemas import Candidate, InterviewRequest, InterviewResponse, InterviewState
from app.storage.session_store import session_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["interview"])
engine = InterviewEngine()


@router.post("/interview", response_model=InterviewResponse)
async def interview_endpoint(body: InterviewRequest) -> InterviewResponse:
    session_id = body.sessionId

    if body.candidate is not None:
        if body.message is not None:
            raise HTTPException(
                status_code=422,
                detail="Request must include either candidate or message, not both",
            )

        try:
            candidate = Candidate.from_dict(body.candidate)
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail="Invalid candidate data") from exc

        existing = session_store.get(session_id)
        if existing and existing.interview_stage.value != "INITIALIZING":
            raise HTTPException(status_code=409, detail="Session already started")

        state = InterviewState(session_id=session_id, candidate=candidate)
        response = await engine.start(state)
        session_store.save(state)
        return response

    if body.message is not None:
        if not body.message.strip():
            raise HTTPException(status_code=422, detail="Message cannot be empty")
        if len(body.message) > settings.max_message_length:
            raise HTTPException(
                status_code=422,
                detail=f"Message exceeds maximum length of {settings.max_message_length}",
            )

        state = session_store.get(session_id)
        if not state:
            raise HTTPException(status_code=404, detail="Session not found. Start with candidate data.")

        if state.interview_stage.value == "COMPLETED":
            from app.interview.evaluator import generate_feedback
            return InterviewResponse(
                reply="Interview completed.",
                done=True,
                feedback=await generate_feedback(state, engine.provider),
                progress=engine._progress(state),
            )

        try:
            response = await engine.process_message(state, body.message.strip())
        except Exception as exc:
            logger.exception("Interview processing failed for session %s", session_id)
            raise HTTPException(status_code=500, detail="Failed to process interview turn") from exc

        session_store.save(state)
        return response

    raise HTTPException(
        status_code=422,
        detail="Request must include either candidate (start) or message (continue)",
    )

