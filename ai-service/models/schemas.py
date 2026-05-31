# ai-service/models/schemas.py
# Pydantic v2 schemas for all AI service endpoints

from pydantic import BaseModel, Field
from typing import Optional


# ── Roadmap ───────────────────────────────────────────────────
class RoadmapRequest(BaseModel):
    goal: str = Field(..., min_length=3, max_length=500, description="User's learning goal")
    user_id: Optional[int] = Field(None, description="Requesting user ID (for personalisation)")


class RoadmapMilestone(BaseModel):
    step: int
    skill: str
    description: str
    credits_needed: int
    estimated_weeks: int
    recommended_mentors: list[dict] = []


class RoadmapResponse(BaseModel):
    goal: str
    milestones: list[RoadmapMilestone]
    total_credits_needed: int
    estimated_total_weeks: int


# ── Skill DNA Matching ────────────────────────────────────────
class MatchRequest(BaseModel):
    user_id: int = Field(..., description="User looking for matches")
    skill_id: int = Field(..., description="Skill they want to learn")
    limit: int = Field(10, ge=1, le=50)


class MatchCandidate(BaseModel):
    user_id: int
    user_name: str
    avatar_url: Optional[str]
    trust_score: float
    trust_tier: str
    compatibility_score: float          # 0–100
    skill_relevance: float              # 0–1
    location: Optional[str]
    credit_rate: int


class MatchResponse(BaseModel):
    skill_id: int
    candidates: list[MatchCandidate]


# ── Trust Prediction ──────────────────────────────────────────
class TrustRequest(BaseModel):
    user_id: int
    cancellation_rate: float = Field(0.0, ge=0.0, le=1.0)
    avg_response_hours: float = Field(0.0, ge=0.0)
    completion_rate: float = Field(1.0, ge=0.0, le=1.0)
    avg_feedback_score: float = Field(3.0, ge=0.0, le=5.0)
    no_show_count: int = Field(0, ge=0)
    total_sessions: int = Field(0, ge=0)


class TrustResponse(BaseModel):
    user_id: int
    predicted_risk: float               # 0 = safe, 1 = high risk
    risk_label: str                     # low / medium / high
    recommended_tier: str
    flags: list[str]                    # human-readable warnings


# ── Content Moderation ────────────────────────────────────────
class ModerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    context: str = Field("message", description="message | review | skill_description | bio")


class ModerateResponse(BaseModel):
    is_safe: bool
    confidence: float
    flags: list[str]
    action: str                         # allow | warn | block | review
