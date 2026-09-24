# GeoGuide API image (the frontend deploys separately as a static site; see docs/DEPLOY.md).
#   docker build -t geoguide-api .
#   docker run -p 8000:8000 --env-file .env geoguide-api
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/app/.cache/hf
WORKDIR /app

# CPU-only PyTorch first: the default wheel pulls ~2 GB of CUDA libraries a CPU server never uses.
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch
COPY backend/requirements.txt backend/requirements.txt
RUN pip install -r backend/requirements.txt

COPY ai ai
COPY backend backend
COPY data-model data-model

# Build the vector index and cache the embedding model inside the image, so a new
# container starts without downloading anything. Keys are never baked in: they come
# from the host's environment variables at run time.
RUN python -m ai.index --reset

EXPOSE 8000
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
