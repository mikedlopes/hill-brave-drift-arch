#!/usr/bin/env node
/** Dump or write the shipping format snapshot. */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFormatSnapshot, snapshotJson } from "../src/lib/format-harness.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gold = join(root, "docs/harness-snapshot.json");
const write = process.argv.includes("--write");
const snap = buildFormatSnapshot();
const json = snapshotJson(snap);

if (write) {
  await mkdir(dirname(gold), { recursive: true });
  await writeFile(gold, json);
  console.log(`wrote ${gold}`);
} else {
  process.stdout.write(json);
}

console.error(
  `${snap.family} v${snap.version}  ${snap.device.id} · ${snap.pattern.id} · ${snap.style.id}  ${snap.defaults.zip}`,
);
