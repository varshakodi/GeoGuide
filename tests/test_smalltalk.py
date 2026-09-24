"""Greetings are answered politely without retrieval, and never open a hole in the
refusal layers; factual questions still go through the grounded Q&A prompt."""
import pytest
from ai import config, pipeline
from ai.retrieval import Passage, Retrieval

BLR = "cty_17b8ef2f"


@pytest.fixture
def no_retrieval(monkeypatch):
    called = []
    monkeypatch.setattr(pipeline, "retrieve", lambda q, c, k=None: called.append(q) or Retrieval(gated=True))
    monkeypatch.setattr(pipeline, "generate", lambda s, u: called.append("llm") or "x [1].")
    return called


@pytest.mark.parametrize("q", ["hi", "Hello!", "hey there", "Good morning", "who are you?",
                               "thanks", "Thank you so much!", "नमस्ते", "ನಮಸ್ಕಾರ"])
def test_greetings_skip_retrieval_and_the_model(no_retrieval, q):
    out = pipeline.answer_question(q, BLR)
    assert out["type"] == "greeting" and "Bengaluru" in out["message"]
    assert no_retrieval == []


def test_greeting_is_answered_in_the_selected_language(no_retrieval):
    assert pipeline.answer_question("hello", BLR, lang="hi")["message"].startswith("नमस्ते")


@pytest.mark.parametrize("q", ["hi, how much is a cab to the airport right now?",
                               "hello, tell me about the history", "Hi GeoGuide what is the etiquette here"])
def test_a_greeting_prefix_does_not_bypass_the_gate(no_retrieval, q):
    out = pipeline.answer_question(q, BLR)
    assert out["type"] != "greeting"


def test_qa_prompt_names_the_sentinel_and_keeps_details():
    p = [Passage(1, "Remove footwear at religious sites.", "KV Place Guide / Bengaluru / etiquette", 0.7)]
    prompt = pipeline._qa("kn", "What should I know?", p, 6)
    assert config.SENTINEL in prompt and "DETAIL PRESERVATION" in prompt
    assert "[1] (KV Place Guide / Bengaluru / etiquette) Remove footwear" in prompt
    assert "What should I know?" in prompt and "kn" in prompt


def test_follow_up_uses_the_qa_prompt(monkeypatch):
    seen = {}
    monkeypatch.setattr(pipeline, "retrieve", lambda q, c, k=None: Retrieval(
        passages=[Passage(1, "Remove footwear at religious sites.", "KV Place Guide / Bengaluru / etiquette", 0.7)],
        top_score=0.7))
    monkeypatch.setattr(pipeline, "generate",
                        lambda s, u: seen.update(system=s, user=u) or "Remove footwear at religious sites [1].")
    out = pipeline.answer_question("Any etiquette tips?", BLR)
    assert out["type"] == "answer" and out["claims"][0]["source_labels"]
    assert seen["system"] is None and "DETAIL PRESERVATION" in seen["user"]


def test_faq_answer_keeps_the_guidelines_not_just_the_opening_line():
    from backend.ai_routes import ask_faqs
    faqs = ask_faqs(BLR, limit=6)["faqs"]
    etiquette = next(f for f in faqs if "etiquette" in f["question"])
    text = " ".join(c["text"] for c in etiquette["answer"]["claims"])
    assert "Remove footwear at religious sites" in text and len(etiquette["answer"]["claims"]) > 1
