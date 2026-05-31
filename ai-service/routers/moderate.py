# ai-service/routers/moderate.py
# POST /moderate — NLP Content Moderation
#
# Two-layer approach:
#   Layer 1: Fast keyword/pattern blocklist  (catches obvious violations instantly)
#   Layer 2: Embedding similarity to known harmful phrase clusters
#             (catches paraphrased / subtle harmful content)
#
# In production, replace Layer 2 with a fine-tuned classifier on real flagged data.

from fastapi import APIRouter
from models.schemas import ModerateRequest, ModerateResponse
from services.embeddings import embed, cosine_similarity
import numpy as np
import re
import os

router = APIRouter()

THRESHOLD = float(os.getenv("MODERATION_THRESHOLD", "0.72"))

# ── Layer 1: Hard blocklist patterns ─────────────────────────
_BLOCKED_PATTERNS = [
    r"\b(fuck|shit|bitch|asshole|bastard)\b",
    r"\b(hate|kill|murder|rape|stab|shoot)\s+you\b",
    r"\b(nigger|faggot|retard|spastic)\b",
    r"\bcontact\s+(me|us)\s+outside\b.*\b(whatsapp|telegram|signal)\b",
    r"\bpay\s+(me|you|us)\s+directly\b",
    r"\bclick\s+this\s+link\b",
    r"\bfree\s+(money|gift\s*card|bitcoin|crypto)\b",
    r"\byour\s+account\s+(has\s+been\s+)?(suspended|hacked|compromised)\b",
]

_COMPILED = [re.compile(p, re.IGNORECASE) for p in _BLOCKED_PATTERNS]

# ── Layer 2: Harmful semantic clusters ───────────────────────
# Representative phrases for each harmful category.
# The model checks if submitted text is semantically close to any cluster.
_HARM_CLUSTERS = {
    "harassment":      ["you are worthless and nobody likes you", "I will hurt you", "I know where you live"],
    "scam":            ["send me money outside the platform", "pay directly to my bank account", "this is a guaranteed investment"],
    "spam":            ["click this link for free prizes", "you have been selected as a winner", "earn money fast from home"],
    "hate_speech":     ["people like you do not belong here", "your kind is inferior", "go back to your country"],
    "explicit":        ["send me explicit photos", "let us meet for sexual favors", "adults only private session"],
    "fake_review":     ["I will give you 5 stars if you give me a discount", "write a fake review for me"],
}

# Pre-compute cluster embeddings once at startup
_cluster_vecs: dict[str, np.ndarray] = {}

def _load_cluster_vecs():
    global _cluster_vecs
    for category, phrases in _HARM_CLUSTERS.items():
        vecs = embed(phrases)
        _cluster_vecs[category] = vecs

_load_cluster_vecs()


def _layer1_check(text: str) -> list[str]:
    """Returns list of matched pattern labels."""
    matched = []
    for pattern in _COMPILED:
        if pattern.search(text):
            matched.append("explicit_pattern")
    return matched


def _layer2_check(text: str) -> list[str]:
    """Returns list of harm categories whose cluster is close to the text."""
    if not _cluster_vecs:
        return []
    text_vec = embed([text])[0:1]
    flagged = []
    for category, cluster_vecs in _cluster_vecs.items():
        sims = cosine_similarity(text_vec, cluster_vecs)[0]
        if float(sims.max()) >= THRESHOLD:
            flagged.append(category)
    return flagged


@router.post("", response_model=ModerateResponse)
def moderate_content(req: ModerateRequest):
    text = req.text.strip()

    layer1_flags = _layer1_check(text)
    layer2_flags = _layer2_check(text)
    all_flags    = list(set(layer1_flags + layer2_flags))

    if "explicit_pattern" in all_flags:
        confidence = 0.97
        action = "block"
    elif layer2_flags:
        # Confidence based on highest semantic similarity found
        text_vec = embed([text])[0:1]
        max_sim = 0.0
        for cat in layer2_flags:
            sims = cosine_similarity(text_vec, _cluster_vecs[cat])[0]
            max_sim = max(max_sim, float(sims.max()))
        confidence = round(max_sim, 4)
        action = "block" if confidence >= 0.85 else "review"
    else:
        confidence = 0.02
        action = "allow"

    is_safe = action == "allow"

    return ModerateResponse(
        is_safe=is_safe,
        confidence=confidence,
        flags=all_flags,
        action=action,
    )
