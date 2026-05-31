# ai-service/routers/roadmap.py
# POST /roadmap — AI Learning Roadmap Generator

import os
import json
import httpx
from fastapi import APIRouter, HTTPException
from models.schemas import RoadmapRequest, RoadmapResponse, RoadmapMilestone
from services.db import query
from services.embeddings import top_matches

router = APIRouter()

_PROGRESSION = [
    ("Beginner",      5,  2),   # (proficiency, default_credits, weeks)
    ("Intermediate",  10,  4),
    ("Advanced",      15, 6),
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

    # ── 2. Find top semantically relevant skills via SentenceTransformers ──
    ranked = top_matches(goal, skill_texts, top_n=3)
    
    # Identify the top matched skill for mentor routing
    matched_skill = None
    if ranked:
        top_idx, score = ranked[0]
        if score >= 0.15:
            matched_skill = skills[top_idx]

    # Gather database mentors by proficiency level for the matched skill
    db_mentors_by_level = {}
    if matched_skill:
        for level, _, _ in _PROGRESSION:
            mentors = query(
                "SELECT u.id, u.name, u.avatar_url, u.trust_score, u.trust_tier, "
                "       us.credit_rate, u.location "
                "FROM user_skills us "
                "JOIN users u ON u.id = us.user_id "
                "WHERE us.skill_id = %s AND us.type = 'teach' "
                "  AND us.proficiency = %s AND us.is_active = 1 AND u.is_active = 1 "
                "ORDER BY u.trust_score DESC LIMIT 3",
                (matched_skill["id"], level)
            )
            db_mentors_by_level[level] = [
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

    # ── 3. Generate customized milestones via Google Gemini ──
    gemini_key = os.getenv("GEMINI_API_KEY")
    roadmap_data = None

    if gemini_key and not gemini_key.startswith("AQ."):
        prompt = f"""
You are the SkillSwap X AI Learning Coach. Your job is to construct a customized 3-step learning roadmap for a user whose goal is: "{goal}".

Available skills in our platform database:
- {matched_skill['skill_name'] if matched_skill else 'General Skill'}: {matched_skill['description'] if matched_skill else 'Self-learning roadmap'}

Please generate a 3-step sequential roadmap (Beginner, Intermediate, and Advanced milestones) that details how they can achieve this goal.

You MUST respond with a JSON object conforming exactly to this JSON schema:
{{
  "milestones": [
    {{
      "step": 1,
      "skill": "Name of the skill/concept for Step 1 (e.g., 'Basic syntax' or 'Figma fundamentals')",
      "description": "Short explanation of what they will focus on, and how it helps them achieve: '{goal}'",
      "credits_needed": 5,
      "estimated_weeks": 2
    }},
    {{
      "step": 2,
      "skill": "Name of the skill/concept for Step 2",
      "description": "Short explanation of the intermediate objectives...",
      "credits_needed": 10,
      "estimated_weeks": 4
    }},
    {{
      "step": 3,
      "skill": "Name of the skill/concept for Step 3",
      "description": "Short explanation of the advanced goals...",
      "credits_needed": 15,
      "estimated_weeks": 6
    }}
  ]
}}

Ensure there are exactly 3 milestones. No surrounding markdown backticks or formatting, no intro or outro text. Just return the JSON object.
"""
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            with httpx.Client(timeout=15.0) as client:
                res = client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    res_json = res.json()
                    text_content = res_json['candidates'][0]['content']['parts'][0]['text']
                    roadmap_data = json.loads(text_content.strip())
        except Exception as e:
            # Catch exceptions and fall back to local rule generator
            print(f"Gemini API request failed: {e}")

    milestones: list[RoadmapMilestone] = []
    total_credits = 0
    total_weeks   = 0

    # ── 4. Parse Gemini roadmap OR construct local fallback roadmap ──
    if roadmap_data and "milestones" in roadmap_data:
        try:
            for m in roadmap_data["milestones"]:
                step_idx = int(m.get("step", 1))
                level = "Beginner"
                if step_idx == 2:
                    level = "Intermediate"
                elif step_idx >= 3:
                    level = "Advanced"

                credits_val = int(m.get("credits_needed", 5))
                weeks_val = int(m.get("estimated_weeks", 2))

                # Inject database mentors matching this level
                mentors_list = db_mentors_by_level.get(level, [])

                milestones.append(RoadmapMilestone(
                    step=step_idx,
                    skill=m.get("skill", f"{level} Skill"),
                    description=m.get("description", f"Learn {level.lower()} concepts."),
                    credits_needed=credits_val,
                    estimated_weeks=weeks_val,
                    recommended_mentors=mentors_list,
                ))
                total_credits += credits_val
                total_weeks   += weeks_val
        except Exception as e:
            print(f"Failed to parse Gemini response payload: {e}")
            milestones = []

    # ── 5. Fallback rule-based generator using local SentenceTransformer ──
    if not milestones:
        # Use top matched skill or default to user goal
        fallback_skill = matched_skill if matched_skill else {"id": 1, "skill_name": goal, "category": "General Learning"}
        
        step_idx = 1
        for level, default_credits, weeks in _PROGRESSION:
            mentors_list = db_mentors_by_level.get(level, []) if matched_skill else []
            credit_rate = mentors_list[0]["credit_rate"] if mentors_list else default_credits

            milestones.append(RoadmapMilestone(
                step=step_idx,
                skill=f"{level} {fallback_skill['skill_name']}",
                description=(
                    f"Develop a {level.lower()}-level understanding of {fallback_skill['skill_name']} "
                    f"({fallback_skill['category']}) to progress towards your goal: '{goal}'."
                ),
                credits_needed=credit_rate,
                estimated_weeks=weeks,
                recommended_mentors=mentors_list,
            ))
            total_credits += credit_rate
            total_weeks   += weeks
            step_idx      += 1

    return RoadmapResponse(
        goal=goal,
        milestones=milestones,
        total_credits_needed=total_credits,
        estimated_total_weeks=total_weeks,
    )
