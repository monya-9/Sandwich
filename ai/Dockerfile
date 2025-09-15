FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client redis-tools ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

COPY . .
CMD ["bash", "-lc", "sleep infinity"]
