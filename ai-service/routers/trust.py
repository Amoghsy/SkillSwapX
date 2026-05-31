# ai-service/routers/trust.py
# POST /trust — Trust Risk Prediction Engine
#
# Uses a GradientBoostingClassifier trained on synthetic behavioural data.
# In production, retrain periodically on real session + feedback data.
#
# Input features:
#   cancellation_rate, avg_response_hours, completion_rate,
#   avg_feedback_score, no_show_count, total_sessions
#
# Output: risk probability (0=safe, 1=high risk) + tier recommendation

from fastapi import APIRouter
from models.schemas import TrustRequest, TrustResponse
from services.db import query_one
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
import os, pickle, pathlib

router = APIRouter()

_MODEL_PATH = pathlib.Path(__file__).parent.parent / "data" / "trust_model.pkl"


def _build_synthetic_model() -> GradientBoostingClassifier:
    """
    Train on synthetic data so the model is available immediately.
    Replace with real session data as the platform grows.
    
    Features: [cancel_rate, response_hrs, completion_rate, feedback_avg, no_shows, sessions]
    Label: 1 = bad actor / risky, 0 = trustworthy
    """
    rng = np.random.default_rng(42)

    # Good users
    good = np.column_stack([
        rng.uniform(0.0, 0.2,  500),   # low cancellation
        rng.uniform(0.0, 4.0,  500),   # fast response
        rng.uniform(0.8, 1.0,  500),   # high completion
        rng.uniform(3.5, 5.0,  500),   # good feedback
        rng.integers(0, 2,     500),   # few no-shows
        rng.integers(5, 100,   500),   # many sessions
    ])

    # Bad users
    bad = np.column_stack([
        rng.uniform(0.5, 1.0,  200),   # high cancellation
        rng.uniform(24, 120,   200),   # slow response
        rng.uniform(0.0, 0.5,  200),   # low completion
        rng.uniform(1.0, 2.5,  200),   # bad feedback
        rng.integers(3, 20,    200),   # many no-shows
        rng.integers(0, 20,    200),   # few sessions
    ])

    X = np.vstack([good, bad])
    y = np.array([0] * 500 + [1] * 200)

    model = GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42)
    model.fit(X, y)
    return model


def _load_model() -> GradientBoostingClassifier:
    if _MODEL_PATH.exists():
        with open(_MODEL_PATH, "rb") as f:
            return pickle.load(f)
    model = _build_synthetic_model()
    _MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(_MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    return model


_clf = _load_model()


def _tier_from_score(trust_score: float) -> str:
    if trust_score >= 86: return "Mentor Elite"
    if trust_score >= 66: return "Gold"
    if trust_score >= 41: return "Silver"
    return "Bronze"


@router.post("", response_model=TrustResponse)
def predict_trust(req: TrustRequest):
    features = np.array([[
        req.cancellation_rate,
        req.avg_response_hours,
        req.completion_rate,
        req.avg_feedback_score,
        req.no_show_count,
        req.total_sessions,
    ]])

    risk_prob = float(_clf.predict_proba(features)[0][1])

    flags: list[str] = []
    if req.cancellation_rate > 0.4:
        flags.append("High cancellation rate")
    if req.no_show_count >= 3:
        flags.append("Multiple no-shows recorded")
    if req.avg_feedback_score < 2.5 and req.total_sessions >= 5:
        flags.append("Consistently low feedback scores")
    if req.completion_rate < 0.5 and req.total_sessions >= 3:
        flags.append("Low session completion rate")
    if req.avg_response_hours > 48:
        flags.append("Slow response time")

    if risk_prob < 0.3:
        risk_label = "low"
    elif risk_prob < 0.65:
        risk_label = "medium"
    else:
        risk_label = "high"

    # Pull current trust score from DB for tier recommendation
    user = query_one("SELECT trust_score FROM users WHERE id = %s", (req.user_id,))
    trust_score = float(user["trust_score"]) if user else 50.0
    recommended_tier = _tier_from_score(trust_score)

    return TrustResponse(
        user_id=req.user_id,
        predicted_risk=round(risk_prob, 4),
        risk_label=risk_label,
        recommended_tier=recommended_tier,
        flags=flags,
    )
