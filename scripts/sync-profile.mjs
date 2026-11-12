// Rebuilds the generated sections of a profile README from the Work hub data.
//
// Source of truth: data/lanes.json in the Work hub repo, read through the
// GitHub API (the Pages copy can be about ten minutes old). Only text between
// <!-- NAME:START --> and <!-- NAME:END --> markers is replaced. Everything
// else in the file is left as written.
//
// Usage:
//   node scripts/sync-profile.mjs --target org        print what would change
//   node scripts/sync-profile.mjs --target org --write
//   node scripts/sync-profile.mjs --target builds --write   (lorisca-builds/.github)
//   node scripts/sync-profile.mjs --target profile --write  (lori-sca/lori-sca)
//
// Plain Node 20, no packages.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const CONFIG = {
  hubRepo: "lorisca-analytics/lorisca-analytics.github.io",
  lanesPath: "data/lanes.json",
  org: "lorisca-analytics",
  siteUrl: "https://lorisca-analytics.github.io",
  // Cards shown in a hand-written section of the org page, so Shipped skips them.
  skipInShipped: ["massachusetts-h1b-analysis"],
  builds: {
    hubRepo: "lorisca-builds/lorisca-builds.github.io",
    dataPath: "data/projects.json",
    org: "lorisca-builds",
    siteUrl: "https://lorisca-builds.github.io",
  },
  targets: {
    org: { readme: "profile/README.md", hero: "profile/hero.svg" },
    builds: { readme: "profile/README.md" },
    profile: {
      readme: "README.md",
      marker: "REPOS:START:lorisca-analytics",
      buildsMarker: "REPOS:START:lorisca-builds",
    },
  },
};

const INFRA = (name) => name === ".github" || name.endsWith(".github.io");

// ---------- reading the data ----------

export function liveCards(lanesDoc) {
  const out = [];
  for (const lane of lanesDoc.lanes) {
    for (const card of lane.projects || []) {
      if (card.status === "live") out.push({ lane, card });
    }
  }
  return out;
}

