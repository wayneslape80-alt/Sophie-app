const rows = [
  ["COOK-T001","Run the Prep","organisation"],["COOK-T002","Measure It Properly","measurement"],
  ["COOK-T003","Set Up Sharp Tools Safely","knife_and_prep"],["COOK-T004","Control the Knife","knife_and_prep"],
  ["COOK-T005","Grate With Control","knife_and_prep"],["COOK-T018","Keep the Kitchen Safe","safety"],
  ["COOK-T019","Build and Present the Dish","assembly"],["COOK-T020","Mix With Purpose","preparation"],
  ["COOK-T021","Use a Small Appliance Safely","equipment"],["COOK-T006","Read the Heat","heat_control"],
  ["COOK-T007","Sauté Without Steaming","heat_control"],["COOK-T008","Hold the Simmer","moist_heat"],
  ["COOK-T009","Manage a Boiling Pot","moist_heat"],["COOK-T010","Use the Oven With Intention","oven"],
  ["COOK-T022","Control Direct Grill Heat","heat_control"],["COOK-T011","Know When It's Ready","judgement"],
  ["COOK-T012","Make It Taste Right","flavour"],["COOK-T013","Bring Oil and Water Together","sauces_and_dressings"],
  ["COOK-T014","Cook the Grain","grains"],["COOK-T015","Know When to Stop Mixing","baking"],
  ["COOK-T016","Handle the Dough","baking"],["COOK-T017","Bring It Together","coordination"]
];

const edges = {
  "COOK-T004":[["COOK-T003","Set Up Sharp Tools Safely","hard"]],
  "COOK-T005":[["COOK-T003","Set Up Sharp Tools Safely","hard"]],
  "COOK-T007":[["COOK-T006","Read the Heat","recommended"]],
  "COOK-T008":[["COOK-T006","Read the Heat","recommended"]],
  "COOK-T009":[["COOK-T006","Read the Heat","recommended"]],
  "COOK-T022":[["COOK-T006","Read the Heat","recommended"]],
  "COOK-T013":[["COOK-T020","Mix With Purpose","recommended"],["COOK-T012","Make It Taste Right","recommended"]],
  "COOK-T014":[["COOK-T002","Measure It Properly","recommended"],["COOK-T008","Hold the Simmer","recommended"]],
  "COOK-T015":[["COOK-T002","Measure It Properly","recommended"],["COOK-T020","Mix With Purpose","recommended"]],
  "COOK-T016":[["COOK-T002","Measure It Properly","recommended"],["COOK-T020","Mix With Purpose","recommended"]],
  "COOK-T017":[["COOK-T011","Know When It's Ready","recommended"],["COOK-T001","Run the Prep","recommended"]]
};

function makePathwayPayload() {
  return {
    learningPathwayContractVersion:"pathway-v1",
    domain:"cooking",
    techniques:rows.map(([techniqueId,title,family]) => ({
      techniqueId,title,family,
      description:`Authoritative description for ${title}.`,
      typicalSupportOptions:["show_me","do_with_me","prompt_me","got_this"],
      safety:{critical:["COOK-T003","COOK-T004","COOK-T005","COOK-T006","COOK-T007","COOK-T008","COOK-T009","COOK-T010","COOK-T014","COOK-T018","COOK-T021","COOK-T022"].includes(techniqueId),typicalSupport:techniqueId === "COOK-T004" ? "adult_nearby" : "none",note:techniqueId === "COOK-T004" ? "Use deliberate hand position and activity-specific adult support." : ""},
      candidateLinks:techniqueId === "COOK-T004"
        ? [{candidateId:"LC-COOK-005",role:"primary_practice",evidenceRelevant:true,safetyRole:"sophie_led"},{candidateId:"LC-COOK-015",role:"primary_practice",evidenceRelevant:true,safetyRole:"sophie_led"}]
        : [],
      prerequisites:(edges[techniqueId] || []).map(([prerequisiteTechniqueId,prerequisiteTitle,kind]) => ({
        prerequisiteTechniqueId,title:prerequisiteTitle,kind,
        rationale:kind === "hard" ? "Safe sharp-tool setup comes first for Sophie-led practice." : "This preparation can make the technique easier to interpret.",
        safetyRelated:kind === "hard",
        supportImplication:kind === "hard" ? "Use a separately defined adult-led variant if the prerequisite is not confirmed." : "Add support without locking the later technique."
      }))
    }))
  };
}

module.exports = { makePathwayPayload };
