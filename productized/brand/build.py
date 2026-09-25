#!/usr/bin/env python3
"""Render the EdgeVault and Growth Fabric brand assets from HTML.

Every word on these images is product copy that has to match the listings
exactly, so the text is typeset, not generated: an image model asked to spell
"HMAC-SHA256" or "$39" will sometimes get it wrong, and a wrong price on a
cover is worse than no cover. Generative imagery (Higgsfield marketplace
cards) is layered on top separately — see higgsfield-cards.sh.

Usage:
    python3 productized/brand/build.py                  # every asset
    python3 productized/brand/build.py edgevault        # one product

Needs: Python 3.10+, Pillow, npm (fetches the fonts once), and a headless
Chromium (auto-detected; override with CHROME_BIN).
"""
from __future__ import annotations

import base64
import glob
import html
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
CACHE = HERE / ".cache"

# Open-licensed (OFL) variable fonts, fetched from the npm registry via
# Fontsource. Not committed; the build downloads them on first run.
FONTS = {
    "SG": ("@fontsource-variable/space-grotesk", "space-grotesk-latin-wght-normal.woff2", "300 700"),
    "IN": ("@fontsource-variable/inter", "inter-latin-wght-normal.woff2", "100 900"),
    "JB": ("@fontsource-variable/jetbrains-mono", "jetbrains-mono-latin-wght-normal.woff2", "100 800"),
}

BRANDS = {
    "edgevault": {
        "name": "EdgeVault",
        "price": "$49",
        "bg": "#0A0F1C", "panel": "#111A2E", "line": "#22304D",
        "text": "#E8EEF9", "muted": "#8C9BB8",
        "a1": "#3CF2B1",  # signal mint: verified / paid
        "a2": "#FFB547",  # vault amber: pending / 402
        "ok": "#3CF2B1", "bad": "#FF5C72",
        "glow2": "#2F6BFF",  # amber reads as a brown smudge at glow opacity; cool blue doesn't
    },
    "growth-fabric": {
        "name": "Growth Fabric",
        "price": "$39",
        "bg": "#120B1F", "panel": "#1C1330", "line": "#33264F",
        "text": "#F4EEFF", "muted": "#A99CC4",
        "a1": "#FF7A59",  # thread A: the generating agent
        "a2": "#A58BFF",  # thread B: the approving agent
        "ok": "#5BE3A6", "bad": "#FF5C72",
        "glow2": "#A58BFF",
    },
}


# --------------------------------------------------------------------------
# Fonts and Chromium
# --------------------------------------------------------------------------

def font_css() -> str:
    fontdir = CACHE / "fonts"
    fontdir.mkdir(parents=True, exist_ok=True)
    rules = []
    for family, (pkg, filename, weights) in FONTS.items():
        path = fontdir / filename
        if not path.exists():
            with tempfile.TemporaryDirectory() as tmp:
                subprocess.run(["npm", "pack", pkg, "--quiet"], cwd=tmp, check=True,
                               stdout=subprocess.DEVNULL)
                tgz = next(Path(tmp).glob("*.tgz"))
                with tarfile.open(tgz) as tar:
                    member = next(m for m in tar.getmembers() if m.name.endswith("/" + filename))
                    path.write_bytes(tar.extractfile(member).read())
        b64 = base64.b64encode(path.read_bytes()).decode()
        rules.append(
            f"@font-face{{font-family:{family};src:url(data:font/woff2;base64,{b64}) "
            f"format('woff2');font-weight:{weights};font-display:block}}"
        )
    return "\n".join(rules)


def find_chrome() -> str:
    if os.environ.get("CHROME_BIN"):
        return os.environ["CHROME_BIN"]
    hits = sorted(glob.glob("/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell"))
    if hits:
        return hits[-1]
    for name in ("chromium", "chromium-browser", "google-chrome"):
        if shutil.which(name):
            return shutil.which(name)
    sys.exit("No headless Chromium found; set CHROME_BIN.")


OVERFLOWS: list[str] = []

# A fixed-size canvas fails silently: text that doesn't fit is simply cut off
# at the edge of the PNG. This runs in the page and marks the body when the
# layout is bigger than the canvas, or a code window is clipping a line.
OVERFLOW_CHECK = """<script>
document.fonts.ready.then(function(){
  var c=document.querySelector('.content'), over=c.scrollHeight>c.clientHeight+1||c.scrollWidth>c.clientWidth+1;
  document.querySelectorAll('pre').forEach(function(p){ if(p.scrollWidth>p.clientWidth+1) over=true; });
  document.body.setAttribute('data-overflow', over?'1':'0');
});
</script>"""


