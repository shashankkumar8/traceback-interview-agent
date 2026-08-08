from __future__ import annotations
from app.models.schemas import Candidate

# Mapping days to module titles
DAY_TO_MODULE = {
    1: "Environment & Tooling", 2: "Environment & Tooling", 3: "Environment & Tooling",
    4: "Data Foundations", 5: "Data Foundations", 6: "Data Foundations",
    7: "Embeddings & Vector Search", 8: "Embeddings & Vector Search", 9: "Embeddings & Vector Search", 10: "Embeddings & Vector Search",
    11: "LLM Core, Prompting & Fine-Tuning", 12: "LLM Core, Prompting & Fine-Tuning", 13: "LLM Core, Prompting & Fine-Tuning", 14: "LLM Core, Prompting & Fine-Tuning", 15: "LLM Core, Prompting & Fine-Tuning",
    16: "Chatbot Application Build", 17: "Chatbot Application Build", 18: "Chatbot Application Build", 19: "Chatbot Application Build", 20: "Chatbot Application Build",
    21: "Agentic AI & MCP", 22: "Agentic AI & MCP", 23: "Agentic AI & MCP", 24: "Agentic AI & MCP",
    25: "Evaluation, Security & Deployment", 26: "Evaluation, Security & Deployment", 27: "Evaluation, Security & Deployment", 28: "Evaluation, Security & Deployment",
    29: "Production & Capstone", 30: "Production & Capstone", 31: "Production & Capstone"
}


def analyze_candidate(candidate: Candidate) -> dict:
    member = candidate.member
    role = member.jobRole or "Software Engineer"
    years = member.yearsExperience or 0

    # Categorize by curriculum areas
    passed_by_module = {}
    attempts_by_module = {}
    skipped_by_module = {}
    failed_by_module = {}

    for m in candidate.missions:
        day = m.day or 1
        module = DAY_TO_MODULE.get(day, "General AI Engineering")
        
        if m.skipped:
            skipped_by_module[module] = skipped_by_module.get(module, 0) + 1
        elif m.passed is False:
            failed_by_module[module] = failed_by_module.get(module, 0) + 1
        elif m.passed:
            passed_by_module[module] = passed_by_module.get(module, 0) + 1
            attempts_by_module[module] = attempts_by_module.get(module, []) + [m.attempts]

    strengths = []
    weak_areas = []
    skipped_areas = []
    repeated_attempt_areas = []

    all_modules = set(DAY_TO_MODULE.values())
    for mod in all_modules:
        # Check skipped
        if skipped_by_module.get(mod, 0) > 0:
            skipped_areas.append(mod)
        
        # Check failed or high attempt
        attempts = attempts_by_module.get(mod, [])
        max_attempts = max(attempts) if attempts else 0
        avg_attempts = sum(attempts) / len(attempts) if attempts else 0
        failed_count = failed_by_module.get(mod, 0)

        if failed_count > 0 or max_attempts >= 4:
            weak_areas.append(mod)
        elif avg_attempts >= 2.5:
            repeated_attempt_areas.append(mod)
        elif passed_by_module.get(mod, 0) > 0 and max_attempts <= 2:
            strengths.append(mod)

    # First-try performance
    completed = candidate.signals.missionsCompleted
    first_try_pct = (candidate.signals.missionsFirstTry / completed) if completed > 0 else 0.0

    # Completion consistency
    consistency = completed / 31.0

    # Determine difficulty level
    difficulty = "mid"
    if years >= 5 or "Senior" in role or "Lead" in role or "Principal" in role or "Distinguished" in role:
        difficulty = "senior"
    elif years <= 2 or "Junior" in role or "Intern" in role:
        difficulty = "junior"

    summary = (
        f"{member.name} ({role}, {years} yrs experience). "
        f"Missions completed: {completed}/31. First-try rate: {first_try_pct:.1%}. "
        f"Strengths identified in: {', '.join(strengths[:3]) or 'None'}. "
        f"Struggles/Weaknesses in: {', '.join(weak_areas[:3]) or 'None'}."
    )

    return {
        "identity": {
            "id": member.id,
            "name": member.name,
            "education": member.education
        },
        "role": role,
        "years": years,
        "difficulty": difficulty,
        "strengths": strengths,
        "weak_areas": weak_areas,
        "skipped_areas": skipped_areas,
        "repeated_attempt_areas": repeated_attempt_areas,
        "first_try_performance": first_try_pct,
        "completion_consistency": consistency,
        "summary": summary
    }
