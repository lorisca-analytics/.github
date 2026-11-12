// Run with: node --test scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildOrg, buildProfile, updateHero, replaceBlock, renderShipped,
  renderLanes, renderPipeline, renderRepos, firstSentence, repoOf,
} from "./sync-profile.mjs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const lanes = JSON.parse(read("./fixtures/lanes.json"));
const repos = JSON.parse(read("./fixtures/repos.json"));
const readme = read("../profile/README.md");
const hero = read("../profile/hero.svg");

test("Shipped lists every live card except the hand-featured one", () => {
  const out = renderShipped(lanes);
  const titles = [...out.matchAll(/^### (.+)$/gm)].map((m) => m[1]);
  const live = lanes.lanes.flatMap((l) => l.projects).filter((c) => c.status === "live");
  assert.equal(titles.length, live.length - 1);
  assert.ok(!titles.includes("Massachusetts H-1B Analysis"));
  assert.ok(titles.includes("The recruitment front door"));
});

test("Shipped keeps lane order, then hub order", () => {
  const out = renderShipped(lanes);
  const tags = [...out.matchAll(/^`([A-Z &]+)`$/gm)].map((m) => m[1]);
  const order = lanes.lanes.map((l) => l.name.toUpperCase());
  const idx = tags.map((t) => order.indexOf(t));
  assert.deepEqual(idx, [...idx].sort((a, b) => a - b));
});

test("Lane counts come from live cards and pipeline rows", () => {
  const out = renderLanes(lanes);
  for (const l of lanes.lanes) {
    const shipped = l.projects.filter((c) => c.status === "live").length;
    if (!shipped) continue;
    assert.ok(out.includes(`**${shipped} shipped** · ${l.pipeline.length} in the pipeline`), l.name);
  }
});

test("Pipeline lists only queued rows", () => {
  const out = renderPipeline(lanes);
  assert.ok(!out.includes("The recruitment front door"));
  assert.equal((out.match(/^- /gm) || []).length, lanes.lanes.reduce((n, l) => n + l.pipeline.length, 0));
});

test("All repos skips infra repos and uses card titles", () => {
  const out = renderRepos(lanes, repos);
  assert.ok(!out.includes("[.github]"));
  assert.ok(!out.includes("lorisca-analytics.github.io]"));
  assert.ok(out.includes("[recruitment-front-door](https://github.com/lorisca-analytics/recruitment-front-door) - **The recruitment front door** - "));
});

test("Archived, forked and private repos stay out", () => {
  const extra = [
    { name: "old", full_name: "x/old", html_url: "u", archived: true },
    { name: "fk", full_name: "x/fk", html_url: "u", fork: true },
    { name: "pv", full_name: "x/pv", html_url: "u", private: true },
  ];
  assert.equal(renderRepos(lanes, extra), "");
});

test("A second run changes nothing", () => {
  const once = buildOrg(readme, lanes, repos);
  assert.equal(buildOrg(once, lanes, repos), once);
  const h = updateHero(hero, lanes);
  assert.equal(updateHero(h, lanes), h);
});

test("Text outside the markers is never touched", () => {
  const out = buildOrg(readme, lanes, repos);
  const outside = (s) => s.replace(/<!-- (\w+):START -->[\s\S]*?<!-- \1:END -->/g, "");
  assert.equal(outside(out), outside(readme));
});

test("A missing or doubled marker stops the run", () => {
  assert.throws(() => replaceBlock("no markers", "SHIPPED:START", "x"), /exactly once/);
  const twice = "<!-- A:START --><!-- A:END --><!-- A:START --><!-- A:END -->";
  assert.throws(() => replaceBlock(twice, "A:START", "x"), /exactly once/);
  assert.throws(() => replaceBlock("<!-- A:START -->", "A:START", "x"), /No <!-- A:END -->/);
});

test("Hero counts follow the lanes and stop if the image changed shape", () => {
  const out = updateHero(hero, lanes);
  const t = lanes.lanes[0];
  assert.ok(out.includes(`${t.projects.filter((c) => c.status === "live").length} shipped &#183; ${t.pipeline.length} in pipeline`));
  assert.throws(() => updateHero("<svg></svg>", lanes), /count lines/);
});

test("Personal profile marker block is rebuilt", () => {
  const doc = "a\n<!-- REPOS:START:lorisca-analytics -->\nold\n<!-- REPOS:END -->\nb";
  const out = buildProfile(doc, lanes);
  assert.ok(out.includes("- **[The recruitment front door](https://github.com/lorisca-analytics/recruitment-front-door)** - "));
  assert.ok(out.startsWith("a\n") && out.endsWith("\nb"));
});

test("Helpers", () => {
  assert.equal(firstSentence("SQL analysis of 3.47M H-1B filings (2020–2023). Then more."), "SQL analysis of 3.47M H-1B filings (2020–2023). Then more.");
  assert.equal(firstSentence("A long opening sentence that is well over sixty characters long. Then more."), "A long opening sentence that is well over sixty characters long.");
  assert.equal(firstSentence("The bank already banks these people. It just can't see their income."), "The bank already banks these people. It just can't see their income.");
  assert.equal(repoOf({ links: [{ url: "https://github.com/o/r" }] }), "o/r");
  assert.equal(repoOf({ repo: "o/x", links: [] }), "o/x");
});

// ---------- Builds ----------
import { buildBuilds, renderBuildsShipped, renderBuildsRepos, renderProfileBuilds } from "./sync-profile.mjs";
const builds = JSON.parse(read("./fixtures/projects.json"));
const buildsRepos = JSON.parse(read("./fixtures/builds-repos.json"));
const buildsReadme = read("./fixtures/builds-readme.md");

test("Builds Shipped lists every live build, one table each", () => {
  const out = renderBuildsShipped(builds);
  const live = builds.projects.filter((c) => c.status === "live");
  assert.equal((out.match(/^### /gm) || []).length, live.length);
  assert.equal((out.match(/<table>/g) || []).length, live.length);
  assert.ok(!out.includes("·"), "middle dots are written as &#183;");
});

test("Builds images with a site path become full URLs", () => {
  const out = renderBuildsShipped({ projects: [{ status: "live", title: "T", hook: "H", visual: "assets/x.svg" }] });
  assert.ok(out.includes('src="https://lorisca-builds.github.io/assets/x.svg"'));
});

test("Builds repo list skips private and infra repos", () => {
  const out = renderBuildsRepos(buildsRepos);
  assert.ok(!out.includes("portfolio-pipeline"));
  assert.ok(!out.includes("[.github]") && !out.includes("lorisca-builds.github.io]"));
  assert.ok(out.includes("[lori-claude-skills](https://github.com/lorisca-builds/lori-claude-skills): "));
});

test("Builds page: second run changes nothing, outside text untouched", () => {
  const once = buildBuilds(buildsReadme, builds, buildsRepos);
  assert.equal(buildBuilds(once, builds, buildsRepos), once);
  const outside = (s) => s.replace(/<!-- (\w+):START -->[\s\S]*?<!-- \1:END -->/g, "");
  assert.equal(outside(once), outside(buildsReadme));
});

test("Personal profile Builds block is rebuilt", () => {
  const doc = "<!-- REPOS:START:lorisca-analytics -->\n<!-- REPOS:END -->\nx\n<!-- REPOS:START:lorisca-builds -->\nold\n<!-- REPOS:END -->";
  const out = buildProfile(doc, lanes, builds);
  assert.ok(out.includes("- **[Open Loops Board](https://github.com/lorisca-builds/muse-adhd-project-manager)** - "));
  assert.ok(!out.includes("old"));
});
