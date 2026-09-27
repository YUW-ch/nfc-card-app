// Copies the card designer from the marketing site (../nfc-card-website) into
// this app, so customers get the same editor in the dashboard and on the site.
//
//   pnpm sync:editor          copy the files over
//   pnpm sync:editor --check  only report drift, exit 1 if any
//
// The website is the source of truth: src/components/editor/ there is a
// self-contained module (react, next/image and its own files only). Never
// edit the copies here; every copied source file carries a header saying so.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const website = resolve(root, process.env.WEBSITE_DIR ?? "../nfc-card-website");
const EDITOR = "src/components/editor";
const source = join(website, EDITOR);
const target = join(root, EDITOR);

const HEADER =
  "// GENERATED FILE, DO NOT EDIT. Copied from nfc-card-website/src/components/editor.\n" +
  "// Change it there, then run `pnpm sync:editor` in nfc-card-app.\n";

if (!existsSync(source)) {
  console.error(`Website editor not found at ${source}. Set WEBSITE_DIR.`);
  process.exit(1);
}

/** All files below `dir`, as paths relative to it. */
function walk(dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    const abs = join(dir, name);
    return statSync(abs).isDirectory() ? walk(abs, base) : [relative(base, abs)];
  });
}

/** What the copy of a source file should contain (header on source code). */
function expected(rel) {
  const buf = readFileSync(join(source, rel));
  if (![".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(extname(rel))) return buf;
  const text = buf.toString("utf8");
  // Keep "use client" as the very first statement so Next still honours it.
  const directive = text.match(/^(["'])use client\1;?\n/);
  const body = (directive ? text.slice(directive[0].length) : text).replace(/^\n+/, "");
  return Buffer.from((directive ? `${directive[0]}\n` : "") + HEADER + "\n" + body, "utf8");
}

const check = process.argv.includes("--check");
const wanted = new Set(walk(source));
const drifted = [];

for (const rel of wanted) {
  const to = join(target, rel);
  const next = expected(rel);
  if (existsSync(to) && readFileSync(to).equals(next)) continue;
  drifted.push(rel);
  if (!check) {
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, next);
  }
}

// Files that no longer exist in the website copy.
for (const rel of existsSync(target) ? walk(target) : []) {
  if (wanted.has(rel)) continue;
  drifted.push(`${rel} (removed)`);
  if (!check) rmSync(join(target, rel));
}

if (drifted.length === 0) {
  console.log("Editor is in sync with the website.");
} else if (check) {
  console.error(`Out of sync with the website:\n  ${drifted.join("\n  ")}`);
  console.error("Run `pnpm sync:editor` to update.");
  process.exit(1);
} else {
  console.log(`Updated from the website:\n  ${drifted.join("\n  ")}`);
}
