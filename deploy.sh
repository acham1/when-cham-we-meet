#!/usr/bin/env bash
set -euo pipefail

# Deploy When2Meet to Firebase Hosting.
#
# First-time setup:
#   1. Create a Firebase project and enable Authentication → Google provider
#   2. Create a Firestore database in Native mode
#   3. Copy .env.example to a local .env file, fill in your Firebase web-app config
#   4. Store secrets in Secret Manager:
#        gcloud secrets create when2meet-env --project=YOUR_PROJECT
#        gcloud secrets versions add when2meet-env --data-file=.env --project=YOUR_PROJECT
#   5. Deploy Firestore security rules:
#        npx firebase deploy --only firestore:rules --project YOUR_PROJECT
#   6. Run this script: ./deploy.sh

CONFIG_FILE="config.yaml"

if ! command -v python3 &>/dev/null; then
  echo "Error: python3 is required to parse config.yaml" >&2
  exit 1
fi

GCP_PROJECT=$(python3 -c "import yaml; print(yaml.safe_load(open('$CONFIG_FILE'))['gcp']['project'])")
SECRET_NAME=$(python3 -c "import yaml; print(yaml.safe_load(open('$CONFIG_FILE'))['gcp']['secret_name'])")

echo "==> Fetching secrets from Secret Manager (${SECRET_NAME})..."
gcloud secrets versions access latest \
  --secret="$SECRET_NAME" \
  --project="$GCP_PROJECT" > .env

echo "==> Building..."
npm run build

echo "==> Deploying to Firebase Hosting..."
npx firebase deploy --only hosting --project "$GCP_PROJECT"

rm -f .env
echo "==> Done!"
