from __future__ import annotations

import re
from app.models.schemas import Candidate, InterviewState, NextAction


TOPIC_QUESTIONS: dict[str, list[dict]] = {
    "Embeddings & Vector Search": [
        {
            "q": "Walk me through how you converted text into embeddings in your project. What model did you use and why?",
            "dim": "Implementation",
            "topic": "Embeddings Explained",
        },
        {
            "q": "What tradeoffs did you consider when choosing between a local embedding model and an API-based one?",
            "dim": "Tradeoffs",
            "topic": "Vector Databases Overview",
        },
    ],
    "RAG & Retrieval": [
        {
            "q": "Describe your RAG pipeline end to end — from user query to final answer. Where does retrieval happen?",
            "dim": "System Design",
            "topic": "RAG End-to-End & LLM API Basics",
        },
        {
            "q": "How did you decide chunk size and overlap for your knowledge base? What happened when chunks were too large or too small?",
            "dim": "Implementation",
            "topic": "Building the Knowledge Base",
        },
        {
            "q": "When retrieval returned irrelevant context, how did you detect and handle it?",
            "dim": "Debugging",
            "topic": "The Retrieval & Matching Engine",
        },
    ],
    "LLM & Prompting": [
        {
            "q": "How did you structure your system prompt to keep answers grounded in retrieved context?",
            "dim": "Fundamentals",
            "topic": "Prompt Engineering Fundamentals",
        },
        {
            "q": "Tell me about a time you used function calling or structured outputs. What schema did you enforce and why?",
            "dim": "Implementation",
            "topic": "Advanced Prompting: Function Calling & Structured Outputs",
        },
    ],
    "Agents & MCP": [
        {
            "q": "You worked with agents or MCP in the curriculum — what problem did that solve that a single LLM call could not?",
            "dim": "Tradeoffs",
            "topic": "Model Context Protocol (MCP)",
        },
        {
            "q": "How did you decide which tools or MCP capabilities to expose, and how did you test tool selection?",
            "dim": "Evaluation",
            "topic": "Agentic Frameworks: LangChain Agents & Tool Use",
        },
    ],
    "Production & Security": [
        {
            "q": "What metrics would you monitor in production for a RAG chatbot, and what thresholds would concern you?",
            "dim": "Production",
            "topic": "Monitoring, Logging & Observability",
        },
        {
            "q": "How did you protect the chatbot against prompt injection or leaking sensitive data?",
            "dim": "Security",
            "topic": "Security, Privacy & Guardrails",
        },
        {
            "q": "How did you evaluate whether your chatbot answers were accurate and grounded before shipping?",
            "dim": "Evaluation",
            "topic": "Chatbot Evaluation & Testing",
        },
    ],
}


CLAIM_PROBES: list[tuple[str, list[str]]] = [
    (r"\brag\b", [
        "What was retrieved for a typical user question, and how did you decide top-k?",
        "How did you evaluate retrieval quality — any metric or test set?",
        "Why RAG instead of fine-tuning for your use case?",
    ]),
    (r"\bvector\s*(search|db|database|store)\b|\bpinecone\b|\bchroma\b|\bchromadb\b", [
        "What did your vector store give you that a simpler lookup would not?",
        "What retrieval metric or latency target did you monitor?",
        "Where in the retrieval pipeline was the bottleneck?",
    ]),
    (r"\bmcp\b|model context protocol", [
        "What tools did you expose through MCP and how did the client discover them?",
        "How did you handle MCP tool failures or timeouts?",
    ]),
    (r"\bagent(s)?\b|\bcrewai\b|\blanggraph\b|\blangchain\b", [
        "How did the agent decide which tool to call — can you walk through one trace?",
        "When would a single-agent design have been enough?",
    ]),
    (r"\bfine-?tun(e|ing)\b|\blora\b|\bqlora\b", [
        "What problem were you solving that prompting or RAG could not?",
        "How did you build and validate your fine-tuning dataset?",
    ]),
    (r"\bdocker\b|\bkubernetes\b|\bk8s\b", [
        "What did you containerize separately and why?",
        "How did you configure health checks and environment for the LLM service?",
    ]),
    (r"\beval(uation)?\b|\bmetric(s)?\b", [
        "Which specific metrics did you track and what were acceptable values?",
        "How did you build your evaluation dataset?",
    ]),
    (r"\bprompt(ing)?\b", [
        "Can you compare two prompt variants you tried and what differed in outcomes?",
        "How did you test for hallucinations or tone drift?",
    ]),
]


