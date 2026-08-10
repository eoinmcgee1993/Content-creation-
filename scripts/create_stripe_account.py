#!/usr/bin/env python3
"""Create a Stripe v2 Core account from a JSON config file.

Usage:
    STRIPE_SECRET_KEY=sk_test_... python3 scripts/create_stripe_account.py \
        scripts/stripe_accounts/furever.json

Config files hold only non-secret business/account details (see
scripts/stripe_accounts/furever.json for an example). The Stripe secret key
is never read from a file or CLI arg — only from the STRIPE_SECRET_KEY
environment variable — so it can't end up committed to the repo.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

STRIPE_API_URL = "https://api.stripe.com/v2/core/accounts"
STRIPE_VERSION = "2026-07-29.preview"


def create_account(config_path: str, secret_key: str) -> dict:
    with open(config_path) as f:
        body = json.load(f)

    request = urllib.request.Request(
        STRIPE_API_URL,
        data=json.dumps(body).encode(),
        method="POST",
        headers={
            "Authorization": f"Bearer {secret_key}",
            "Stripe-Version": STRIPE_VERSION,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request) as response:
            return json.load(response)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Stripe API error ({e.code}): {e.read().decode()}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("config", help="Path to a JSON account config, e.g. scripts/stripe_accounts/furever.json")
    args = parser.parse_args()

    secret_key = os.getenv("STRIPE_SECRET_KEY")
    if not secret_key:
        sys.exit("STRIPE_SECRET_KEY environment variable is not set")

    account = create_account(args.config, secret_key)
    print(json.dumps(account, indent=2))


if __name__ == "__main__":
    main()
