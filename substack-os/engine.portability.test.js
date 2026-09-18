// Run: npm test  (from this directory)
//
// The engine has to run unchanged in a browser, in Node, in a Deno Edge
// Function, inside an n8n Function node, and behind an MCP tool. That is not a
// nice-to-have: it is what stops the same calculation being reimplemented four
// times and drifting four different ways.
//
// A rule like that decays silently. Someone adds one `import` for convenience
// and nothing fails until the day the engine is needed somewhere that cannot
// resolve it. These tests are the guard: they fail the moment the engine
// acquires a dependency, reaches for a host API, or learns what a database is.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { brief, summarise } from "./engine.js";
import { sampleDaily, samplePosts } from "./sample-data.js";

const SOURCE = readFileSync(new URL("./engine.js", import.meta.url), "utf8");

// Comments discuss some of these by name, so the checks run against code only.
const CODE = SOURCE
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .split("\n")
  .map((line) => line.replace(/\/\/.*$/, ""))
  .join("\n");

test("the engine imports nothing", () => {
  const imports = CODE.match(/^\s*import\s/gm) ?? [];
  assert.deepEqual(imports, [], "the engine must stay dependency-free");
  assert.equal(/\brequire\s*\(/.test(CODE), false, "no CommonJS require either");
});

test("the engine knows nothing about a database", () => {
  for (const banned of ["supabase", "createClient", "postgres", "SELECT ", "service_role"]) {
    assert.equal(
      CODE.toLowerCase().includes(banned.toLowerCase()), false,
      `engine.js references "${banned}" — the engine must not know where rows come from`,
    );
  }
});

test("the engine reaches for no host API", () => {
  // Anything here exists in one runtime and not another. Touching one of them
  // is what makes an engine that works in the browser fail in n8n.
  const hostOnly = [
    "fetch", "XMLHttpRequest", "WebSocket", "localStorage", "sessionStorage",
    "document", "window", "navigator", "process", "Buffer",
    "__dirname", "node:", "Deno",
  ];
  for (const api of hostOnly) {
    assert.equal(
      new RegExp(`\\b${api.replace(":", "")}\\b`).test(CODE), false,
      `engine.js references "${api}" — that pins it to one runtime`,
    );
  }
});

test("the engine still computes with the browser and network globals removed", () => {
  // Proves nothing is reached for lazily at call time, only at import time.
  const stash = {};
  const removed = ["fetch", "XMLHttpRequest", "WebSocket", "localStorage", "crypto"];
  for (const g of removed) {
    if (g in globalThis) { stash[g] = globalThis[g]; delete globalThis[g]; }
  }
  try {
    const out = brief(sampleDaily({ days: 60 }), samplePosts());
    assert.equal(out.summary.current.subscribers > 0, true);
    assert.equal(out.top_posts.length > 0, true);
  } finally {
    for (const [g, v] of Object.entries(stash)) globalThis[g] = v;
  }
});

test("the engine is pure — same input, same output, and inputs are not mutated", () => {
  const daily = sampleDaily({ days: 45 });
  const posts = samplePosts();
  const frozen = JSON.stringify({ daily, posts });

  const first = JSON.stringify(brief(daily, posts));
  const second = JSON.stringify(brief(daily, posts));

  assert.equal(first, second, "two identical calls disagreed");
  assert.equal(JSON.stringify({ daily, posts }), frozen, "the engine mutated its input");
});

test("the engine accepts plain rows from anywhere, not a database client's shape", () => {
  // A CSV import, an MCP tool result and a PostgREST response all arrive as
  // plain objects. The engine must not care which.
  const fromCsv = [
    { metric_date: "2026-03-01", subscribers: "1000", paid_subscribers: "100" },
    { metric_date: "2026-03-02", subscribers: "1100", paid_subscribers: "110" },
  ];
  const s = summarise(fromCsv, 1);
  assert.equal(s.current.subscribers, 1100, "numeric strings from a CSV must coerce");
  assert.equal(s.change.subscribers, 100);
});
