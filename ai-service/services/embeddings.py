# ai-service/services/embeddings.py
# Loads the sentence-transformer model once at startup and caches it.
# Used by both roadmap and matching engines.

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv()

_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(_MODEL_NAME)
    return _model


def embed(texts: list[str]) -> np.ndarray:
    """Return a 2-D numpy array of embeddings for the given texts."""
    return get_model().encode(texts, convert_to_numpy=True, show_progress_bar=False)


def similarity(text_a: str, text_b: str) -> float:
    """Cosine similarity between two strings, returns 0.0–1.0."""
    vecs = embed([text_a, text_b])
    return float(cosine_similarity([vecs[0]], [vecs[1]])[0][0])


def top_matches(query_text: str, candidates: list[str], top_n: int = 5) -> list[tuple[int, float]]:
    """
    Returns the top_n (index, score) pairs from candidates
    most semantically similar to query_text.
    """
    if not candidates:
        return []
    vecs = embed([query_text] + candidates)
    query_vec = vecs[0:1]
    cand_vecs  = vecs[1:]
    scores = cosine_similarity(query_vec, cand_vecs)[0]
    ranked = sorted(enumerate(scores.tolist()), key=lambda x: x[1], reverse=True)
    return ranked[:top_n]
