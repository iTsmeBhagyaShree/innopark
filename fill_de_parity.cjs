/**
 * Fills German locale where values still match English (de === en).
 * Uses public Google translate endpoint (same as deep_translate_de_fetch.cjs).
 */
const fs = require("fs");
const path = require("path");

const DELAY_MS = 150;

const enPathF = path.join(__dirname, "frontend", "src", "locales", "en.json");
const dePathF = path.join(__dirname, "frontend", "src", "locales", "de.json");
const enPathB = path.join(__dirname, "backend", "locales", "en.json");
const dePathB = path.join(__dirname, "backend", "locales", "de.json");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldSkip(value) {
  if (typeof value !== "string") return true;
  const t = value.trim();
  if (!t) return true;
  if (t.length <= 1) return true;
  if (/^#?[0-9a-fA-F]{3,8}$/.test(t)) return true;
  if (/^https?:\/\//i.test(t) || t.startsWith("//")) return true;
  if (/^\/[\w\-./%]*$/.test(t) && t.length < 200) return true;
  if (/^[\w-]+\.(png|jpg|jpeg|gif|svg|ico|pdf)$/i.test(t)) return true;
  if (/^[\d\s+\-()]+$/.test(t) && t.length < 30) return true;
  return false;
}

async function translateText(text) {
  const res = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=de&dt=t&q=${encodeURIComponent(text)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data[0][0][0];
}

function get(obj, parts) {
  let c = obj;
  for (const k of parts) {
    if (c == null) return undefined;
    c = c[k];
  }
  return c;
}

function set(obj, parts, v) {
  let c = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    c = c[parts[i]];
  }
  c[parts[parts.length - 1]] = v;
}

function* iterLeaves(obj, prefix = []) {
  if (obj === null || obj === undefined) return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const v = obj[i];
      if (typeof v === "object" && v !== null) {
        yield* iterLeaves(v, prefix.concat(String(i)));
      } else {
        yield { path: prefix.concat(String(i)), value: v };
      }
    }
    return;
  }
  if (typeof obj !== "object") return;
  for (const k of Object.keys(obj)) {
    const p = prefix.concat(k);
    const v = obj[k];
    if (typeof v === "object" && v !== null) {
      yield* iterLeaves(v, p);
    } else {
      yield { path: p, value: v };
    }
  }
}

async function processFile(enP, deP, label) {
  if (!fs.existsSync(enP) || !fs.existsSync(deP)) {
    console.log(`${label}: skip (missing file)`);
    return { updated: 0, total: 0 };
  }
  const en = JSON.parse(fs.readFileSync(enP, "utf8"));
  const de = JSON.parse(fs.readFileSync(deP, "utf8"));
  const tasks = [];
  for (const { path, value } of iterLeaves(en)) {
    if (typeof value !== "string") continue;
    if (shouldSkip(value)) continue;
    const dev = get(de, path);
    if (typeof dev !== "string" || dev !== value) continue;
    tasks.push({ path, value });
  }
  console.log(`${label}: ${tasks.length} strings to translate`);
  let n = 0;
  for (let i = 0; i < tasks.length; i++) {
    const { path, value } = tasks[i];
    const tr = await translateText(value);
    if (tr) {
      set(de, path, tr);
      n++;
    }
    if (n > 0 && n % 40 === 0) {
      fs.writeFileSync(deP, JSON.stringify(de, null, 2) + "\n");
      console.log(`  ${label}: checkpoint ${n}/${tasks.length}`);
    }
    await sleep(DELAY_MS);
  }
  fs.writeFileSync(deP, JSON.stringify(de, null, 2) + "\n");
  console.log(`${label}: done, updated ${n} of ${tasks.length}`);
  return { updated: n, total: tasks.length };
}

(async () => {
  const a = await processFile(enPathF, dePathF, "frontend");
  const b = await processFile(enPathB, dePathB, "backend");
  const totalU = a.updated + b.updated;
  const totalT = a.total + b.total;
  console.log(`ALL: ${totalU} / ${totalT} strings translated.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
