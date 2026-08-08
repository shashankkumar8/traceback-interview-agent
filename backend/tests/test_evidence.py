import pytest
from app.interview.evidence import classify_depth, extract_evidence
from app.models.schemas import AnswerDepth


def test_surface_answer():
    assert classify_depth("I used RAG.") == AnswerDepth.SURFACE


def test_strong_answer():
    text = (
        "We built a RAG pipeline with ChromaDB, chunk size 512, top-k 5, "
        "measured latency at 200ms and recall at 85%. We chose hybrid retrieval "
        "because of tradeoffs between SQL and vector search."
    )
    depth = classify_depth(text)
    assert depth in (AnswerDepth.STRONG, AnswerDepth.EXPERT, AnswerDepth.WORKING)


@pytest.mark.anyio
async def test_extract_technologies():
    ev = await extract_evidence("We used Pinecone for vector search and FastAPI for the API.")
    assert "pinecone" in [t.lower() for t in ev.technologies] or any("vector" in t for t in ev.technologies)

