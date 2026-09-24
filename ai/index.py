"""Builds and opens the Chroma index. Cosine space, so similarity = 1 - distance."""
import chromadb
from .config import CHROMA_PATH, EMBED_MODEL
from .corpus import load_documents

_model = None
_client = None
COLLECTIONS = ("place_kb", "poi_facts_kb")


def model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(EMBED_MODEL)
    return _model


def embed(texts):
    return [list(map(float, v)) for v in
            model().encode(texts, normalize_embeddings=True, batch_size=32)]


def client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    return _client


def collections():
    return {n: client().get_or_create_collection(n, metadata={"hnsw:space": "cosine"})
            for n in COLLECTIONS}


def build(reset=False):
    docs = load_documents()
    counts = {}
    for name in COLLECTIONS:
        subset = [d for d in docs if d["meta"]["collection"] == name]
        coll = client().get_or_create_collection(name, metadata={"hnsw:space": "cosine"})
        if reset and coll.count():
            client().delete_collection(name)
            coll = client().create_collection(name, metadata={"hnsw:space": "cosine"})
        if coll.count() != len(subset):
            for i in range(0, len(subset), 500):
                b = subset[i:i + 500]
                coll.add(ids=[d["id"] for d in b], documents=[d["text"] for d in b],
                         metadatas=[d["meta"] for d in b],
                         embeddings=embed([d["text"] for d in b]))
        counts[name] = coll.count()
    return counts


if __name__ == "__main__":
    import sys
    print(build(reset="--reset" in sys.argv))
