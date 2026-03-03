#!/usr/bin/env bash
# Backend deploy script — build Docker image and deploy to Cloud Run.
# Run this after any backend changes to deploy in one shot.
# Usage (from repo root or backend folder):
#   ./backend/deploy.sh
#   ./backend/deploy.sh [REGION] [SERVICE_NAME]
# Requires: gcloud CLI, Docker, GCP project with Cloud Run + Artifact Registry enabled.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Repo root (parent of backend) — needed for gcloud builds submit when using Cloud Build
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

REGION="${1:-asia-south1}"
SERVICE_NAME="${2:-interview-ai-api}"
REPO_NAME="cloud-run-source-deploy"
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: Set GCP_PROJECT_ID or run: gcloud config set project YOUR_PROJECT_ID" >&2
  exit 1
fi

# Ensure Artifact Registry repo exists (idempotent)
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &>/dev/null; then
  echo "Creating Artifact Registry repository '$REPO_NAME' in $REGION..."
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Cloud Run source deploy"
fi

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo latest)"
echo "Building backend image: $IMAGE (linux/amd64 for Cloud Run)"
docker build --platform linux/amd64 -t "$IMAGE" -f "$SCRIPT_DIR/Dockerfile" "$SCRIPT_DIR"

echo "Configuring Docker for Artifact Registry..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

echo "Pushing to Artifact Registry..."
docker push "$IMAGE"

echo "Deploying to Cloud Run (region: $REGION)..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --cpu-boost

echo "Done. Service URL: $(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)')"