def build_topic_queue(profile: dict, candidate: Candidate) -> list[str]:
    queue = []
    module_topics = {
        "Embeddings & Vector Search": ["Embeddings Explained", "Vector Databases Overview"],
        "LLM Core, Prompting & Fine-Tuning": ["Prompt Engineering Fundamentals", "Advanced Prompting: Function Calling & Structured Outputs"],
        "Agentic AI & MCP": ["Model Context Protocol (MCP)", "Agentic Frameworks: LangChain Agents & Tool Use"],
        "Evaluation, Security & Deployment": ["Chatbot Evaluation & Testing", "Security, Privacy & Guardrails"],
        "Production & Capstone": ["Monitoring, Logging & Observability", "Production & Capstone"]
    }

    for area in profile.get("weak_areas", []):
        if area in module_topics:
            queue.extend(module_topics[area])
    for area in profile.get("skipped_areas", []):
        if area in module_topics:
            queue.extend(module_topics[area])
    for area in profile.get("strengths", []):
        if area in module_topics:
            queue.extend(module_topics[area])

    if not queue:
        queue = [
            "Embeddings Explained",
            "Prompt Engineering Fundamentals",
            "Model Context Protocol (MCP)",
            "Chatbot Evaluation & Testing"
        ]

    seen: set[str] = set()
    unique: list[str] = []
    for t in queue:
        key = t.lower()
        if key not in seen:
            seen.add(key)
            unique.append(t)
    return unique[:10]


def generate_interview_plan(profile: dict, candidate: Candidate) -> dict:
    competencies = ["Embeddings & Vector Search", "LLM Core, Prompting & Fine-Tuning", "Agentic AI & MCP", "Evaluation, Security & Deployment"]
    
    weak_areas = profile.get("weak_areas", [])
    strengths = profile.get("strengths", [])
    
    likely_follow_ups = []
    if "Embeddings & Vector Search" in weak_areas:
        likely_follow_ups.extend(["semantic similarity", "embedding dimensions", "similarity metrics"])
    if "Agentic AI & MCP" in weak_areas or "Agentic AI & MCP" in profile.get("skipped_areas", []):
        likely_follow_ups.extend(["tool failures", "agent recovery", "MCP server configuration"])
    if not likely_follow_ups:
        likely_follow_ups = ["system tradeoffs", "chunk overlap", "evaluation metrics"]

    return {
        "competencies": competencies,
        "difficulty": profile.get("difficulty", "mid"),
        "weak_areas": weak_areas,
        "strengths_to_validate": strengths,
        "likely_follow_ups": likely_follow_ups,
        "completion_condition": "Collect evidence on at least 4 competency dimensions with safety limits."
    }



def topic_to_area(topic: str) -> str:
    t = topic.lower()
    if any(k in t for k in ("embedding", "vector", "retrieval", "knowledge base")):
        return "RAG & Retrieval" if "retrieval" in t or "rag" in t else "Embeddings & Vector Search"
    if any(k in t for k in ("prompt", "function calling", "fine-tuning", "llm")):
        return "LLM & Prompting"
    if any(k in t for k in ("agent", "mcp", "orchestr")):
        return "Agents & MCP"
    if any(k in t for k in ("security", "docker", "kubernetes", "monitor", "evaluat", "production")):
        return "Production & Security"
    return "RAG & Retrieval"


def pick_opening_question(profile: dict, topic: str) -> tuple[str, str]:
    area = topic_to_area(topic)
    bank = TOPIC_QUESTIONS.get(area, TOPIC_QUESTIONS["RAG & Retrieval"])
    role = profile.get("role", "")
    difficulty = profile.get("difficulty", "mid")

    for item in bank:
        if topic.lower() in item["topic"].lower() or item["topic"].lower() in topic.lower():
            q = item["q"]
            if difficulty == "senior":
                q = q.replace("How did you", "In production, how did you")
            if "Intern" in role or "Junior" in role:
                q = q.replace("In production, ", "")
            return q, item["dim"]

    item = bank[0]
    return item["q"], item["dim"]


