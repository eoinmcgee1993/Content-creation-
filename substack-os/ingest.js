#!/usr/bin/env node
// Merge a Substack snapshot into a publication's history file.
//
//   node ingest.js data/the-brief.json < payload.json
//   node ingest.js data/the-brief.json payload.json
//
// This is what replaces POSTing to the substack-ingest Edge Function. The
// payload is byte-for-byte the same JSON the endpoint took, minus "key" — there
// is no secret because there is no network service to authenticate to; the
// permission to write the file IS the permission to write the file.
//
// Re-running is normal and safe. Substack revises recent numbers, and an ingest
// interrupted halfway has to be repeatable, so this upserts rather than appends.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { empty, merge, serialise } from "./store.js";

function die(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const [storePath, payloadPath] = process.argv.slice(2);
if (!storePath) die("usage: node ingest.js <store.json> [payload.json]");

let raw;
try {
  raw = readFileSync(payloadPath ?? 0, "utf8");
} catch (e) {
  die(`could not read payload: ${e.message}`);
}

let payload;
try {
  payload = JSON.parse(raw);
} catch (e) {
  die(`payload is not valid JSON: ${e.message}`);
}

// A missing store is the first ingest, not an error. A store that exists but
// will not parse is refused: overwriting it would destroy the only copy of the
// history, and the recovery for a truncated file is `git checkout`, which only
// works if this does not helpfully replace it first.
let store;
try {
  store = JSON.parse(readFileSync(storePath, "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") die(`${storePath} exists but is not valid JSON: ${e.message}`);
  store = empty(typeof payload?.publication === "string" ? payload.publication.trim() : "");
}

const result = merge(store, payload);
if ("error" in result) die(`refused: ${result.error}`);

// Write beside the target and rename, so an interruption leaves the previous
// history intact rather than a half-written file where the history used to be.
const tmp = `${storePath}.tmp`;
try {
  mkdirSync(dirname(storePath), { recursive: true });
  writeFileSync(tmp, serialise(result.store));
  renameSync(tmp, storePath);
} catch (e) {
  die(`could not write ${storePath}: ${e.message}`);
}

const { daily, posts } = result;
const total = Object.keys(result.store.daily).length;
process.stdout.write(
  `${storePath}: merged ${daily} daily, ${posts} posts — ${total} days of history\n`,
);
