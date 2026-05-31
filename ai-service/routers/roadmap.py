# ai-service/routers/roadmap.py
# POST /roadmap — AI Learning Roadmap Generator
#
# Algorithm:
#  1. Parse the user's goal text with embeddings to identify target skill domain
#  2. Look up matching skills from the DB ordered by semantic similarity
#  3. Build a prerequisite chain (Beginner → Intermediate → Advanced)
#  4. Find best mentors for each step from user_skills table
#  5. Estimate credits and weeks per step

from fastapi import APIRouter, HTTPException
from models.schemas import RoadmapRequest, RoadmapResponse, RoadmapMilestone
from services.db import query, query_one
from services.embeddings import top_matches

router = APIRouter()

# Prerequisite depth map
_PROGRESSION = [
    ("Beginner",      4,  2),   # (proficiency, credits_per_session, weeks)
    ("Intermediate",  8,  4),
    ("Advanced",      12, 6),
]


@router.post("", response_model=RoadmapResponse)
def generate_roadmap(req: RoadmapRequest):
    goal = req.goal.strip()

    # ── 1. Fetch all skills from DB ───────────────────────────
    skills = query(
        "SELECT s.id, s.skill_name, s.description, sc.name AS category "
        "FROM skills s JOIN skill_categories sc ON sc.id = s.category_id"
    )
    if not skills:
        raise HTTPException(status_code=503, detail="Skill data unavailable")

    skill_texts = [f"{s['skill_name']} {s['description'] or ''} {s['category']}" for s in skills]

    # ── 2. Find top semantically relevant skills ──────────────
    ranked = top_matches(goal, skill_texts, top_n=3)
    if not ranked:
        raise HTTPException(status_code=422, detail="Could not parse goal into known skills")

    milestones: list[RoadmapMilestone] = []
    step = 1
    total_credits = 0
    total_weeks   = 0

    for skill_idx, relevance_score in ranked:
        if relevance_score < 0.15:
            continue
        skill = skills[skill_idx]

        for proficiency, credits, weeks in _PROGRESSION:
            # Find mentors for this skill + proficiency
            mentors = query(
                "SELECT u.id, u.name, u.avatar_url, u.trust_score, u.trust_tier, "
                "       us.credit_rate, u.location "
                "FROM user_skills us "
                "JOIN users u ON u.id = us.user_id "
                "WHERE us.skill_id = %s AND us.type = 'teach' "
                "  AND us.proficiency = %s AND us.is_active = 1 AND u.is_active = 1 "
                "ORDER BY u.trust_score DESC LIMIT 3",
                (skill["id"], proficiency)
            )

            mentor_list = [
                {
                    "user_id":     m["id"],
                    "name":        m["name"],
                    "avatar_url":  m["avatar_url"],
                    "trust_score": float(m["trust_score"]),
                    "trust_tier":  m["trust_tier"],
                    "credit_rate": m["credit_rate"],
                    "location":    m["location"],
                }
                for m in mentors
            ]

            credit_rate = mentors[0]["credit_rate"] if mentors else credits

            milestones.append(RoadmapMilestone(
                step=step,
                skill=f"{proficiency} {skill['skill_name']}",
                description=(
                    f"Build {proficiency.lower()} proficiency in {skill['skill_name']} "
                    f"({skill['category']}). Skill relevance to your goal: {relevance_score:.0%}."
                ),
                credits_needed=credit_rate,
                estimated_weeks=weeks,
                recommended_mentors=mentor_list,
            ))
            step         += 1
            total_credits += credit_rate
            total_weeks   += weeks

    if not milestones:
        raise HTTPException(status_code=422, detail="No matching skills found for this goal")

    return RoadmapResponse(
        goal=goal,
        milestones=milestones,
        total_credits_needed=total_credits,
        estimated_total_weeks=total_weeks,
    )
