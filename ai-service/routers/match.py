# ai-service/routers/match.py
# POST /match — Skill DNA Matching Engine
#
# Compatibility score weights (as per project report):
#   skill_relevance       30%
#   trust_score           25%  (proxy for reliability)
#   credit_rate_match     20%  (affordability relative to seeker's balance)
#   location_bonus        15%  (same city gets bonus)
#   activity_bonus        10%  (recently active users score higher)

from fastapi import APIRouter, HTTPException
from models.schemas import MatchRequest, MatchResponse, MatchCandidate
from services.db import query, query_one
from services.embeddings import embed
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

router = APIRouter()

WEIGHTS = {
    "skill_relevance":   0.30,
    "trust_score":       0.25,
    "credit_rate_match": 0.20,
    "location_bonus":    0.15,
    "activity_bonus":    0.10,
}


@router.post("", response_model=MatchResponse)
def find_matches(req: MatchRequest):
    # ── Seeker info ───────────────────────────────────────────
    seeker = query_one(
        "SELECT id, location, credits FROM users WHERE id = %s AND is_active = 1",
        (req.user_id,)
    )
    if not seeker:
        raise HTTPException(status_code=404, detail="User not found")

    # ── Target skill info ─────────────────────────────────────
    skill = query_one(
        "SELECT s.id, s.skill_name, s.description, sc.name AS category "
        "FROM skills s JOIN skill_categories sc ON sc.id = s.category_id "
        "WHERE s.id = %s",
        (req.skill_id,)
    )
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # ── Candidate teachers ────────────────────────────────────
    candidates = query(
        "SELECT u.id, u.name, u.avatar_url, u.trust_score, u.trust_tier, "
        "       u.location, u.updated_at, "
        "       us.credit_rate, us.proficiency, us.description AS skill_desc, "
        "       s.skill_name, s.description AS skill_def "
        "FROM user_skills us "
        "JOIN users u ON u.id = us.user_id "
        "JOIN skills s ON s.id = us.skill_id "
        "WHERE us.skill_id = %s AND us.type = 'teach' "
        "  AND us.is_active = 1 AND u.is_active = 1 AND u.id != %s "
        "LIMIT 100",
        (req.skill_id, req.user_id)
    )

    if not candidates:
        return MatchResponse(skill_id=req.skill_id, candidates=[])

    # ── Embedding similarity for skill relevance ──────────────
    goal_text = f"{skill['skill_name']} {skill['description'] or ''}"
    cand_texts = [
        f"{c['skill_name']} {c['skill_desc'] or ''} {c['skill_def'] or ''}"
        for c in candidates
    ]
    all_vecs  = embed([goal_text] + cand_texts)
    goal_vec  = all_vecs[0:1]
    cand_vecs = all_vecs[1:]
    skill_sims = cosine_similarity(goal_vec, cand_vecs)[0]

    seeker_credits = int(seeker["credits"] or 0)
    seeker_location = (seeker["location"] or "").lower()

    scored: list[MatchCandidate] = []

    for i, c in enumerate(candidates):
        # Normalise trust score 0-1
        trust_norm = min(float(c["trust_score"]) / 100.0, 1.0)

        # Credit affordability: 1.0 if free, decreases as credit_rate approaches balance
        rate = int(c["credit_rate"] or 5)
        if seeker_credits <= 0:
            credit_match = 0.0
        else:
            credit_match = max(0.0, 1.0 - (rate / max(seeker_credits, 1)))

        # Location bonus
        cand_loc = (c["location"] or "").lower()
        location_bonus = 1.0 if (seeker_location and cand_loc and seeker_location == cand_loc) else 0.3

        # Activity bonus — was active within last 30 days?
        from datetime import datetime, timezone
        try:
            updated = c["updated_at"]
            if isinstance(updated, str):
                updated = datetime.fromisoformat(updated)
            delta = (datetime.now(timezone.utc) - updated.replace(tzinfo=timezone.utc)).days
            activity = 1.0 if delta <= 30 else max(0.2, 1.0 - delta / 365)
        except Exception:
            activity = 0.5

        raw_score = (
            skill_sims[i]  * WEIGHTS["skill_relevance"]   +
            trust_norm     * WEIGHTS["trust_score"]        +
            credit_match   * WEIGHTS["credit_rate_match"]  +
            location_bonus * WEIGHTS["location_bonus"]     +
            activity       * WEIGHTS["activity_bonus"]
        )
        compatibility = round(raw_score * 100, 1)

        scored.append(MatchCandidate(
            user_id=c["id"],
            user_name=c["name"],
            avatar_url=c["avatar_url"],
            trust_score=float(c["trust_score"]),
            trust_tier=c["trust_tier"],
            compatibility_score=compatibility,
            skill_relevance=round(float(skill_sims[i]), 3),
            location=c["location"],
            credit_rate=rate,
        ))

    scored.sort(key=lambda x: x.compatibility_score, reverse=True)
    return MatchResponse(skill_id=req.skill_id, candidates=scored[: req.limit])
