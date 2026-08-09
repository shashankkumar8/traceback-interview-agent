from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class InterviewStage(str, Enum):
    INITIALIZING = "INITIALIZING"
    PROFILE_ANALYSIS = "PROFILE_ANALYSIS"
    QUESTIONING = "QUESTIONING"
    FOLLOW_UP = "FOLLOW_UP"
    DEEP_DIVE = "DEEP_DIVE"
    CROSS_CHECK = "CROSS_CHECK"
    FINAL_EVALUATION = "FINAL_EVALUATION"
    COMPLETED = "COMPLETED"


class AnswerDepth(str, Enum):
    UNKNOWN = "UNKNOWN"
    SURFACE = "SURFACE"
    WORKING = "WORKING"
    STRONG = "STRONG"
    EXPERT = "EXPERT"


class NextAction(str, Enum):
    FOLLOW_UP = "FOLLOW_UP"
    DEEPER = "DEEPER"
    CROSS_CHECK = "CROSS_CHECK"
    CHANGE_TOPIC = "CHANGE_TOPIC"
    FINALIZE = "FINALIZE"


class CoverageDimension(str, Enum):
    FUNDAMENTALS = "Fundamentals"
    IMPLEMENTATION = "Implementation"
    TRADEOFFS = "Tradeoffs"
    DEBUGGING = "Debugging"
    PRODUCTION = "Production"
    SECURITY = "Security"
    EVALUATION = "Evaluation"
    SYSTEM_DESIGN = "System Design"


class MemberInfo(BaseModel):
    id: str = "UNKNOWN"
    name: str = "Candidate"
    jobRole: str = "Software Engineer"
    yearsExperience: int = 0
    education: str = ""
    status: str = "UNKNOWN"


class MissionRecord(BaseModel):
    day: int | None = None
    title: str = ""
    passed: bool | None = None
    skipped: bool | None = None
    attempts: int = 1


class CandidateSignals(BaseModel):
    commitDays: int = 0
    missionsCompleted: int = 0
    missionsFirstTry: int = 0


class Candidate(BaseModel):
    member: MemberInfo = Field(default_factory=MemberInfo)
    missions: list[MissionRecord] = Field(default_factory=list)
    signals: CandidateSignals = Field(default_factory=CandidateSignals)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Candidate":
        if not data:
            return cls()
        member = data.get("member") or {}
        signals = data.get("signals") or {}
        missions_raw = data.get("missions") or []
        missions = [MissionRecord(**m) if isinstance(m, dict) else MissionRecord() for m in missions_raw]
        return cls(
            member=MemberInfo(**member) if isinstance(member, dict) else MemberInfo(),
            missions=missions,
            signals=CandidateSignals(**signals) if isinstance(signals, dict) else CandidateSignals(),
        )


class EvidenceItem(BaseModel):
    claim: str = ""
    technologies: list[str] = Field(default_factory=list)
    decisions: list[str] = Field(default_factory=list)
    metrics: list[str] = Field(default_factory=list)
    tradeoffs: list[str] = Field(default_factory=list)
    ownership: str = ""
    depth: AnswerDepth = AnswerDepth.UNKNOWN
    probe_level: int = 0
    topic: str = ""  # topic being tested when this evidence was collected


class InterviewRequest(BaseModel):
    sessionId: str
    candidate: dict[str, Any] | None = None
    message: str | None = None

    @field_validator("sessionId")
    @classmethod
    def session_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("sessionId is required")
        return v.strip()


class Feedback(BaseModel):
    summary: str
    strengths: list[str]
    gaps: list[str]
    next: list[str]


class InterviewResponse(BaseModel):
    reply: str
    done: bool = False
    feedback: Feedback | None = None
    progress: dict[str, Any] | None = None


class InterviewState(BaseModel):
    session_id: str
    candidate: Candidate
    interview_stage: InterviewStage = InterviewStage.INITIALIZING
    current_topic: str = ""
    current_question: str = ""
    question_history: list[str] = Field(default_factory=list)
    answer_history: list[str] = Field(default_factory=list)
    competencies_tested: list[str] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    follow_up_count: int = 0
    confidence: float = 0.5
    weak_areas: list[str] = Field(default_factory=list)
    strong_areas: list[str] = Field(default_factory=list)
    coverage: dict[str, bool] = Field(default_factory=dict)
    topic_queue: list[str] = Field(default_factory=list)
    asked_topics: list[str] = Field(default_factory=list)
    topic_history: list[str] = Field(default_factory=list)
    profile_summary: str = ""
    question_count: int = 0
    max_questions: int = 10
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None
    last_action: NextAction | None = None
    pending_claim: str | None = None
    internal_plan: dict | None = None
    analyses: list[dict] = Field(default_factory=list)


    def explored_dimensions(self) -> list[str]:
        return [dim for dim, explored in self.coverage.items() if explored]

    def mark_coverage(self, dimension: str) -> None:
        self.coverage[dimension] = True
