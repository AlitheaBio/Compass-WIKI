FROM python:3.14-slim@sha256:3955a7dd66ccf92b68d0232f7f86d892eaf75255511dc7e98961bdc990dc6c9b

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

RUN groupadd -r appgroup && useradd -r -g appgroup -u 1001 appuser

COPY api_stub/requirements.txt /tmp/api-stub-requirements.txt
RUN pip install --no-cache-dir -r /tmp/api-stub-requirements.txt

RUN mkdir -p /var/lib/devkit && chown -R appuser:appgroup /var/lib/devkit

COPY --chown=appuser:appgroup api_stub /app/api_stub

USER appuser

EXPOSE 4100

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:4100/v1/system/ready || exit 1

CMD ["uvicorn", "api_stub.main:app", "--host", "0.0.0.0", "--port", "4100"]
