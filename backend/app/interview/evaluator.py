import json
import logging
from app.models.schemas import AnswerDepth, Feedback, InterviewState
from app.llm.provider import LLMProvider

logger = logging.getLogger(__name__)


def _depth_score(depth: AnswerDepth) -> int:
    return {
        AnswerDepth.UNKNOWN: 0,
        AnswerDepth.SURFACE: 1,
        AnswerDepth.WORKING: 2,
        AnswerDepth.STRONG: 3,
        AnswerDepth.EXPERT: 4,
    }[depth]


def generate_feedback_rules(state: InterviewState) -> Feedback:
    name = state.candidate.member.name
    role = state.candidate.member.jobRole

    strengths: list[str] = []
    gaps: list[str] = []

    strong_topics: dict[str, int] = {}
    weak_topics: dict[str, int] = {}

    for ev in state.evidence:
        topic = state.current_topic or "general"
        score = _depth_score(ev.depth)
        if score >= 3:
            strong_topics[topic] = strong_topics.get(topic, 0) + 1
            if ev.technologies:
                strengths.append(
                    f"Showed {ev.depth.value.lower()} understanding of {', '.join(ev.technologies[:3])} "
                    f"with concrete detail."
                )
        elif score <= 1:
            weak_topics[topic] = weak_topics.get(topic, 0) + 1

    if state.strong_areas:
        for area in state.strong_areas[:3]:
            if area not in [s[:40] for s in strengths]:
                strengths.append(f"Demonstrated solid knowledge in {area}.")

    if state.weak_areas:
        for area in state.weak_areas[:3]:
            gaps.append(f"Answers on {area} lacked implementation detail or measurable outcomes.")

    explored = state.explored_dimensions()
    all_dims = [
        "Fundamentals", "Implementation", "Tradeoffs", "Debugging",
        "Production", "Security", "Evaluation", "System Design",
    ]
    for dim in all_dims:
        if dim not in explored:
            gaps.append(f"Limited evidence collected for {dim.lower()}.")

    if not strengths:
        strengths.append("Engaged with technical topics across the AI engineering curriculum.")
    if not gaps:
        gaps.append("Some areas could benefit from more specific metrics and production examples.")

    strengths = list(dict.fromkeys(strengths))[:4]
    gaps = list(dict.fromkeys(gaps))[:4]

    next_steps = [
        "Practice explaining one RAG pipeline end-to-end with retrieval metrics and failure modes.",
        "Prepare concrete examples with numbers: latency targets, chunk sizes, evaluation scores.",
        "Review skipped or weak curriculum areas and be ready to discuss tradeoffs.",
        f"Tailor depth to {role} expectations — connect tools to business outcomes.",
    ]

    depth_counts = {_depth_score(e.depth) for e in state.evidence}
    avg = sum(depth_counts) / len(depth_counts) if depth_counts else 1

    summary = (
        f"{name} completed a {state.question_count}-question TRACEBACK interview for a {role} profile. "
        f"Evidence spanned {len(explored)} competency dimensions"
        f" ({', '.join(explored[:4])}{'...' if len(explored) > 4 else ''}). "
    )
    if avg >= 3:
        summary += "Several answers showed strong practical depth with technologies and tradeoffs articulated clearly."
    elif avg >= 2:
        summary += "Answers demonstrated working familiarity but often stopped short of production-level specifics."
    else:
        summary += "Many responses remained surface-level; deeper implementation and evaluation detail would strengthen the profile."

    return Feedback(summary=summary, strengths=strengths, gaps=gaps, next=next_steps[:4])


async def generate_feedback(state: InterviewState, provider: LLMProvider | None = None) -> Feedback:
    if not provider or type(provider).__name__ == "MockLLMProvider":
        return generate_feedback_rules(state)

    name = state.candidate.member.name
    role = state.candidate.member.jobRole

    history_str = ""
    for q, a, ev in zip(state.question_history, state.answer_history, state.evidence):
        history_str += f"Q: {q}\nA: {a}\nEvidence extracted (technologies: {ev.technologies}, metrics: {ev.metrics}, depth: {ev.depth.value})\n\n"

    system_prompt = (
        "You are a senior technical interviewer. Evaluate the candidate's performance across the entire interview session. "
        "Create structured, professional feedback returned as a JSON object matching this schema:\n"
        "{\n"
        "  \"summary\": \"Detailed summary paragraph analyzing their performance, communication style, depth of understanding, and overall readiness.\",\n"
        "  \"strengths\": [\"list of 3-4 specific technical strengths shown with details\"],\n"
        "  \"gaps\": [\"list of 2-4 specific technical areas where they lacked detail, skipped questions, or gave surface-level answers\"],\n"
        "  \"next\": [\"list of 3-4 concrete next steps or practice recommendations (e.g. read about X, build a prototype with Y)\"]\n"
        "}\n"
        "Only return the raw JSON object, no markdown blocks, no other text."
    )

    user_prompt = (
        f"Candidate: {name}\nRole: {role}\n\n"
        f"Interview Logs:\n{history_str}"
    )

    try:
        response_text = await provider.generate([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        content = response_text.strip()
        if content.startswith("```"):
            content = content.split("```", 1)[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.rsplit("```", 1)[0].strip()
        data = json.loads(content)

        return Feedback(
            summary=data.get("summary", ""),
            strengths=data.get("strengths", [])[:4],
            gaps=data.get("gaps", [])[:4],
            next=data.get("next", [])[:4]
        )
    except Exception as exc:
        logger.warning("LLM feedback generation failed, falling back to rules: %s", exc)
        return generate_feedback_rules(state)

