const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { makePathwayPayload } = require("./v27-pathway-fixture.cjs");

const code = fs.readFileSync(path.resolve(__dirname, "..", "Code.gs"), "utf8");
const start = code.indexOf("function getLearningPathway_(data)");
const end = code.indexOf("function setLearningPreference_(data)", start);
assert.ok(start >= 0 && end > start, "getLearningPathway_ source not found");
const functionSource = code.slice(start, end);

const fixture = makePathwayPayload();
const candidates = [
  {CandidateID:"LC-COOK-005",Domain:"cooking",SkillID:"S001",CandidateStatus:"active"},
  {CandidateID:"LC-HIDDEN",Domain:"cooking",SkillID:"S001",CandidateStatus:"retired"}
];
const mappings = fixture.techniques.filter(technique => technique.techniqueId !== "COOK-T018").map((technique,index) => ({
  CandidateTechniqueID:`CT-${index}`,
  CandidateID:"LC-COOK-005",
  TechniqueID:technique.techniqueId,
  Role:technique.techniqueId === "COOK-T004" ? "primary_practice" : "supporting",
  EvidenceRelevant:true,
  SafetyRole:"sophie_led"
})).concat([{CandidateTechniqueID:"CT-HIDDEN",CandidateID:"LC-HIDDEN",TechniqueID:"COOK-T004",Role:"primary_practice",EvidenceRelevant:true,SafetyRole:"sophie_led"}]);
const prerequisites = fixture.techniques.flatMap((technique,index) => technique.prerequisites.map((edge,edgeIndex) => ({
  PrerequisiteEdgeID:`PE-${index}-${edgeIndex}`,
  TechniqueID:technique.techniqueId,
  PrerequisiteTechniqueID:edge.prerequisiteTechniqueId,
  RequirementKind:edge.kind,
  EvidenceExpectation:"internal expectation must not leave the backend",
  Rationale:edge.rationale,
  SafetyRelated:edge.safetyRelated,
  SupportImplication:edge.supportImplication,
  AppliesWhen:"internal applicability",
  Active:true,
  CreatedAt:new Date(),
  UpdatedAt:new Date()
})));
const techniques = fixture.techniques.map(technique => ({
  TechniqueID:technique.techniqueId,
  SkillID:"S001",
  Name:technique.title,
  SophieFacingTitle:technique.title,
  TechniqueFamily:technique.family,
  Description:technique.description,
  ObservableEvidence:"internal observation wording",
  TypicalScaffoldOptions:JSON.stringify(technique.typicalSupportOptions),
  SafetyCritical:technique.safety.critical,
  TypicalSafetySupport:technique.safety.typicalSupport,
  SafetyNote:technique.safety.note,
  Active:true,
  CreatedAt:new Date(),
  UpdatedAt:new Date()
})).concat([{
  TechniqueID:"OTHER-T001",SkillID:"S999",Name:"Other domain",SophieFacingTitle:"Other domain",
  TechniqueFamily:"other",Description:"Must not leave the bounded Cooking response.",TypicalScaffoldOptions:"[]",
  SafetyCritical:false,TypicalSafetySupport:"none",SafetyNote:"",Active:true
}]);

const sheets = {LearnCandidates:candidates,CandidateTechniques:mappings,TechniquePrerequisites:prerequisites,Techniques:techniques};
const context = {
  SpreadsheetApp:{openById:() => ({})},
  SPREADSHEET_ID:"test",
  SHEET_NAMES:{learnCandidates:"LearnCandidates",candidateTechniques:"CandidateTechniques",techniquePrerequisites:"TechniquePrerequisites",techniques:"Techniques"},
  REC_ENUMS:{domain:["cooking"]},
  LEARNING_PATHWAY_CONTRACT_VERSION:"pathway-v1",
  assertLearningRecommendationSchemaReady_:() => {},
  cleanRecEnum_:(value,allowed) => { assert.ok(allowed.includes(value)); return value; },
  recSheet_:(db,name) => name,
  readObjects_:name => sheets[name] || [],
  recBoolFromRow_:value => value === true || String(value).toLowerCase() === "true",
  parseRecJsonArray_:value => Array.isArray(value) ? value : JSON.parse(value)
};
vm.createContext(context);
vm.runInContext(functionSource, context);
const result = context.getLearningPathway_({domain:"cooking"});

assert.equal(result.learningPathwayContractVersion,"pathway-v1");
assert.equal(result.domain,"cooking");
assert.equal(result.techniques.length,22);
assert.ok(result.techniques.some(item => item.techniqueId === "COOK-T018"),"active domain technique without a candidate edge must remain visible");
assert.ok(!result.techniques.some(item => item.techniqueId === "OTHER-T001"),"another domain's technique must be excluded");
const knife = result.techniques.find(item => item.techniqueId === "COOK-T004");
assert.ok(knife);
assert.equal(knife.candidateLinks.length,1,"inactive candidate links must be excluded");
assert.equal(knife.candidateLinks[0].candidateId,"LC-COOK-005");
assert.equal(knife.prerequisites.length,1);
assert.equal(knife.prerequisites[0].kind,"hard");
assert.equal(knife.prerequisites[0].title,"Set Up Sharp Tools Safely");

const serialised = JSON.stringify(result);
for (const forbidden of ["internal expectation","internal applicability","internal observation wording","EvidenceExpectation","ObservableEvidence","LearningEvidence","RecommendationHistory","SourceLinks"]) {
  assert.ok(!serialised.includes(forbidden),`bounded payload leaked ${forbidden}`);
}
assert.ok(!/"satisfied"|mastery|readiness/i.test(serialised),"bounded payload must not assert readiness state");
console.log("v2.7 backend pathway contract: PASS");
