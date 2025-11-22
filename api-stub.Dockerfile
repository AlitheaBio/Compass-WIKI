FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY devkit/api_stub/requirements.txt /tmp/devkit-requirements.txt
RUN pip install -r /tmp/devkit-requirements.txt

COPY devkit/api_stub /app/devkit/api_stub
COPY docs/api /app/docs/api

EXPOSE 4100

CMD ["uvicorn", "devkit.api_stub.main:app", "--host", "0.0.0.0", "--port", "4100"]
