const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const pathway = read("assets/skill-pathways-v27.js");
const choice = read("assets/skill-pathways-v27-choice.js");
const code = read("Code.gs");
const index = read("index.html");
const sw = read("sw.js");

assert.match(index, /<script src="\.\/assets\/skill-pathways-v27\.js"><\/script>/);
assert.match(index, /<script src="\.\/assets\/skill-pathways-v27-choice\.js"><\/script>/);
assert.match(sw, /sophie-app-v2-18-authoritative-pathways-stage/);
assert.match(sw, /"\.\/assets\/skill-pathways-v27\.js"/);
assert.match(sw, /"\.\/assets\/skill-pathways-v27-choice\.js"/);

assert.match(pathway, /action:"getLearningPathway"/);
assert.match(pathway, /learningPathwayContractVersion/);
assert.match(pathway, /authority:"backend"/);
assert.match(pathway, /v27CandidateIdsForTechnique/);
assert.match(pathway, /<details class="technique-group"/);
assert.match(pathway, /history\.back\(\)/);
assert.equal((pathway.match(/COOK-T\d{3}/g) || []).length, 0, "frontend pathway asset must not bundle technique records");
assert.equal((pathway.match(/LC-COOK-\d{3}/g) || []).length, 0, "frontend pathway asset must not bundle candidate links");
assert.ok(!/v27-cooking-snapshot|snapshot-2026/i.test(pathway), "snapshot authority must be removed");

for (const forbidden of ["apiPost(", "fetch(", "localStorage", "chooseRecommendedLearn", "createOpportunity"]) {
  assert.ok(!pathway.includes(forbidden), `pathway client must stay behind the existing recommendation transport; found ${forbidden}`);
}
assert.ok(!/\b(?:XP|mastery percentage|readiness score)\b/i.test(pathway), "pathway UI must not introduce gamified readiness state");

assert.match(choice, /v27CandidateIdsForTechnique/);
assert.match(choice, /action: "getLearningCandidateCatalogue"/);
assert.match(choice, /techniqueId: flow\.techniqueId/);
assert.match(choice, /recommendationPost\(/);
assert.match(choice, /chooseRecommendation/);
assert.equal((choice.match(/COOK-T\d{3}/g) || []).length, 0, "choice bridge must not bundle technique IDs");
assert.equal((choice.match(/LC-COOK-\d{3}/g) || []).length, 0, "choice bridge must not bundle candidate IDs");
for (const forbidden of ['action: "getLearningPathway"', 'action: "chooseRecommendedLearn"', 'action: "createOpportunity"', "recommendationKey", "localStorage"]) {
  assert.ok(!choice.includes(forbidden), `choice bridge must reuse existing boundaries; found ${forbidden}`);
}

assert.match(code, /const APP_VERSION = '2\.5\.1'/);
assert.match(code, /const LEARNING_RECOMMENDATION_CONTRACT_VERSION = 'rec-v1'/);
assert.match(code, /const LEARNING_PATHWAY_CONTRACT_VERSION = 'pathway-v1'/);
assert.match(code, /case 'getLearningPathway':[\s\S]*?requireLearningRecommendationAccess_\(data\.recommendationKey, data\.adminKey\);[\s\S]*?getLearningPathway_\(data\)/);
assert.match(code, /learningPathwayContractVersion: LEARNING_PATHWAY_CONTRACT_VERSION/);
assert.match(code, /candidateLinks:/);
assert.match(code, /prerequisites:/);
assert.doesNotMatch(code, /case 'createLearningPathway'/);
assert.doesNotMatch(code, /case 'chooseTechniqueLearn'/);

const readStart = code.indexOf("function getLearningPathway_(data)");
const readEnd = code.indexOf("function setLearningPreference_(data)", readStart);
assert.ok(readStart >= 0 && readEnd > readStart, "bounded pathway read function must exist");
const boundedRead = code.slice(readStart, readEnd);
for (const forbidden of ["SHEET_NAMES.learningEvidence", "edge.EvidenceExpectation", "SHEET_NAMES.recommendationHistory", "SHEET_NAMES.sourceLinks", "PreferenceValue", "technique.ObservableEvidence", "CreatedAt:", "UpdatedAt:"]) {
  assert.ok(!boundedRead.includes(forbidden), `bounded pathway payload must exclude ${forbidden}`);
}
assert.ok(!/satisfied\s*:|mastery|readiness/i.test(boundedRead), "pathway response must not claim prerequisite satisfaction, mastery or readiness");

console.log("v2.7 static contracts: PASS");
