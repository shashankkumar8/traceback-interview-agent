import json
import logging
import re
from app.models.schemas import AnswerDepth, EvidenceItem
from app.llm.provider import LLMProvider

logger = logging.getLogger(__name__)

TECH_PATTERNS = [
    r"\brag\b", r"\bllm\b", r"\bembedding(s)?\b", r"\bvector\b", r"\bchroma(db)?\b",
    r"\bpinecone\b", r"\bmcp\b", r"\blangchain\b", r"\bfastapi\b", r"\bdocker\b",
    r"\bkubernetes\b", r"\bprompt(ing)?\b", r"\bfine-?tun(e|ing)\b", r"\blora\b",
    r"\bagent(s)?\b", r"\bcrewai\b", r"\blanggraph\b", r"\bsqlite\b", r"\bpandas\b",
    r"\bopenai\b", r"\bollama\b", r"\bgroq\b", r"\bpydantic\b", r"\bstreamlit\b",
    r"\breact\b", r"\bhybrid\b", r"\bretriev(al|e)\b",
]

METRIC_PATTERNS = [
    r"\blatency\b", r"\baccuracy\b", r"\bprecision\b", r"\brecall\b", r"\bf1\b",
    r"\b\d+\s*ms\b", r"\b\d+%\b", r"\btop-?k\b", r"\bchunk\s*size\b", r"\boverlap\b",
    r"\btoken(s)?\b", r"\bcost\b", r"\bthroughput\b",
]

TRADEOFF_PATTERNS = [
    r"\btrade-?off\b", r"\binstead of\b", r"\brather than\b", r"\bpros and cons\b",
    r"\bchose\b", r"\bdecided\b", r"\bbecause\b", r"\bvs\.?\b", r"\bversus\b",
]


def _find_matches(text: str, patterns: list[str]) -> list[str]:
    found: list[str] = []
    lower = text.lower()
    for p in patterns:
        for m in re.finditer(p, lower, re.I):
            word = m.group(0).strip()
            if word and word not in found:
                found.append(word)
    return found


def classify_depth(answer: str) -> AnswerDepth:
    text = answer.strip()
    if not text:
        return AnswerDepth.UNKNOWN

    words = len(text.split())
    techs = _find_matches(text, TECH_PATTERNS)
    metrics = _find_matches(text, METRIC_PATTERNS)
    tradeoffs = _find_matches(text, TRADEOFF_PATTERNS)

    if len(text) < 15 and not techs:
        return AnswerDepth.UNKNOWN

    score = 0
    if words >= 30:
        score += 1
    if words >= 80:
        score += 1
    if techs:
        score += 1
    if metrics:
        score += 1
    if tradeoffs:
        score += 1
    if any(k in text.lower() for k in ("implemented", "built", "deployed", "measured", "tested")):
        score += 1

    if score >= 5:
        return AnswerDepth.EXPERT
    if score >= 4:
        return AnswerDepth.STRONG
    if score >= 2:
        return AnswerDepth.WORKING
    if score >= 1:
        return AnswerDepth.SURFACE
    return AnswerDepth.UNKNOWN


def extract_evidence_rules(answer: str, question: str = "") -> EvidenceItem:
    depth = classify_depth(answer)
    technologies = _find_matches(answer, TECH_PATTERNS)
    metrics = _find_matches(answer, METRIC_PATTERNS)
    tradeoffs = _find_matches(answer, TRADEOFF_PATTERNS)

    claim = answer.strip()[:200] if answer else ""
    ownership = "first-person" if re.search(r"\b(i|we|my|our)\b", answer, re.I) else "unclear"

    decisions: list[str] = []
    for phrase in ("chose", "decided", "selected", "used because"):
        if phrase in answer.lower():
            decisions.append(phrase)

    return EvidenceItem(
        claim=claim,
        technologies=technologies,
        decisions=decisions,
        metrics=metrics,
        tradeoffs=tradeoffs,
        ownership=ownership,
        depth=depth,
    )


