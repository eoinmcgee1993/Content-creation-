"""Generate one Seedance 2.5 text-to-video clip through the Higgsfield SDK.

Credentials come from HF_KEY ("key-id:key-secret") in .env.local next to this
file, or from the process environment. The value is never printed.
"""
import sys
from pathlib import Path

import higgsfield_client
import httpx
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


def first_media_url(result: dict) -> str | None:
    """Return the output URL from a completed payload.

    subscribe() returns the backend JSON unchanged, and the SDK's documented
    shape is a plural media key holding a list of objects — result["images"][0]
    ["url"] for images, so result["videos"][0]["url"] for this text-to-video
    model. Scan the plausible media keys instead of hard-coding one.
    """
    for key in ("videos", "images"):
        items = result.get(key)
        if isinstance(items, list) and items and isinstance(items[0], dict):
            url = items[0].get("url")
            if url:
                return url
    return None


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
    except httpx.HTTPError as error:
        # The SDK wraps HTTP *status* errors into HiggsfieldClientError, but raw
        # connect/timeout failures during the minutes-long poll loop escape
        # unwrapped as httpx errors. Catch them so a transient blip exits 1
        # cleanly instead of dumping a traceback.
        print(f"Network error talking to Higgsfield: {error}", file=sys.stderr)
        return 1

    # subscribe() returns the final payload for every terminal state, including
    # failed, nsfw (moderated) and canceled, so success must be checked here.
    status = result.get("status")
    if status != "completed":
        print(f"Generation did not succeed (status: {status}).", file=sys.stderr)
        return 1

    url = first_media_url(result)
    if not url:
        print(f"Completed, but no video URL in response keys: {sorted(result)}", file=sys.stderr)
        return 1

    print(url)
    return 0


if __name__ == "__main__":
    sys.exit(main())
