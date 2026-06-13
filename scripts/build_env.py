#!/usr/bin/env python3
"""Generate .env from config.yaml for the Vite build."""

from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
config = yaml.safe_load((REPO_ROOT / "config.yaml").read_text())

fb = config["firebase"]
env_path = REPO_ROOT / ".env"
env_path.write_text(
    f"VITE_FIREBASE_API_KEY={fb['api_key']}\n"
    f"VITE_FIREBASE_AUTH_DOMAIN={fb['auth_domain']}\n"
    f"VITE_FIREBASE_PROJECT_ID={fb['project_id']}\n"
    f"VITE_FIREBASE_STORAGE_BUCKET={fb['storage_bucket']}\n"
    f"VITE_FIREBASE_MESSAGING_SENDER_ID={fb['messaging_sender_id']}\n"
    f"VITE_FIREBASE_APP_ID={fb['app_id']}\n"
)
print(f"Wrote {env_path}")