async def extract_evidence(answer: str, question: str = "", provider: LLMProvider | None = None) -> EvidenceItem:
    if not provider or type(provider).__name__ == "MockLLMProvider":
        return extract_evidence_rules(answer, question)

    system_prompt = (
        "You are a senior technical interviewer. Analyze the candidate's answer to the given question. "
        "Extract the evidence as a JSON object matching this schema:\n"
        "{\n"
        "  \"claim\": \"Short summary of the candidate's main point (max 100 chars)\",\n"
        "  \"technologies\": [\"list of specific tools/frameworks mentioned\"],\n"
        "  \"decisions\": [\"key design choices or justifications made\"],\n"
        "  \"metrics\": [\"numerical metrics or specific performance indicators mentioned\"],\n"
        "  \"tradeoffs\": [\"tradeoffs or alternatives considered\"],\n"
        "  \"ownership\": \"first-person or unclear\",\n"
        "  \"depth\": \"UNKNOWN, SURFACE, WORKING, STRONG, or EXPERT\"\n"
        "}\n"
        "Only return the raw JSON object, no markdown blocks, no other text."
    )
    user_prompt = f"Question: {question}\nCandidate Answer: {answer}"

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

        depth_str = data.get("depth", "UNKNOWN").upper()
        if depth_str not in AnswerDepth.__members__:
            depth_str = "UNKNOWN"

        return EvidenceItem(
            claim=data.get("claim", "")[:200],
            technologies=data.get("technologies", []),
            decisions=data.get("decisions", []),
            metrics=data.get("metrics", []),
            tradeoffs=data.get("tradeoffs", []),
            ownership=data.get("ownership", "unclear"),
            depth=AnswerDepth(depth_str)
        )
    except Exception as exc:
        logger.warning("LLM evidence extraction failed, falling back to rules: %s", exc)
        return extract_evidence_rules(answer, question)


def analyze_answer_rules(answer: str, question: str) -> dict:
    depth = classify_depth(answer)
    quality = "weak"
    if depth in (AnswerDepth.STRONG, AnswerDepth.EXPERT):
        quality = "strong"
    elif depth == AnswerDepth.WORKING:
        quality = "adequate"

    return {
        "quality": quality,
        "correctness": 0.8 if quality == "strong" else 0.5,
        "depth": 0.9 if depth == AnswerDepth.EXPERT else (0.6 if depth == AnswerDepth.STRONG else 0.3),
        "missing_concepts": [],
        "misconceptions": [],
        "follow_up_needed": quality in ("adequate", "weak"),
        "reason": f"Rules fallback evaluated depth as {depth.value}."
    }


async def analyze_answer(answer: str, question: str, provider: LLMProvider | None = None) -> dict:
    if not provider or type(provider).__name__ == "MockLLMProvider":
        return analyze_answer_rules(answer, question)

    system_prompt = (
        "You are an expert technical interviewer. Internally evaluate the candidate's answer to the given question.\n"
        "Return a JSON object conforming exactly to this schema:\n"
        "{\n"
        "  \"quality\": \"strong|adequate|weak\",\n"
        "  \"correctness\": <float between 0 and 1>,\n"
        "  \"depth\": <float between 0 and 1>,\n"
        "  \"missing_concepts\": [\"list\", \"of\", \"expected\", \"concepts\", \"not\", \"mentioned\"],\n"
        "  \"misconceptions\": [\"any\", \"false\", \"assumptions\", \"or\", \"incorrect\", \"statements\"],\n"
        "  \"follow_up_needed\": <boolean>,\n"
        "  \"reason\": \"Brief justification of quality/follow-up choice\"\n"
        "}\n"
        "Only return the raw JSON object, no markdown blocks, no other text."
    )
    user_prompt = f"Question: {question}\nCandidate Answer: {answer}"

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
        return json.loads(content)
    except Exception as exc:
        logger.warning("LLM answer analysis failed, falling back to rules: %s", exc)
        return analyze_answer_rules(answer, question)


