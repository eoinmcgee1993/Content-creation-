// Loads a Supabase Edge Function's REAL source under Node so the two routes
// can be tested without a deployed project.
//
// Why this exists: both functions shipped with no test of any kind. They were
// driven once from a throwaway script that was never committed, so nothing
// guarded them afterwards — and the repo's own review rules require an
// integration test for a new route.
//
// The functions are Deno TypeScript importing from `jsr:`, which Node cannot
// resolve. So the source is read, its two import lines are rewritten to point
// at this file, and the result is written to a temp file and imported. Node
// 22 strips the types natively. Everything below the imports runs byte for
// byte as deployed — the point is to exercise the shipped handler, not a copy.

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Every call the function made against the database, in order. */
export const calls = [];

let config = { value: "correct-horse" };
let failNext = null;

export function reset() {
  calls.length = 0;
  config = { value: "correct-horse" };
  failNext = null;
}

/** Replace the row substack_config returns (null = no key configured). */
export function setConfig(v) {
  config = v;
}

/** Make the next write fail, to exercise the 500 path. */
export function failWrites(error = { message: "boom" }) {
  failNext = error;
}

export function createClient() {
  return {
    from(table) {
      const q = {
        select() {
          return q;
        },
        eq() {
          return q;
        },
        gte(col, value) {
          calls.push({ table, op: "gte", col, value });
          return q;
        },
        order() {
          return q;
        },
        limit() {
          calls.push({ table, op: "select" });
          return Promise.resolve({ data: [], error: null });
        },
        maybeSingle() {
          calls.push({ table, op: "config" });
          return Promise.resolve({ data: config, error: null });
        },
        upsert(rows, opts) {
          calls.push({ table, op: "upsert", rows, opts });
          const error = failNext;
          failNext = null;
          return Promise.resolve({ error });
        },
        then(res) {
          calls.push({ table, op: "select" });
          return Promise.resolve({ data: [], error: null }).then(res);
        },
      };
      return q;
    },
  };
}

/**
 * Import a function by directory name and return its Deno.serve handler.
 */
export async function loadFunction(name) {
  const srcPath = fileURLToPath(
    new URL(`../supabase/functions/${name}/index.ts`, import.meta.url),
  );
  const harness = fileURLToPath(new URL("./function-harness.js", import.meta.url));

  const original = readFileSync(srcPath, "utf8");
  const code = original
    .replace(/^import "jsr:@supabase\/functions-js\/edge-runtime\.d\.ts";$/m, "")
    .replace(
      /^import \{ createClient \} from "jsr:@supabase\/supabase-js@2";$/m,
      `import { createClient } from ${JSON.stringify(harness)};`,
    );

  // If the import lines ever change shape, fail loudly rather than testing a
  // file that still references jsr: and would throw something confusing.
  if (code.includes("jsr:@supabase/supabase-js")) {
    throw new Error(`${name}: could not rewrite the supabase-js import — harness needs updating`);
  }

  const file = join(mkdtempSync(join(tmpdir(), "substack-fn-")), `${name}.mts`);
  writeFileSync(file, code);

  let handler = null;
  globalThis.Deno = {
    env: { get: (k) => `stub-${k}` },
    serve: (h) => {
      handler = h;
    },
  };
  await import(`file://${file}`);
  if (!handler) throw new Error(`${name}: Deno.serve was never called`);
  return handler;
}

/** POST a JSON body, returning status, parsed body and headers. */
export function post(handler, body) {
  return respond(
    handler,
    new Request("https://x/fn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function respond(handler, req) {
  const r = await handler(req);
  let parsed = null;
  try {
    parsed = JSON.parse(await r.clone().text());
  } catch {
    parsed = await r.clone().text();
  }
  return { status: r.status, body: parsed, headers: r.headers };
}

/** The rows a table was asked to upsert, flattened across column-shape groups. */
export function upsertedRows(table) {
  return calls.filter((c) => c.table === table && c.op === "upsert").flatMap((c) => c.rows);
}