def render(page: str, out: Path, w: int, h: int, scale: int) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    src = CACHE / "html" / (out.parent.parent.name + "-" + out.parent.name + "-" + out.stem + ".html")
    src.parent.mkdir(parents=True, exist_ok=True)
    src.write_text(page, encoding="utf-8")
    common = [CHROME, "--no-sandbox", "--disable-gpu", "--hide-scrollbars", f"--window-size={w},{h}",
              "--virtual-time-budget=2500"]
    subprocess.run(common + [f"--force-device-scale-factor={scale}", f"--screenshot={out}", src.as_uri()],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    dom = subprocess.run(common + ["--dump-dom", src.as_uri()], check=True, capture_output=True, text=True).stdout
    img = Image.open(out)
    if img.size != (w * scale, h * scale):
        sys.exit(f"{out}: rendered {img.size}, expected {(w * scale, h * scale)}")
    img.save(out, optimize=True)
    status = "ok"
    if 'data-overflow="1"' in dom:
        status = "OVERFLOW"
        OVERFLOWS.append(str(out.relative_to(HERE)))
    elif 'data-overflow="0"' not in dom:
        status = "overflow check did not run"
        OVERFLOWS.append(str(out.relative_to(HERE)) + " (check did not run)")
    print(f"  {out.relative_to(HERE)}  {img.size[0]}x{img.size[1]}  {status}")


# --------------------------------------------------------------------------
# Marks
# --------------------------------------------------------------------------

def mark(slug: str, b: dict) -> str:
    if slug == "edgevault":
        # A vault door: four bolts, and a keyhole where the dial would be.
        bolts = "".join(
            f'<circle cx="{x}" cy="{y}" r="2.4" fill="{b["a1"]}"/>'
            for x in (14.5, 49.5) for y in (14.5, 49.5)
        )
        return (
            f'<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">'
            f'<rect x="3" y="3" width="58" height="58" rx="16" fill="{b["panel"]}" '
            f'stroke="{b["a1"]}" stroke-width="3"/>{bolts}'
            f'<circle cx="32" cy="28.5" r="8" fill="none" stroke="{b["a1"]}" stroke-width="3.5"/>'
            f'<path d="M32 36.5V45" stroke="{b["a1"]}" stroke-width="3.5" stroke-linecap="round"/>'
            f'</svg>'
        )
    # Two threads, genuinely woven: A crosses over B on the left, B over A on
    # the right. The halo strokes are what make the over/under read.
    a = "M10 24C21 24 21 40 32 40S43 24 54 24"
    bpath = "M10 40C21 40 21 24 32 24S43 40 54 40"
    return (
        f'<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">'
        f'<rect x="3" y="3" width="58" height="58" rx="16" fill="{b["panel"]}" '
        f'stroke="{b["a1"]}" stroke-width="3"/>'
        f'<path d="{bpath}" stroke="{b["a2"]}" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
        f'<path d="{a}" stroke="{b["panel"]}" stroke-width="9" fill="none"/>'
        f'<path d="{a}" stroke="{b["a1"]}" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
        f'<path d="M40.2 27.9L45.8 36.1" stroke="{b["panel"]}" stroke-width="9"/>'
        f'<path d="M40.2 27.9L45.8 36.1" stroke="{b["a2"]}" stroke-width="4.5"/>'
        f'</svg>'
    )


def sized_mark(slug: str, px: int) -> str:
    return mark(slug, BRANDS[slug]).replace("<svg ", f'<svg width="{px}" height="{px}" ', 1)


ICON_X = ('<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" '
          'stroke-width="3" stroke-linecap="round"/></svg>')
ICON_OK = ('<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" '
           'stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>')


# --------------------------------------------------------------------------
# Page shell and shared CSS
# --------------------------------------------------------------------------

BASE_CSS = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden;background:var(--bg);color:var(--text);font-family:IN,sans-serif;
  -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.canvas{position:relative;width:100%;height:100%;overflow:hidden}
.bg-grid{position:absolute;inset:0;background-image:linear-gradient(var(--line) 1px,transparent 1px),
  linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:60px 60px;opacity:.3;
  -webkit-mask-image:radial-gradient(ellipse 90% 70% at 85% 0%,#000 0%,transparent 75%)}
.bg-glow{position:absolute;width:1200px;height:1200px;right:-480px;top:-560px;border-radius:50%;
  background:radial-gradient(circle,color-mix(in srgb,var(--a1) 22%,transparent) 0%,transparent 62%)}
.bg-glow2{position:absolute;width:900px;height:900px;left:-420px;bottom:-520px;border-radius:50%;
  background:radial-gradient(circle,color-mix(in srgb,var(--glow2) 14%,transparent) 0%,transparent 62%)}
.content{position:relative;z-index:1;display:flex;flex-direction:column;height:100%}
.top{display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:16px}
.wordmark{font-family:SG;font-weight:700;letter-spacing:-.01em}
.counter{font-family:JB;color:var(--muted);letter-spacing:.08em}
.kicker{align-self:flex-start;font-family:JB;font-weight:600;letter-spacing:.12em;text-transform:uppercase;
  color:var(--a1);border:1.5px solid color-mix(in srgb,var(--a1) 55%,transparent);
  background:color-mix(in srgb,var(--a1) 9%,transparent);border-radius:999px}
h1{font-family:SG;font-weight:700;line-height:1.02;letter-spacing:-.028em}
h1 em{font-style:normal;color:var(--a1)}
h1 i{font-style:normal;color:var(--a2)}
.lede{color:var(--muted);line-height:1.38}
.lede b{color:var(--text);font-weight:600}
.mono{font-family:JB}
/* JetBrains Mono turns => into an arrow glyph; a code excerpt must show the characters as written. */
.mono,.code pre,.kicker,.chip,.counter,.bottom,.num,.step .t{font-feature-settings:"calt" 0,"liga" 0}
.accent{color:var(--a1)} .accent2{color:var(--a2)} .okc{color:var(--ok)} .badc{color:var(--bad)}
.list{display:flex;flex-direction:column;list-style:none}
.list li{display:flex;align-items:flex-start}
.ic{flex:none;display:grid;place-items:center;border-radius:14px}
.ic svg{width:60%;height:60%}
.ic.x{color:var(--bad);background:color-mix(in srgb,var(--bad) 14%,transparent);
  border:1.5px solid color-mix(in srgb,var(--bad) 45%,transparent)}
.ic.ok{color:var(--ok);background:color-mix(in srgb,var(--ok) 14%,transparent);
  border:1.5px solid color-mix(in srgb,var(--ok) 45%,transparent)}
.steps{display:flex;flex-direction:column}
.step{display:grid;position:relative}
.num{display:grid;place-items:center;background:var(--panel);font-family:JB;font-weight:700;color:var(--a1);
  border:1.5px solid color-mix(in srgb,var(--a1) 60%,transparent)}
.step .t{font-family:JB;font-weight:600;color:var(--text);letter-spacing:.02em}
.step .d{color:var(--muted);line-height:1.35}
.card{background:color-mix(in srgb,var(--panel) 88%,transparent);border:1.5px solid var(--line)}
.code{background:color-mix(in srgb,var(--bg) 70%,#000);border:1.5px solid var(--line);overflow:hidden;
  box-shadow:0 30px 80px rgba(0,0,0,.45)}
.code .bar{display:flex;align-items:center;gap:10px;border-bottom:1.5px solid var(--line);font-family:JB;
  color:var(--muted)}
.code .bar i{border-radius:50%;background:var(--line);display:block}
.code pre{font-family:JB;color:var(--text);white-space:pre}
.tk-k{color:var(--a2)} .tk-s{color:var(--a1)} .tk-c{color:color-mix(in srgb,var(--muted) 70%,var(--bg))}
.tk-f{color:#8FB4FF}
.chips{display:flex;flex-wrap:wrap}
.chip{font-family:JB;text-transform:uppercase;color:var(--muted);border:1.5px solid var(--line);border-radius:999px;
  letter-spacing:.1em}
.bottom{display:flex;justify-content:space-between;align-items:center;border-top:1.5px solid var(--line);
  font-family:JB;color:var(--muted);letter-spacing:.06em}
.bottom .cta{color:var(--a1)}
"""

# Instagram portrait carousel, 1080x1350.
IG_CSS = """
.content{padding:84px 88px 70px}
.brand svg{width:58px;height:58px}.wordmark{font-size:34px}.counter{font-size:22px}
.main{flex:1;display:flex;flex-direction:column;justify-content:center;gap:40px}
.kicker{font-size:21px;padding:10px 18px}
h1{font-size:78px}h1.hero{font-size:98px}
.lede{font-size:35px;max-width:880px}
.list{gap:26px}.list li{gap:24px;font-size:35px;line-height:1.3}.ic{width:50px;height:50px;margin-top:2px}
.step{grid-template-columns:66px 1fr;gap:28px;padding-bottom:30px}
.step:not(:last-child)::before{content:"";position:absolute;left:32px;top:66px;bottom:0;width:2px;
  background:linear-gradient(var(--a1),color-mix(in srgb,var(--a1) 12%,transparent))}
.num{width:66px;height:66px;border-radius:18px;font-size:26px}
.step .t{font-size:25px;margin-top:6px}.step .d{font-size:31px;margin-top:8px}
.card{border-radius:24px}
.bottom{padding-top:28px;font-size:22px}
"""

# Gumroad 16:9 gallery images, 1280x720 CSS rendered at 2x.
GR_CSS = """
.content{padding:60px 72px 52px}
.brand svg{width:46px;height:46px}.wordmark{font-size:27px}.counter{font-size:15px}
.kicker{font-size:14px;padding:8px 14px}
h1{font-size:58px}
.lede{font-size:21px;max-width:580px}
.chips{gap:10px}.chip{font-size:13px;padding:7px 13px}
.price{display:flex;align-items:baseline;gap:14px;font-family:SG;font-weight:700;font-size:46px;letter-spacing:-.02em}
.price small{font-family:JB;font-weight:500;font-size:14px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase}
.code{border-radius:18px}.code .bar{padding:13px 18px;font-size:13px}.code .bar i{width:9px;height:9px}
.code pre{font-size:15.5px;line-height:1.62;padding:20px 22px}
.card{border-radius:18px}
.bottom{padding-top:18px;font-size:14px}
"""


def page(slug: str, w: int, h: int, css: str, body: str) -> str:
    b = BRANDS[slug]
    root = ";".join(f"--{k}:{b[k]}" for k in
                    ("bg", "panel", "line", "text", "muted", "a1", "a2", "ok", "bad", "glow2"))
    return (
        "<!doctype html><html><head><meta charset='utf-8'><style>"
        f"{FONT_CSS}\n:root{{{root}}}\nhtml,body{{width:{w}px;height:{h}px}}\n{BASE_CSS}\n{css}"
        f"</style></head><body><div class='canvas'><div class='bg-grid'></div><div class='bg-glow'></div>"
        f"<div class='bg-glow2'></div><div class='content'>{body}</div></div>{OVERFLOW_CHECK}</body></html>"
    )


def brand_row(slug: str, right: str) -> str:
    b = BRANDS[slug]
    return (f"<div class='top'><div class='brand'>{mark(slug, b)}<span class='wordmark'>{b['name']}</span></div>"
            f"<div class='counter'>{right}</div></div>")


def xlist(items, kind="x") -> str:
    icon = ICON_X if kind == "x" else ICON_OK
    return "<ul class='list'>" + "".join(
        f"<li><span class='ic {kind}'>{icon}</span><span>{t}</span></li>" for t in items) + "</ul>"


def steps(items) -> str:
    return "<div class='steps'>" + "".join(
        f"<div class='step'><div class='num'>{i:02d}</div><div><div class='t'>{t}</div>"
        f"<div class='d'>{d}</div></div></div>" for i, (t, d) in enumerate(items, 1)) + "</div>"


def code_window(filename: str, code: str) -> str:
    return (f"<div class='code'><div class='bar'><i></i><i></i><i></i><span style='margin-left:8px'>"
            f"{html.escape(filename)}</span></div><pre>{code}</pre></div>")


# --------------------------------------------------------------------------
# Shared visual pieces
# --------------------------------------------------------------------------

EV_CODE = (
    "<span class='tk-c'>// excerpt — HMAC-SHA256 over the raw body</span>\n"
    "<span class='tk-k'>const</span> expected = <span class='tk-k'>await</span> <span class='tk-f'>hmacHex</span>(\n"
    "  secret,\n"
    "  <span class='tk-s'>`${timestamp}.${rawBody}`</span>,\n"
    ");\n"
    "<span class='tk-k'>if</span> (!provided.<span class='tk-f'>some</span>((p) =&gt;\n"
    "      <span class='tk-f'>timingSafeEqual</span>(p, expected))) {\n"
    "  <span class='tk-k'>return</span> { ok: <span class='tk-k'>false</span>,\n"
    "           reason: <span class='tk-s'>\"signature mismatch\"</span> };\n"
    "}"
)

GF_CODE = (
    "<span class='tk-c'>// Agent B output schema (pipeline 01, simplified)</span>\n"
    "{\n"
    "  <span class='tk-f'>\"status\"</span>: <span class='tk-s'>\"APPROVED\"</span> | <span class='tk-k'>\"REJECTED\"</span>,\n"
    "  <span class='tk-f'>\"reasoning\"</span>: string,\n"
    "  <span class='tk-f'>\"final_newsletter_markdown\"</span>: string\n"
    "}\n\n"
    "<span class='tk-c'>// REJECTED → rewrite + log, never sent</span>"
)


def gf_pattern(scale: float = 1.0, vertical: bool = False, trigger: bool = True) -> str:
    """Agent A writes, Agent B signs off, and only then does anything ship.

    The two outcomes are laid out across the flow — side by side when it runs
    down, stacked when it runs across — so the fork costs one row either way.
    """
    s = scale

    def node(label: str, sub: str, color: str) -> str:
        return (f"<div class='card' style='border-color:color-mix(in srgb,{color} 55%,transparent);"
                f"padding:{16*s}px {20*s}px;border-radius:{16*s}px;{'' if vertical else 'flex:1;'}'>"
                f"<div class='mono' style='font-size:{13*s}px;letter-spacing:.1em;color:{color};"
                f"text-transform:uppercase'>{label}</div>"
                f"<div style='font-family:SG;font-weight:600;font-size:{20*s}px;margin-top:{6*s}px'>{sub}</div></div>")

    def outcome(kind: str, text: str, color: str, icon: str) -> str:
        return (f"<div class='card' style='flex:1;padding:{12*s}px {16*s}px;border-radius:{14*s}px;"
                f"border-color:color-mix(in srgb,{color} 55%,transparent);display:flex;align-items:center;gap:{10*s}px'>"
                f"<span class='ic {kind}' style='width:{30*s}px;height:{30*s}px;border-radius:{9*s}px'>{icon}</span>"
                f"<span style='font-family:SG;font-weight:600;font-size:{19*s}px'>{text}</span></div>")

    arrow = (f"<div class='mono' style='color:var(--muted);font-size:{22*s}px;align-self:center;"
             f"{'transform:rotate(90deg);' if vertical else ''}'>→</div>")
    # Both two-agent pipelines (01, 03) are cron-triggered; the sheet-row
    # trigger belongs to 02, which has no Agent B.
    parts = ([node("Trigger", "On a schedule", "var(--muted)")] if trigger else []) + [
        node("Agent A", "Generates", "var(--a1)"),
        node("Agent B", "Approves or rejects", "var(--a2)"),
    ]
    fork = (f"<div style='display:flex;gap:{12*s}px;flex-direction:{'row' if vertical else 'column'};"
            f"{'' if vertical else 'flex:1.15;'}'>"
            + outcome("ok", "Ships", "var(--ok)", ICON_OK)
            + outcome("x", "Logged, stopped", "var(--bad)", ICON_X) + "</div>")
    direction = "column" if vertical else "row"
    return (f"<div style='display:flex;flex-direction:{direction};gap:{14*s}px;align-items:stretch'>"
            f"{arrow.join(parts)}{arrow}{fork}</div>")


# --------------------------------------------------------------------------
# Instagram carousels
# --------------------------------------------------------------------------

def ig_slides(slug: str) -> list[str]:
    b = BRANDS[slug]
    if slug == "edgevault":
        perm_rows = "".join(
            f"<div style='display:grid;grid-template-columns:1fr auto;align-items:center;padding:26px 34px;"
            f"{'' if i == 0 else 'border-top:1.5px solid var(--line);'}font-family:JB;font-size:34px'>"
            f"<span>{op}</span><span class='{cls}' style='display:flex;align-items:center;gap:14px'>"
            f"<span class='ic {ic}' style='width:44px;height:44px;border-radius:12px'>{ICON_OK if ic == 'ok' else ICON_X}</span>{verdict}</span></div>"
            for i, (op, cls, ic, verdict) in enumerate([
                ("INSERT", "okc", "ok", "allowed"),
                ("SELECT", "badc", "x", "no grant"),
                ("UPDATE", "badc", "x", "no grant"),
                ("DELETE", "badc", "x", "no grant"),
            ]))
        mech_rows = "".join(
            f"<div class='card' style='padding:24px 30px'><div style='font-family:SG;font-weight:600;font-size:33px'>{c}</div>"
            f"<div class='mono accent' style='font-size:22px;margin-top:10px;line-height:1.45'>{m}</div></div>"
            for c, m in [
                ("Can't self-declare “paid”", "BEFORE INSERT trigger resets the payment fields on every row"),
                ("No order-ID oracle", "wrong token → the same 404 as a wrong order id"),
                ("Secrets never in the repo or env", "one config table · RLS on · zero policies"),
                ("Operator view can't leak links", "SHA-256 key compare · token columns never selected"),
            ])
        return [
            f"<div class='kicker'>Stripe + Supabase kit</div>"
            f"<h1 class='hero'>Sell a digital file with Stripe. <em>Run zero servers.</em></h1>"
            f"<p class='lede'>Six Supabase Edge Functions and one SQL schema do all of the trusted work. "
            f"<b>Your page does none of it.</b></p>",

            f"<div class='kicker'>The problem</div>"
            f"<h1>Most checkout boilerplates <em>trust the browser.</em></h1>"
            + xlist([
                "A crafted request marks its own order “paid”.",
                "The webhook skips — or fumbles — the signature check.",
                "Different errors for a wrong id vs a wrong token leak which orders exist.",
            ]),

            f"<div class='kicker'>The one rule</div>"
            f"<h1>The browser can create. <em>Nothing else.</em></h1>"
            f"<div class='card' style='overflow:hidden'><div class='mono' style='padding:20px 34px;font-size:21px;"
            f"color:var(--muted);letter-spacing:.1em;border-bottom:1.5px solid var(--line);text-transform:uppercase'>"
            f"role: anon — the browser</div>{perm_rows}</div>"
            f"<p class='lede' style='font-size:31px'>Enforced twice — Postgres grants <b>and</b> row-level security — "
            f"so one misconfiguration doesn't undo it.</p>",

            f"<div class='kicker'>How payment works</div>"
            f"<h1>Only Stripe can mark <em>an order paid.</em></h1>"
            + steps([
                ("Browser", "INSERTs the order and a random download token"),
                ("Stripe Payment Link", "carries client_reference_id = the order id"),
                ("stripe-webhook", "HMAC-SHA256 · constant-time compare · 5-minute replay window"),
                ("Download", "(order id, token) and paid → the file. Unpaid → 402."),
            ]),

            f"<div class='kicker'>Security, by mechanism</div>"
            f"<h1 style='font-size:68px'>Every guarantee has <em>code behind it.</em></h1>"
            f"<div style='display:flex;flex-direction:column;gap:16px'>{mech_rows}</div>",

            f"<div class='kicker'>What you get</div>"
            f"<h1>The whole backend. <em>No server to run.</em></h1>"
            + xlist([
                "<b>6 Edge Functions</b> — payment webhook, paid-only download, one-way approval, "
                "order creation, send-once email, operator queue",
                "<b>SQL schema</b> — tables, indexes, triggers, RLS policies, grants",
                "<b>2 reference pages</b> — plain HTML, no framework",
                "<b>Setup guide</b> — a verification query at every step",
            ], kind="ok"),

            f"<div class='kicker'>EdgeVault</div>"
            f"<h1 class='hero'>{b['price']}. <em>One time.</em></h1>"
            f"<p class='lede'>Extracted from a system that has taken <b>real, live-mode Stripe payments</b> — "
            f"not a tutorial project.</p>"
            f"<div class='chips' style='gap:12px'>"
            + "".join(f"<span class='chip' style='font-size:20px;padding:10px 18px'>{c}</span>"
                      for c in ("Not for subscriptions", "No user accounts", "Backend, not a theme"))
            + "</div>",
        ]

    pipelines = {
        "01": ("Newsletter engine", "A daily issue that has to <em>pass review first.</em>", [
            ("6 AM cron", "TechCrunch, The Verge, Wired + Hacker News, deduped"),
            ("Agent A drafts", "and can open a full article, not just the RSS summary"),
            ("Agent B reviews", "APPROVED or REJECTED — with its reasoning"),
            ("Approved → Loops.so", "every send and every rejection logged to Postgres"),
        ]),
        "02": ("Affiliate social", "One sheet row in. <em>Three channels out.</em>", [
            ("New row", "in your Google Sheets product queue"),
            ("Live product data", "from the Rainforest API (Amazon)"),
            ("Copy + image", "short-form AI copy and a Fal.ai Flux image"),
            ("Publish", "Telegram, Instagram and a Facebook Page, in parallel"),
        ]),
        "03": ("B2B outreach", "Personal, grounded — <em>and checked.</em>", [
            ("Weekday 9 AM", "leads from Apollo.io; anyone already contacted is skipped"),
            ("Scrape their site", "real context, not a mail-merge field"),
            ("Agent A writes · Agent B checks", "a dedicated compliance guardrail must pass it"),
            ("Randomized delay → Gmail", "no identical-timestamp blasts"),
        ]),
    }
    slides = [
        f"<div class='kicker'>n8n · AI agents</div>"
        f"<h1 class='hero' style='font-size:94px'>Your AI agent shouldn't <em>grade its own homework.</em></h1>"
        f"<p class='lede'>Growth Fabric: three production n8n pipelines. <b>Two of them won't send a thing "
        f"until a second, independent agent approves it.</b></p>",

        f"<div class='kicker'>The problem</div>"
        f"<h1>Too many “AI agent” templates: <em>one prompt, straight to publish.</em></h1>"
        + xlist([
            "Nothing checks the output before it goes out.",
            "When the prompt drifts, the drift ships.",
            "No record of what was rejected — or why.",
        ]),

        f"<div class='kicker'>The pattern</div>"
        f"<h1>Agent A writes. <i>Agent B signs off.</i></h1>"
        + gf_pattern(scale=1.4, vertical=True, trigger=False)
        + "<p class='lede' style='font-size:29px'>A separate model call with its own structured-output schema "
          "— and the authority to block. <b>Pipelines 01 and 03.</b></p>",
    ]
    for num, (name, headline, st) in pipelines.items():
        slides.append(f"<div class='kicker'>Pipeline {num} · {name}</div><h1 style='font-size:72px'>{headline}</h1>"
                      + steps(st))
    slides.append(
        f"<div class='kicker'>Growth Fabric</div>"
        f"<h1 class='hero'>{b['price']}. <em>One time.</em></h1>"
        + xlist([
            "<b>3 importable workflows</b> — 76 nodes",
            "<b>Shared Postgres schema</b> — per-pipeline tables + 2 dashboard views",
            "<b>Setup guide</b> — every credential, variable and placeholder, by pipeline",
        ], kind="ok")
        + "<p class='lede' style='font-size:29px'>Not zero-setup: <b>bring your own keys</b> — OpenAI, Postgres, "
          "plus each pipeline's services.</p>"
    )
    return slides


def build_ig(slug: str) -> None:
    slides = ig_slides(slug)
    n = len(slides)
    for i, content in enumerate(slides, 1):
        last = i == n
        footer = (f"<div class='bottom'><span>{BRANDS[slug]['name']}</span>"
                  f"<span class='cta'>{'Link in bio →' if last else 'Swipe →'}</span></div>")
        body = brand_row(slug, f"{i:02d} / {n:02d}") + f"<div class='main'>{content}</div>" + footer
        render(page(slug, 1080, 1350, IG_CSS, body), HERE / slug / "instagram" / f"{i:02d}.png", 1080, 1350, 1)


# --------------------------------------------------------------------------
# Gumroad images
# --------------------------------------------------------------------------

COPY = {
    "edgevault": {
        "h1px": 58,
        "headline": "Sell a digital file with Stripe. <em>Run zero servers.</em>",
        "lede": "Six Supabase Edge Functions and one SQL schema. <b>The browser can create an order — and nothing else.</b>",
        "chips": ("Supabase Edge Functions", "Stripe webhooks", "RLS + grants"),
        "tagline": "Stripe + Supabase fulfillment kit",
    },
    "growth-fabric": {
        "h1px": 52,
        # "Two", not "all three": the affiliate-social pipeline has one LLM call
        # and a readiness check, not a second reviewing agent.
        "headline": "Three n8n AI pipelines. <em>Two with a second agent that must approve.</em>",
        "lede": "Newsletter and B2B outreach can't send until a separate agent signs off. "
                "<b>Plus affiliate social, and a shared Postgres schema.</b>",
        "chips": ("n8n", "OpenAI", "Postgres"),
        "tagline": "Three production n8n AI pipelines",
    },
}


def build_gumroad(slug: str) -> None:
    b, c = BRANDS[slug], COPY[slug]
    out = HERE / slug / "gumroad"
    chips = "<div class='chips'>" + "".join(f"<span class='chip'>{x}</span>" for x in c["chips"]) + "</div>"
    visual = code_window("stripe-webhook/index.ts", EV_CODE) if slug == "edgevault" else (
        "<div style='display:flex;flex-direction:column;gap:18px'>" + gf_pattern(scale=0.86, trigger=False)
        + code_window("pipeline-1 · Agent B", GF_CODE) + "</div>")
    price = f"<div class='price'>{b['price']}<small>one-time · digital download</small></div>"

    cover = (brand_row(slug, "")
             + "<div style='flex:1;display:grid;grid-template-columns:1.02fr .98fr;gap:52px;align-items:center'>"
             f"<div style='display:flex;flex-direction:column;gap:24px'>"
             f"<h1 style='font-size:{c['h1px']}px'>{c['headline']}</h1>"
             f"<p class='lede'>{c['lede']}</p>{chips}{price}</div><div>{visual}</div></div>")
    render(page(slug, 1280, 720, GR_CSS, cover), out / "cover.png", 1280, 720, 2)

    if slug == "edgevault":
        flow = [
            ("Browser", "INSERTs the order + a random download token. anon holds INSERT and nothing else."),
            ("Payment Link", "Stripe checkout carries client_reference_id = the order id."),
            ("stripe-webhook", "HMAC-SHA256 over the raw body, constant-time compare, 5-min replay window."),
            ("Download", "(order id, token) + paid → file. Wrong token: same 404 as a wrong id."),
        ]
        title = "Only Stripe can mark <em>an order paid.</em>"
        foot = "The browser holds a publishable key that can INSERT — no SELECT, no UPDATE, enforced by grants and RLS."
    else:
        flow = [
            ("Trigger", "On a schedule: daily 6 AM (01), weekdays 9 AM (03). Dedup runs before any model call."),
            ("Agent A", "Generates: the newsletter draft, or the personalized pitch."),
            ("Agent B", "A separate model call returns a structured verdict with its reasoning."),
            ("Ship or stop", "Approved → sent. Rejected → logged to Postgres, never sent."),
        ]
        title = "Agent A writes. <i>Agent B signs off.</i>"
        foot = ("Pipelines 01 (newsletter) and 03 (B2B outreach). Pipeline 02 (affiliate social) "
                "gates publishing on a deterministic readiness check instead.")
    cards = "".join(
        f"<div class='card' style='padding:22px 22px 24px;display:flex;flex-direction:column;gap:12px'>"
        f"<div class='num' style='width:44px;height:44px;border-radius:13px;font-size:17px'>{i:02d}</div>"
        f"<div class='mono' style='font-weight:600;font-size:17px'>{t}</div>"
        f"<div style='color:var(--muted);font-size:17px;line-height:1.45'>{d}</div></div>"
        for i, (t, d) in enumerate(flow, 1))
    how = (brand_row(slug, "How it works")
           + f"<div style='flex:1;display:flex;flex-direction:column;justify-content:center;gap:34px'>"
           f"<h1 style='font-size:54px'>{title}</h1>"
           f"<div style='display:grid;grid-template-columns:repeat(4,1fr);gap:16px'>{cards}</div>"
           f"<p class='lede' style='font-size:18px;max-width:none'>{foot}</p></div>")
    render(page(slug, 1280, 720, GR_CSS, how), out / "how-it-works.png", 1280, 720, 2)

    if slug == "edgevault":
        items = [
            ("6 Edge Functions", "Payment webhook · paid-only download · one-way approval · server-side order "
                                 "creation · send-once email · operator queue"),
            ("SQL schema", "Tables, indexes, BEFORE INSERT triggers, RLS policies, grants"),
            ("2 reference pages", "Plain-HTML order form and download page — no framework"),
            ("Setup guide", "Empty project to verified live purchase, with a check at every step"),
        ]
        side_title, side = "Not in the box", ["Subscriptions / billing portal", "User accounts or login",
                                              "A themed storefront"]
    else:
        items = [
            ("Pipeline 01 · Newsletter engine", "26 nodes · RSS + Hacker News → Agent A → Agent B QA → Loops.so"),
            ("Pipeline 02 · Affiliate social", "23 nodes · sheet row → Rainforest → copy + Fal.ai image → 3 channels"),
            ("Pipeline 03 · B2B outreach", "27 nodes · Apollo → site scrape → Agent A → compliance agent → Gmail"),
            ("Shared Postgres schema", "Execution log + one table per pipeline + 2 dashboard views"),
        ]
        side_title, side = "Bring your own keys", ["OpenAI · Postgres (all three)", "Loops.so (01)",
                                                   "Sheets · Rainforest · Fal.ai · Telegram · Meta (02)",
                                                   "Apollo.io · Gmail · Sheets (03)"]
    rows = "".join(
        f"<div style='display:flex;gap:16px;align-items:flex-start'><span class='ic ok' style='width:34px;height:34px;"
        f"border-radius:10px;margin-top:2px'>{ICON_OK}</span><div><div style='font-family:SG;font-weight:600;"
        f"font-size:23px'>{t}</div><div style='color:var(--muted);font-size:17px;line-height:1.45;margin-top:4px'>{d}"
        f"</div></div></div>" for t, d in items)
    side_html = "".join(f"<div style='font-size:17px;color:var(--muted);padding:12px 0;border-top:1.5px solid "
                        f"var(--line)'>{s}</div>" for s in side)
    inc = (brand_row(slug, "What's included")
           + "<div style='flex:1;display:grid;grid-template-columns:1.45fr .8fr;gap:40px;align-items:center'>"
           f"<div style='display:flex;flex-direction:column;gap:22px'><h1 style='font-size:50px'>What's in "
           f"<em>the kit.</em></h1>{rows}</div>"
           f"<div class='card' style='padding:26px 26px 14px'><div class='mono accent2' style='font-size:14px;"
           f"letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px'>{side_title}</div>{side_html}</div></div>")
    render(page(slug, 1280, 720, GR_CSS, inc), out / "whats-included.png", 1280, 720, 2)

    # Square thumbnail: legible at 120px in a Gumroad library grid.
    thumb = (f"<div style='flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px'>"
             f"<div style='width:250px;height:250px'>{sized_mark(slug, 250)}</div>"
             f"<div class='wordmark' style='font-size:{64 if slug == 'edgevault' else 58}px'>{b['name']}</div>"
             f"<div class='mono' style='font-size:19px;color:var(--muted);letter-spacing:.12em;text-transform:uppercase'>"
             f"{c['tagline']}</div></div>")
    render(page(slug, 600, 600, "", thumb), out / "thumbnail.png", 600, 600, 2)


def build_keyart(slug: str) -> None:
    """Square product shot, used as the --image reference for Higgsfield marketplace cards."""
    b, c = BRANDS[slug], COPY[slug]
    visual = code_window("stripe-webhook/index.ts", EV_CODE) if slug == "edgevault" else (
        gf_pattern(scale=0.95, vertical=False))
    body = (f"<div style='flex:1;display:flex;flex-direction:column;justify-content:center;gap:40px;padding:84px'>"
            f"<div class='brand' style='gap:24px'><div style='width:120px;height:120px'>"
            f"{sized_mark(slug, 120)}</div>"
            f"<span class='wordmark' style='font-size:76px'>{b['name']}</span></div>"
            f"<div class='mono' style='font-size:22px;color:var(--muted);letter-spacing:.14em;text-transform:uppercase'>"
            f"{c['tagline']}</div><div style='font-size:15px'>{visual}</div></div>")
    render(page(slug, 1024, 1024, GR_CSS, body), HERE / slug / "keyart.png", 1024, 1024, 1)


def build_previews(slug: str) -> None:
    """One overview image per channel, so the blueprint can show a set at a glance."""
    bg = BRANDS[slug]["bg"]

    def sheet(tiles: list[Path], cols: int, cell: tuple[int, int], out: Path) -> None:
        gap, pad = 20, 28
        rows = -(-len(tiles) // cols)
        canvas = Image.new("RGB", (pad * 2 + cols * cell[0] + (cols - 1) * gap,
                                   pad * 2 + rows * cell[1] + (rows - 1) * gap), bg)
        for i, path in enumerate(tiles):
            img = Image.open(path).convert("RGB")
            img.thumbnail(cell, Image.LANCZOS)
            x = pad + (i % cols) * (cell[0] + gap) + (cell[0] - img.width) // 2
            y = pad + (i // cols) * (cell[1] + gap) + (cell[1] - img.height) // 2
            canvas.paste(img, (x, y))
        canvas.save(out, optimize=True)
        print(f"  {out.relative_to(HERE)}  {canvas.width}x{canvas.height}  preview")

    base = HERE / slug
    sheet(sorted((base / "instagram").glob("[0-9][0-9].png")), 4, (360, 450), base / "instagram" / "preview.png")
    sheet([base / "gumroad" / f for f in ("cover.png", "how-it-works.png", "whats-included.png", "thumbnail.png")],
          2, (800, 450), base / "gumroad" / "preview.png")


if __name__ == "__main__":
    wanted = sys.argv[1:] or list(BRANDS)
    unknown = set(wanted) - set(BRANDS)
    if unknown:
        sys.exit(f"Unknown product(s): {', '.join(sorted(unknown))}. Choose from {', '.join(BRANDS)}.")
    CHROME = find_chrome()
    FONT_CSS = font_css()
    for slug in wanted:
        print(BRANDS[slug]["name"])
        build_keyart(slug)
        build_gumroad(slug)
        build_ig(slug)
        build_previews(slug)
    if OVERFLOWS:
        sys.exit("Layout overflows — fix before shipping these images:\n  " + "\n  ".join(OVERFLOWS))