def find_claim_probe(answer: str, probe_level: int) -> str | None:
    lower = answer.lower()
    for pattern, probes in CLAIM_PROBES:
        if re.search(pattern, lower, re.I):
            idx = min(probe_level, len(probes) - 1)
            return probes[idx]
    return None


async def generate_next_question_llm(
    state: InterviewState,
    action: NextAction,
    profile: dict,
    provider
) -> str:
    from app.models.schemas import NextAction

    role = profile.get("role", "Software Engineer")
    years = profile.get("years", 0)
    summary = profile.get("summary", "")

    history_str = ""
    for q, a in zip(state.question_history, state.answer_history):
        history_str += f"Interviewer: {q}\n--- BEGIN CANDIDATE ANSWER ---\n{a}\n--- END CANDIDATE ANSWER ---\n\n"
    if len(state.question_history) > len(state.answer_history):
        history_str += f"Interviewer: {state.question_history[-1]}\n"

    action_instructions = {
        NextAction.FOLLOW_UP: (
            "Ask a targeted, direct follow-up question probing the candidate's last response. "
            "Inspect shallow understanding, request specific metrics, or ask them to explain a specific technology they claimed to use."
        ),
        NextAction.DEEPER: (
            "The candidate's last answer was solid. Ask a deeper scenario-based or tradeoff question "
            "on the current topic to explore the limits of their understanding (e.g. scaling limits, failure modes)."
        ),
        NextAction.CROSS_CHECK: (
            "Ask a question to cross-verify an earlier technology claim or decision they mentioned, and how they validated it in production."
        ),
        NextAction.CHANGE_TOPIC: (
            f"Move to the next topic: '{state.current_topic}'. Ask a clear, high-level implementation "
            "or architectural opening question tailored to their level."
        ),
        NextAction.FINALIZE: "Conclude the interview politely."
    }

    instruction = action_instructions.get(action, "Ask a technical question about the current topic.")

    system_prompt = (
        "You are TRACEBACK, an experienced senior staff engineer conducting a technical interview.\n"
        f"Candidate: {role} ({years} years experience).\n"
        f"Profile Summary: {summary}\n"
        "Style Guidelines:\n"
        "- Do not act like a generic chatbot. Be professional, direct, and conversational.\n"
        "- Probe technical claims with specificity.\n"
        "- Keep questions concise (max 2 sentences or 50 words).\n"
        "- Do NOT repeat previously asked questions.\n"
        "- Dive straight into the question without conversational filler (e.g. do not say 'That's interesting!', 'Great job!').\n"
    )

    if state.analyses:
        last_analysis = state.analyses[-1]
        quality = last_analysis.get("quality", "adequate")
        missing = ", ".join(last_analysis.get("missing_concepts", []))
        misconceptions = ", ".join(last_analysis.get("misconceptions", []))

        system_prompt += (
            f"\n[INTERNAL ANALYSIS OF LAST ANSWER]\n"
            f"Quality: {quality}\n"
            f"Missing concepts: {missing or 'none'}\n"
            f"Misconceptions: {misconceptions or 'none'}\n"
        )

        if quality == "weak":
            system_prompt += (
                "GUIDELINE: The candidate struggled or gave a surface-level response. "
                "Simplify/clarify, and probe basic fundamentals first to verify core understanding.\n"
            )
        elif quality == "strong":
            system_prompt += (
                "GUIDELINE: The candidate gave a strong response. "
                "Increase complexity! Ask deep technical design or tradeoff questions.\n"
            )

        if len(state.analyses) >= 2 and all(a.get("quality") == "weak" for a in state.analyses[-2:]):
            system_prompt += (
                "GUIDELINE: The candidate gave repeated vague/weak answers. "
                "Ask a concrete scenario or trade-off question to help them ground their answer.\n"
            )

    user_prompt = (
        f"Interview History so far:\n{history_str}\n"
        f"Goal/Instruction: {instruction}\n"
        f"Generate the next response/question."
    )

    try:
        reply = await provider.generate([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        return reply.strip()
    except Exception as exc:
        raise exc


