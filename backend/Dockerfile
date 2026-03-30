FROM python:3.11-slim

ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}

WORKDIR /app

# Install system dependencies
# ffmpeg is needed for openai-whisper
# default-libmysqlclient-dev and build-essential for pymysql/sqlalchemy
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    ffmpeg \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install common dependencies not always listed but required by shared
RUN pip install --no-cache-dir sqlalchemy pymysql pydantic PyJWT

# Install service specific requirements
COPY ./${SERVICE_NAME}/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Download spacy model for fr_core_news_sm if spacy is installed (cv_service, job_service)
RUN if grep -q "spacy" /app/requirements.txt; then python -m spacy download fr_core_news_sm; fi

# Copy shared logic
COPY ./shared /app/shared

# Copy service code
COPY ./${SERVICE_NAME} /app/${SERVICE_NAME}

# Add service directory to Python path to allow absolute imports like `import schemas` to work correctly 
ENV PYTHONPATH=/app/${SERVICE_NAME}:/app

# The command to run the service
CMD uvicorn ${SERVICE_NAME}.main:app --host 0.0.0.0 --port 8000 --reload
