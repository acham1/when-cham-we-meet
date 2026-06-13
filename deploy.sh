#!/usr/bin/env bash
set -euo pipefail

# Deploy Firestore security rules.
#
# First-time setup:
#   1. Enable Firebase in the GCP console for project "when-cham-we-meet"
#   2. Enable Authentication → Google provider
#   3. Create a Firestore database in Native mode
#   4. Create a Firebase web app, add its config values to config.yaml
#   5. Add when-cham-we-meet.alanch.am as an authorized domain in Firebase Auth settings
#   6. Restrict the Firebase API key in GCP Console → APIs & Services → Credentials:
#      - API restrictions → Restrict to: Identity Toolkit API, Cloud Firestore API
#      - This prevents abuse if other APIs (e.g. Gemini) are enabled on the project
#      - See: https://trufflesecurity.com/blog/google-api-keys-werent-secrets-but-then-gemini-changed-the-rules

CONFIG_FILE="config.yaml"

if ! command -v python3 &>/dev/null; then
  echo "Error: python3 is required to parse config.yaml" >&2
  exit 1
fi

GCP_PROJECT=$(python3 -c "import yaml; print(yaml.safe_load(open('$CONFIG_FILE'))['gcp']['project'])")

echo "==> Deploying Firestore security rules..."
npx firebase deploy --only firestore:rules --project "$GCP_PROJECT"
echo "==> Done!"
