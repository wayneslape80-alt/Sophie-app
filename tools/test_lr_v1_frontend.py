from pathlib import Path
import re
import sys

html = Path("index.html").read_text(encoding="utf-8")
sw = Path("sw.js").read_text(encoding="utf-8")

checks = []

def check(name, condition):
    checks.append((name, bool(condition)))

# Capability isolation and data contract.
check("d006 gate preserved", 'next.opportunityContractVersion !== "d006-v1"' in html)
check("lr-v1 separate capability field", 'learningResourceContractVersion: String(raw.learningResourceContractVersion || "")' in html)
check("lr-v1 separate gate", '=== "lr-v1"' in html and 'learningResourceContractAvailable' in html)
check("active resources sourced from getData", 'learningResources: (Array.isArray(raw.learningResources)' in html)

# D-006 lifecycle/financial API regression.
for action in ["startOpportunity", "finishOpportunity", "withdrawEarn", "stopLearn", "reviewEarn", "completeContributionReview", "createOpportunity"]:
    check(f"D006 action {action}", f'"{action}"' in html)
for retired in ["claimJob", "approveJob", "rejectJob"]:
    check(f"retired action absent: {retired}", retired not in html)

# Learning Resources route coverage.
for action in [
    "getLearningResourcesAdmin", "createLearningResource", "updateLearningResource",
    "reorderLearningResources", "archiveLearningResource", "reviewLearningResource",
    "provisionLearningResourceDevice", "rotateLearningResourceDeviceKey", "suggestLearningResource"
]:
    check(f"LR action {action}", f'"{action}"' in html)

# Sophie suggestion is capability-key based and cannot create active state locally.
check("Sophie suggestion uses learningKey", 'action: "suggestLearningResource"' in html and 'learningKey: app.learningKey' in html)
check("Sophie suggestion verifies pending authoritative response", 'authoritative.reviewState !== "pending"' in html and 'authoritative.active' in html)
check("no local active resource push", 'learningResources.push' not in html and 'learningResourceAdmin.push' not in html)

# Trusted server embed metadata only.
check("trusted embed helper exists", 'function trustedLearningEmbed(resource)' in html)
check("requires backend youtube metadata", 'resource.provider !== "youtube"' in html and 'resource.embeddable !== true' in html)
check("requires 11-char provider id", '/^[A-Za-z0-9_-]{11}$/' in html)
check("requires youtube-nocookie hostname", 'embed.hostname !== "www.youtube-nocookie.com"' in html)
check("embed src comes from trusted helper", 'const embedUrl = trustedLearningEmbed(resource);' in html and 'src="${safe(embedUrl)}"' in html)
check("frontend does not construct embed URL", 'youtube-nocookie.com/embed/${' not in html)
check("iframe is lazy", 'loading="lazy"' in html)
check("iframe has fullscreen", 'allowfullscreen' in html)
check("no autoplay parameter", 'autoplay=1' not in html)
check("normal Open video fallback", 'Open video ↗' in html)

# Parent Mode lifecycle.
check("parent create dialog", 'id="learning-resource-editor-dialog"' in html)
check("parent review dialog", 'id="learning-resource-review-dialog"' in html)
check("parent edit", 'data-learning-resource-edit' in html)
check("parent reorder", 'data-learning-resource-move' in html)
check("parent archive", 'data-learning-resource-archive' in html)
check("parent pending review", 'data-learning-resource-review' in html)
check("device provisioning hidden key", 'The private capability key is never displayed.' in html)

# Failure/reload behaviour: existing authoritative data remains and mutations are gated.
check("global load retains previous authoritative state", 'app.data = hadAuthoritativeData ? previous : normaliseData(emptyData);' in html)
check("LR mutations blocked while data unavailable", 'return !app.dataUnavailable && learningResourceContractAvailable(data);' in html)
check("parent admin read preserves loaded list on failure", 'app.learningResourceAdminUnavailable = true;' in html and 'app.learningResourceAdmin = []' not in html.split('async function loadParentLearningResources',1)[1].split('async function refreshLearningResourceViews',1)[0])
check("failed resource writes do not mutate local resource arrays", not re.search(r'app\.(?:learningResourceAdmin|data\.learningResources)\s*=.*(?:filter|map|concat|\[)', html.split('async function saveLearningResourceEditor',1)[1].split('function openLearningResourceReview',1)[0]))

# Learn-only active presentation and non-completion semantics.
check("resources render only for Learn", 'job.type !== "learn"' in html and 'learningResourceSectionMarkup(job)' in html)
check("only active review state displayed", 'resource.active === true && resource.reviewState === "active"' in html)
check("watching is not completion", 'Watching a video does not complete this activity.' in html)

# PWA update behaviour.
check("cache bumped", 'sophie-app-v2-9-learning-resources' in sw)
check("old cache removed", 'sophie-app-v2-8-d006-opportunities' not in sw)
check("skipWaiting retained", 'self.skipWaiting()' in sw)
check("clients.claim retained", 'self.clients.claim()' in sw)
check("network-first fetch retained", 'fetch(event.request)' in sw and '.catch(() => caches.match(event.request)' in sw)
check("registration bypasses HTTP cache", 'updateViaCache: "none"' in html)
check("registration requests update", 'registration.update()' in html)

failed = [name for name, ok in checks if not ok]
for name, ok in checks:
    print(("PASS" if ok else "FAIL") + " - " + name)
print(f"\n{len(checks)-len(failed)}/{len(checks)} checks passed")
if failed:
    print("Failed checks:", ", ".join(failed), file=sys.stderr)
    raise SystemExit(1)
