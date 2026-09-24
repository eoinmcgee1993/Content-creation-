"""Generate one Seedance 2.5 text-to-video clip through the Higgsfield SDK.

Credentials come from HF_KEY ("key-id:key-secret") in .env.local next to this
file, or from the process environment. The value is never printed.
"""
import sys
from pathlib import Path

import higgsfield_client
from dotenv import load_dotenv

MODEL = "bytedance/seedance-2.5/text-to-video"
ARGUMENTS = {
    "prompt": "A cinematic scene at sunset",
    "duration": 5,
    "resolution": "720p",
    "aspect_ratio": "16:9",
}

load_dotenv(Path(__file__).with_name(".env.local"))


def on_queue_update(status: higgsfield_client.Status) -> None:
    print(f"status: {type(status).__name__}", file=sys.stderr)


def main() -> int:
    try:
        result = higgsfield_client.subscribe(
            MODEL,
            arguments=ARGUMENTS,
            on_enqueue=lambda request_id: print(f"request: {request_id}", file=sys.stderr),
            on_queue_update=on_queue_update,
        )
    except higgsfield_client.CredentialsMissedError:
        print("HF_KEY is not set. Add it to higgsfield-seedance/.env.local.", file=sys.stderr)
        return 1
    except higgsfield_client.HiggsfieldClientError as error:
        print(f"Higgsfield API error: {error}", file=sys.stderr)
        return 1

    # subscribe() returns the final payload for every terminal state, including
    # failed, nsfw (moderated) and canceled, so success must be checked here.
    status = result.get("status")
    if status != "completed":
        print(f"Generation did not succeed (status: {status}).", file=sys.stderr)
        return 1

    url = (result.get("video") or {}).get("url")
    if not url:
        print(f"Completed, but no video URL in response keys: {sorted(result)}", file=sys.stderr)
        return 1

    print(url)
    return 0


if __name__ == "__main__":
    sys.exit(main())
