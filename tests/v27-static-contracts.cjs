const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const pathway = read("assets/skill-pathways-v27.js");
const choice = read("assets/skill-pathways-v27-choice.js");
const index = read("index.html");
const sw = read("sw.js");
const decision = read("docs/V27_REC_V1_REUSE_DECISION.md");

assert.match(index, /<script src="\.\/assets\/skill-pathways-v27\.js"><\/script>/);
assert.match(index, /<script src="\.\/assets\/skill-pathways-v27-choice\.js"><\/script>/);
assert.match(sw, /sophie-app-v2-17-skill-pathways-choice-stage/);
assert.match(sw, /"\.\/assets\/skill-pathways-v27\.js"/);
assert.match(sw, /"\.\/assets\/skill-pathways-v27-choice\.js"/);

assert.equal((pathway.match(/id:"COOK-T\d{3}"/g) || []).length, 22, "expected 22 Cooking techniques");
assert.equal((pathway.match(/kind:"hard"/g) || []).length, 2, "only the two sharp-tool safety dependencies are hard");
assert.equal((pathway.match(/kind:"recommended"/g) || []).length, 14, "recommended prerequisites must remain distinct");
assert.match(pathway, /<details class="technique-group"/);
assert.match(pathway, /id === "prepare" \? "open" : ""/);
assert.match(pathway, /direction === "next" \? \(hard \? "Safety-gated next step"/);
assert.match(pathway, /state\.skillsTechniqueId/);
assert.match(pathway, /writeNavigationState\(historyMode\)/);
assert.match(pathway, /history\.back\(\)/);

for (const forbidden of ["apiPost(", "fetch(", "localStorage", "chooseRecommendedLearn", "createOpportunity"]) {
  assert.ok(!pathway.includes(forbidden), `read-only pathway asset must not contain ${forbidden}`);
}
assert.ok(!/\b(?:XP|level|mastery percentage|readiness score)\b/i.test(pathway), "pathway UI must not introduce gamified readiness state");

assert.equal((choice.match(/"COOK-T\d{3}"/g) || []).length, 22, "choice bridge must map all snapshot techniques explicitly");
assert.match(choice, /action: "getLearningCandidateCatalogue"/);
assert.match(choice, /recommendationPost\(/);
assert.match(choice, /chooseRecommendation/);
assert.match(choice, /#recommendation-dialog-body/);
assert.match(choice, /REC_SAFETY_OPTIONS\.map\(\(\[value,label\]\)/);
assert.match(choice, /REC_SUPPORT_OPTIONS\.map\(\(\[value,label\]\)/);
for (const forbidden of ['action: "chooseRecommendedLearn"', 'action: "createOpportunity"', "recommendationKey", "localStorage", "#rec-dialog-title", "#recommendation-body", "recErrorMessage(", "recommendationUnauthorised("]) {
  assert.ok(!choice.includes(forbidden), `choice bridge must reuse existing boundaries and symbols; found ${forbidden}`);
}

assert.match(decision, /Reuse the existing `chooseRecommendedLearn` write path/);
assert.match(decision, /No new mutation route is required/);
assert.match(decision, /remaining gap is read-only pathway\/candidate-link exposure/);

const codeDiff = execFileSync("git", ["diff", "9fc9790b034dcdea0776b7c8ea17d776306fd814", "--", "Code.gs"], { cwd: root, encoding: "utf8" });
assert.equal(codeDiff, "", "Code.gs must remain unchanged from the v2.6.3 production baseline");

console.log("v2.7 static contracts: PASS");
