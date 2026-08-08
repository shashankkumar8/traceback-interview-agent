import logging
from datetime import datetime, timezone
from app.config import settings
from app.interview.evaluator import generate_feedback
from app.interview.evidence import extract_evidence
from app.interview.question_strategy import (
    build_topic_queue,
    pick_opening_question,
    generate_next_question_llm,
)
from app.models.schemas import (
    AnswerDepth,
    InterviewResponse,
    InterviewStage,
    InterviewState,
    NextAction,
)
from app.services.candidate_profile import analyze_candidate

logger = logging.getLogger(__name__)


class InterviewEngine:
    def __init__(self, max_questions: int | None = None):
        self.max_questions = max_questions or settings.target_questions
        from app.llm.provider import get_llm_provider
        self.provider = get_llm_provider()

    async def start(self, state: InterviewState) -> InterviewResponse:
        profile = analyze_candidate(state.candidate)
        state.profile_summary = profile["summary"]
        state.topic_queue = build_topic_queue(profile, state.candidate)
        state.max_questions = self.max_questions
        state.interview_stage = InterviewStage.PROFILE_ANALYSIS

        from app.interview.question_strategy import generate_interview_plan
        state.internal_plan = generate_interview_plan(profile, state.candidate)

        name = state.candidate.member.name.split()[0]
        role = state.candidate.member.jobRole
        article = 'an' if role and role[0].lower() in 'aeiou' else 'a'

        state.interview_stage = InterviewStage.QUESTIONING
        topic = state.topic_queue.pop(0) if state.topic_queue else "RAG End-to-End & LLM API Basics"
        state.current_topic = topic
        question, dim = pick_opening_question(profile, topic)
        state.current_question = question
        state.question_history.append(question)
        state.question_count = 1
        state.mark_coverage(dim)
        state.competencies_tested.append(topic)

        reply = (
            f"Welcome, {name}. I'm TRACEBACK — I'll explore your understanding of the AI engineering "
            f"curriculum, tailored to your background as {article} {role}.\n\n{question}"
        )
        return InterviewResponse(reply=reply, done=False, progress=self._progress(state))

    async def process_message(self, state: InterviewState, message: str) -> InterviewResponse:
        if state.interview_stage == InterviewStage.COMPLETED:
            return InterviewResponse(
                reply="Interview completed.",
                done=True,
                feedback=await generate_feedback(state, self.provider),
                progress=self._progress(state),
            )

        state.answer_history.append(message)
        evidence = await extract_evidence(message, state.current_question, self.provider)
        # Tag evidence with the topic being tested at the time of this answer.
        evidence_topic = state.current_topic
        evidence.topic = evidence_topic
        evidence.probe_level = min(state.follow_up_count, 2)
        state.evidence.append(evidence)

        # Analyze answer using LLM
        from app.interview.evidence import analyze_answer
        analysis = await analyze_answer(message, state.current_question, self.provider)
        state.analyses.append(analysis)

        depth = evidence.depth
        action = self._decide_action(state, analysis)
        state.last_action = action

        if depth in (AnswerDepth.STRONG, AnswerDepth.EXPERT):
            state.strong_areas.append(state.current_topic)
            state.confidence = min(1.0, state.confidence + 0.1)
        elif depth in (AnswerDepth.SURFACE, AnswerDepth.UNKNOWN):
            state.weak_areas.append(state.current_topic)
            state.confidence = max(0.0, state.confidence - 0.08)

        # Completion: either reached finalize action, or max safety question count
        if action == NextAction.FINALIZE or state.question_count >= state.max_questions:
            return await self._complete(state)

        question = await self._next_question(state, action, message, evidence, depth)
        state.current_question = question
        state.question_history.append(question)
        state.question_count += 1

        return InterviewResponse(reply=question, done=False, progress=self._progress(state))

    def _decide_action(
        self, state: InterviewState, analysis: dict
    ) -> NextAction:
        if state.question_count >= state.max_questions:
            return NextAction.FINALIZE

        follow_up_needed = analysis.get("follow_up_needed", True)
        quality = analysis.get("quality", "weak")

        # TRACEBACK Signature Feature: Probe vague or incomplete answers
        if follow_up_needed and state.follow_up_count < 2:
            state.follow_up_count += 1
            state.interview_stage = InterviewStage.FOLLOW_UP
            return NextAction.FOLLOW_UP

        state.follow_up_count = 0
        state.interview_stage = InterviewStage.QUESTIONING

        # Conclude if we have evaluated at least 4 dimensions and have asked >= 6 questions
        explored = len(state.explored_dimensions())
        if explored >= 4 and state.question_count >= 6:
            return NextAction.FINALIZE

        return NextAction.CHANGE_TOPIC

    async def _next_question(
        self,
        state: InterviewState,
        action: NextAction,
        message: str,
        evidence,
        depth: AnswerDepth,
    ) -> str:
        profile = analyze_candidate(state.candidate)

        # Dynamic LLM questions generator with template fallback
        if self.provider and type(self.provider).__name__ != "MockLLMProvider":
            try:
                # Update current topic if changing topic
                if action == NextAction.CHANGE_TOPIC:
                    if state.topic_queue:
                        topic = state.topic_queue.pop(0)
                    else:
                        topic = "Chatbot Evaluation & Testing"
                    state.current_topic = topic
                    state.competencies_tested.append(topic)
                    _, dim = pick_opening_question(profile, topic)
                    state.mark_coverage(dim)

                question = await generate_next_question_llm(state, action, profile, self.provider)
                if question.strip() in state.question_history:
                    raise ValueError("Duplicate question generated")
                state.interview_stage = InterviewStage.QUESTIONING if action == NextAction.CHANGE_TOPIC else InterviewStage.FOLLOW_UP
                return question
            except Exception as e:
                logger.warning("LLM question generation failed, falling back to templates: %s", e)

        # Template fallback
        last_analysis = state.analyses[-1] if state.analyses else {}
        quality = last_analysis.get("quality", "weak")

        if action == NextAction.FOLLOW_UP:
            if quality == "weak":
                return f"Let's step back. Can you explain the basic definition or fundamental workflow of {state.current_topic}?"
            return (
                f"Can you go deeper on {state.current_topic}? "
                f"Specifically — what did you personally implement, and what outcome did you measure?"
            )

        if action == NextAction.DEEPER:
            return (
                f"That's a solid answer on {state.current_topic}. "
                f"What would break first at scale, and how would you mitigate it?"
            )

        if action == NextAction.CROSS_CHECK:
            return (
                f"Earlier you mentioned {', '.join(evidence.technologies[:2]) or 'that approach'}. "
                f"How would you validate it was working correctly in production?"
            )

        if state.topic_queue:
            topic = state.topic_queue.pop(0)
        else:
            topic = "Chatbot Evaluation & Testing"

        state.current_topic = topic
        state.competencies_tested.append(topic)
        question, dim = pick_opening_question(profile, topic)
        state.mark_coverage(dim)
        state.interview_stage = InterviewStage.QUESTIONING
        return question

    async def _complete(self, state: InterviewState) -> InterviewResponse:
        state.interview_stage = InterviewStage.COMPLETED
        state.completed_at = datetime.now(timezone.utc)
        feedback = await generate_feedback(state, self.provider)
        return InterviewResponse(
            reply="Interview completed.",
            done=True,
            feedback=feedback,
            progress=self._progress(state),
        )

    def _progress(self, state: InterviewState) -> dict:
        all_dims = [
            "Fundamentals", "Implementation", "Tradeoffs", "Debugging",
            "Production", "Security", "Evaluation", "System Design",
        ]
        return {
            "questionNumber": state.question_count,
            "totalQuestions": state.max_questions,
            "areasExplored": [
                {"name": d, "explored": state.coverage.get(d, False)} for d in all_dims
            ],
            "stage": state.interview_stage.value,
        }


