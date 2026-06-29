#!/usr/bin/env node
/**
 * Rebrand to Adunda.
 *   node rebrand.mjs --dry   preview what would change (writes nothing)
 *   node rebrand.mjs         apply the changes
 *
 * Case-sensitive on purpose: it replaces the brand WORDS but leaves the
 * live lowercase domains alone (tryrepwise.com, trymeridian.com, the email
 * sender). Reads/writes UTF-8 with no BOM, so no PowerShell encoding damage.
 */
import fs from "fs";
import path from "path";

const DRY = process.argv.includes("--dry");
const EXTS = new Set([".tsx", ".ts", ".jsx", ".js", ".css", ".md", ".mdx"]);
const SKIP = new Set(["node_modules", ".next", ".git", ".vercel", "dist", "build"]);

// Order matters: TryRepWise before RepWise. All case-sensitive (no /i flag).
const REPLACEMENTS = [
  [/TryRepWise/g, "Adunda"],
  [/RepWise/g, "Adunda"],
  [/MERIDIAN/g, "ADUNDA"],
  [/Meridian/g, "Adunda"],
];

let filesChanged = 0;
let hits = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) walk(path.join(dir, entry.name));
    } else if (EXTS.has(path.extname(entry.name))) {
      const p = path.join(dir, entry.name);
      const before = fs.readFileSync(p, "utf8");
      let after = before;
      let fileHits = 0;
      for (const [re, to] of REPLACEMENTS) {
        after = after.replace(re, () => { fileHits++; return to; });
      }
      if (after !== before) {
        if (!DRY) fs.writeFileSync(p, after, "utf8");
        filesChanged++;
        hits += fileHits;
        console.log(`${DRY ? "would update" : "updated"}: ${p} (${fileHits})`);
      }
    }
  }
}

walk(".");
console.log(`\n${DRY ? "DRY RUN — nothing written. " : ""}${filesChanged} files, ${hits} replacements.`);
if (DRY) console.log("Run without --dry to apply.");
