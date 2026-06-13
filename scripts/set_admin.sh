#!/usr/bin/env bash
set -euo pipefail

# Grant admin custom claim to a Firebase Auth user.
# Usage: ./scripts/set_admin.sh <uid>

if [ $# -ne 1 ]; then
  echo "Usage: $0 <firebase-auth-uid>" >&2
  exit 1
fi

USER_UID="$1"
PROJECT="when-cham-we-meet"

echo "==> Setting admin claim for UID: $USER_UID"

ACCESS_TOKEN=$(gcloud auth print-access-token)

curl -s -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:update?key=unused" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Goog-User-Project: $PROJECT" \
  -H "Content-Type: application/json" \
  -d "{
    \"localId\": \"$USER_UID\",
    \"customAttributes\": \"{\\\"admin\\\": true}\"
  }" | python3 -c "import sys,json; r=json.load(sys.stdin); print('Done.' if 'localId' in r else f'Error: {r}')"

echo "==> User must sign out and back in for the claim to take effect."