export function repoOf(card) {
  if (card.repo) return card.repo;
  const link = (card.links || []).find((l) => /github\.com\/[^/]+\/[^/#?]+/.test(l.url));
  if (!link) return null;
  const m = link.url.match(/github\.com\/([^/]+\/[^/#?]+)/);
  return m[1].replace(/\.git$/, "");
}

// The opening of a hook for one-line lists. A very short first sentence
// ("The bank already banks these people.") keeps the next one with it.
export function firstSentence(text, min = 60) {
  const sentences = (text || "").trim().match(/.+?[.?!](?=\s|$)|.+$/g) || [""];
  let out = sentences[0].trim();
  for (let i = 1; out.length < min && i < sentences.length; i++) out += " " + sentences[i].trim();
  return out;
}

// ---------- rendering each block ----------

function linkLine(card) {
  const links = card.links || [];
  const repo = links.filter((l) => l.label === "Repo");
  const rest = links.filter((l) => l.label !== "Repo");
  return [...repo, ...rest]
    .map((l) => `[${l.label}](${l.url})`)
    .concat(`[All case studies](${CONFIG.siteUrl})`)
    .join(" · ");
}

export function renderShipped(lanesDoc, skip = CONFIG.skipInShipped) {
  const rows = liveCards(lanesDoc).filter(({ card }) => !skip.includes(card.id));
  const parts = ["<table>"];
  for (const { lane, card } of rows) {
    parts.push(
      "<tr>",
      '<td width="60%" valign="top">',
      "",
      "`" + lane.name.toUpperCase() + "`",
      "",
      `### ${card.title}`,
      "",
      card.hook,
      "",
      ...(card.metric ? [`**${card.metric}**`, ""] : []),
      linkLine(card),
      "",
      "</td>",
      '<td width="40%" valign="top">',
      ...(card.visual
        ? [`<img src="${card.visual}" alt="${escapeAttr(card.visualAlt || card.title)}" width="100%">`]
        : []),
      "</td>",
      "</tr>",
    );
  }
  parts.push("</table>");
  return parts.join("\n");
}

function counts(lane) {
  const shipped = (lane.projects || []).filter((c) => c.status === "live").length;
  const queued = (lane.pipeline || []).length;
  return { shipped, queued };
}

export function renderLanes(lanesDoc) {
  const lanes = lanesDoc.lanes.filter((l) => counts(l).shipped > 0);
  const cell = (l) => {
    const { shipped, queued } = counts(l);
    return [
      '<td width="50%" valign="top">',
      "",
      "`" + l.name.toUpperCase() + "`",
      "",
      l.blurb,
      "",
      `**${shipped} shipped** · ${queued} in the pipeline`,
      "",
      "</td>",
    ].join("\n");
  };
  const parts = ["<table>"];
  for (let i = 0; i < lanes.length; i += 2) {
    parts.push("<tr>", cell(lanes[i]));
    if (lanes[i + 1]) parts.push(cell(lanes[i + 1]));
    parts.push("</tr>");
  }
  parts.push("</table>");
  return parts.join("\n");
}

export function renderPipeline(lanesDoc) {
  const parts = [];
  for (const lane of lanesDoc.lanes) {
    const rows = lane.pipeline || [];
    if (!rows.length) continue;
    if (parts.length) parts.push("");
    parts.push(`**${lane.name}**`, ...rows.map((r) => `- ${r.title}`));
  }
  return parts.join("\n");
}

// Every public org repo except infra, forks and archived ones. A repo with a
// live card uses the card's title and hook. Any other repo uses its description.
export function renderRepos(lanesDoc, repos) {
  const byRepo = new Map(liveCards(lanesDoc).map(({ card }) => [repoOf(card), card]));
  return repos
    .filter((r) => !r.private && !r.fork && !r.archived && !INFRA(r.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((r) => {
      const card = byRepo.get(r.full_name);
      const text = card ? `**${card.title}** - ${firstSentence(card.hook)}` : firstSentence(r.description || "");
      return `- [${r.name}](${r.html_url}) - ${text}`.replace(/ - $/, "");
    })
    .join("\n");
}

// The personal profile lists live cards in lane order, title first.
export function renderProfileRepos(lanesDoc) {
  return liveCards(lanesDoc)
    .map(({ card }) => {
      const repo = repoOf(card);
      const url = repo ? `https://github.com/${repo}` : (card.links?.[0]?.url ?? CONFIG.siteUrl);
      return `- **[${card.title}](${url})** - ${firstSentence(card.hook)}`;
    })
    .join("\n");
}

// ---------- Builds hub (data/projects.json: a flat list, no lanes) ----------

export function liveBuilds(projectsDoc) {
  return (projectsDoc.projects || []).filter((c) => c.status === "live");
}

// Org profile files keep the middle dot as an entity, so a paste through the
// GitHub web editor cannot turn it into a stray character.
const dots = (s) => String(s).replace(/·/g, "&#183;");

function absolute(url, site) {
  return /^https?:\/\//.test(url) ? url : `${site}/${url.replace(/^\.?\//, "")}`;
}

export function renderBuildsShipped(projectsDoc, site = CONFIG.builds.siteUrl) {
  return liveBuilds(projectsDoc)
    .map((card) => {
      const links = (card.links || []).map((l) => `[${l.label}](${l.url})`).join(" &#183; ");
      return [
        "<table>",
        "<tr>",
        '<td width="60%" valign="top">',
        "",
        `### ${card.title}`,
        "",
        card.hook,
        "",
        ...(card.metric ? [`**${dots(card.metric)}**`, ""] : []),
        links,
        "",
        "</td>",
        '<td width="40%" valign="top">',
        ...(card.visual
          ? [`<img src="${absolute(card.visual, site)}" alt="${escapeAttr(card.visualAlt || card.title)}" width="100%">`]
          : []),
        "</td>",
        "</tr>",
        "</table>",
      ].join("\n");
    })
    .join("\n\n");
}

// Builds repos are listed with their own GitHub description.
export function renderBuildsRepos(repos) {
  return repos
    .filter((r) => !r.private && !r.fork && !r.archived && !INFRA(r.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((r) => `- [${r.name}](${r.html_url})${r.description ? ": " + r.description : ""}`)
    .join("\n");
}

export function renderProfileBuilds(projectsDoc) {
  return liveBuilds(projectsDoc)
    .map((card) => {
      const repo = repoOf(card);
      const url = repo ? `https://github.com/${repo}` : (card.links?.[0]?.url ?? CONFIG.builds.siteUrl);
      return `- **[${card.title}](${url})** - ${firstSentence(card.hook)}`;
    })
    .join("\n");
}

export function buildBuilds(readme, projectsDoc, repos) {
  let out = replaceBlock(readme, "SHIPPED:START", renderBuildsShipped(projectsDoc));
  out = replaceBlock(out, "REPOS:START", renderBuildsRepos(repos));
  return out;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// ---------- writing ----------

// Replaces the text between <!-- start --> and the next <!-- NAME:END -->.
// A missing or doubled marker throws, so a hand edit to a marker stops the run
// instead of writing somewhere unexpected.
export function replaceBlock(doc, startMarker, body) {
  const name = startMarker.split(":")[0];
  const start = `<!-- ${startMarker} -->`;
  const end = `<!-- ${name}:END -->`;
  const i = doc.indexOf(start);
  if (i === -1 || doc.indexOf(start, i + 1) !== -1) {
    throw new Error(`Marker ${start} must appear exactly once`);
  }
  const j = doc.indexOf(end, i);
  if (j === -1) throw new Error(`No ${end} after ${start}`);
  return doc.slice(0, i + start.length) + "\n" + body + "\n" + doc.slice(j);
}

// The hero image has one count line per lane, in lane order.
export function updateHero(svg, lanesDoc) {
  const re = /(<text[^>]*>)((?:\d+ shipped &#183; )?\d+ in pipeline)(<\/text>)/g;
  const found = svg.match(re) || [];
  if (found.length !== lanesDoc.lanes.length) {
    throw new Error(`hero.svg has ${found.length} count lines, lanes.json has ${lanesDoc.lanes.length} lanes`);
  }
  let k = 0;
  return svg.replace(re, (_, open, _old, close) => {
    const { shipped, queued } = counts(lanesDoc.lanes[k++]);
    return `${open}${shipped} shipped &#183; ${queued} in pipeline${close}`;
  });
}

export function buildOrg(readme, lanesDoc, repos) {
  let out = readme;
  out = replaceBlock(out, "SHIPPED:START", renderShipped(lanesDoc));
  out = replaceBlock(out, "LANES:START", renderLanes(lanesDoc));
  out = replaceBlock(out, "PIPELINE:START", renderPipeline(lanesDoc));
  out = replaceBlock(out, "REPOS:START", renderRepos(lanesDoc, repos));
  return out;
}

export function buildProfile(readme, lanesDoc, projectsDoc) {
  let out = replaceBlock(readme, CONFIG.targets.profile.marker, renderProfileRepos(lanesDoc));
  if (projectsDoc) out = replaceBlock(out, CONFIG.targets.profile.buildsMarker, renderProfileBuilds(projectsDoc));
  return out;
}

// ---------- GitHub API ----------

async function api(path) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "profile-sync" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} on ${path}`);
  return res.json();
}

export async function fetchLanes() {
  const file = await api(`/repos/${CONFIG.hubRepo}/contents/${CONFIG.lanesPath}`);
  return JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
}

export async function fetchRepos(org = CONFIG.org) {
  return api(`/orgs/${org}/repos?type=public&per_page=100`);
}

export async function fetchBuilds() {
  const file = await api(`/repos/${CONFIG.builds.hubRepo}/contents/${CONFIG.builds.dataPath}`);
  return JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
}

// ---------- CLI ----------

async function main() {
  const args = process.argv.slice(2);
  const target = args[args.indexOf("--target") + 1];
  const write = args.includes("--write");
  if (!CONFIG.targets[target]) throw new Error("Use --target org, builds or profile");

  const files = [];
  const t = CONFIG.targets[target];
  const readme = await readFile(t.readme, "utf8");
  if (target === "org") {
    const lanes = await fetchLanes();
    const repos = await fetchRepos();
    files.push([t.readme, readme, buildOrg(readme, lanes, repos)]);
    const hero = await readFile(t.hero, "utf8");
    files.push([t.hero, hero, updateHero(hero, lanes)]);
  } else if (target === "builds") {
    const builds = await fetchBuilds();
    const repos = await fetchRepos(CONFIG.builds.org);
    files.push([t.readme, readme, buildBuilds(readme, builds, repos)]);
  } else {
    const [lanes, builds] = await Promise.all([fetchLanes(), fetchBuilds()]);
    files.push([t.readme, readme, buildProfile(readme, lanes, builds)]);
  }

  const changed = files.filter(([, before, after]) => before !== after);
  if (!changed.length) {
    console.log("Up to date. Nothing written.");
    return;
  }
  for (const [path, , after] of changed) {
    if (write) await writeFile(path, after);
    console.log(`${write ? "Updated" : "Would update"} ${path}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
