FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    LEADS_PATH=/data/leads.csv

WORKDIR /app

COPY landing/requirements.txt landing/requirements.txt
RUN pip install --no-cache-dir -r landing/requirements.txt

COPY . .

# Persistent location for captured leads; mount a volume here in prod.
RUN mkdir -p /data && useradd --create-home appuser \
    && chown -R appuser:appuser /app /data
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request,os,sys; \
  sys.exit(0) if urllib.request.urlopen('http://127.0.0.1:%s/healthz' % os.environ.get('PORT','8000'), timeout=4).status==200 else sys.exit(1)"

CMD ["sh", "-c", "gunicorn 'landing.app:app' --bind 0.0.0.0:${PORT} --workers 2 --timeout 60"]
