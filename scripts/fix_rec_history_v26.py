from pathlib import Path

index_path = Path("index.html")
test_path = Path("tests/mobile-regression.cjs")

text = index_path.read_text(encoding="utf-8")

replacements = {
    'writeNavigationState("push", { overlay: "recommendation", recView: "results" });':
        'writeNavigationState("replace", { overlay: "recommendation", recView: "results" });',
    'writeNavigationState("push", { overlay: "recommendation", recView: "catalogue" });':
        'writeNavigationState("replace", { overlay: "recommendation", recView: "catalogue" });',
    'writeNavigationState("push", { overlay: "recommendation", recView: "support", candidateId: candidate.candidateId, candidateSource: source });':
        'writeNavigationState("replace", { overlay: "recommendation", recView: "support", candidateId: candidate.candidateId, candidateSource: source });',
    'renderRecommendationDialog(); writeNavigationState("push", { overlay: "recommendation", recView: "preview", candidateId: recPreview.dataset.recPreview, candidateSource: "recommendation" });':
        'renderRecommendationDialog(); writeNavigationState("replace", { overlay: "recommendation", recView: "preview", candidateId: recPreview.dataset.recPreview, candidateSource: "recommendation" });',
    'if (recChangeSetup) { app.rec.view = "setup"; app.rec.error = ""; app.rec.retry = null; renderRecommendationDialog(); writeNavigationState("push", { overlay: "recommendation", recView: "setup" }); }':
        'if (recChangeSetup) { app.rec.view = "setup"; app.rec.error = ""; app.rec.retry = null; renderRecommendationDialog(); writeNavigationState("replace", { overlay: "recommendation", recView: "setup" }); }',
    'if (recBackResults) { if (history.state?.overlay === "recommendation") history.back(); else { app.rec.view = "results"; app.rec.currentCandidate = null; app.rec.error = ""; renderRecommendationDialog(); } }':
        'if (recBackResults) { app.rec.view = "results"; app.rec.currentCandidate = null; app.rec.error = ""; renderRecommendationDialog(); if (history.state?.overlay === "recommendation") writeNavigationState("replace", { overlay: "recommendation", recView: "results" }); }',
    'if (recBackSupport) { if (history.state?.overlay === "recommendation") history.back(); else { app.rec.view = app.rec.currentSource === "catalogue" ? "catalogue" : "preview"; app.rec.error = ""; renderRecommendationDialog(); } }':
        'if (recBackSupport) { const returnView = app.rec.currentSource === "catalogue" ? "catalogue" : "preview"; app.rec.view = returnView; app.rec.error = ""; renderRecommendationDialog(); if (history.state?.overlay === "recommendation") { const nav = { overlay: "recommendation", recView: returnView }; if (returnView === "preview" && app.rec.currentCandidate) { nav.candidateId = app.rec.currentCandidate.candidateId; nav.candidateSource = app.rec.currentSource; } writeNavigationState("replace", nav); } }',
}

for old, new in replacements.items():
    if old in text:
        text = text.replace(old, new)
    elif new not in text:
        raise SystemExit(f"Expected navigation pattern not found: {old[:100]}")

index_path.write_text(text, encoding="utf-8")

# Add regression coverage for whole-session exit and stale history after conversion.
test = test_path.read_text(encoding="utf-8")

results_anchor = '  await page.getByRole("heading", { name: "A few Cooking ideas" }).waitFor();\n  await page.getByRole("button", { name: "Browse more ideas" }).click();'
results_replacement = '''  await page.getByRole("heading", { name: "A few Cooking ideas" }).waitFor();
  await page.getByRole("button", { name: "Not now", exact: true }).click();
  await page.locator("#recommendation-dialog").waitFor({ state: "hidden" });
  await page.getByRole("heading", { name: "Cooking", exact: true }).waitFor();
  await page.getByRole("button", { name: "Find a Cooking idea" }).click();
  await page.getByRole("button", { name: "About the same" }).click();
  await page.getByRole("button", { name: "An adult will be nearby" }).click();
  await page.getByRole("button", { name: "Show me some ideas" }).click();
  await page.getByRole("heading", { name: "A few Cooking ideas" }).waitFor();
  await page.getByRole("button", { name: "Browse more ideas" }).click();'''
if results_anchor in test:
    test = test.replace(results_anchor, results_replacement, 1)
elif results_replacement not in test:
    raise SystemExit("Recommendation whole-session exit test anchor not found")

post_choose_anchor = '''  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("heading", { name: "Currently learning" }).waitFor();
  await page.locator("#skills-workspace").getByText("Caprese-style salad", { exact: true }).waitFor();

  await page.getByRole("button", { name: "Opportunities", exact: true }).click();'''
post_choose_replacement = '''  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("heading", { name: "Currently learning" }).waitFor();
  await page.locator("#skills-workspace").getByText("Caprese-style salad", { exact: true }).waitFor();
  await page.evaluate(() => history.back());
  await page.getByRole("heading", { name: "Cooking", exact: true }).waitFor();
  assert.strictEqual(await page.locator("#recommendation-dialog[open]").count(), 0, "stale recommendation history reopened after Learn conversion");

  await page.getByRole("button", { name: "Opportunities", exact: true }).click();'''
if post_choose_anchor in test:
    test = test.replace(post_choose_anchor, post_choose_replacement, 1)
elif post_choose_replacement not in test:
    raise SystemExit("Post-conversion history test anchor not found")

test_path.write_text(test, encoding="utf-8")

print("rec-v1 history fix applied")
