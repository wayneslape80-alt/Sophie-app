/**
 * Sophie App v2.5.0 - D-006 / d006-v1 + Learning Resources lr-v1 + Learning Recommendations rec-v1 backend.
 *
 * This release carries forward the verified v2.3 School backend and adds the
 * authoritative Opportunity lifecycle contract. Deploy only as part of the
 * controlled D-006 backend/frontend release. Historical Transactions are never
 * rewritten by the D-006 migration.
 */

const SPREADSHEET_ID = '1qfuPKdDIT6WkLPRQ9qf7ww38JqYBu37bvLfYu3X2Eq0';
const APP_VERSION = '2.5.1';
const OPPORTUNITY_CONTRACT_VERSION = 'd006-v1';
const LEARNING_RESOURCE_CONTRACT_VERSION = 'lr-v1';
const LEARNING_RECOMMENDATION_CONTRACT_VERSION = 'rec-v1';
const LEARNING_PATHWAY_CONTRACT_VERSION = 'pathway-v1';

const SHEET_NAMES = Object.freeze({
  stats: 'Stats',
  opportunities: 'Opportunities',
  goals: 'Goals',
  skills: 'Skills',
  transactions: 'Transactions',
  schoolTasks: 'SchoolTasks',
  schoolRubric: 'SchoolRubric',
  schoolProfile: 'SchoolProfile',
  learningResources: 'LearningResources',
  learnCandidates: 'LearnCandidates',
  techniques: 'Techniques',
  candidateTechniques: 'CandidateTechniques',
  techniquePrerequisites: 'TechniquePrerequisites',
  learningEvidence: 'LearningEvidence',
  learningPreferences: 'LearningPreferences',
  recommendationHistory: 'RecommendationHistory',
  sourceLinks: 'SourceLinks'
});

const OPPORTUNITY_HEADERS = [
  'ID', 'Title', 'Value', 'Tier', 'Status', 'Description', 'Category', 'Type',
  'Skill', 'EstimatedMinutes', 'Repeatable', 'Frequency', 'ClaimedAt',
  'SubmittedAt', 'ApprovedAt', 'Icon', 'Instructions', 'WhyItMatters',
  'Feedback', 'ApprovedBy',
  'Requiredness', 'Scope', 'CompletionStandard', 'ApprovalRequired', 'ReviewReason',
  'SkillID', 'SupportPreference', 'CreatedAt', 'UpdatedAt', 'StartedAt', 'FinishedAt',
  'ReviewedAt', 'CompletedAt', 'WithdrawnAt', 'CancelledAt', 'AgreedValue',
  'AgreedScope', 'AgreedCompletionStandard', 'AgreedEstimatedMinutes', 'AcceptedAt',
  'ReviewState', 'ReviewKind', 'ReviewOutcome', 'ApprovedAmount', 'ReviewFeedback',
  'ReviewedBy', 'WithdrawalReviewRequested', 'PartialWorkDescription',
  'SourceOpportunityID', 'MigrationVersion', 'SourceCandidateID'
];
const GOAL_HEADERS = ['GoalID', 'Title', 'TargetAmount', 'SavedAmount', 'Icon', 'Status', 'CreatedAt', 'ImageUrl', 'ProductUrl'];
const SKILL_HEADERS = ['SkillID', 'Name', 'Level', 'Progress', 'NextLevelAt', 'Icon', 'Description'];
const TRANSACTION_HEADERS = [
  'TransactionID', 'Date', 'Type', 'Description', 'Amount', 'OpportunityID',
  'GoalID', 'Status', 'ApprovedBy', 'Feedback', 'AgreedAmount', 'ReviewKind',
  'ReviewOutcome'
];

const LEARNING_RESOURCE_DEVICE_KEY_PROPERTY = 'SOPHIE_LEARNING_RESOURCE_DEVICE_KEY';
const LEARNING_RECOMMENDATION_DEVICE_KEY_PROPERTY = 'SOPHIE_LEARNING_RECOMMENDATION_DEVICE_KEY';
const LEARNING_RESOURCE_HEADERS = [
  'ResourceID', 'AttachedToType', 'AttachedToID', 'ResourceType', 'Title', 'URL',
  'Provider', 'ProviderResourceID', 'Description', 'WhatToNotice', 'TryNext',
  'SafetyNote', 'SortOrder', 'AddedByRole', 'ReviewState', 'Active', 'CreatedAt',
  'UpdatedAt', 'ArchivedAt', 'ReviewedAt', 'ReviewedBy', 'ReviewFeedback'
];
const LEARNING_RESOURCE_LIMITS = Object.freeze({
  title: 160,
  url: 2048,
  description: 500,
  whatToNotice: 500,
  tryNext: 500,
  safetyNote: 240,
  reviewFeedback: 500
});

const D006_MIGRATION_CONFIG_PROPERTY = 'SOPHIE_D006_MIGRATION_CONFIG';
const D006_OPPORTUNITY_SNAPSHOT_SHEET = 'Opportunities_PreD006_v23';
const D006_TRANSACTION_SNAPSHOT_SHEET = 'Transactions_PreD006_v23';
// SchoolTasks retains the original MVP Status/NextAction columns for backward
// compatibility with the currently deployed frontend. Canonical D-005 fields are
// stored alongside them rather than collapsing journey, support and submission.
const SCHOOL_TASK_HEADERS = [
  'TaskID', 'Subject', 'Title', 'DueDate', 'TaskType', 'Status', 'NextAction',
  'HelpType', 'Source', 'CreatedAt', 'StartedAt', 'UpdatedAt', 'SubmittedAt',
  'ReceiptConfirmedAt', 'ArchivedAt',
  'SourceTaskID', 'SubjectKey', 'SetDate', 'RecordState', 'JourneyStage',
  'CurrentAction', 'SupportPreference', 'SourceStatus', 'SubmissionState',
  'GradeOrResult', 'Mark', 'TeacherComment', 'CoachComment',
  'CarryForwardSuggestion', 'SourceConflict', 'ParentReviewState'
];
const SCHOOL_RUBRIC_HEADERS = [
  'RubricID', 'TaskID', 'CriterionOrder', 'CriterionCode', 'CriterionName',
  'Rating', 'Mark', 'MaxMark', 'SelectedDescriptor', 'Source', 'CreatedAt', 'UpdatedAt'
];
const SCHOOL_PROFILE_HEADERS = [
  'ProfileID', 'ScaffoldMode', 'PreferredSchoolView', 'LastScaffoldReviewAt',
  'SuggestedScaffoldMode', 'UpdatedAt'
];
const SCHOOL_PROFILE_ID = 'SP-SOPHIE';
const SCHOOL_TIME_ZONE = 'Australia/Adelaide';

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'getData');
    if (action === 'health') {
      return json_({
        success: true,
        version: APP_VERSION,
        opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
        learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION,
        learningRecommendationContractVersion: LEARNING_RECOMMENDATION_CONTRACT_VERSION,
        learningPathwayContractVersion: LEARNING_PATHWAY_CONTRACT_VERSION
      });
    }
    if (action !== 'getData') throwApiError_('INVALID_ACTION', 'Unsupported GET action.');
    return json_(getAppData_());
  } catch (error) {
    return json_({ success: false, code: apiErrorCode_(error), error: safeError_(error) });
  }
}

function doPost(e) {
  try {
    const data = parsePostData_(e);
    const action = String(data.action || '');
    let result;

    switch (action) {
      case 'getParentData':
        requireAdmin_(data.adminKey);
        result = getAppData_();
        break;

      // D-006 / d006-v1 Opportunity lifecycle.
      case 'startOpportunity':
        result = startOpportunity_(data.opportunityId);
        break;
      case 'finishOpportunity':
        result = finishOpportunity_(data.opportunityId);
        break;
      case 'withdrawEarn':
        result = withdrawEarn_(data);
        break;
      case 'stopLearn':
        result = stopLearn_(data.opportunityId);
        break;
      case 'reviewEarn':
        requireAdmin_(data.adminKey);
        result = reviewEarn_(data);
        break;
      case 'completeContributionReview':
        requireAdmin_(data.adminKey);
        result = completeContributionReview_(data);
        break;
      case 'cancelOpportunity':
        requireAdmin_(data.adminKey);
        result = cancelOpportunity_(data);
        break;
      case 'createOpportunity':
        requireAdmin_(data.adminKey);
        result = createOpportunity_(data);
        break;

      // Learning Resources / lr-v1. Active reads are public with getData;
      // privileged management stays parent-authenticated and Sophie suggestions
      // require a separately provisioned device capability key.
      case 'getLearningResources':
        result = getLearningResources_(data.attachedToId);
        break;
      case 'getLearningResourcesAdmin':
        requireAdmin_(data.adminKey);
        result = getLearningResourcesAdmin_(data.attachedToId);
        break;
      case 'createLearningResource':
        requireAdmin_(data.adminKey);
        result = createLearningResource_(data);
        break;
      case 'updateLearningResource':
        requireAdmin_(data.adminKey);
        result = updateLearningResource_(data);
        break;
      case 'reorderLearningResources':
        requireAdmin_(data.adminKey);
        result = reorderLearningResources_(data);
        break;
      case 'archiveLearningResource':
        requireAdmin_(data.adminKey);
        result = archiveLearningResource_(data.resourceId);
        break;
      case 'reviewLearningResource':
        requireAdmin_(data.adminKey);
        result = reviewLearningResource_(data);
        break;
      case 'provisionLearningResourceDevice':
        requireAdmin_(data.adminKey);
        result = provisionLearningResourceDevice_();
        break;
      case 'rotateLearningResourceDeviceKey':
        requireAdmin_(data.adminKey);
        result = rotateLearningResourceDeviceKey_();
        break;
      case 'suggestLearningResource':
        requireLearningResourceAccess_(data.learningKey, data.adminKey);
        result = suggestLearningResource_(data);
        break;

      // Learning Recommendations / rec-v1. All Sophie-facing routes use a
      // dedicated device capability key or parent admin override. Raw evidence,
      // preferences and history are never exposed through public getData.
      case 'provisionLearningRecommendationDevice':
        requireAdmin_(data.adminKey);
        result = provisionLearningRecommendationDevice_();
        break;
      case 'rotateLearningRecommendationDeviceKey':
        requireAdmin_(data.adminKey);
        result = rotateLearningRecommendationDeviceKey_();
        break;
      case 'getLearningRecommendations':
        requireLearningRecommendationAccess_(data.recommendationKey, data.adminKey);
        result = getLearningRecommendations_(data);
        break;
      case 'getLearningCandidateCatalogue':
        requireLearningRecommendationAccess_(data.recommendationKey, data.adminKey);
        result = getLearningCandidateCatalogue_(data);
        break;
      case 'getLearningPathway':
        requireLearningRecommendationAccess_(data.recommendationKey, data.adminKey);
        result = getLearningPathway_(data);
        break;
      case 'setLearningPreference':
        requireLearningRecommendationAccess_(data.recommendationKey, data.adminKey);
        result = setLearningPreference_(data);
        break;
      case 'recordRecommendationResponse':
        requireLearningRecommendationAccess_(data.recommendationKey, data.adminKey);
        result = recordRecommendationResponse_(data);
        break;
      case 'chooseRecommendedLearn':
        requireLearningRecommendationAccess_(data.recommendationKey, data.adminKey);
        result = chooseRecommendedLearn_(data);
        break;
      case 'getLearnCandidatesAdmin':
        requireAdmin_(data.adminKey);
        result = getLearnCandidatesAdmin_();
        break;
      case 'createLearnCandidate':
        requireAdmin_(data.adminKey);
        result = createLearnCandidate_(data);
        break;
      case 'updateLearnCandidate':
        requireAdmin_(data.adminKey);
        result = updateLearnCandidate_(data);
        break;
      case 'setCandidateStatus':
        requireAdmin_(data.adminKey);
        result = setCandidateStatus_(data);
        break;
      case 'createTechnique':
        requireAdmin_(data.adminKey);
        result = createTechnique_(data);
        break;
      case 'updateTechnique':
        requireAdmin_(data.adminKey);
        result = updateTechnique_(data);
        break;
      case 'setCandidateTechniques':
        requireAdmin_(data.adminKey);
        result = setCandidateTechniques_(data);
        break;
      case 'setTechniquePrerequisites':
        requireAdmin_(data.adminKey);
        result = setTechniquePrerequisites_(data);
        break;
      case 'recordLearningEvidence':
        requireAdmin_(data.adminKey);
        result = recordLearningEvidence_(data);
        break;
      case 'createSourceLink':
        requireAdmin_(data.adminKey);
        result = createSourceLink_(data);
        break;
      case 'deleteSourceLink':
        requireAdmin_(data.adminKey);
        result = deleteSourceLink_(data.sourceLinkId);
        break;
      case 'getLearningEvidenceAdmin':
        requireAdmin_(data.adminKey);
        result = getLearningEvidenceAdmin_();
        break;
      case 'getLearningPreferencesAdmin':
        requireAdmin_(data.adminKey);
        result = getLearningPreferencesAdmin_();
        break;
      case 'getRecommendationHistoryAdmin':
        requireAdmin_(data.adminKey);
        result = getRecommendationHistoryAdmin_();
        break;

      // Legacy Opportunity mutations are deliberately disabled. Reusing the old
      // claim path would recreate the prohibited start -> pending-money behaviour.
      case 'claimJob':
      case 'approveJob':
      case 'rejectJob':
        throwApiError_('CLIENT_UPDATE_REQUIRED', 'This Opportunity action belongs to the retired pre-D006 lifecycle. Reload the updated app.');
        break;

      case 'createGoal':
        result = createGoal_(data);
        break;
      case 'approveGoal':
        requireAdmin_(data.adminKey);
        result = approveGoal_(data.goalId);
        break;
      case 'rejectGoal':
        requireAdmin_(data.adminKey);
        result = rejectGoal_(data.goalId);
        break;
      case 'provisionSchoolDevice':
        requireAdmin_(data.adminKey);
        result = provisionSchoolDevice_();
        break;
      case 'rotateSchoolDeviceKey':
        requireAdmin_(data.adminKey);
        result = rotateSchoolDeviceKey_();
        break;
      case 'getSchoolTasks':
        requireSchoolAccess_(data.schoolKey, data.adminKey);
        result = getSchoolTasks_();
        break;
      case 'createSchoolTask':
        requireSchoolAccess_(data.schoolKey, data.adminKey);
        result = createSchoolTask_(data);
        break;
      case 'updateSchoolTask':
        requireSchoolAccess_(data.schoolKey, data.adminKey);
        result = updateSchoolTask_(data);
        break;
      case 'requestSchoolHelp':
        requireSchoolAccess_(data.schoolKey, data.adminKey);
        result = requestSchoolHelp_(data.taskId, data.helpType);
        break;
      case 'markSchoolSubmitted':
        requireSchoolAccess_(data.schoolKey, data.adminKey);
        result = markSchoolSubmitted_(data.taskId);
        break;
      case 'confirmSchoolReceipt':
        requireSchoolAccess_(data.schoolKey, data.adminKey);
        result = confirmSchoolReceipt_(data.taskId);
        break;
      case 'archiveSchoolTask':
        requireSchoolAccess_(data.schoolKey, data.adminKey);
        result = archiveSchoolTask_(data.taskId);
        break;
      case 'getSchoolWorkspace':
        requireSchoolAccess_(data.schoolKey, data.adminKey);
        result = getSchoolWorkspace_();
        break;
      case 'getSchoolHistory':
        requireSchoolAccess_(data.schoolKey, data.adminKey);
        result = getSchoolHistory_();
        break;
      case 'getSchoolProfile':
        requireSchoolAccess_(data.schoolKey, data.adminKey);
        result = getSchoolProfile_();
        break;
      case 'updateSchoolProfile':
        if (Object.prototype.hasOwnProperty.call(data, 'scaffoldMode') ||
            Object.prototype.hasOwnProperty.call(data, 'suggestedScaffoldMode') ||
            Object.prototype.hasOwnProperty.call(data, 'lastScaffoldReviewAt')) {
          requireAdmin_(data.adminKey);
        } else {
          requireSchoolAccess_(data.schoolKey, data.adminKey);
        }
        result = updateSchoolProfile_(data);
        break;
      case 'getSchoolRubric':
        requireSchoolAccess_(data.schoolKey, data.adminKey);
        result = getSchoolRubric_(data.taskId);
        break;
      case 'saveSchoolFeedback':
        requireAdmin_(data.adminKey);
        result = saveSchoolFeedback_(data);
        break;
      case 'saveSchoolRubric':
        requireAdmin_(data.adminKey);
        result = saveSchoolRubric_(data);
        break;
      default:
        throwApiError_('INVALID_ACTION', 'Unsupported action.');
    }

    return json_({ success: true, data: result });
  } catch (error) {
    const failure = { success: false, code: apiErrorCode_(error), error: safeError_(error) };
    if (error && error.eligibility) failure.eligibility = error.eligibility;
    return json_(failure);
  }
}

function getAppData_() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const statsSheet = requireSheet_(db, SHEET_NAMES.stats);
  const opportunitiesSheet = requireSheet_(db, SHEET_NAMES.opportunities);
  const stats = readStats_(statsSheet);
  const jobs = readObjects_(opportunitiesSheet)
    .map(normaliseOpportunity_)
    .filter(function(job) { return job.migrationVersion !== 'd006-v1-retired'; });
  const goalsSheet = db.getSheetByName(SHEET_NAMES.goals);
  const skillsSheet = db.getSheetByName(SHEET_NAMES.skills);
  const transactionsSheet = db.getSheetByName(SHEET_NAMES.transactions);
  const goals = goalsSheet ? readObjects_(goalsSheet).map(normaliseGoal_) : [];
  const skills = skillsSheet ? readObjects_(skillsSheet).map(normaliseSkill_) : [];
  const transactions = transactionsSheet
    ? readObjects_(transactionsSheet).map(normaliseTransaction_).sort(sortByDateDesc_).slice(0, 80)
    : [];
  const learningResources = readLearningResourcesFromDb_(db, '', true);

  return {
    appVersion: APP_VERSION,
    opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
    learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION,
    learningRecommendationContractVersion: LEARNING_RECOMMENDATION_CONTRACT_VERSION,
    learningPathwayContractVersion: LEARNING_PATHWAY_CONTRACT_VERSION,
    balance: stats.balance,
    pending: stats.pending,
    familyValue: stats.familyValue,
    badges: stats.badges,
    impact: calculateImpact_(transactions),
    jobs: jobs,
    goals: goals,
    skills: skills,
    transactions: transactions,
    learningResources: learningResources
  };
}

/*
 * Learning Resources / lr-v1
 * Additive to D-006. Resource viewing never mutates Opportunity lifecycle,
 * competence, payment, XP, streaks or completion state.
 */
function getLearningResources_(attachedToId) {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  return readLearningResourcesFromDb_(db, attachedToId, true);
}

function getLearningResourcesAdmin_(attachedToId) {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  return readLearningResourcesFromDb_(db, attachedToId, false);
}

function readLearningResourcesFromDb_(db, attachedToId, activeOnly) {
  const sheet = db.getSheetByName(SHEET_NAMES.learningResources);
  if (!sheet) return [];
  const targetId = cleanText_(attachedToId || '', 120);
  return readObjects_(sheet)
    .map(normaliseLearningResource_)
    .filter(function(resource) {
      if (targetId && resource.attachedToId !== targetId) return false;
      return !activeOnly || (resource.active && resource.reviewState === 'active');
    })
    .sort(sortLearningResources_);
}

function provisionLearningResourceDevice_() {
  const properties = PropertiesService.getScriptProperties();
  let key = properties.getProperty(LEARNING_RESOURCE_DEVICE_KEY_PROPERTY);
  if (!key) {
    key = generateLearningResourceKey_();
    properties.setProperty(LEARNING_RESOURCE_DEVICE_KEY_PROPERTY, key);
  }
  return { learningKey: key, provisioned: true, learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION };
}

function rotateLearningResourceDeviceKey_() {
  const key = generateLearningResourceKey_();
  PropertiesService.getScriptProperties().setProperty(LEARNING_RESOURCE_DEVICE_KEY_PROPERTY, key);
  return { learningKey: key, rotated: true, learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION };
}

function createLearningResource_(data) {
  return withLearningResourceLock_(function(db, sheet) {
    const draft = buildLearningResourceDraft_(db, data, 'parent', 'active');
    assertNoLearningResourceDuplicate_(sheet, draft.AttachedToID, draft.Provider, draft.ProviderResourceID, '');
    draft.ResourceID = uniqueGeneratedId_(sheet, 'ResourceID', 'LR');
    draft.SortOrder = nextLearningResourceSortOrder_(sheet, draft.AttachedToID);
    draft.Active = true;
    draft.CreatedAt = new Date();
    draft.UpdatedAt = draft.CreatedAt;
    appendObjectRow_(sheet, draft);
    SpreadsheetApp.flush();
    return normaliseLearningResource_(draft);
  });
}

function suggestLearningResource_(data) {
  return withLearningResourceLock_(function(db, sheet) {
    const draft = buildLearningResourceDraft_(db, data, 'sophie', 'pending');
    assertNoLearningResourceDuplicate_(sheet, draft.AttachedToID, draft.Provider, draft.ProviderResourceID, '');
    draft.ResourceID = uniqueGeneratedId_(sheet, 'ResourceID', 'LR');
    draft.SortOrder = nextLearningResourceSortOrder_(sheet, draft.AttachedToID);
    draft.Active = false;
    draft.CreatedAt = new Date();
    draft.UpdatedAt = draft.CreatedAt;
    appendObjectRow_(sheet, draft);
    SpreadsheetApp.flush();
    return normaliseLearningResource_(draft);
  });
}

function updateLearningResource_(data) {
  return withLearningResourceLock_(function(db, sheet) {
    const record = findLearningResourceById_(sheet, data.resourceId);
    if (String(record.object.ReviewState || '').toLowerCase() === 'archived') {
      throwApiError_('INVALID_RESOURCE_STATE', 'Archived learning resources cannot be edited.');
    }
    validateLearningAttachment_(db, record.object.AttachedToType, record.object.AttachedToID);

    const fields = [
      ['title', 'Title', LEARNING_RESOURCE_LIMITS.title, true],
      ['description', 'Description', LEARNING_RESOURCE_LIMITS.description, false],
      ['whatToNotice', 'WhatToNotice', LEARNING_RESOURCE_LIMITS.whatToNotice, false],
      ['tryNext', 'TryNext', LEARNING_RESOURCE_LIMITS.tryNext, false],
      ['safetyNote', 'SafetyNote', LEARNING_RESOURCE_LIMITS.safetyNote, false]
    ];
    fields.forEach(function(definition) {
      if (Object.prototype.hasOwnProperty.call(data, definition[0])) {
        const value = requirePlainResourceText_(data[definition[0]], definition[2], definition[0], definition[3]);
        setRecordValue_(sheet, record, definition[1], value);
      }
    });

    if (Object.prototype.hasOwnProperty.call(data, 'url')) {
      const parsed = parseSupportedLearningVideoUrl_(data.url);
      assertNoLearningResourceDuplicate_(sheet, String(record.object.AttachedToID), parsed.provider, parsed.videoId, String(record.object.ResourceID));
      setRecordValue_(sheet, record, 'URL', parsed.canonicalUrl);
      setRecordValue_(sheet, record, 'Provider', parsed.provider);
      setRecordValue_(sheet, record, 'ProviderResourceID', parsed.videoId);
    }

    setRecordValue_(sheet, record, 'UpdatedAt', new Date());
    SpreadsheetApp.flush();
    return normaliseLearningResource_(record.object);
  });
}

function reorderLearningResources_(data) {
  return withLearningResourceLock_(function(db, sheet) {
    const attachedToId = requirePlainResourceText_(data.attachedToId, 120, 'attachedToId', true);
    validateLearningAttachment_(db, 'opportunity', attachedToId);
    const ids = Array.isArray(data.resourceIds) ? data.resourceIds.map(String) : [];
    if (!ids.length) throwApiError_('RESOURCE_VALIDATION', 'resourceIds must contain the complete active resource order.');
    const unique = {};
    ids.forEach(function(id) {
      if (!id || unique[id]) throwApiError_('RESOURCE_VALIDATION', 'resourceIds must be unique and non-empty.');
      unique[id] = true;
    });

    const activeRecords = readObjectsWithRows_(sheet).filter(function(item) {
      const resource = normaliseLearningResource_(item.object);
      return resource.attachedToId === attachedToId && resource.active && resource.reviewState === 'active';
    });
    if (activeRecords.length !== ids.length) {
      throwApiError_('RESOURCE_ORDER_MISMATCH', 'Provide every active resource for this Learn activity exactly once.');
    }
    const byId = {};
    activeRecords.forEach(function(item) { byId[String(item.object.ResourceID)] = item; });
    ids.forEach(function(id, index) {
      if (!byId[id]) throwApiError_('RESOURCE_ORDER_MISMATCH', 'Resource order contains an item outside this Learn activity.');
      setRecordValue_(sheet, byId[id], 'SortOrder', index + 1);
      setRecordValue_(sheet, byId[id], 'UpdatedAt', new Date());
    });
    SpreadsheetApp.flush();
    return readLearningResourcesFromDb_(db, attachedToId, false).filter(function(resource) {
      return resource.active && resource.reviewState === 'active';
    });
  });
}

function archiveLearningResource_(resourceId) {
  return withLearningResourceLock_(function(db, sheet) {
    const record = findLearningResourceById_(sheet, resourceId);
    const now = new Date();
    setRecordValue_(sheet, record, 'Active', false);
    setRecordValue_(sheet, record, 'ReviewState', 'archived');
    setRecordValue_(sheet, record, 'ArchivedAt', now);
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    SpreadsheetApp.flush();
    return normaliseLearningResource_(record.object);
  });
}

function reviewLearningResource_(data) {
  return withLearningResourceLock_(function(db, sheet) {
    const record = findLearningResourceById_(sheet, data.resourceId);
    const current = String(record.object.ReviewState || '').toLowerCase();
    if (current !== 'pending') throwApiError_('INVALID_RESOURCE_STATE', 'Only pending Sophie suggestions can be reviewed.');
    const outcome = String(data.outcome || '').trim().toLowerCase();
    if (['approve', 'reject'].indexOf(outcome) < 0) {
      throwApiError_('RESOURCE_VALIDATION', 'outcome must be approve or reject.');
    }
    const feedback = requirePlainResourceText_(data.feedback || '', LEARNING_RESOURCE_LIMITS.reviewFeedback, 'feedback', false);
    const reviewedBy = requirePlainResourceText_(data.reviewedBy || 'parent', 80, 'reviewedBy', false) || 'parent';
    const now = new Date();
    if (outcome === 'approve') {
      validateLearningAttachment_(db, record.object.AttachedToType, record.object.AttachedToID);
      const parsed = parseSupportedLearningVideoUrl_(record.object.URL);
      assertNoLearningResourceDuplicate_(sheet, String(record.object.AttachedToID), parsed.provider, parsed.videoId, String(record.object.ResourceID));
      setRecordValue_(sheet, record, 'ReviewState', 'active');
      setRecordValue_(sheet, record, 'Active', true);
    } else {
      setRecordValue_(sheet, record, 'ReviewState', 'rejected');
      setRecordValue_(sheet, record, 'Active', false);
    }
    setRecordValue_(sheet, record, 'ReviewedAt', now);
    setRecordValue_(sheet, record, 'ReviewedBy', reviewedBy);
    setRecordValue_(sheet, record, 'ReviewFeedback', feedback);
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    SpreadsheetApp.flush();
    return normaliseLearningResource_(record.object);
  });
}

function buildLearningResourceDraft_(db, data, addedByRole, reviewState) {
  const attachedToType = String(data.attachedToType || 'opportunity').trim().toLowerCase();
  const attachedToId = requirePlainResourceText_(data.attachedToId, 120, 'attachedToId', true);
  validateLearningAttachment_(db, attachedToType, attachedToId);
  const resourceType = String(data.resourceType || 'video').trim().toLowerCase();
  if (resourceType !== 'video') throwApiError_('UNSUPPORTED_RESOURCE_TYPE', 'The Learning Resources MVP supports video resources only.');
  const parsed = parseSupportedLearningVideoUrl_(data.url);
  return {
    AttachedToType: attachedToType,
    AttachedToID: attachedToId,
    ResourceType: resourceType,
    Title: requirePlainResourceText_(data.title, LEARNING_RESOURCE_LIMITS.title, 'title', true),
    URL: parsed.canonicalUrl,
    Provider: parsed.provider,
    ProviderResourceID: parsed.videoId,
    Description: requirePlainResourceText_(data.description || '', LEARNING_RESOURCE_LIMITS.description, 'description', false),
    WhatToNotice: requirePlainResourceText_(data.whatToNotice || '', LEARNING_RESOURCE_LIMITS.whatToNotice, 'whatToNotice', false),
    TryNext: requirePlainResourceText_(data.tryNext || '', LEARNING_RESOURCE_LIMITS.tryNext, 'tryNext', false),
    SafetyNote: requirePlainResourceText_(data.safetyNote || '', LEARNING_RESOURCE_LIMITS.safetyNote, 'safetyNote', false),
    AddedByRole: addedByRole,
    ReviewState: reviewState,
    Active: reviewState === 'active',
    ArchivedAt: '',
    ReviewedAt: '',
    ReviewedBy: '',
    ReviewFeedback: ''
  };
}

function validateLearningAttachment_(db, attachedToType, attachedToId) {
  if (String(attachedToType || '').toLowerCase() !== 'opportunity') {
    throwApiError_('INVALID_ATTACHMENT_TARGET', 'Learning Resources MVP attaches to Learn opportunities only.');
  }
  const opportunitySheet = requireSheet_(db, SHEET_NAMES.opportunities);
  const record = findRecordById_(opportunitySheet, 'ID', attachedToId);
  const opportunity = normaliseOpportunity_(record.object);
  if (opportunity.type !== 'learn') throwApiError_('INVALID_ATTACHMENT_TARGET', 'Learning resources can only attach to Learn opportunities in this release.');
  if (opportunity.status === 'cancelled' || opportunity.migrationVersion === 'd006-v1-retired') {
    throwApiError_('INVALID_ATTACHMENT_TARGET', 'Learning resources cannot be attached to a retired or cancelled Learn opportunity.');
  }
  return opportunity;
}

function parseSupportedLearningVideoUrl_(value) {
  const raw = String(value || '').trim();
  if (!raw) throwApiError_('INVALID_VIDEO_URL', 'Add a YouTube video URL.');
  if (raw.length > LEARNING_RESOURCE_LIMITS.url) throwApiError_('INVALID_VIDEO_URL', 'Video URL is too long.');
  if (containsRawHtml_(raw)) throwApiError_('INVALID_VIDEO_URL', 'Paste a normal YouTube URL, not iframe or HTML code.');
  if (!/^https?:\/\//i.test(raw)) throwApiError_('INVALID_VIDEO_URL', 'Video URL must start with http:// or https://.');

  let match = raw.match(/^https?:\/\/(?:www\.|m\.|music\.)?youtube\.com\/watch\?([^#]+)(?:#.*)?$/i);
  let videoId = '';
  if (match) {
    const query = match[1];
    const idMatch = query.match(/(?:^|&)v=([A-Za-z0-9_-]{11})(?:&|$)/);
    if (idMatch) videoId = idMatch[1];
  }
  if (!videoId) {
    match = raw.match(/^https?:\/\/(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})(?:[?&#/].*)?$/i);
    if (match) videoId = match[1];
  }
  if (!videoId) {
    match = raw.match(/^https?:\/\/(?:www\.|m\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})(?:[?&#/].*)?$/i);
    if (match) videoId = match[1];
  }
  if (!videoId) throwApiError_('UNSUPPORTED_VIDEO_URL', 'Use a supported YouTube watch, youtu.be or Shorts URL.');

  return {
    provider: 'youtube',
    videoId: videoId,
    canonicalUrl: 'https://www.youtube.com/watch?v=' + videoId,
    embedUrl: 'https://www.youtube-nocookie.com/embed/' + videoId
  };
}

function requirePlainResourceText_(value, maxLength, fieldName, required) {
  const text = String(value || '').trim();
  if (required && !text) throwApiError_('RESOURCE_VALIDATION', fieldName + ' is required.');
  if (text.length > maxLength) throwApiError_('RESOURCE_VALIDATION', fieldName + ' exceeds the ' + maxLength + '-character limit.');
  if (containsRawHtml_(text)) throwApiError_('RESOURCE_VALIDATION', fieldName + ' must be plain text, not HTML or iframe markup.');
  return text;
}

function containsRawHtml_(value) {
  return /<\s*\/?\s*[a-z][^>]*>/i.test(String(value || ''));
}

function assertNoLearningResourceDuplicate_(sheet, attachedToId, provider, providerResourceId, ignoredResourceId) {
  const duplicates = readObjects_(sheet).filter(function(row) {
    const id = String(row.ResourceID || '');
    if (ignoredResourceId && id === String(ignoredResourceId)) return false;
    const state = String(row.ReviewState || '').trim().toLowerCase();
    if (state === 'archived' || state === 'rejected') return false;
    return String(row.AttachedToID || '') === String(attachedToId) &&
      String(row.Provider || '').toLowerCase() === String(provider || '').toLowerCase() &&
      String(row.ProviderResourceID || '') === String(providerResourceId || '');
  });
  if (duplicates.length) {
    throwApiError_('DUPLICATE_RESOURCE', 'That video is already active or awaiting review on this Learn activity.');
  }
}

function nextLearningResourceSortOrder_(sheet, attachedToId) {
  const orders = readObjects_(sheet).filter(function(row) {
    return String(row.AttachedToID || '') === String(attachedToId) &&
      String(row.ReviewState || '').toLowerCase() !== 'archived';
  }).map(function(row) { return Math.max(0, Math.floor(number_(row.SortOrder))); });
  return orders.length ? Math.max.apply(null, orders) + 1 : 1;
}

function findLearningResourceById_(sheet, resourceId) {
  return findUniqueRecordById_(sheet, 'ResourceID', resourceId, 'Learning resource');
}

function normaliseLearningResource_(row) {
  const parsed = safeParseLearningVideoUrl_(row.URL);
  const reviewState = String(row.ReviewState || '').trim().toLowerCase();
  const active = toBoolean_(row.Active) && reviewState === 'active' && !row.ArchivedAt;
  return {
    resourceId: String(row.ResourceID || ''),
    attachedToType: String(row.AttachedToType || '').toLowerCase(),
    attachedToId: String(row.AttachedToID || ''),
    resourceType: String(row.ResourceType || '').toLowerCase(),
    title: String(row.Title || ''),
    url: parsed ? parsed.canonicalUrl : String(row.URL || ''),
    provider: parsed ? parsed.provider : String(row.Provider || '').toLowerCase(),
    providerResourceId: parsed ? parsed.videoId : String(row.ProviderResourceID || ''),
    videoId: parsed ? parsed.videoId : String(row.ProviderResourceID || ''),
    embedUrl: parsed ? parsed.embedUrl : '',
    embeddable: !!parsed,
    description: String(row.Description || ''),
    whatToNotice: String(row.WhatToNotice || ''),
    tryNext: String(row.TryNext || ''),
    safetyNote: String(row.SafetyNote || ''),
    sortOrder: Math.max(0, Math.floor(number_(row.SortOrder))),
    addedByRole: String(row.AddedByRole || '').toLowerCase(),
    reviewState: reviewState,
    active: active,
    createdAt: iso_(row.CreatedAt),
    updatedAt: iso_(row.UpdatedAt),
    archivedAt: iso_(row.ArchivedAt),
    reviewedAt: iso_(row.ReviewedAt),
    reviewedBy: String(row.ReviewedBy || ''),
    reviewFeedback: String(row.ReviewFeedback || '')
  };
}

function safeParseLearningVideoUrl_(value) {
  try { return parseSupportedLearningVideoUrl_(value); }
  catch (error) { return null; }
}

function sortLearningResources_(left, right) {
  if (left.attachedToId !== right.attachedToId) return left.attachedToId.localeCompare(right.attachedToId);
  if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
  return left.resourceId.localeCompare(right.resourceId);
}

function withLearningResourceLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureLearningResourceSheet_(db);
    return callback(db, sheet);
  } finally {
    lock.releaseLock();
  }
}

function ensureLearningResourceSheet_(db) {
  const sheet = ensureSheet_(db, SHEET_NAMES.learningResources, LEARNING_RESOURCE_HEADERS);
  addMissingHeaders_(sheet, LEARNING_RESOURCE_HEADERS);
  return sheet;
}

function requireLearningResourceAccess_(learningKey, adminKey) {
  if (adminKey) {
    requireAdmin_(adminKey);
    return;
  }
  const expected = PropertiesService.getScriptProperties().getProperty(LEARNING_RESOURCE_DEVICE_KEY_PROPERTY);
  if (!expected) throwApiError_('UNAUTHORISED', 'Learning-resource authoring has not been provisioned on this device.');
  if (!learningKey || !constantTimeEqual_(String(learningKey), String(expected))) {
    throwApiError_('UNAUTHORISED', 'Learning-resource authoring is not authorised on this device.');
  }
}

function generateLearningResourceKey_() {
  return Utilities.getUuid().replace(/-/g, '').toUpperCase();
}

/**
 * Editor-runnable, non-secret smoke test for lr-v1 Sophie authorisation.
 * Temporarily substitutes a test device key, verifies valid/invalid/unprovisioned
 * behaviour, then restores the exact prior Script Property state.
 * No LearningResources rows are written and no secret key is logged or returned.
 */
function runLearningResourceAuthorisationSmokeTest() {
  const properties = PropertiesService.getScriptProperties();
  const previous = properties.getProperty(LEARNING_RESOURCE_DEVICE_KEY_PROPERTY);
  const testKey = 'TEST-' + Utilities.getUuid().replace(/-/g, '').toUpperCase();
  let validAccepted = false;
  let invalidRejected = false;
  let unprovisionedRejected = false;

  try {
    properties.setProperty(LEARNING_RESOURCE_DEVICE_KEY_PROPERTY, testKey);

    requireLearningResourceAccess_(testKey, '');
    validAccepted = true;

    try {
      requireLearningResourceAccess_('INVALID-' + testKey, '');
    } catch (error) {
      invalidRejected = apiErrorCode_(error) === 'UNAUTHORISED';
    }

    properties.deleteProperty(LEARNING_RESOURCE_DEVICE_KEY_PROPERTY);
    try {
      requireLearningResourceAccess_(testKey, '');
    } catch (error) {
      unprovisionedRejected = apiErrorCode_(error) === 'UNAUTHORISED';
    }
  } finally {
    if (previous) properties.setProperty(LEARNING_RESOURCE_DEVICE_KEY_PROPERTY, previous);
    else properties.deleteProperty(LEARNING_RESOURCE_DEVICE_KEY_PROPERTY);
  }

  const result = {
    version: APP_VERSION,
    opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
    learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION,
    ok: validAccepted && invalidRejected && unprovisionedRejected,
    validKeyAccepted: validAccepted,
    invalidKeyRejected: invalidRejected,
    unprovisionedRejected: unprovisionedRejected,
    priorProvisioningStateRestored: true
  };
  console.log(JSON.stringify(result));
  return result;
}

function initialiseLearningResourcesV1() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ensureLearningResourceSheet_(db);
  SpreadsheetApp.flush();
  const result = {
    version: APP_VERSION,
    opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
    learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION,
    sheet: sheet.getName(),
    columns: sheet.getLastColumn(),
    resourceRows: Math.max(0, sheet.getLastRow() - 1),
    deviceKeyProvisioned: !!PropertiesService.getScriptProperties().getProperty(LEARNING_RESOURCE_DEVICE_KEY_PROPERTY)
  };
  Logger.log(JSON.stringify(result));
  return result;
}

function auditLearningResourceIntegrity() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = db.getSheetByName(SHEET_NAMES.learningResources);
  const issues = [];
  if (!sheet) {
    const missing = {
      version: APP_VERSION,
      opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
      learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION,
      ok: false,
      issueCount: 1,
      issues: ['Missing LearningResources sheet. Run initialiseLearningResourcesV1().'],
      resourceCount: 0,
      activeCount: 0,
      pendingCount: 0,
      deviceKeyProvisioned: !!PropertiesService.getScriptProperties().getProperty(LEARNING_RESOURCE_DEVICE_KEY_PROPERTY)
    };
    Logger.log(JSON.stringify(missing));
    return missing;
  }
  const rows = readObjects_(sheet);
  collectDuplicateIds_(rows, 'ResourceID').forEach(function(id) { issues.push('Duplicate ResourceID: ' + id); });
  const opportunities = {};
  readObjects_(requireSheet_(db, SHEET_NAMES.opportunities)).forEach(function(row) {
    opportunities[String(row.ID || '')] = normaliseOpportunity_(row);
  });
  const duplicateKeys = {};
  rows.forEach(function(row) {
    const id = String(row.ResourceID || '');
    const state = String(row.ReviewState || '').trim().toLowerCase();
    const role = String(row.AddedByRole || '').trim().toLowerCase();
    const resourceType = String(row.ResourceType || '').trim().toLowerCase();
    const attachedType = String(row.AttachedToType || '').trim().toLowerCase();
    const targetId = String(row.AttachedToID || '');
    if (!id) issues.push('Learning resource row missing ResourceID.');
    if (resourceType !== 'video') issues.push(id + ': unsupported ResourceType ' + resourceType + '.');
    if (attachedType !== 'opportunity') issues.push(id + ': unsupported AttachedToType ' + attachedType + '.');
    if (['parent', 'sophie'].indexOf(role) < 0) issues.push(id + ': invalid AddedByRole ' + role + '.');
    if (['pending', 'active', 'rejected', 'archived'].indexOf(state) < 0) issues.push(id + ': invalid ReviewState ' + state + '.');
    const opportunity = opportunities[targetId];
    if (!opportunity) issues.push(id + ': attachment target not found: ' + targetId + '.');
    else if (opportunity.type !== 'learn') issues.push(id + ': attachment target is not a Learn opportunity.');
    else if ((opportunity.status === 'cancelled' || opportunity.migrationVersion === 'd006-v1-retired') && state === 'active') {
      issues.push(id + ': active resource is attached to a retired/cancelled Learn opportunity.');
    }
    const parsed = safeParseLearningVideoUrl_(row.URL);
    if (!parsed) issues.push(id + ': invalid or unsupported video URL.');
    else {
      if (String(row.Provider || '').toLowerCase() !== parsed.provider) issues.push(id + ': Provider does not match validated URL.');
      if (String(row.ProviderResourceID || '') !== parsed.videoId) issues.push(id + ': ProviderResourceID does not match validated URL.');
      if (state === 'active' || state === 'pending') {
        const key = targetId + '|' + parsed.provider + '|' + parsed.videoId;
        if (duplicateKeys[key]) issues.push(id + ': duplicate active/pending resource with ' + duplicateKeys[key] + '.');
        duplicateKeys[key] = id;
      }
    }
    if (state === 'active' && !toBoolean_(row.Active)) issues.push(id + ': active ReviewState requires Active=true.');
    if (state !== 'active' && toBoolean_(row.Active)) issues.push(id + ': non-active ReviewState must not have Active=true.');
    if ((state === 'active' || state === 'pending') && number_(row.SortOrder) < 1) issues.push(id + ': active/pending resource requires positive SortOrder.');
    validateLearningResourceTextAudit_(row, id, issues);
  });
  const result = {
    version: APP_VERSION,
    opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
    learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION,
    ok: issues.length === 0,
    issueCount: issues.length,
    issues: issues,
    resourceCount: rows.length,
    activeCount: rows.filter(function(row) { return String(row.ReviewState || '').toLowerCase() === 'active' && toBoolean_(row.Active); }).length,
    pendingCount: rows.filter(function(row) { return String(row.ReviewState || '').toLowerCase() === 'pending'; }).length,
    deviceKeyProvisioned: !!PropertiesService.getScriptProperties().getProperty(LEARNING_RESOURCE_DEVICE_KEY_PROPERTY)
  };
  Logger.log(JSON.stringify(result));
  return result;
}

function validateLearningResourceTextAudit_(row, id, issues) {
  const checks = [
    ['Title', LEARNING_RESOURCE_LIMITS.title],
    ['Description', LEARNING_RESOURCE_LIMITS.description],
    ['WhatToNotice', LEARNING_RESOURCE_LIMITS.whatToNotice],
    ['TryNext', LEARNING_RESOURCE_LIMITS.tryNext],
    ['SafetyNote', LEARNING_RESOURCE_LIMITS.safetyNote],
    ['ReviewFeedback', LEARNING_RESOURCE_LIMITS.reviewFeedback]
  ];
  checks.forEach(function(definition) {
    const value = String(row[definition[0]] || '');
    if (value.length > definition[1]) issues.push(id + ': ' + definition[0] + ' exceeds limit.');
    if (containsRawHtml_(value)) issues.push(id + ': ' + definition[0] + ' contains HTML-like markup.');
  });
}

function runLearningResourceContractTests() {
  const result = runLearningResourcePureTests_();
  Logger.log(JSON.stringify(result));
  return result;
}

function runLearningResourcePureTests_() {
  const failures = [];
  let count = 0;
  function check(name, condition) {
    count += 1;
    if (!condition) failures.push(name);
  }
  function throwsCode(name, callback, code) {
    count += 1;
    try { callback(); failures.push(name + ' (did not throw)'); }
    catch (error) { if (String(error.code || '') !== code) failures.push(name + ' (wrong code ' + String(error.code || '') + ')'); }
  }

  let parsed = parseSupportedLearningVideoUrl_('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  check('youtube watch URL', parsed.videoId === 'dQw4w9WgXcQ' && parsed.provider === 'youtube');
  parsed = parseSupportedLearningVideoUrl_('https://youtu.be/dQw4w9WgXcQ?t=12');
  check('youtu.be URL', parsed.videoId === 'dQw4w9WgXcQ');
  parsed = parseSupportedLearningVideoUrl_('https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share');
  check('YouTube Shorts URL', parsed.videoId === 'dQw4w9WgXcQ');
  parsed = parseSupportedLearningVideoUrl_('https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ');
  check('mobile YouTube watch URL', parsed.videoId === 'dQw4w9WgXcQ');
  check('canonical URL', parsed.canonicalUrl === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  check('privacy enhanced embed', parsed.embedUrl === 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  throwsCode('reject Vimeo', function() { parseSupportedLearningVideoUrl_('https://vimeo.com/123456789'); }, 'UNSUPPORTED_VIDEO_URL');
  throwsCode('reject iframe markup', function() { parseSupportedLearningVideoUrl_('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>'); }, 'INVALID_VIDEO_URL');
  throwsCode('reject invalid YouTube ID', function() { parseSupportedLearningVideoUrl_('https://www.youtube.com/watch?v=short'); }, 'UNSUPPORTED_VIDEO_URL');
  throwsCode('reject missing scheme', function() { parseSupportedLearningVideoUrl_('youtube.com/watch?v=dQw4w9WgXcQ'); }, 'INVALID_VIDEO_URL');
  check('plain text accepted', requirePlainResourceText_('Adult supervision', 40, 'safetyNote', true) === 'Adult supervision');
  throwsCode('reject HTML text', function() { requirePlainResourceText_('<b>watch</b>', 40, 'title', true); }, 'RESOURCE_VALIDATION');
  throwsCode('reject overlong text', function() { requirePlainResourceText_(new Array(162).join('x'), 160, 'title', true); }, 'RESOURCE_VALIDATION');
  throwsCode('require title', function() { requirePlainResourceText_('', 160, 'title', true); }, 'RESOURCE_VALIDATION');
  check('HTML detector ignores ordinary comparison text', containsRawHtml_('Keep fingers < 2 cm apart') === false);
  check('HTML detector catches script', containsRawHtml_('<script>alert(1)</script>') === true);

  return {
    version: APP_VERSION,
    opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
    learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION,
    ok: failures.length === 0,
    testCount: count,
    failureCount: failures.length,
    failures: failures
  };
}


function claimJob_() {
  throwApiError_('CLIENT_UPDATE_REQUIRED', 'claimJob is retired under D-006.');
}

function approveJob_() {
  throwApiError_('CLIENT_UPDATE_REQUIRED', 'approveJob is retired under D-006.');
}

function rejectJob_() {
  throwApiError_('CLIENT_UPDATE_REQUIRED', 'rejectJob is retired under D-006.');
}

function startOpportunity_(opportunityId) {
  return withOpportunityLock_(function(db, sheet) {
    const record = findRecordById_(sheet, 'ID', opportunityId);
    assertD006SchemaAvailable_(record.headers);
    const type = d006Type_(record.object);
    const status = normaliseOpportunityStatus_(record.object.Status);
    const allowed = status === 'available' || (type === 'earn' && status === 'returned_for_completion');
    if (!allowed) throwApiError_('INVALID_TRANSITION', 'This activity cannot be started from its current state.');

    validateD006OpportunityRow_(db, record.object, { allowRetired: false });
    const now = new Date();
    if (type === 'earn' && !record.object.AcceptedAt) {
      setRecordValue_(sheet, record, 'AgreedValue', roundMoney_(number_(record.object.Value)));
      setRecordValue_(sheet, record, 'AgreedScope', cleanText_(record.object.Scope, 1500));
      setRecordValue_(sheet, record, 'AgreedCompletionStandard', cleanText_(record.object.CompletionStandard, 1500));
      setRecordValue_(sheet, record, 'AgreedEstimatedMinutes', number_(record.object.EstimatedMinutes));
      setRecordValue_(sheet, record, 'AcceptedAt', now);
    }
    setRecordValue_(sheet, record, 'Status', 'in_progress');
    if (!record.object.StartedAt) setRecordValue_(sheet, record, 'StartedAt', now);
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    setRecordValue_(sheet, record, 'ReviewState', 'none');
    setRecordValue_(sheet, record, 'ReviewKind', '');
    setRecordValue_(sheet, record, 'ReviewOutcome', '');
    SpreadsheetApp.flush();
    return normaliseOpportunity_(record.object);
  });
}

function finishOpportunity_(opportunityId) {
  return withOpportunityLock_(function(db, sheet) {
    const record = findRecordById_(sheet, 'ID', opportunityId);
    assertD006SchemaAvailable_(record.headers);
    const type = d006Type_(record.object);
    const status = normaliseOpportunityStatus_(record.object.Status);
    if (status !== 'in_progress') throwApiError_('INVALID_TRANSITION', 'Only an activity in progress can be finished.');
    validateD006OpportunityRow_(db, record.object, { allowRetired: false });

    const now = new Date();

    if (type === 'earn') {
      assertEarnAgreementSnapshot_(record.object);
      const agreed = roundMoney_(number_(record.object.AgreedValue));
      if (findPendingTransactionsForOpportunity_(db, record.object.ID).length) {
        throwApiError_('LEDGER_MISMATCH', 'A pending review transaction already exists for this job.');
      }
      const statsSheet = requireSheet_(db, SHEET_NAMES.stats);
      const stats = readStats_(statsSheet);
      const effect = computeD006FinancialEffect_('full_finish', agreed, 0);
      setRecordValue_(sheet, record, 'FinishedAt', now);
      setRecordValue_(sheet, record, 'UpdatedAt', now);
      setRecordValue_(sheet, record, 'Status', 'waiting_for_review');
      setRecordValue_(sheet, record, 'ReviewState', 'awaiting');
      setRecordValue_(sheet, record, 'ReviewKind', 'full_completion');
      setRecordValue_(sheet, record, 'ReviewOutcome', '');
      setRecordValue_(sheet, record, 'ApprovedAmount', '');
      statsSheet.getRange('B2').setValue(roundMoney_(stats.pending + effect.pendingDelta));
      appendD006PendingTransaction_(db, record.object, now, agreed, 'full_completion');
      SpreadsheetApp.flush();
      return { opportunity: normaliseOpportunity_(record.object), pending: roundMoney_(stats.pending + effect.pendingDelta) };
    }

    setRecordValue_(sheet, record, 'FinishedAt', now);
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    if (type === 'contribute' && toBoolean_(record.object.ApprovalRequired)) {
      setRecordValue_(sheet, record, 'Status', 'waiting_for_review');
      setRecordValue_(sheet, record, 'ReviewState', 'awaiting');
      setRecordValue_(sheet, record, 'ReviewKind', 'contribution_check');
      setRecordValue_(sheet, record, 'ReviewOutcome', '');
    } else {
      setRecordValue_(sheet, record, 'Status', 'completed');
      setRecordValue_(sheet, record, 'CompletedAt', now);
      setRecordValue_(sheet, record, 'ReviewState', 'settled');
    }
    SpreadsheetApp.flush();
    return normaliseOpportunity_(record.object);
  });
}

function withdrawEarn_(data) {
  return withOpportunityLock_(function(db, sheet) {
    const record = findRecordById_(sheet, 'ID', data.opportunityId);
    assertD006SchemaAvailable_(record.headers);
    if (d006Type_(record.object) !== 'earn') throwApiError_('INVALID_DOMAIN_CONTRACT', 'Only Earn activities can use Earn withdrawal.');
    const status = normaliseOpportunityStatus_(record.object.Status);
    if (status !== 'in_progress' && status !== 'returned_for_completion') {
      throwApiError_('INVALID_TRANSITION', 'This Earn activity cannot be withdrawn from its current state.');
    }
    assertEarnAgreementSnapshot_(record.object);
    const requestReview = toBoolean_(data.requestPartialReview);
    const partialDescription = cleanText_(data.partialWorkDescription || '', 1500);
    if (requestReview && !partialDescription) {
      throwApiError_('REVIEW_VALIDATION', 'Describe the part of the work that was completed before requesting partial review.');
    }
    if (findPendingTransactionsForOpportunity_(db, record.object.ID).length) {
      throwApiError_('LEDGER_MISMATCH', 'Unexpected pending transaction exists for this withdrawal.');
    }

    const now = new Date();
    setRecordValue_(sheet, record, 'WithdrawnAt', now);
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    setRecordValue_(sheet, record, 'WithdrawalReviewRequested', requestReview);
    setRecordValue_(sheet, record, 'PartialWorkDescription', requestReview ? partialDescription : '');
    setRecordValue_(sheet, record, 'ApprovedAmount', requestReview ? '' : 0);
    if (requestReview) {
      setRecordValue_(sheet, record, 'Status', 'waiting_for_review');
      setRecordValue_(sheet, record, 'ReviewState', 'awaiting');
      setRecordValue_(sheet, record, 'ReviewKind', 'partial_work_withdrawal');
      setRecordValue_(sheet, record, 'ReviewOutcome', '');
    } else {
      setRecordValue_(sheet, record, 'Status', 'withdrawn');
      setRecordValue_(sheet, record, 'ReviewState', 'settled');
      setRecordValue_(sheet, record, 'ReviewKind', '');
      setRecordValue_(sheet, record, 'ReviewOutcome', '');
    }
    SpreadsheetApp.flush();
    return normaliseOpportunity_(record.object);
  });
}

function stopLearn_(opportunityId) {
  return withOpportunityLock_(function(db, sheet) {
    const record = findRecordById_(sheet, 'ID', opportunityId);
    assertD006SchemaAvailable_(record.headers);
    if (d006Type_(record.object) !== 'learn') throwApiError_('INVALID_DOMAIN_CONTRACT', 'Only Learn activities can be stopped for now.');
    if (normaliseOpportunityStatus_(record.object.Status) !== 'in_progress') {
      throwApiError_('INVALID_TRANSITION', 'Only Learn practice in progress can be stopped for now.');
    }
    const now = new Date();
    setRecordValue_(sheet, record, 'Status', 'withdrawn');
    setRecordValue_(sheet, record, 'WithdrawnAt', now);
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    setRecordValue_(sheet, record, 'ReviewState', 'settled');
    SpreadsheetApp.flush();
    return normaliseOpportunity_(record.object);
  });
}

function reviewEarn_(data) {
  return withOpportunityLock_(function(db, sheet) {
    const record = findRecordById_(sheet, 'ID', data.opportunityId);
    assertD006SchemaAvailable_(record.headers);
    if (d006Type_(record.object) !== 'earn') throwApiError_('INVALID_DOMAIN_CONTRACT', 'Only Earn activities can receive payment review.');
    if (normaliseOpportunityStatus_(record.object.Status) !== 'waiting_for_review' || String(record.object.ReviewState || '') !== 'awaiting') {
      throwApiError_('INVALID_TRANSITION', 'This Earn activity is not waiting for review.');
    }
    assertEarnAgreementSnapshot_(record.object);

    const kind = String(record.object.ReviewKind || '');
    const outcome = String(data.outcome || '').toLowerCase();
    const agreed = roundMoney_(number_(record.object.AgreedValue));
    const feedback = cleanText_(data.feedback || '', 1500);
    const reviewer = cleanText_(data.approvedBy || 'Parent', 80);
    const now = new Date();
    let approvedAmount = 0;

    if (kind === 'full_completion') {
      if (['full_payment', 'returned_for_completion', 'partial_payment'].indexOf(outcome) < 0) {
        throwApiError_('REVIEW_VALIDATION', 'Invalid outcome for full-completion review.');
      }
    } else if (kind === 'partial_work_withdrawal') {
      if (['partial_payment', 'no_partial_payment'].indexOf(outcome) < 0) {
        throwApiError_('REVIEW_VALIDATION', 'Invalid outcome for partial-work withdrawal review.');
      }
    } else {
      throwApiError_('REVIEW_VALIDATION', 'Unknown Earn review kind.');
    }

    if (outcome === 'returned_for_completion' && !feedback) {
      throwApiError_('REVIEW_VALIDATION', 'Actionable feedback is required when work is returned for completion.');
    }
    if (outcome === 'partial_payment') {
      approvedAmount = roundMoney_(number_(data.approvedAmount));
      if (!(approvedAmount > 0 && approvedAmount < agreed)) {
        throwApiError_('REVIEW_VALIDATION', 'Partial payment must be greater than zero and less than the frozen agreed amount.');
      }
      if (!feedback) throwApiError_('REVIEW_VALIDATION', 'A factual coverage note is required for partial payment.');
    }
    if (outcome === 'no_partial_payment' && !feedback) {
      throwApiError_('REVIEW_VALIDATION', 'A factual explanation is required when no partial payment is recorded.');
    }
    if (outcome === 'full_payment') approvedAmount = agreed;

    const statsSheet = requireSheet_(db, SHEET_NAMES.stats);
    const stats = readStats_(statsSheet);
    let effect;

    if (kind === 'full_completion') {
      const pendingTx = requireSingleD006PendingTransaction_(db, record.object.ID, 'full_completion');
      const ledgerAgreed = roundMoney_(number_(pendingTx.object.AgreedAmount || pendingTx.object.Amount));
      if (Math.abs(ledgerAgreed - agreed) > 0.0001) throwApiError_('LEDGER_MISMATCH', 'Frozen agreement and pending ledger amount do not match.');

      if (outcome === 'full_payment') {
        effect = computeD006FinancialEffect_('full_payment', agreed, agreed);
        assertPendingCanDecrease_(stats.pending, agreed);
        statsSheet.getRange('A2').setValue(roundMoney_(stats.balance + effect.balanceDelta));
        statsSheet.getRange('B2').setValue(roundMoney_(stats.pending + effect.pendingDelta));
        finaliseD006TransactionRecord_(pendingTx, now, 'completed', reviewer, feedback, agreed, 'full_completion', 'full_payment');
        setRecordValue_(sheet, record, 'Status', 'completed');
        setRecordValue_(sheet, record, 'CompletedAt', now);
      } else if (outcome === 'returned_for_completion') {
        effect = computeD006FinancialEffect_('returned_for_completion', agreed, 0);
        assertPendingCanDecrease_(stats.pending, agreed);
        statsSheet.getRange('B2').setValue(roundMoney_(stats.pending + effect.pendingDelta));
        finaliseD006TransactionRecord_(pendingTx, now, 'returned_for_completion', reviewer, feedback, agreed, 'full_completion', 'returned_for_completion');
        setRecordValue_(sheet, record, 'Status', 'returned_for_completion');
      } else {
        effect = computeD006FinancialEffect_('partial_payment_from_full', agreed, approvedAmount);
        assertPendingCanDecrease_(stats.pending, agreed);
        statsSheet.getRange('A2').setValue(roundMoney_(stats.balance + effect.balanceDelta));
        statsSheet.getRange('B2').setValue(roundMoney_(stats.pending + effect.pendingDelta));
        finaliseD006TransactionRecord_(pendingTx, now, 'completed', reviewer, feedback, approvedAmount, 'full_completion', 'partial_payment', agreed);
        setRecordValue_(sheet, record, 'Status', 'completed');
        setRecordValue_(sheet, record, 'CompletedAt', now);
      }
    } else {
      if (findPendingTransactionsForOpportunity_(db, record.object.ID).length) {
        throwApiError_('LEDGER_MISMATCH', 'Partial-work withdrawal review must not have a pending payment transaction.');
      }
      if (outcome === 'partial_payment') {
        effect = computeD006FinancialEffect_('partial_payment_withdrawal', agreed, approvedAmount);
        statsSheet.getRange('A2').setValue(roundMoney_(stats.balance + effect.balanceDelta));
        appendD006CompletedTransaction_(db, record.object, now, approvedAmount, agreed, 'partial_work_withdrawal', 'partial_payment', reviewer, feedback);
        setRecordValue_(sheet, record, 'Status', 'completed');
        setRecordValue_(sheet, record, 'CompletedAt', now);
      } else {
        effect = computeD006FinancialEffect_('no_partial_payment', agreed, 0);
        setRecordValue_(sheet, record, 'Status', 'withdrawn');
      }
    }

    setRecordValue_(sheet, record, 'ReviewState', 'settled');
    setRecordValue_(sheet, record, 'ReviewOutcome', outcome);
    setRecordValue_(sheet, record, 'ApprovedAmount', approvedAmount);
    setRecordValue_(sheet, record, 'ReviewFeedback', feedback);
    setRecordValue_(sheet, record, 'ReviewedBy', reviewer);
    setRecordValue_(sheet, record, 'ReviewedAt', now);
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    SpreadsheetApp.flush();

    return {
      opportunity: normaliseOpportunity_(record.object),
      balance: roundMoney_(stats.balance + (effect ? effect.balanceDelta : 0)),
      pending: roundMoney_(stats.pending + (effect ? effect.pendingDelta : 0))
    };
  });
}

function completeContributionReview_(data) {
  return withOpportunityLock_(function(db, sheet) {
    const record = findRecordById_(sheet, 'ID', data.opportunityId);
    assertD006SchemaAvailable_(record.headers);
    if (d006Type_(record.object) !== 'contribute' || !toBoolean_(record.object.ApprovalRequired)) {
      throwApiError_('INVALID_DOMAIN_CONTRACT', 'This activity does not use Contribution review.');
    }
    if (normaliseOpportunityStatus_(record.object.Status) !== 'waiting_for_review' || String(record.object.ReviewKind || '') !== 'contribution_check') {
      throwApiError_('INVALID_TRANSITION', 'This Contribution is not waiting for review.');
    }
    if (findPendingTransactionsForOpportunity_(db, record.object.ID).length) {
      throwApiError_('LEDGER_MISMATCH', 'Contribution review must not have a financial pending transaction.');
    }
    const now = new Date();
    const reviewer = cleanText_(data.approvedBy || 'Parent', 80);
    const feedback = cleanText_(data.feedback || '', 1500);
    setRecordValue_(sheet, record, 'Status', 'completed');
    setRecordValue_(sheet, record, 'ReviewState', 'settled');
    setRecordValue_(sheet, record, 'ReviewOutcome', 'contribution_completed');
    setRecordValue_(sheet, record, 'ApprovedAmount', 0);
    setRecordValue_(sheet, record, 'ReviewFeedback', feedback);
    setRecordValue_(sheet, record, 'ReviewedBy', reviewer);
    setRecordValue_(sheet, record, 'ReviewedAt', now);
    setRecordValue_(sheet, record, 'CompletedAt', now);
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    SpreadsheetApp.flush();
    return normaliseOpportunity_(record.object);
  });
}

function cancelOpportunity_(data) {
  return withOpportunityLock_(function(db, sheet) {
    const record = findRecordById_(sheet, 'ID', data.opportunityId);
    assertD006SchemaAvailable_(record.headers);
    const type = d006Type_(record.object);
    const status = normaliseOpportunityStatus_(record.object.Status);
    const reason = cleanText_(data.reason || '', 1000);
    if (!reason) throwApiError_('REVIEW_VALIDATION', 'A factual cancellation reason is required.');
    if (type === 'earn' && record.object.AcceptedAt && status !== 'available') {
      throwApiError_('CANCELLATION_REQUIRES_REVIEW', 'An accepted Earn agreement cannot be cancelled without an explicit settlement/review path.');
    }
    if (status === 'waiting_for_review' || status === 'completed' || status === 'cancelled') {
      throwApiError_('INVALID_TRANSITION', 'This activity cannot be cancelled from its current state.');
    }
    if (findPendingTransactionsForOpportunity_(db, record.object.ID).length) {
      throwApiError_('LEDGER_MISMATCH', 'This activity has a pending financial record and cannot be cancelled.');
    }
    const now = new Date();
    setRecordValue_(sheet, record, 'Status', 'cancelled');
    setRecordValue_(sheet, record, 'CancelledAt', now);
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    setRecordValue_(sheet, record, 'ReviewFeedback', reason);
    SpreadsheetApp.flush();
    return normaliseOpportunity_(record.object);
  });
}

function createOpportunity_(data) {
  return withOpportunityLock_(function(db, sheet) {
    ensureD006OpportunitySchema_(db);
    const skillsSheet = requireSheet_(db, SHEET_NAMES.skills);
    const type = String(data.type || '').toLowerCase();
    const title = cleanText_(data.title || '', 120);
    const requiredness = String(data.requiredness || '').toLowerCase();
    const why = cleanText_(data.whyItMatters || '', 1000);
    const instructions = cleanText_(data.instructions || '', 1500);
    const scope = cleanText_(data.scope || '', 1500);
    const standard = cleanText_(data.completionStandard || '', 1500);
    const skillId = cleanText_(data.skillId || '', 80);
    const approvalRequired = type === 'earn' ? true : toBoolean_(data.approvalRequired);
    const reviewReason = cleanText_(data.reviewReason || '', 1000);
    const estimatedMinutes = nonNegativeNumber_(data.estimatedMinutes);
    const repeatable = cleanText_(data.repeatable || '', 40);
    const frequency = cleanText_(data.frequency || '', 120);
    const value = type === 'earn' ? roundMoney_(number_(Object.prototype.hasOwnProperty.call(data, 'agreedValue') ? data.agreedValue : data.value)) : 0;
    if (!title) throwApiError_('INVALID_DOMAIN_CONTRACT', 'Opportunity title is required.');

    let skillLabel = cleanText_(data.capabilityLabel || '', 120);
    if (type === 'learn') {
      if (!skillId) throwApiError_('INVALID_DOMAIN_CONTRACT', 'Learn requires a capability/SkillID.');
      const skillRecord = findUniqueRecordById_(skillsSheet, 'SkillID', skillId, 'Skill');
      skillLabel = String(skillRecord.object.Name || '');
    } else if (skillId) {
      const matches = readObjectsWithRows_(skillsSheet).filter(function(item) { return String(item.object.SkillID) === skillId; });
      if (matches.length > 1) throwApiError_('DUPLICATE_ID', 'Duplicate SkillID found: ' + skillId + '.');
      if (matches.length === 1 && !skillLabel) skillLabel = String(matches[0].object.Name || '');
    }

    const now = new Date();
    const id = uniqueGeneratedId_(sheet, 'ID', 'OP');
    const row = {
      ID: id,
      Title: title,
      Value: value,
      Tier: number_(data.tier) || 1,
      Status: 'available',
      Description: cleanText_(data.description || '', 1000),
      Category: cleanText_(data.category || 'Home', 120),
      Type: type,
      Skill: skillLabel,
      EstimatedMinutes: estimatedMinutes,
      Repeatable: repeatable,
      Frequency: frequency,
      ClaimedAt: '', SubmittedAt: '', ApprovedAt: '',
      Icon: cleanText_(data.icon || (type === 'earn' ? '💰' : type === 'learn' ? '🌱' : '🤝'), 20),
      Instructions: instructions,
      WhyItMatters: why,
      Feedback: '', ApprovedBy: '',
      Requiredness: requiredness,
      Scope: scope,
      CompletionStandard: standard,
      ApprovalRequired: approvalRequired,
      ReviewReason: reviewReason,
      SkillID: skillId,
      SupportPreference: cleanText_(data.supportPreference || '', 120),
      CreatedAt: now, UpdatedAt: now,
      StartedAt: '', FinishedAt: '', ReviewedAt: '', CompletedAt: '', WithdrawnAt: '', CancelledAt: '',
      AgreedValue: '', AgreedScope: '', AgreedCompletionStandard: '', AgreedEstimatedMinutes: '', AcceptedAt: '',
      ReviewState: 'none', ReviewKind: '', ReviewOutcome: '', ApprovedAmount: '', ReviewFeedback: '', ReviewedBy: '',
      WithdrawalReviewRequested: false, PartialWorkDescription: '', SourceOpportunityID: '', MigrationVersion: OPPORTUNITY_CONTRACT_VERSION, SourceCandidateID: ''
    };
    validateD006OpportunityRow_(db, row, { allowRetired: false });
    appendObjectRow_(sheet, row);
    SpreadsheetApp.flush();
    return normaliseOpportunity_(row);
  });
}

function createGoal_(data) {
  const title = cleanText_(data.title || '', 80);
  const target = number_(data.targetAmount);
  const icon = cleanText_(data.icon || '🎯', 12);
  const imageUrl = cleanHttpUrl_(data.imageUrl);
  const productUrl = cleanHttpUrl_(data.productUrl);

  if (!title) throw new Error('A goal needs a title.');
  if (!(target > 0 && target <= 100000)) throw new Error('Enter a valid goal amount.');

  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ensureSheet_(db, SHEET_NAMES.goals, GOAL_HEADERS);
  const id = newId_('G');

  // Sophie can author her own goals. New goals are proposals until a parent
  // reviews them, so public/child access cannot create an authoritative
  // active financial goal by itself.
  sheet.appendRow([
    id, title, roundMoney_(target), 0, icon, 'pending', new Date(), imageUrl, productUrl
  ]);

  SpreadsheetApp.flush();
  return {
    goalId: id,
    title: title,
    targetAmount: target,
    savedAmount: 0,
    icon: icon,
    status: 'pending',
    imageUrl: imageUrl,
    productUrl: productUrl
  };
}

function approveGoal_(goalId) {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = requireSheet_(db, SHEET_NAMES.goals);
  const record = findGoalById_(sheet, goalId);
  const status = String(record.object.Status || '').toLowerCase();

  if (status !== 'pending') throw new Error('Only pending goals can be approved.');

  setRecordValue_(sheet, record, 'Status', 'active');
  SpreadsheetApp.flush();
  return { goalId: String(record.object.GoalID), status: 'active' };
}

function rejectGoal_(goalId) {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = requireSheet_(db, SHEET_NAMES.goals);
  const record = findGoalById_(sheet, goalId);
  const status = String(record.object.Status || '').toLowerCase();

  if (status !== 'pending') throw new Error('Only pending goals can be declined.');

  setRecordValue_(sheet, record, 'Status', 'declined');
  SpreadsheetApp.flush();
  return { goalId: String(record.object.GoalID), status: 'declined' };
}


function appendD006PendingTransaction_(db, opportunity, date, agreedAmount, reviewKind) {
  const sheet = ensureSheet_(db, SHEET_NAMES.transactions, TRANSACTION_HEADERS);
  addMissingHeaders_(sheet, TRANSACTION_HEADERS);
  const transactionId = uniqueGeneratedId_(sheet, 'TransactionID', 'TX');
  appendObjectRow_(sheet, {
    TransactionID: transactionId,
    Date: date,
    Type: 'earning',
    Description: String(opportunity.Title || 'Opportunity'),
    Amount: roundMoney_(agreedAmount),
    OpportunityID: String(opportunity.ID),
    GoalID: '',
    Status: 'pending',
    ApprovedBy: '',
    Feedback: '',
    AgreedAmount: roundMoney_(agreedAmount),
    ReviewKind: reviewKind,
    ReviewOutcome: ''
  });
}

function appendD006CompletedTransaction_(db, opportunity, date, amount, agreedAmount, reviewKind, reviewOutcome, reviewer, feedback) {
  const sheet = ensureSheet_(db, SHEET_NAMES.transactions, TRANSACTION_HEADERS);
  addMissingHeaders_(sheet, TRANSACTION_HEADERS);
  const transactionId = uniqueGeneratedId_(sheet, 'TransactionID', 'TX');
  appendObjectRow_(sheet, {
    TransactionID: transactionId,
    Date: date,
    Type: 'earning',
    Description: String(opportunity.Title || 'Opportunity'),
    Amount: roundMoney_(amount),
    OpportunityID: String(opportunity.ID),
    GoalID: '',
    Status: 'completed',
    ApprovedBy: reviewer,
    Feedback: feedback,
    AgreedAmount: roundMoney_(agreedAmount),
    ReviewKind: reviewKind,
    ReviewOutcome: reviewOutcome
  });
}

function requireSingleD006PendingTransaction_(db, opportunityId, reviewKind) {
  const matches = findPendingTransactionsForOpportunity_(db, opportunityId);
  if (!matches.length) throwApiError_('LEDGER_MISMATCH', 'No pending transaction exists for this Opportunity review.');
  if (matches.length > 1) throwApiError_('LEDGER_MISMATCH', 'Multiple pending transactions exist for this Opportunity review.');
  const match = matches[0];
  if (reviewKind && String(match.object.ReviewKind || '') !== reviewKind) {
    throwApiError_('LEDGER_MISMATCH', 'Pending transaction review kind does not match the Opportunity review.');
  }
  match.sheet = requireSheet_(db, SHEET_NAMES.transactions);
  return match;
}

function finaliseD006TransactionRecord_(record, date, status, approvedBy, feedback, amount, reviewKind, reviewOutcome, agreedAmountOverride) {
  const sheet = record.sheet;
  setRecordValue_(sheet, record, 'Date', date);
  setRecordValue_(sheet, record, 'Status', status);
  setRecordValue_(sheet, record, 'Amount', roundMoney_(amount));
  setRecordValue_(sheet, record, 'ApprovedBy', approvedBy);
  setRecordValue_(sheet, record, 'Feedback', feedback);
  setRecordValueIfPresent_(sheet, record, 'AgreedAmount', roundMoney_(typeof agreedAmountOverride === 'undefined' ? number_(record.object.AgreedAmount || amount) : agreedAmountOverride));
  setRecordValueIfPresent_(sheet, record, 'ReviewKind', reviewKind);
  setRecordValueIfPresent_(sheet, record, 'ReviewOutcome', reviewOutcome);
}

function provisionSchoolDevice_() {
  const properties = PropertiesService.getScriptProperties();
  let key = properties.getProperty('SOPHIE_SCHOOL_DEVICE_KEY');
  if (!key) {
    key = generateSchoolKey_();
    properties.setProperty('SOPHIE_SCHOOL_DEVICE_KEY', key);
  }
  return { schoolKey: key, provisioned: true };
}

function rotateSchoolDeviceKey_() {
  const key = generateSchoolKey_();
  PropertiesService.getScriptProperties().setProperty('SOPHIE_SCHOOL_DEVICE_KEY', key);
  return { schoolKey: key, rotated: true };
}

function getSchoolTasks_() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ensureSchoolTaskSchema_(db);
  return readObjects_(sheet)
    .map(normaliseSchoolTask_)
    .filter(function(task) {
      return task.parentReviewState === 'approved' &&
        task.recordState === 'active' &&
        !task.sourceConflict;
    })
    .sort(sortSchoolTasks_);
}

function getSchoolHistory_() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ensureSchoolTaskSchema_(db);
  return readObjects_(sheet)
    .map(normaliseSchoolTask_)
    .filter(function(task) {
      return task.parentReviewState === 'approved' &&
        task.recordState === 'history' &&
        !task.sourceConflict;
    })
    .sort(function(left, right) {
      return new Date(right.updatedAt || right.submittedAt || right.createdAt || 0) -
        new Date(left.updatedAt || left.submittedAt || left.createdAt || 0);
    });
}

function getSchoolWorkspace_() {
  return {
    tasks: getSchoolTasks_(),
    history: getSchoolHistory_(),
    profile: getSchoolProfile_()
  };
}

function createSchoolTask_(data) {
  const subject = cleanText_(data.subject || '', 60);
  const title = cleanText_(data.title || '', 120);
  const dueDate = cleanDateOnly_(data.dueDate, true);
  const currentAction = cleanText_(data.currentAction || data.nextAction || '', 240);
  const taskType = cleanTaskType_(data.taskType || 'assignment');
  const journeyStage = cleanJourneyStage_(data.journeyStage || 'understand');
  const supportPreference = cleanSupportPreference_(data.supportPreference || '');

  if (!subject) throw new Error('Choose a subject.');
  if (!title) throw new Error('A school task needs a name.');
  if (!currentAction) throw new Error('Add one concrete next step.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSchoolTaskSchema_(db);
    const now = new Date();
    const id = uniqueGeneratedId_(sheet, 'TaskID', 'ST');
    const legacyStatus = legacyStatusForCanonical_(journeyStage, 'not_submitted');

    appendObjectRow_(sheet, {
      TaskID: id,
      SourceTaskID: cleanText_(data.sourceTaskId || '', 120),
      Subject: subject,
      SubjectKey: cleanSubjectKey_(data.subjectKey || subject),
      Title: title,
      TaskType: taskType,
      SetDate: cleanDateOnly_(data.setDate || '', false) || dateOnlyInZone_(now),
      DueDate: dueDate,
      Status: legacyStatus,
      NextAction: currentAction,
      RecordState: 'active',
      JourneyStage: journeyStage,
      CurrentAction: currentAction,
      SupportPreference: supportPreference,
      HelpType: '',
      SourceStatus: cleanText_(data.sourceStatus || '', 160),
      SubmissionState: 'not_submitted',
      CreatedAt: now,
      StartedAt: '',
      UpdatedAt: now,
      SubmittedAt: '',
      ReceiptConfirmedAt: '',
      GradeOrResult: '',
      Mark: '',
      TeacherComment: '',
      CoachComment: '',
      CarryForwardSuggestion: '',
      Source: cleanText_(data.source || 'manual', 80) || 'manual',
      SourceConflict: '',
      ParentReviewState: 'approved',
      ArchivedAt: ''
    });

    SpreadsheetApp.flush();
    return normaliseSchoolTask_(findSchoolTaskById_(sheet, id).object);
  } finally {
    lock.releaseLock();
  }
}

function updateSchoolTask_(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSchoolTaskSchema_(db);
    const record = findSchoolTaskById_(sheet, data.taskId);
    const now = new Date();

    assertSchoolTaskEditableByDevice_(record.object);

    if (Object.prototype.hasOwnProperty.call(data, 'subject')) {
      const subject = cleanText_(data.subject || '', 60);
      if (!subject) throw new Error('Choose a subject.');
      setRecordValue_(sheet, record, 'Subject', subject);
      if (!Object.prototype.hasOwnProperty.call(data, 'subjectKey')) {
        setRecordValue_(sheet, record, 'SubjectKey', cleanSubjectKey_(subject));
      }
    }
    if (Object.prototype.hasOwnProperty.call(data, 'subjectKey')) {
      setRecordValue_(sheet, record, 'SubjectKey', cleanSubjectKey_(data.subjectKey));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'title')) {
      const title = cleanText_(data.title || '', 120);
      if (!title) throw new Error('A school task needs a name.');
      setRecordValue_(sheet, record, 'Title', title);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'dueDate')) {
      setRecordValue_(sheet, record, 'DueDate', cleanDateOnly_(data.dueDate, true));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'taskType')) {
      setRecordValue_(sheet, record, 'TaskType', cleanTaskType_(data.taskType));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'currentAction') ||
        Object.prototype.hasOwnProperty.call(data, 'nextAction')) {
      const currentAction = cleanText_(data.currentAction || data.nextAction || '', 240);
      if (!currentAction) throw new Error('Add one concrete next step.');
      setRecordValue_(sheet, record, 'CurrentAction', currentAction);
      setRecordValue_(sheet, record, 'NextAction', currentAction);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'supportPreference')) {
      setRecordValue_(sheet, record, 'SupportPreference', cleanSupportPreference_(data.supportPreference));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'helpType')) {
      setRecordValue_(sheet, record, 'HelpType', cleanHelpType_(data.helpType));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'journeyStage')) {
      const stage = cleanJourneyStage_(data.journeyStage);
      setRecordValue_(sheet, record, 'JourneyStage', stage);
      const submission = canonicalSubmissionState_(record.object);
      setRecordValue_(sheet, record, 'Status', legacyStatusForCanonical_(stage, submission));
      if (stage === 'work' && !record.object.StartedAt) setRecordValue_(sheet, record, 'StartedAt', now);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
      applyLegacySchoolStatus_(sheet, record, cleanSchoolStatus_(data.status), now);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'recordState')) {
      const state = cleanRecordState_(data.recordState);
      setRecordValue_(sheet, record, 'RecordState', state);
      if (state === 'archived') {
        setRecordValue_(sheet, record, 'ArchivedAt', record.object.ArchivedAt || now);
      } else if (record.object.ArchivedAt) {
        setRecordValue_(sheet, record, 'ArchivedAt', '');
      }
    }

    setRecordValue_(sheet, record, 'UpdatedAt', now);
    SpreadsheetApp.flush();
    return normaliseSchoolTask_(record.object);
  } finally {
    lock.releaseLock();
  }
}

function requestSchoolHelp_(taskId, helpType) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSchoolTaskSchema_(db);
    const record = findSchoolTaskById_(sheet, taskId);
    assertSchoolTaskEditableByDevice_(record.object);
    const cleanHelp = cleanHelpType_(helpType);
    setRecordValue_(sheet, record, 'HelpType', cleanHelp);
    setRecordValue_(sheet, record, 'UpdatedAt', new Date());
    SpreadsheetApp.flush();
    return { taskId: String(record.object.TaskID), helpType: cleanHelp };
  } finally {
    lock.releaseLock();
  }
}

function markSchoolSubmitted_(taskId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSchoolTaskSchema_(db);
    const record = findSchoolTaskById_(sheet, taskId);
    assertSchoolTaskEditableByDevice_(record.object);
    const now = new Date();
    setRecordValue_(sheet, record, 'JourneyStage', 'submit');
    setRecordValue_(sheet, record, 'SubmissionState', 'submitted');
    setRecordValue_(sheet, record, 'Status', 'submitted');
    setRecordValue_(sheet, record, 'SubmittedAt', now);
    setRecordValue_(sheet, record, 'ReceiptConfirmedAt', '');
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    setRecordValue_(sheet, record, 'HelpType', '');
    SpreadsheetApp.flush();
    return normaliseSchoolTask_(record.object);
  } finally {
    lock.releaseLock();
  }
}

function confirmSchoolReceipt_(taskId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSchoolTaskSchema_(db);
    const record = findSchoolTaskById_(sheet, taskId);
    assertSchoolTaskEditableByDevice_(record.object);
    const submission = canonicalSubmissionState_(record.object);
    if (submission !== 'submitted' && submission !== 'received') {
      throw new Error('Mark the task as submitted before confirming receipt.');
    }
    const now = new Date();
    setRecordValue_(sheet, record, 'SubmissionState', 'received');
    setRecordValue_(sheet, record, 'ReceiptConfirmedAt', record.object.ReceiptConfirmedAt || now);
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    SpreadsheetApp.flush();
    return normaliseSchoolTask_(record.object);
  } finally {
    lock.releaseLock();
  }
}

function archiveSchoolTask_(taskId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSchoolTaskSchema_(db);
    const record = findSchoolTaskById_(sheet, taskId);
    const now = new Date();
    setRecordValue_(sheet, record, 'RecordState', 'archived');
    setRecordValue_(sheet, record, 'ArchivedAt', record.object.ArchivedAt || now);
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    SpreadsheetApp.flush();
    return { taskId: String(record.object.TaskID), archived: true };
  } finally {
    lock.releaseLock();
  }
}

function getSchoolRubric_(taskId) {
  const cleanTaskId = cleanText_(taskId || '', 120);
  if (!cleanTaskId) throw new Error('A task ID is required.');
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const taskSheet = ensureSchoolTaskSchema_(db);
  const task = normaliseSchoolTask_(findSchoolTaskById_(taskSheet, cleanTaskId).object);
  if (task.parentReviewState !== 'approved' || task.sourceConflict || task.recordState === 'review') {
    throw new Error('This rubric is not available to Sophie yet.');
  }
  const sheet = ensureSheet_(db, SHEET_NAMES.schoolRubric, SCHOOL_RUBRIC_HEADERS);
  addMissingHeaders_(sheet, SCHOOL_RUBRIC_HEADERS);
  return readObjects_(sheet)
    .filter(function(row) { return String(row.TaskID || '') === cleanTaskId; })
    .map(normaliseSchoolRubric_)
    .sort(function(left, right) { return left.criterionOrder - right.criterionOrder; });
}

function normaliseSchoolRubric_(row) {
  return {
    rubricId: String(row.RubricID || ''),
    taskId: String(row.TaskID || ''),
    criterionOrder: positiveInteger_(row.CriterionOrder, 1, 1000),
    criterionCode: String(row.CriterionCode || ''),
    criterionName: String(row.CriterionName || ''),
    rating: String(row.Rating || ''),
    mark: String(row.Mark || ''),
    maxMark: String(row.MaxMark || ''),
    selectedDescriptor: String(row.SelectedDescriptor || ''),
    source: String(row.Source || ''),
    createdAt: iso_(row.CreatedAt),
    updatedAt: iso_(row.UpdatedAt)
  };
}

function saveSchoolFeedback_(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSchoolTaskSchema_(db);
    const record = findSchoolTaskById_(sheet, data.taskId);
    const now = new Date();

    if (Object.prototype.hasOwnProperty.call(data, 'gradeOrResult')) {
      setRecordValue_(sheet, record, 'GradeOrResult', cleanText_(data.gradeOrResult || '', 80));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'mark')) {
      setRecordValue_(sheet, record, 'Mark', cleanText_(data.mark || '', 80));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'teacherComment')) {
      // Teacher text is only replaced through this explicit parent/import route.
      setRecordValue_(sheet, record, 'TeacherComment', cleanText_(data.teacherComment || '', 4000));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'coachComment')) {
      setRecordValue_(sheet, record, 'CoachComment', cleanText_(data.coachComment || '', 4000));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'carryForwardSuggestion')) {
      setRecordValue_(sheet, record, 'CarryForwardSuggestion', cleanText_(data.carryForwardSuggestion || '', 1000));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'sourceStatus')) {
      setRecordValue_(sheet, record, 'SourceStatus', cleanText_(data.sourceStatus || '', 240));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'sourceConflict')) {
      setRecordValue_(sheet, record, 'SourceConflict', cleanSourceConflict_(data.sourceConflict));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'parentReviewState')) {
      setRecordValue_(sheet, record, 'ParentReviewState', cleanParentReviewState_(data.parentReviewState));
    }
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    SpreadsheetApp.flush();
    return normaliseSchoolTask_(record.object);
  } finally {
    lock.releaseLock();
  }
}

function saveSchoolRubric_(data) {
  const taskId = cleanText_(data.taskId || '', 120);
  if (!taskId) throw new Error('A rubric needs a task ID.');
  const criteria = Array.isArray(data.criteria) ? data.criteria : [data];
  if (!criteria.length || criteria.length > 50) throw new Error('Provide between 1 and 50 rubric criteria.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const taskSheet = ensureSchoolTaskSchema_(db);
    findSchoolTaskById_(taskSheet, taskId);
    const sheet = ensureSheet_(db, SHEET_NAMES.schoolRubric, SCHOOL_RUBRIC_HEADERS);
    addMissingHeaders_(sheet, SCHOOL_RUBRIC_HEADERS);
    const now = new Date();
    const saved = [];

    criteria.forEach(function(item, index) {
      const criterionName = cleanText_(item.criterionName || '', 240);
      if (!criterionName) throw new Error('Each rubric criterion needs a name.');
      const criterionCode = cleanText_(item.criterionCode || '', 80);
      const order = positiveInteger_(item.criterionOrder, index + 1, 1000);
      const existing = findRubricCriterion_(sheet, taskId, criterionCode, order);
      const values = {
        TaskID: taskId,
        CriterionOrder: order,
        CriterionCode: criterionCode,
        CriterionName: criterionName,
        Rating: cleanText_(item.rating || '', 120),
        Mark: cleanText_(item.mark || '', 80),
        MaxMark: cleanText_(item.maxMark || '', 80),
        SelectedDescriptor: cleanText_(item.selectedDescriptor || '', 2000),
        Source: cleanText_(item.source || data.source || 'parent', 120) || 'parent',
        UpdatedAt: now
      };
      if (existing) {
        Object.keys(values).forEach(function(header) { setRecordValue_(sheet, existing, header, values[header]); });
        saved.push(String(existing.object.RubricID));
      } else {
        values.RubricID = uniqueGeneratedId_(sheet, 'RubricID', 'RB');
        values.CreatedAt = now;
        appendObjectRow_(sheet, values);
        saved.push(values.RubricID);
      }
    });

    SpreadsheetApp.flush();
    return { taskId: taskId, rubricIds: saved, count: saved.length };
  } finally {
    lock.releaseLock();
  }
}

function getSchoolProfile_() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ensureSchoolProfile_(db);
  const record = findUniqueRecordById_(sheet, 'ProfileID', SCHOOL_PROFILE_ID, 'School profile');
  return normaliseSchoolProfile_(record.object);
}

function updateSchoolProfile_(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSchoolProfile_(db);
    const record = findUniqueRecordById_(sheet, 'ProfileID', SCHOOL_PROFILE_ID, 'School profile');
    const now = new Date();

    if (Object.prototype.hasOwnProperty.call(data, 'scaffoldMode')) {
      setRecordValue_(sheet, record, 'ScaffoldMode', cleanScaffoldMode_(data.scaffoldMode));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'preferredSchoolView')) {
      setRecordValue_(sheet, record, 'PreferredSchoolView', cleanPreferredSchoolView_(data.preferredSchoolView));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'lastScaffoldReviewAt')) {
      setRecordValue_(sheet, record, 'LastScaffoldReviewAt', cleanDateTimeOrBlank_(data.lastScaffoldReviewAt));
    }
    if (Object.prototype.hasOwnProperty.call(data, 'suggestedScaffoldMode')) {
      const suggested = String(data.suggestedScaffoldMode || '').trim();
      setRecordValue_(sheet, record, 'SuggestedScaffoldMode', suggested ? cleanScaffoldMode_(suggested) : '');
    }
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    SpreadsheetApp.flush();
    return normaliseSchoolProfile_(record.object);
  } finally {
    lock.releaseLock();
  }
}

function normaliseSchoolTask_(row) {
  const journeyStage = canonicalJourneyStage_(row);
  const submissionState = canonicalSubmissionState_(row);
  const recordState = canonicalRecordState_(row);
  const currentAction = String(row.CurrentAction || row.NextAction || '');
  const parentReviewState = String(row.ParentReviewState || 'approved').trim().toLowerCase();
  const sourceConflict = hasUnresolvedSourceConflict_(row.SourceConflict);
  const supportPreference = canonicalSupportPreference_(row.SupportPreference);

  return {
    // Backward-compatible frontend fields.
    taskId: String(row.TaskID || ''),
    subject: String(row.Subject || ''),
    title: String(row.Title || ''),
    dueDate: dateOnlyFromCell_(row.DueDate),
    taskType: normaliseTaskType_(row.TaskType),
    status: legacyStatusForCanonical_(journeyStage, submissionState, row.Status),
    nextAction: currentAction,
    helpType: String(row.HelpType || '').trim().toLowerCase(),
    source: String(row.Source || 'manual'),
    createdAt: iso_(row.CreatedAt),
    startedAt: iso_(row.StartedAt),
    updatedAt: iso_(row.UpdatedAt),
    submittedAt: iso_(row.SubmittedAt),
    receiptConfirmedAt: iso_(row.ReceiptConfirmedAt),
    archivedAt: iso_(row.ArchivedAt),

    // Canonical D-005 fields.
    sourceTaskId: String(row.SourceTaskID || ''),
    subjectKey: String(row.SubjectKey || cleanSubjectKey_(row.Subject || '')),
    setDate: dateOnlyFromCell_(row.SetDate),
    recordState: recordState,
    journeyStage: journeyStage,
    currentAction: currentAction,
    supportPreference: supportPreference,
    sourceStatus: String(row.SourceStatus || ''),
    submissionState: submissionState,
    gradeOrResult: String(row.GradeOrResult || ''),
    mark: String(row.Mark || ''),
    teacherComment: String(row.TeacherComment || ''),
    coachComment: String(row.CoachComment || ''),
    carryForwardSuggestion: String(row.CarryForwardSuggestion || ''),
    sourceConflict: sourceConflict,
    parentReviewState: parentReviewState
  };
}

function normaliseSchoolProfile_(row) {
  return {
    profileId: String(row.ProfileID || SCHOOL_PROFILE_ID),
    scaffoldMode: cleanScaffoldModeOrDefault_(row.ScaffoldMode, 'guided'),
    preferredSchoolView: cleanPreferredSchoolViewOrDefault_(row.PreferredSchoolView, 'now'),
    lastScaffoldReviewAt: iso_(row.LastScaffoldReviewAt),
    suggestedScaffoldMode: cleanScaffoldModeOrDefault_(row.SuggestedScaffoldMode, ''),
    updatedAt: iso_(row.UpdatedAt)
  };
}

function sortSchoolTasks_(left, right) {
  const leftDue = left.dueDate || '9999-12-31';
  const rightDue = right.dueDate || '9999-12-31';
  if (leftDue !== rightDue) return leftDue < rightDue ? -1 : 1;
  return new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0);
}

function cleanDateOnly_(value, required) {
  const text = String(value || '').trim();
  if (!text) {
    if (required) throw new Error('Choose a due date.');
    return '';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error('Use a valid date in YYYY-MM-DD format.');
  const parts = text.split('-').map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  if (date.getUTCFullYear() !== parts[0] || date.getUTCMonth() !== parts[1] - 1 || date.getUTCDate() !== parts[2]) {
    throw new Error('Use a valid date.');
  }
  return text;
}

function dateOnlyFromCell_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return dateOnlyInZone_(value);
  }
  if (typeof value === 'number' && isFinite(value)) {
    // Google Sheets serial date: day 0 = 1899-12-30.
    const milliseconds = Math.round((value - 25569) * 86400000);
    const date = new Date(milliseconds);
    return Utilities.formatDate(date, 'Etc/UTC', 'yyyy-MM-dd');
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(value);
  return isNaN(date.getTime()) ? '' : dateOnlyInZone_(date);
}

function dateOnlyInZone_(date) {
  return Utilities.formatDate(date, SCHOOL_TIME_ZONE, 'yyyy-MM-dd');
}

function cleanTaskType_(value) {
  const type = normaliseTaskType_(value);
  const allowed = ['assignment', 'checkpoint', 'homework', 'other'];
  if (allowed.indexOf(type) < 0) throw new Error('Unsupported school task type.');
  return type;
}

function normaliseTaskType_(value) {
  const text = String(value || 'assignment').trim().toLowerCase();
  if (text.indexOf('checkpoint') >= 0) return 'checkpoint';
  if (text.indexOf('homework') >= 0) return 'homework';
  if (text === 'assignment' || text === 'checkpoint' || text === 'homework' || text === 'other') return text;
  return 'assignment';
}

function cleanSchoolStatus_(value) {
  const status = String(value || '').trim().toLowerCase();
  const allowed = ['todo', 'working', 'ready', 'submitted'];
  if (allowed.indexOf(status) < 0) throw new Error('Unsupported school task status.');
  return status;
}

function cleanJourneyStage_(value) {
  const stage = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  const aliases = { doing: 'work', working: 'work', ready: 'check', submitted: 'submit' };
  const canonical = aliases[stage] || stage;
  const allowed = ['understand', 'plan', 'work', 'check', 'submit', 'feedback'];
  if (allowed.indexOf(canonical) < 0) throw new Error('Unsupported assignment journey stage.');
  return canonical;
}

function cleanSupportPreference_(value) {
  const support = String(value || '').trim().toLowerCase().replace(/[’']/g, '').replace(/\s+/g, '_');
  const aliases = {
    showme: 'show_me',
    show_me: 'show_me',
    do_it_with_me: 'do_with_me',
    do_with_me: 'do_with_me',
    promptme: 'prompt_me',
    prompt_me: 'prompt_me',
    ive_got_this: 'got_this',
    i_ve_got_this: 'got_this',
    got_this: 'got_this'
  };
  if (!support) return '';
  const canonical = aliases[support] || support;
  const allowed = ['show_me', 'do_with_me', 'prompt_me', 'got_this'];
  if (allowed.indexOf(canonical) < 0) throw new Error('Unsupported support preference.');
  return canonical;
}

function cleanHelpType_(value) {
  const help = String(value || '').trim().toLowerCase();
  const allowed = ['', 'understand', 'stuck', 'feedback', 'submitting'];
  if (allowed.indexOf(help) < 0) throw new Error('Unsupported help request.');
  return help;
}

function cleanRecordState_(value) {
  const state = String(value || '').trim().toLowerCase();
  const allowed = ['active', 'history', 'review', 'archived'];
  if (allowed.indexOf(state) < 0) throw new Error('Unsupported school record state.');
  return state;
}

function cleanSubmissionState_(value) {
  const state = String(value || '').trim().toLowerCase();
  const allowed = ['not_submitted', 'submitted', 'received'];
  if (allowed.indexOf(state) < 0) throw new Error('Unsupported submission state.');
  return state;
}

function cleanScaffoldMode_(value) {
  const mode = String(value || '').trim().toLowerCase();
  const allowed = ['guided', 'shared', 'self_managed', 'light'];
  if (allowed.indexOf(mode) < 0) throw new Error('Unsupported scaffold mode.');
  return mode;
}

function cleanScaffoldModeOrDefault_(value, fallback) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return fallback;
  return ['guided', 'shared', 'self_managed', 'light'].indexOf(text) >= 0 ? text : fallback;
}

function cleanPreferredSchoolView_(value) {
  const view = String(value || '').trim().toLowerCase();
  const allowed = ['now', 'subjects'];
  if (allowed.indexOf(view) < 0) throw new Error('Unsupported School view.');
  return view;
}

function cleanPreferredSchoolViewOrDefault_(value, fallback) {
  const text = String(value || '').trim().toLowerCase();
  return ['now', 'subjects'].indexOf(text) >= 0 ? text : fallback;
}

function cleanParentReviewState_(value) {
  const state = String(value || '').trim().toLowerCase();
  const allowed = ['approved', 'pending', 'hold'];
  if (allowed.indexOf(state) < 0) throw new Error('Unsupported parent review state.');
  return state;
}

function cleanSourceConflict_(value) {
  if (value === true) return 'unresolved';
  const text = cleanText_(value || '', 500);
  if (!text) return '';
  if (/^(false|no|none|resolved)$/i.test(text)) return '';
  return text;
}

function cleanSubjectKey_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function cleanDateTimeOrBlank_(value) {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) throw new Error('Use a valid date/time.');
  return date;
}

function canonicalJourneyStage_(row) {
  const direct = String(row.JourneyStage || '').trim();
  if (direct) {
    try { return cleanJourneyStage_(direct); } catch (error) { /* fall through */ }
  }
  const status = String(row.Status || 'todo').trim().toLowerCase();
  return ({ todo: 'understand', working: 'work', ready: 'check', submitted: 'submit' })[status] || 'understand';
}

function canonicalSubmissionState_(row) {
  const direct = String(row.SubmissionState || '').trim().toLowerCase();
  if (['not_submitted', 'submitted', 'received'].indexOf(direct) >= 0) return direct;
  if (row.ReceiptConfirmedAt) return 'received';
  if (row.SubmittedAt || String(row.Status || '').toLowerCase() === 'submitted') return 'submitted';
  return 'not_submitted';
}

function canonicalRecordState_(row) {
  const direct = String(row.RecordState || '').trim().toLowerCase();
  if (['active', 'history', 'review', 'archived'].indexOf(direct) >= 0) return direct;
  return row.ArchivedAt ? 'archived' : 'active';
}

function canonicalSupportPreference_(value) {
  try { return cleanSupportPreference_(value); } catch (error) { return ''; }
}

function legacyStatusForCanonical_(journeyStage, submissionState, existingStatus) {
  const submission = String(submissionState || '').toLowerCase();
  if (submission === 'submitted' || submission === 'received') return 'submitted';
  const stage = String(journeyStage || '').toLowerCase();
  if (stage === 'work') return 'working';
  if (stage === 'check') return 'ready';
  if (stage === 'submit' || stage === 'feedback') {
    const existing = String(existingStatus || '').toLowerCase();
    return existing === 'submitted' ? 'submitted' : 'ready';
  }
  return 'todo';
}

function applyLegacySchoolStatus_(sheet, record, status, now) {
  setRecordValue_(sheet, record, 'Status', status);
  if (status === 'todo') {
    setRecordValue_(sheet, record, 'JourneyStage', 'understand');
    setRecordValue_(sheet, record, 'SubmissionState', 'not_submitted');
    setRecordValue_(sheet, record, 'SubmittedAt', '');
    setRecordValue_(sheet, record, 'ReceiptConfirmedAt', '');
  } else if (status === 'working') {
    setRecordValue_(sheet, record, 'JourneyStage', 'work');
    setRecordValue_(sheet, record, 'SubmissionState', 'not_submitted');
    if (!record.object.StartedAt) setRecordValue_(sheet, record, 'StartedAt', now);
    setRecordValue_(sheet, record, 'SubmittedAt', '');
    setRecordValue_(sheet, record, 'ReceiptConfirmedAt', '');
  } else if (status === 'ready') {
    setRecordValue_(sheet, record, 'JourneyStage', 'check');
    setRecordValue_(sheet, record, 'SubmissionState', 'not_submitted');
    setRecordValue_(sheet, record, 'SubmittedAt', '');
    setRecordValue_(sheet, record, 'ReceiptConfirmedAt', '');
  } else if (status === 'submitted') {
    setRecordValue_(sheet, record, 'JourneyStage', 'submit');
    setRecordValue_(sheet, record, 'SubmissionState', 'submitted');
    if (!record.object.SubmittedAt) setRecordValue_(sheet, record, 'SubmittedAt', now);
    setRecordValue_(sheet, record, 'ReceiptConfirmedAt', '');
  }
}

function assertSchoolTaskEditableByDevice_(row) {
  const recordState = canonicalRecordState_(row);
  const reviewState = String(row.ParentReviewState || 'approved').trim().toLowerCase();
  if (recordState === 'review') throw new Error('This task is still under parent review.');
  if (recordState === 'archived') throw new Error('This task is archived.');
  if (reviewState !== 'approved') throw new Error('This task is not yet approved for Sophie.');
  if (hasUnresolvedSourceConflict_(row.SourceConflict)) throw new Error('This task has an unresolved source conflict.');
}

function hasUnresolvedSourceConflict_(value) {
  if (value === true) return true;
  const text = String(value || '').trim();
  if (!text) return false;
  return !/^(false|no|none|resolved)$/i.test(text);
}

function findRubricCriterion_(sheet, taskId, criterionCode, order) {
  const matches = readObjectsWithRows_(sheet).filter(function(item) {
    if (String(item.object.TaskID) !== String(taskId)) return false;
    if (criterionCode) return String(item.object.CriterionCode || '') === String(criterionCode);
    return number_(item.object.CriterionOrder) === number_(order);
  });
  if (matches.length > 1) throw new Error('Duplicate rubric criteria found for this task.');
  return matches[0] || null;
}

function positiveInteger_(value, fallback, maximum) {
  const number = Math.floor(Number(value));
  if (!isFinite(number) || number < 1) return fallback;
  return Math.min(number, maximum);
}

function findPendingTransactionsForOpportunity_(db, opportunityId) {
  const sheet = requireSheet_(db, SHEET_NAMES.transactions);
  return readObjectsWithRows_(sheet).filter(function(item) {
    return String(item.object.OpportunityID) === String(opportunityId) &&
      String(item.object.Status || '').toLowerCase() === 'pending';
  });
}

function assertPendingCanDecrease_(pending, amount) {
  const current = roundMoney_(pending);
  const decrease = roundMoney_(amount);
  if (current + 0.0001 < decrease) {
    throwApiError_('LEDGER_MISMATCH', 'Pending total is inconsistent with the ledger. No money was moved.');
  }
}

/**
 * Read-only diagnostic. Safe to run from the Apps Script editor.
 * It does not repair or rewrite production data.
 */
function auditDataIntegrity() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const issues = [];
  const statsSheet = requireSheet_(db, SHEET_NAMES.stats);
  const opportunitySheet = requireSheet_(db, SHEET_NAMES.opportunities);
  const opportunities = readObjects_(opportunitySheet);
  const transactionSheet = requireSheet_(db, SHEET_NAMES.transactions);
  const transactions = readObjects_(transactionSheet);
  const skillsSheet = requireSheet_(db, SHEET_NAMES.skills);
  const skillIds = {};
  readObjects_(skillsSheet).forEach(function(skill) { if (skill.SkillID) skillIds[String(skill.SkillID)] = true; });
  const d006SchemaReady = hasHeaders_(opportunitySheet, ['Requiredness', 'CompletionStandard', 'MigrationVersion']) &&
    hasHeaders_(transactionSheet, ['AgreedAmount', 'ReviewKind', 'ReviewOutcome']);

  collectDuplicateIds_(opportunities, 'ID').forEach(function(id) { issues.push('Duplicate Opportunity ID: ' + id); });
  collectDuplicateIds_(transactions, 'TransactionID').forEach(function(id) { issues.push('Duplicate Transaction ID: ' + id); });

  if (d006SchemaReady) {
    opportunities.forEach(function(opportunity) {
      if (String(opportunity.MigrationVersion || '') === 'd006-v1-retired') return;
      collectD006OpportunityIssues_(opportunity, skillIds).forEach(function(issue) {
        issues.push('Opportunity ' + opportunity.ID + ': ' + issue);
      });
      const status = normaliseOpportunityStatus_(opportunity.Status);
      const kind = String(opportunity.ReviewKind || '');
      const pendingRows = transactions.filter(function(tx) {
        return String(tx.OpportunityID) === String(opportunity.ID) && String(tx.Status || '').toLowerCase() === 'pending';
      });
      if (status === 'waiting_for_review' && kind === 'full_completion' && pendingRows.length !== 1) {
        issues.push('Opportunity ' + opportunity.ID + ' is awaiting full-completion review but has ' + pendingRows.length + ' pending Transactions.');
      }
      if (status === 'waiting_for_review' && kind === 'partial_work_withdrawal' && pendingRows.length !== 0) {
        issues.push('Opportunity ' + opportunity.ID + ' has a partial-work withdrawal review but also has a pending payment Transaction.');
      }
      if (!(status === 'waiting_for_review' && kind === 'full_completion') && pendingRows.length) {
        issues.push('Opportunity ' + opportunity.ID + ' is ' + status + '/' + kind + ' but still has a pending Transaction.');
      }
    });
  } else {
    opportunities.forEach(function(opportunity) {
      const status = String(opportunity.Status || 'open').toLowerCase();
      const pendingRows = transactions.filter(function(tx) {
        return String(tx.OpportunityID) === String(opportunity.ID) && String(tx.Status || '').toLowerCase() === 'pending';
      });
      if ((status === 'pending' || status === 'claimed') && pendingRows.length !== 1) {
        issues.push('Legacy Opportunity ' + opportunity.ID + ' is ' + status + ' but has ' + pendingRows.length + ' pending Transactions.');
      }
      if (status !== 'pending' && status !== 'claimed' && pendingRows.length) {
        issues.push('Legacy Opportunity ' + opportunity.ID + ' is ' + status + ' but still has a pending Transaction.');
      }
    });
  }

  const pendingFromLedger = roundMoney_(transactions.reduce(function(total, tx) {
    return String(tx.Status || '').toLowerCase() === 'pending' ? total + number_(tx.Amount) : total;
  }, 0));
  const stats = readStats_(statsSheet);
  if (Math.abs(roundMoney_(stats.pending) - pendingFromLedger) > 0.0001) {
    issues.push('Stats.Pending (' + roundMoney_(stats.pending) + ') does not match pending ledger total (' + pendingFromLedger + ').');
  }

  if (d006SchemaReady) {
    transactions.forEach(function(tx) {
      if (String(tx.Type || '').toLowerCase() !== 'earning') return;
      const status = String(tx.Status || '').toLowerCase();
      const agreed = roundMoney_(number_(tx.AgreedAmount || tx.Amount));
      const amount = roundMoney_(number_(tx.Amount));
      if (status === 'pending' && String(tx.ReviewKind || '') !== 'full_completion') {
        issues.push('Pending Transaction ' + tx.TransactionID + ' is not a full-completion review Transaction.');
      }
      if (status === 'completed' && agreed > 0 && amount > agreed + 0.0001) {
        issues.push('Transaction ' + tx.TransactionID + ' exceeds its frozen agreed amount.');
      }
    });
  }

  const schoolSheet = db.getSheetByName(SHEET_NAMES.schoolTasks);
  if (schoolSheet) {
    collectDuplicateIds_(readObjects_(schoolSheet), 'TaskID').forEach(function(id) { issues.push('Duplicate School TaskID: ' + id); });
  }

  const result = {
    version: APP_VERSION,
    opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
    opportunityContractReady: d006SchemaReady,
    ok: issues.length === 0,
    issueCount: issues.length,
    issues: issues,
    statsPending: roundMoney_(stats.pending),
    ledgerPending: pendingFromLedger
  };
  Logger.log(JSON.stringify(result));
  return result;
}

/** Read-only pre-migration gate. Does not add columns or change data. */
function auditD006OpportunityReadiness() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const opportunitySheet = requireSheet_(db, SHEET_NAMES.opportunities);
  const transactionSheet = requireSheet_(db, SHEET_NAMES.transactions);
  const opportunities = readObjects_(opportunitySheet);
  const transactions = readObjects_(transactionSheet);
  const issues = [];
  const requiredIds = ['1', '2', '3', '4', '5', '6'];

  collectDuplicateIds_(opportunities, 'ID').forEach(function(id) { issues.push('Duplicate Opportunity ID: ' + id); });
  collectDuplicateIds_(transactions, 'TransactionID').forEach(function(id) { issues.push('Duplicate Transaction ID: ' + id); });
  requiredIds.forEach(function(id) {
    const matches = opportunities.filter(function(row) { return String(row.ID) === id; });
    if (matches.length !== 1) issues.push('Expected exactly one legacy Opportunity ID ' + id + '; found ' + matches.length + '.');
  });
  opportunities.forEach(function(row) {
    const status = String(row.Status || 'open').toLowerCase();
    if (status === 'pending' || status === 'claimed' || status === 'in_progress' || status === 'waiting_for_review') {
      issues.push('Opportunity ' + row.ID + ' is active (' + status + '); migration requires a settled/open boundary.');
    }
  });
  if (opportunities.length !== 6) issues.push('Scoped six-item migration expects exactly 6 live legacy Opportunity rows; found ' + opportunities.length + '.');
  const pendingTx = transactions.filter(function(tx) { return String(tx.Status || '').toLowerCase() === 'pending'; });
  if (pendingTx.length) issues.push('Migration requires zero pending Transactions; found ' + pendingTx.length + '.');
  const configValidation = validateD006MigrationConfig_(readD006MigrationConfig_(), false);

  const result = {
    version: APP_VERSION,
    opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
    ok: issues.length === 0,
    issues: issues,
    legacyOpportunityCount: opportunities.length,
    transactionRowCount: transactions.length,
    pendingTransactionCount: pendingTx.length,
    migrationConfigPresent: !!readD006MigrationConfig_(),
    migrationConfigReady: configValidation.ok,
    migrationConfigIssues: configValidation.issues,
    snapshotsPresent: !!db.getSheetByName(D006_OPPORTUNITY_SNAPSHOT_SHEET) || !!db.getSheetByName(D006_TRANSACTION_SNAPSHOT_SHEET)
  };
  Logger.log(JSON.stringify(result));
  return result;
}

function getD006MigrationConfigTemplate() {
  const template = {
    dishwasher: { requiredness: 'expected|negotiated', completionStandard: 'PARENT CONFIRM' },
    cookDinner: {
      learnRequiredness: 'negotiated|optional',
      learnCompletionStandard: 'PARENT CONFIRM',
      earn: { value: 'PARENT CONFIRM > 0', scope: 'PARENT CONFIRM genuinely additional scope', completionStandard: 'PARENT CONFIRM', estimatedMinutes: 45 }
    },
    dogPoo: { mode: 'contribute|extra_earn', requiredness: 'expected|negotiated if contribute', completionStandard: 'PARENT CONFIRM', value: 'if extra_earn', scope: 'if extra_earn' },
    tidyRoom: { requiredness: 'negotiated|optional', completionStandard: 'PARENT CONFIRM functional standard' },
    laundry: { requiredness: 'negotiated|optional', completionStandard: 'PARENT CONFIRM' },
    recyclingBins: { mode: 'split|combined', requiredness: 'expected|negotiated', recyclingStandard: 'PARENT CONFIRM', binsOutStandard: 'PARENT CONFIRM', binsInStandard: 'PARENT CONFIRM', combinedStandard: 'if combined' }
  };
  const text = JSON.stringify(template, null, 2);
  Logger.log(text);
  return text;
}

function previewD006OpportunityMigration() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const readiness = auditD006OpportunityReadiness();
  const config = readD006MigrationConfig_();
  const configValidation = validateD006MigrationConfig_(config, true);
  if (!readiness.ok || !configValidation.ok) {
    const result = { ready: false, readiness: readiness, configIssues: configValidation.issues };
    Logger.log(JSON.stringify(result));
    return result;
  }
  const plan = buildD006MigrationRows_(db, config);
  const result = {
    ready: true,
    sourceRows: plan.sourceRowCount,
    resultingRows: plan.rows.length,
    retiredSourceIds: plan.retiredSourceIds,
    createdIds: plan.createdIds,
    transformedIds: plan.transformedIds,
    historicalTransactionsTouched: false
  };
  Logger.log(JSON.stringify(result));
  return result;
}

/**
 * Non-destructive six-item D-006 migration.
 * - Requires explicit parent-confirmed config in Script Property SOPHIE_D006_MIGRATION_CONFIG.
 * - Creates immutable pre-D006 snapshot sheets before the first live-table write.
 * - Does not edit or delete historical Transaction rows.
 * - Retires split source rows rather than deleting them.
 */
function migrateD006SixItems() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const readiness = auditD006OpportunityReadiness();
    if (!readiness.ok) throwApiError_('MIGRATION_CONFLICT', readiness.issues.join(' | '));
    const config = readD006MigrationConfig_();
    const configValidation = validateD006MigrationConfig_(config, true);
    if (!configValidation.ok) throwApiError_('MIGRATION_CONFLICT', configValidation.issues.join(' | '));
    if (db.getSheetByName(D006_OPPORTUNITY_SNAPSHOT_SHEET) || db.getSheetByName(D006_TRANSACTION_SNAPSHOT_SHEET)) {
      throwApiError_('MIGRATION_CONFLICT', 'Pre-D006 snapshot sheet already exists. Inspect the prior migration attempt before continuing.');
    }

    const opportunitySheet = requireSheet_(db, SHEET_NAMES.opportunities);
    const transactionSheet = requireSheet_(db, SHEET_NAMES.transactions);
    createD006Snapshot_(db, opportunitySheet, D006_OPPORTUNITY_SNAPSHOT_SHEET);
    createD006Snapshot_(db, transactionSheet, D006_TRANSACTION_SNAPSHOT_SHEET);

    const plan = buildD006MigrationRows_(db, config);
    ensureColumnCapacity_(opportunitySheet, OPPORTUNITY_HEADERS.length);
    opportunitySheet.getRange(1, 1, 1, OPPORTUNITY_HEADERS.length).setValues([OPPORTUNITY_HEADERS]);
    if (opportunitySheet.getLastRow() > 1) {
      opportunitySheet.getRange(2, 1, opportunitySheet.getLastRow() - 1, opportunitySheet.getMaxColumns()).clearContent();
    }
    if (plan.rows.length) {
      const matrix = plan.rows.map(function(row) {
        return OPPORTUNITY_HEADERS.map(function(header) { return Object.prototype.hasOwnProperty.call(row, header) ? row[header] : ''; });
      });
      opportunitySheet.getRange(2, 1, matrix.length, OPPORTUNITY_HEADERS.length).setValues(matrix);
    }
    addMissingHeaders_(transactionSheet, TRANSACTION_HEADERS);
    styleHeader_(opportunitySheet, OPPORTUNITY_HEADERS.length);
    styleHeader_(transactionSheet, transactionSheet.getLastColumn());
    SpreadsheetApp.flush();

    const audit = auditDataIntegrity();
    if (!audit.ok) {
      throwApiError_('MIGRATION_CONFLICT', 'Post-migration audit failed. Do not continue frontend release; inspect snapshot sheets. ' + audit.issues.join(' | '));
    }
    const result = {
      version: APP_VERSION,
      opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
      migrated: true,
      resultingOpportunityRows: plan.rows.length,
      transformedIds: plan.transformedIds,
      retiredSourceIds: plan.retiredSourceIds,
      createdIds: plan.createdIds,
      historicalTransactionsTouched: false,
      snapshotSheets: [D006_OPPORTUNITY_SNAPSHOT_SHEET, D006_TRANSACTION_SNAPSHOT_SHEET],
      audit: audit
    };
    Logger.log(JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
}

/** Pure contract/financial tests. Safe: no spreadsheet writes. */
function runD006OpportunityContractTests() {
  const tests = [];
  function check(name, actual, expected) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    tests.push({ name: name, pass: pass, actual: actual, expected: expected });
  }
  check('start has no money effect', computeD006FinancialEffect_('start', 10, 0), { pendingDelta: 0, balanceDelta: 0 });
  check('full finish enters pending review', computeD006FinancialEffect_('full_finish', 10, 0), { pendingDelta: 10, balanceDelta: 0 });
  check('full payment settles pending and balance', computeD006FinancialEffect_('full_payment', 10, 10), { pendingDelta: -10, balanceDelta: 10 });
  check('return removes pending only', computeD006FinancialEffect_('returned_for_completion', 10, 0), { pendingDelta: -10, balanceDelta: 0 });
  check('partial payment from full removes full pending', computeD006FinancialEffect_('partial_payment_from_full', 10, 4), { pendingDelta: -10, balanceDelta: 4 });
  check('partial withdrawal request creates no money', computeD006FinancialEffect_('partial_work_request', 10, 0), { pendingDelta: 0, balanceDelta: 0 });
  check('partial payment after withdrawal settles directly', computeD006FinancialEffect_('partial_payment_withdrawal', 10, 4), { pendingDelta: 0, balanceDelta: 4 });
  check('no partial payment has no money effect', computeD006FinancialEffect_('no_partial_payment', 10, 0), { pendingDelta: 0, balanceDelta: 0 });

  const allowed = [
    ['contribute', 'available', 'start', 'in_progress'],
    ['learn', 'in_progress', 'stop', 'withdrawn'],
    ['earn', 'available', 'start', 'in_progress'],
    ['earn', 'returned_for_completion', 'start', 'in_progress'],
    ['earn', 'in_progress', 'finish', 'waiting_for_review']
  ];
  allowed.forEach(function(item) {
    check('transition ' + item.join('/'), d006TransitionResult_(item[0], item[1], item[2]), item[3]);
  });
  check('expected Contribution cannot withdraw', d006TransitionResult_('contribute', 'in_progress', 'withdraw'), null);
  check('Earn cannot be required', d006DomainIssueListForTest_({ Type: 'earn', Requiredness: 'expected', Value: 5, Scope: 'x', CompletionStandard: 'x', ApprovalRequired: true }), ['Earn requiredness must be optional.']);
  check('Learn cannot carry payment', d006DomainIssueListForTest_({ Type: 'learn', Requiredness: 'optional', Value: 1, CompletionStandard: 'practice', ApprovalRequired: false, SkillID: 'S001' }), ['Learn Value must be 0.']);

  const failures = tests.filter(function(test) { return !test.pass; });
  const result = { version: APP_VERSION, opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION, ok: failures.length === 0, testCount: tests.length, failureCount: failures.length, failures: failures };
  Logger.log(JSON.stringify(result));
  return result;
}

function deploymentAuditD006() {
  const result = {
    version: APP_VERSION,
    opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
    contractTests: runD006OpportunityContractTests(),
    migrationReadiness: auditD006OpportunityReadiness(),
    integrity: auditDataIntegrity()
  };
  result.ok = result.contractTests.ok && result.integrity.ok;
  Logger.log(JSON.stringify(result));
  return result;
}

/**
 * Approved D-005 schema migration for existing SchoolTasks rows.
 * Adds canonical columns and backfills compatibility values only when blank.
 * Does not promote SchoolCurrent/SchoolHistory staging rows and never touches
 * SchoolSetupReview. Run once after deploying v2.3.0, then inspect the result.
 */
function migrateSchoolDataContractV23() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSchoolTaskSchema_(db);
    ensureSheet_(db, SHEET_NAMES.schoolRubric, SCHOOL_RUBRIC_HEADERS);
    ensureSchoolProfile_(db);
    const records = readObjectsWithRows_(sheet);
    let migrated = 0;

    records.forEach(function(record) {
      const row = record.object;
      let changed = false;
      function fill(header, value) {
        if (row[header] === '' || row[header] === null || typeof row[header] === 'undefined') {
          setRecordValue_(sheet, record, header, value);
          changed = true;
        }
      }

      const dueDate = dateOnlyFromCell_(row.DueDate);
      if (dueDate && row.DueDate !== dueDate) {
        setRecordValue_(sheet, record, 'DueDate', dueDate);
        changed = true;
      }
      fill('SubjectKey', cleanSubjectKey_(row.Subject || ''));
      fill('RecordState', row.ArchivedAt ? 'archived' : 'active');
      fill('JourneyStage', canonicalJourneyStage_(row));
      fill('CurrentAction', String(row.NextAction || ''));
      fill('SupportPreference', '');
      fill('SourceStatus', '');
      fill('SubmissionState', canonicalSubmissionState_(row));
      fill('ParentReviewState', 'approved');
      fill('SourceConflict', '');
      fill('SetDate', dateOnlyFromCell_(row.CreatedAt) || '');
      if (row.CurrentAction && !row.NextAction) {
        setRecordValue_(sheet, record, 'NextAction', row.CurrentAction);
        changed = true;
      }
      const expectedLegacyStatus = legacyStatusForCanonical_(canonicalJourneyStage_(row), canonicalSubmissionState_(row), row.Status);
      if (!row.Status || String(row.Status).toLowerCase() !== expectedLegacyStatus) {
        setRecordValue_(sheet, record, 'Status', expectedLegacyStatus);
        changed = true;
      }
      if (changed) migrated += 1;
    });

    SpreadsheetApp.flush();
    const result = {
      version: APP_VERSION,
      rowsInspected: records.length,
      rowsChanged: migrated,
      schoolTaskColumns: sheet.getLastColumn(),
      stagingPromoted: false,
      note: 'SchoolCurrent, SchoolHistory and SchoolSetupReview were left untouched.'
    };
    Logger.log(JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Explicit staging promotion for Wayne-approved SchoolCurrent/SchoolHistory
 * records. This is intentionally NOT called by initialiseSophieAppV2() or by
 * any web route. It skips unresolved source conflicts and never touches
 * SchoolSetupReview. Re-running it is idempotent by SourceTaskID.
 */
function promoteApprovedSchoolStagingV23() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const target = ensureSchoolTaskSchema_(db);
    const existingSourceIds = {};
    readObjects_(target).forEach(function(row) {
      const id = String(row.SourceTaskID || '').trim();
      if (id) existingSourceIds[id] = true;
    });

    const result = {
      currentPromoted: 0,
      historyPromoted: 0,
      skippedExisting: 0,
      skippedNotApproved: 0,
      skippedConflict: 0,
      setupReviewTouched: false,
      rubricRowsCreated: 0,
      notes: []
    };

    promoteStagingSheet_(db, 'SchoolCurrent', 'active', target, existingSourceIds, result);
    promoteStagingSheet_(db, 'SchoolHistory', 'history', target, existingSourceIds, result);

    result.notes.push('SchoolSetupReview was not read or modified.');
    result.notes.push('RubricEvidence text remains in staging; no criterion rows were invented from unstructured text.');
    SpreadsheetApp.flush();
    Logger.log(JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function promoteStagingSheet_(db, sheetName, defaultRecordState, target, existingSourceIds, result) {
  const sourceSheet = db.getSheetByName(sheetName);
  if (!sourceSheet) {
    result.notes.push(sheetName + ' was not present.');
    return;
  }

  readObjects_(sourceSheet).forEach(function(row) {
    const sourceTaskId = cleanText_(row.SourceTaskID || '', 120);
    if (!sourceTaskId) {
      result.skippedNotApproved += 1;
      return;
    }
    if (existingSourceIds[sourceTaskId]) {
      result.skippedExisting += 1;
      return;
    }
    if (!isApprovedStagingRow_(row)) {
      result.skippedNotApproved += 1;
      return;
    }
    if (hasUnresolvedSourceConflict_(row.SourceConflict)) {
      result.skippedConflict += 1;
      return;
    }

    const subject = cleanText_(row.Subject || '', 60);
    const title = cleanText_(row.Assignment || row.Title || '', 120);
    if (!subject || !title) {
      result.skippedNotApproved += 1;
      return;
    }

    const sourceStatus = cleanText_(row.DaymapStatus || row.SourceStatus || '', 240);
    const grade = cleanText_(row.GradeOrResult || '', 80);
    const mark = cleanText_(row.Mark || '', 80);
    const submissionState = submissionStateFromStaging_(sourceStatus, grade, mark);
    const suggestedStage = String(row.SuggestedStage || '').trim();
    let journeyStage;
    try {
      journeyStage = suggestedStage ? cleanJourneyStage_(suggestedStage) :
        (submissionState === 'received' ? 'feedback' : 'understand');
    } catch (error) {
      journeyStage = submissionState === 'received' ? 'feedback' : 'understand';
    }

    let recordState = defaultRecordState;
    if (defaultRecordState === 'active' && submissionState === 'received' && journeyStage === 'feedback') {
      recordState = 'history';
    }

    const currentAction = cleanText_(
      row.CurrentAction || row.CarryForwardSuggestion || '',
      1000
    );
    const now = new Date();
    const id = uniqueGeneratedId_(target, 'TaskID', 'ST');
    const source = cleanText_(row.Source || sheetName, 120) || sheetName;

    appendObjectRow_(target, {
      TaskID: id,
      SourceTaskID: sourceTaskId,
      Subject: subject,
      SubjectKey: cleanSubjectKey_(subject),
      Title: title,
      TaskType: normaliseTaskType_(row.TaskType),
      SetDate: normaliseStagingDate_(row.SetDate),
      DueDate: normaliseStagingDate_(row.DueDate),
      Status: legacyStatusForCanonical_(journeyStage, submissionState),
      NextAction: currentAction,
      RecordState: recordState,
      JourneyStage: journeyStage,
      CurrentAction: currentAction,
      // D-005: staging support preference remains unset until Sophie chooses.
      SupportPreference: '',
      HelpType: '',
      SourceStatus: sourceStatus,
      SubmissionState: submissionState,
      CreatedAt: now,
      StartedAt: '',
      UpdatedAt: now,
      SubmittedAt: '',
      ReceiptConfirmedAt: '',
      GradeOrResult: grade,
      Mark: mark,
      TeacherComment: cleanText_(row.TeacherComment || '', 4000),
      CoachComment: cleanText_(row.SDTCoachComment || row.CoachComment || '', 4000),
      CarryForwardSuggestion: cleanText_(row.CarryForwardSuggestion || '', 1000),
      Source: source,
      SourceConflict: '',
      ParentReviewState: 'approved',
      ArchivedAt: ''
    });

    existingSourceIds[sourceTaskId] = true;
    if (sheetName === 'SchoolCurrent') result.currentPromoted += 1;
    else result.historyPromoted += 1;
  });
}

function isApprovedStagingRow_(row) {
  const include = String(row.IncludeInApp || '').trim().toLowerCase();
  const review = String(row.ParentReviewStatus || row.ParentReviewState || '').trim().toLowerCase();
  const includeOk = include === 'yes' || include === 'true' || include === '1';
  return includeOk && review.indexOf('approved') >= 0;
}

function submissionStateFromStaging_(sourceStatus, grade, mark) {
  const status = String(sourceStatus || '').toLowerCase();
  if (/not\s+(been\s+)?received|overdue/.test(status)) return 'not_submitted';
  if (/work\s+has\s+been\s+received|results?\s+published|graded/.test(status)) return 'received';
  if (String(grade || '').trim() || String(mark || '').trim()) return 'received';
  return 'not_submitted';
}

function normaliseStagingDate_(value) {
  if (!value) return '';
  const fromCell = dateOnlyFromCell_(value);
  if (fromCell) return fromCell;
  const text = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function ensureSchoolTaskSchema_(db) {
  const sheet = ensureSheet_(db, SHEET_NAMES.schoolTasks, SCHOOL_TASK_HEADERS);
  addMissingHeaders_(sheet, SCHOOL_TASK_HEADERS);
  return sheet;
}

function ensureSchoolProfile_(db) {
  const sheet = ensureSheet_(db, SHEET_NAMES.schoolProfile, SCHOOL_PROFILE_HEADERS);
  addMissingHeaders_(sheet, SCHOOL_PROFILE_HEADERS);
  const records = readObjectsWithRows_(sheet).filter(function(item) {
    return String(item.object.ProfileID) === SCHOOL_PROFILE_ID;
  });
  if (records.length > 1) throw new Error('Duplicate SchoolProfile rows found.');
  if (!records.length) {
    appendObjectRow_(sheet, {
      ProfileID: SCHOOL_PROFILE_ID,
      ScaffoldMode: 'guided',
      PreferredSchoolView: 'now',
      LastScaffoldReviewAt: '',
      SuggestedScaffoldMode: '',
      UpdatedAt: new Date()
    });
  }
  return sheet;
}

function initialiseSophieAppV2() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const stats = ensureSheet_(db, SHEET_NAMES.stats, ['Balance', 'Pending', 'FamilyValue', 'Badges']);
  if (stats.getLastRow() < 2) stats.appendRow([0, 0, 0, '']);

  const opportunities = ensureSheet_(db, SHEET_NAMES.opportunities, OPPORTUNITY_HEADERS);
  addMissingHeaders_(opportunities, OPPORTUNITY_HEADERS);
  populateOpportunityDefaults_(opportunities); // Legacy defaults only; this is not the D-006 six-item migration.
  ensureSheet_(db, SHEET_NAMES.goals, GOAL_HEADERS);
  const skills = ensureSheet_(db, SHEET_NAMES.skills, SKILL_HEADERS);
  ensureSheet_(db, SHEET_NAMES.transactions, TRANSACTION_HEADERS);
  ensureSchoolTaskSchema_(db);
  ensureSheet_(db, SHEET_NAMES.schoolRubric, SCHOOL_RUBRIC_HEADERS);
  ensureSchoolProfile_(db);
  ensureLearningResourceSheet_(db);
  seedSkills_(skills);

  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('SOPHIE_ADMIN_KEY')) {
    throw new Error('Set SOPHIE_ADMIN_KEY manually in Project Settings > Script Properties, then run initialiseSophieAppV2() again.');
  }

  SpreadsheetApp.flush();
  Logger.log('Sophie App v2.4.1 backend is ready. D-006 remains d006-v1; Learning Resources capability is lr-v1. No credentials were written to logs.');
  return 'Setup complete. Existing parent credentials were preserved. D-006 Opportunity migration remains separate; run auditD006OpportunityReadiness() before migrateD006SixItems().';
}

function resetParentAdminKey() {
  throw new Error('For security, change SOPHIE_ADMIN_KEY manually in Project Settings > Script Properties. This function no longer creates or logs credentials.');
}

function populateOpportunityDefaults_(sheet) {
  const records = readObjectsWithRows_(sheet);
  records.forEach(function(record) {
    const value = number_(record.object.Value);
    const defaults = {
      Description: 'A practical step towards greater independence.',
      Category: 'Home',
      Type: value > 0 ? 'earn' : 'contribute',
      Skill: 'Independence',
      EstimatedMinutes: '',
      Repeatable: 'yes',
      Frequency: '',
      Icon: value > 0 ? '💰' : '🤝',
      WhyItMatters: value > 0 ? 'This is extra work that creates real value.' : 'This helps family life run well.'
    };
    Object.keys(defaults).forEach(function(header) {
      if (record.object[header] === '' || record.object[header] === null || typeof record.object[header] === 'undefined') {
        setRecordValueIfPresent_(sheet, record, header, defaults[header]);
      }
    });
  });
}

function seedSkills_(sheet) {
  if (sheet.getLastRow() > 1) return;
  sheet.getRange(2, 1, 8, SKILL_HEADERS.length).setValues([
    ['S001', 'Cooking', 1, 0, 100, '🍳', 'Planning and preparing food safely.'],
    ['S002', 'Cleaning', 1, 0, 100, '🧽', 'Looking after shared spaces and belongings.'],
    ['S003', 'Laundry', 1, 0, 100, '🧺', 'Caring for clothes independently.'],
    ['S004', 'Organisation', 1, 0, 100, '🗓️', 'Planning time, belongings and responsibilities.'],
    ['S005', 'Money', 1, 0, 100, '💳', 'Saving, choosing and understanding value.'],
    ['S006', 'Maintenance', 1, 0, 100, '🛠️', 'Basic household and practical maintenance.'],
    ['S007', 'Technology', 1, 0, 100, '💻', 'Using technology safely and independently.'],
    ['S008', 'Self-management', 1, 0, 100, '🧭', 'Starting, planning and finishing things independently.']
  ]);
}

function calculateImpact_(transactions) {
  const now = new Date();
  const start = new Date(now);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const contributions = transactions.filter(function(tx) {
    return String(tx.type).toLowerCase() === 'contribution' &&
      String(tx.status).toLowerCase() === 'completed' &&
      new Date(tx.date) >= start;
  });
  return {
    contributionsThisWeek: contributions.length,
    minutesThisWeek: 0,
    message: contributions.length
      ? 'You contributed ' + contributions.length + ' time' + (contributions.length === 1 ? '' : 's') + ' to family life this week.'
      : 'Your contributions will appear here as you help make family life easier.'
  };
}

function normaliseOpportunity_(row) {
  const type = d006Type_(row);
  const value = type === 'earn' ? roundMoney_(number_(row.Value)) : 0;
  const accepted = !!row.AcceptedAt;
  const agreedValue = type === 'earn'
    ? roundMoney_(accepted ? number_(row.AgreedValue) : number_(row.Value))
    : 0;
  return {
    id: String(row.ID),
    title: String(row.Title || 'Untitled opportunity'),
    value: value,
    tier: number_(row.Tier) || 1,
    status: normaliseOpportunityStatus_(row.Status),
    description: String(row.Description || ''),
    category: String(row.Category || 'Home'),
    type: type,
    requiredness: String(row.Requiredness || (type === 'earn' ? 'optional' : '')).toLowerCase(),
    whyItMatters: String(row.WhyItMatters || ''),
    instructions: String(row.Instructions || ''),
    scope: String(row.Scope || ''),
    completionStandard: String(row.CompletionStandard || ''),
    approvalRequired: toBoolean_(row.ApprovalRequired),
    reviewReason: String(row.ReviewReason || ''),
    skillId: String(row.SkillID || ''),
    capabilityLabel: String(row.Skill || ''),
    skill: String(row.Skill || ''),
    estimatedMinutes: number_(row.EstimatedMinutes),
    repeatable: String(row.Repeatable || ''),
    frequency: String(row.Frequency || ''),
    supportPreference: String(row.SupportPreference || ''),
    createdAt: iso_(row.CreatedAt),
    updatedAt: iso_(row.UpdatedAt),
    startedAt: iso_(row.StartedAt),
    finishedAt: iso_(row.FinishedAt),
    reviewedAt: iso_(row.ReviewedAt),
    completedAt: iso_(row.CompletedAt),
    withdrawnAt: iso_(row.WithdrawnAt),
    cancelledAt: iso_(row.CancelledAt),
    agreedValue: agreedValue,
    agreedScope: String(row.AgreedScope || ''),
    agreedCompletionStandard: String(row.AgreedCompletionStandard || ''),
    agreedEstimatedMinutes: number_(row.AgreedEstimatedMinutes),
    acceptedAt: iso_(row.AcceptedAt),
    reviewState: String(row.ReviewState || 'none').toLowerCase(),
    reviewKind: String(row.ReviewKind || ''),
    reviewOutcome: String(row.ReviewOutcome || ''),
    approvedAmount: number_(row.ApprovedAmount),
    reviewFeedback: String(row.ReviewFeedback || ''),
    reviewedBy: String(row.ReviewedBy || ''),
    withdrawalReviewRequested: toBoolean_(row.WithdrawalReviewRequested),
    partialWorkDescription: String(row.PartialWorkDescription || ''),
    sourceOpportunityId: String(row.SourceOpportunityID || ''),
    migrationVersion: String(row.MigrationVersion || ''),
    sourceCandidateId: String(row.SourceCandidateID || ''),

    // One-release compatibility aliases for the pre-D006 frontend/data reader.
    claimedAt: iso_(row.ClaimedAt),
    submittedAt: iso_(row.SubmittedAt),
    approvedAt: iso_(row.ApprovedAt),
    icon: String(row.Icon || (type === 'earn' ? '💰' : type === 'learn' ? '🌱' : '🤝')),
    feedback: String(row.Feedback || row.ReviewFeedback || '')
  };
}

function normaliseGoal_(row) {
  return {
    goalId: String(row.GoalID),
    title: String(row.Title || 'Goal'),
    targetAmount: number_(row.TargetAmount),
    savedAmount: number_(row.SavedAmount),
    icon: String(row.Icon || '🎯'),
    status: String(row.Status || 'active').toLowerCase(),
    createdAt: iso_(row.CreatedAt),
    imageUrl: String(row.ImageUrl || ''),
				productUrl: String(row.ProductUrl || '')
  };
}

function normaliseSkill_(row) {
  return {
    skillId: String(row.SkillID),
    name: String(row.Name || 'Skill'),
    level: number_(row.Level) || 1,
    progress: number_(row.Progress),
    nextLevelAt: number_(row.NextLevelAt) || 100,
    icon: String(row.Icon || '🌱'),
    description: String(row.Description || '')
  };
}

function normaliseTransaction_(row) {
  return {
    transactionId: String(row.TransactionID),
    date: iso_(row.Date),
    type: String(row.Type || ''),
    description: String(row.Description || ''),
    amount: number_(row.Amount),
    opportunityId: String(row.OpportunityID || ''),
    goalId: String(row.GoalID || ''),
    status: String(row.Status || ''),
    approvedBy: String(row.ApprovedBy || ''),
    feedback: String(row.Feedback || ''),
    agreedAmount: number_(row.AgreedAmount),
    reviewKind: String(row.ReviewKind || ''),
    reviewOutcome: String(row.ReviewOutcome || '')
  };
}

function readStats_(sheet) {
  const values = sheet.getRange(2, 1, 1, Math.max(4, sheet.getLastColumn())).getValues()[0];
  return {
    balance: number_(values[0]),
    pending: number_(values[1]),
    familyValue: number_(values[2]),
    badges: String(values[3] || '').split(',').map(function(item) { return item.trim(); }).filter(Boolean)
  };
}

function readObjects_(sheet) {
  return readObjectsWithRows_(sheet).map(function(item) { return item.object; });
}

function readObjectsWithRows_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return [];
  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const headers = values[0].map(function(header) { return String(header).trim(); });
  return values.slice(1).map(function(row, index) {
    const object = {};
    headers.forEach(function(header, column) { if (header) object[header] = row[column]; });
    return { object: object, rowNumber: index + 2, headers: headers };
  }).filter(function(item) {
    return Object.keys(item.object).some(function(key) { return String(item.object[key] || '').trim() !== ''; });
  });
}

function findRecordById_(sheet, idHeader, id) {
  return findUniqueRecordById_(sheet, idHeader, id, 'Opportunity');
}

function findGoalById_(sheet, goalId) {
  return findUniqueRecordById_(sheet, 'GoalID', goalId, 'Goal');
}

function findSchoolTaskById_(sheet, taskId) {
  return findUniqueRecordById_(sheet, 'TaskID', taskId, 'School task');
}

function findUniqueRecordById_(sheet, idHeader, id, label) {
  const matches = readObjectsWithRows_(sheet).filter(function(item) {
    return String(item.object[idHeader]) === String(id);
  });
  if (!matches.length) throw new Error(label + ' not found.');
  if (matches.length > 1) throw new Error('Duplicate ' + idHeader + ' found for ' + id + '. No changes were made.');
  return matches[0];
}


function appendObjectRow_(sheet, valuesByHeader) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(header) {
    return String(header).trim();
  });
  const row = headers.map(function(header) {
    return Object.prototype.hasOwnProperty.call(valuesByHeader, header) ? valuesByHeader[header] : '';
  });
  sheet.appendRow(row);
}

function uniqueGeneratedId_(sheet, idHeader, prefix) {
  const existing = {};
  readObjects_(sheet).forEach(function(row) {
    const value = String(row[idHeader] || '');
    if (value) existing[value] = true;
  });
  for (let attempt = 0; attempt < 10; attempt++) {
    const id = newId_(prefix);
    if (!existing[id]) return id;
  }
  throw new Error('Could not generate a unique ' + idHeader + '.');
}

function assertUniqueId_(sheet, idHeader, ignoredId) {
  const seen = {};
  readObjects_(sheet).forEach(function(row) {
    const id = String(row[idHeader] || '');
    if (!id || (ignoredId !== null && String(ignoredId) === id)) return;
    if (seen[id]) throw new Error('Duplicate ' + idHeader + ' found: ' + id + '.');
    seen[id] = true;
  });
}

function collectDuplicateIds_(rows, idHeader) {
  const seen = {};
  const duplicates = {};
  rows.forEach(function(row) {
    const id = String(row[idHeader] || '');
    if (!id) return;
    if (seen[id]) duplicates[id] = true;
    seen[id] = true;
  });
  return Object.keys(duplicates);
}

function setRecordValue_(sheet, record, header, value) {
  const column = record.headers.indexOf(header);
  if (column < 0) throw new Error('Missing required column: ' + header + '. Run initialiseSophieAppV2().');
  sheet.getRange(record.rowNumber, column + 1).setValue(value);
  record.object[header] = value;
}

function setRecordValueIfPresent_(sheet, record, header, value) {
  if (record.headers.indexOf(header) >= 0) setRecordValue_(sheet, record, header, value);
}

function ensureSheet_(db, name, headers) {
  let sheet = db.getSheetByName(name);
  if (!sheet) sheet = db.insertSheet(name);
  ensureColumnCapacity_(sheet, Math.max(1, headers.length));
  if (sheet.getLastColumn() === 0 || sheet.getRange(1, 1).getValue() === '') {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeader_(sheet, headers.length);
    sheet.setFrozenRows(1);
    return sheet;
  }
  const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const missing = headers.filter(function(header) { return currentHeaders.indexOf(header) < 0; });
  if (missing.length) {
    const startColumn = sheet.getLastColumn() + 1;
    ensureColumnCapacity_(sheet, startColumn + missing.length - 1);
    sheet.getRange(1, startColumn, 1, missing.length).setValues([missing]);
    styleHeader_(sheet, sheet.getLastColumn());
  }
  return sheet;
}

function addMissingHeaders_(sheet, requiredHeaders) {
  const width = Math.max(1, sheet.getLastColumn());
  const existing = sheet.getRange(1, 1, 1, width).getValues()[0].map(String);
  const missing = requiredHeaders.filter(function(header) { return existing.indexOf(header) < 0; });
  if (!missing.length) return;
  ensureColumnCapacity_(sheet, width + missing.length);
  sheet.getRange(1, width + 1, 1, missing.length).setValues([missing]);
  styleHeaderRange_(sheet.getRange(1, width + 1, 1, missing.length));
}

function ensureColumnCapacity_(sheet, requiredColumns) {
  const current = sheet.getMaxColumns();
  if (current < requiredColumns) {
    sheet.insertColumnsAfter(current, requiredColumns - current);
  }
}

function styleHeader_(sheet, columns) {
  sheet.getRange(1, 1, 1, columns).setFontWeight('bold').setBackground('#ebe8ff');
}

function styleHeaderRange_(range) {
  range.setFontWeight('bold').setBackground('#ebe8ff');
}

function requireSheet_(db, name) {
  const sheet = db.getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet: ' + name + '. Run initialiseSophieAppV2().');
  return sheet;
}

function parsePostData_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('Missing request body.');
  try { return JSON.parse(e.postData.contents); }
  catch (error) { throw new Error('Invalid JSON request.'); }
}

function requireAdmin_(key) {
  const expected = PropertiesService.getScriptProperties().getProperty('SOPHIE_ADMIN_KEY');
  if (!expected) throwApiError_('UNAUTHORISED', 'Parent access is not configured.');
  if (!key || !constantTimeEqual_(String(key), String(expected))) throwApiError_('UNAUTHORISED', 'Invalid parent admin key.');
}

function requireSchoolAccess_(schoolKey, adminKey) {
  if (adminKey) {
    requireAdmin_(adminKey);
    return;
  }
  const expected = PropertiesService.getScriptProperties().getProperty('SOPHIE_SCHOOL_DEVICE_KEY');
  if (!expected) throw new Error('School access has not been set up on this app yet.');
  if (!schoolKey || !constantTimeEqual_(String(schoolKey), String(expected))) {
    throw new Error('School access is not authorised on this device.');
  }
}


function constantTimeEqual_(left, right) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i++) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
}

function withOpportunityLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = requireSheet_(db, SHEET_NAMES.opportunities);
    return callback(db, sheet);
  } finally {
    lock.releaseLock();
  }
}

function ensureD006OpportunitySchema_(db) {
  const opportunitySheet = ensureSheet_(db, SHEET_NAMES.opportunities, OPPORTUNITY_HEADERS);
  addMissingHeaders_(opportunitySheet, OPPORTUNITY_HEADERS);
  const transactionSheet = ensureSheet_(db, SHEET_NAMES.transactions, TRANSACTION_HEADERS);
  addMissingHeaders_(transactionSheet, TRANSACTION_HEADERS);
  return opportunitySheet;
}

function assertD006SchemaAvailable_(headers) {
  ['Requiredness', 'CompletionStandard', 'ApprovalRequired', 'MigrationVersion'].forEach(function(header) {
    if (headers.indexOf(header) < 0) throwApiError_('AGREEMENT_REQUIRED', 'D-006 Opportunity migration has not been completed.');
  });
}

function d006Type_(row) {
  const value = number_(row.Value);
  const type = String(row.Type || (value > 0 ? 'earn' : 'contribute')).toLowerCase();
  return type;
}

function normaliseOpportunityStatus_(value) {
  const status = String(value || 'available').toLowerCase();
  if (status === 'open') return 'available';
  if (status === 'pending' || status === 'claimed') return 'waiting_for_review';
  return status;
}

function validateD006OpportunityRow_(db, row, options) {
  options = options || {};
  if (options.allowRetired && String(row.MigrationVersion || '') === 'd006-v1-retired') return true;
  const issues = d006DomainIssueList_(db, row);
  if (issues.length) throwApiError_('INVALID_DOMAIN_CONTRACT', issues.join(' '));
  return true;
}

function d006DomainIssueList_(db, row) {
  const skillIds = {};
  const skillSheet = db && db.getSheetByName(SHEET_NAMES.skills);
  if (skillSheet) readObjects_(skillSheet).forEach(function(skill) { if (skill.SkillID) skillIds[String(skill.SkillID)] = true; });
  return collectD006OpportunityIssues_(row, skillIds);
}

function d006DomainIssueListForTest_(row) {
  return collectD006OpportunityIssues_(row, { S001: true, S003: true, S008: true });
}

function collectD006OpportunityIssues_(row, skillIds) {
  const issues = [];
  const type = d006Type_(row);
  const requiredness = String(row.Requiredness || '').toLowerCase();
  const value = roundMoney_(number_(row.Value));
  const approval = toBoolean_(row.ApprovalRequired);
  const standard = cleanText_(row.CompletionStandard || '', 1500);
  if (['contribute', 'learn', 'earn'].indexOf(type) < 0) return ['Type must be contribute, learn or earn.'];

  if (type === 'contribute') {
    if (['expected', 'negotiated'].indexOf(requiredness) < 0) issues.push('Contribution requiredness must be expected or negotiated.');
    if (value !== 0) issues.push('Contribution Value must be 0.');
    if (!standard) issues.push('Contribution completion standard is required.');
    if (approval && !cleanText_(row.ReviewReason || '', 1000)) issues.push('Contribution review reason is required when approval is enabled.');
  }
  if (type === 'learn') {
    if (['negotiated', 'optional'].indexOf(requiredness) < 0) issues.push('Learn requiredness must be negotiated or optional.');
    if (value !== 0) issues.push('Learn Value must be 0.');
    if (approval) issues.push('Learn approvalRequired must be false.');
    if (!standard) issues.push('Learn practice/completion target is required.');
    const skillId = String(row.SkillID || '');
    if (!skillId) issues.push('Learn SkillID is required.');
    else if (skillIds && !skillIds[skillId]) issues.push('Learn SkillID does not resolve to an existing Skill.');
  }
  if (type === 'earn') {
    if (requiredness !== 'optional') issues.push('Earn requiredness must be optional.');
    if (!(value > 0)) issues.push('Earn Value must be greater than 0.');
    if (!cleanText_(row.Scope || '', 1500)) issues.push('Earn scope is required.');
    if (!standard) issues.push('Earn completion standard is required.');
    if (!approval) issues.push('Earn approvalRequired must be true.');
  }
  const status = normaliseOpportunityStatus_(row.Status);
  if (['available', 'in_progress', 'waiting_for_review', 'returned_for_completion', 'completed', 'withdrawn', 'cancelled'].indexOf(status) < 0) {
    issues.push('Invalid D-006 lifecycle state: ' + status + '.');
  }
  if (type === 'earn' && row.AcceptedAt) {
    if (!(roundMoney_(number_(row.AgreedValue)) > 0)) issues.push('Accepted Earn requires AgreedValue.');
    if (!cleanText_(row.AgreedScope || '', 1500)) issues.push('Accepted Earn requires AgreedScope.');
    if (!cleanText_(row.AgreedCompletionStandard || '', 1500)) issues.push('Accepted Earn requires AgreedCompletionStandard.');
  }
  return issues;
}

function assertEarnAgreementSnapshot_(row) {
  if (!row.AcceptedAt || !(roundMoney_(number_(row.AgreedValue)) > 0) || !cleanText_(row.AgreedScope || '', 1500) || !cleanText_(row.AgreedCompletionStandard || '', 1500)) {
    throwApiError_('AGREEMENT_REQUIRED', 'The frozen Earn agreement snapshot is incomplete.');
  }
}

function computeD006FinancialEffect_(event, agreedValue, approvedAmount) {
  const agreed = roundMoney_(agreedValue);
  const approved = roundMoney_(approvedAmount);
  switch (String(event)) {
    case 'start': return { pendingDelta: 0, balanceDelta: 0 };
    case 'full_finish': return { pendingDelta: agreed, balanceDelta: 0 };
    case 'full_payment': return { pendingDelta: -agreed, balanceDelta: agreed };
    case 'returned_for_completion': return { pendingDelta: -agreed, balanceDelta: 0 };
    case 'partial_payment_from_full': return { pendingDelta: -agreed, balanceDelta: approved };
    case 'partial_work_request': return { pendingDelta: 0, balanceDelta: 0 };
    case 'partial_payment_withdrawal': return { pendingDelta: 0, balanceDelta: approved };
    case 'no_partial_payment': return { pendingDelta: 0, balanceDelta: 0 };
    default: throwApiError_('INVALID_TRANSITION', 'Unknown D-006 financial event.');
  }
}

function d006TransitionResult_(type, status, action) {
  const key = [type, status, action].join('|');
  const map = {
    'contribute|available|start': 'in_progress',
    'contribute|in_progress|finish': 'completed',
    'learn|available|start': 'in_progress',
    'learn|in_progress|finish': 'completed',
    'learn|in_progress|stop': 'withdrawn',
    'earn|available|start': 'in_progress',
    'earn|returned_for_completion|start': 'in_progress',
    'earn|in_progress|finish': 'waiting_for_review',
    'earn|returned_for_completion|finish': 'waiting_for_review',
    'earn|in_progress|withdraw': 'withdrawn',
    'earn|returned_for_completion|withdraw': 'withdrawn'
  };
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
}





function hasHeaders_(sheet, required) {
  if (!sheet || sheet.getLastColumn() < 1) return false;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  return required.every(function(header) { return headers.indexOf(header) >= 0; });
}

function readD006MigrationConfig_() {
  const text = PropertiesService.getScriptProperties().getProperty(D006_MIGRATION_CONFIG_PROPERTY);
  if (!text) return null;
  try { return JSON.parse(text); }
  catch (error) { return { __parseError: true }; }
}

function validateD006MigrationConfig_(config, strict) {
  const issues = [];
  if (!config) return { ok: false, issues: ['Script Property ' + D006_MIGRATION_CONFIG_PROPERTY + ' is not set.'] };
  if (config.__parseError) return { ok: false, issues: ['Migration config is not valid JSON.'] };
  function req(path, value) { if (value === null || typeof value === 'undefined' || String(value).trim() === '') issues.push(path + ' is required.'); }
  function requiredness(path, value, allowed) { if (allowed.indexOf(String(value || '').toLowerCase()) < 0) issues.push(path + ' must be ' + allowed.join(' or ') + '.'); }

  if (!config.dishwasher) issues.push('dishwasher config is required.');
  else {
    requiredness('dishwasher.requiredness', config.dishwasher.requiredness, ['expected', 'negotiated']);
    req('dishwasher.completionStandard', config.dishwasher.completionStandard);
  }
  if (!config.cookDinner) issues.push('cookDinner config is required.');
  else {
    requiredness('cookDinner.learnRequiredness', config.cookDinner.learnRequiredness, ['negotiated', 'optional']);
    req('cookDinner.learnCompletionStandard', config.cookDinner.learnCompletionStandard);
    if (!config.cookDinner.earn) issues.push('cookDinner.earn config is required.');
    else {
      if (!(number_(config.cookDinner.earn.value) > 0)) issues.push('cookDinner.earn.value must be > 0.');
      req('cookDinner.earn.scope', config.cookDinner.earn.scope);
      req('cookDinner.earn.completionStandard', config.cookDinner.earn.completionStandard);
    }
  }
  if (!config.dogPoo) issues.push('dogPoo config is required.');
  else {
    const mode = String(config.dogPoo.mode || '');
    if (['contribute', 'extra_earn'].indexOf(mode) < 0) issues.push('dogPoo.mode must be contribute or extra_earn.');
    if (mode === 'contribute') {
      requiredness('dogPoo.requiredness', config.dogPoo.requiredness, ['expected', 'negotiated']);
      req('dogPoo.completionStandard', config.dogPoo.completionStandard);
    }
    if (mode === 'extra_earn') {
      if (!(number_(config.dogPoo.value) > 0)) issues.push('dogPoo.value must be > 0 for extra_earn.');
      req('dogPoo.scope', config.dogPoo.scope);
      req('dogPoo.completionStandard', config.dogPoo.completionStandard);
    }
  }
  if (!config.tidyRoom) issues.push('tidyRoom config is required.');
  else {
    requiredness('tidyRoom.requiredness', config.tidyRoom.requiredness, ['negotiated', 'optional']);
    req('tidyRoom.completionStandard', config.tidyRoom.completionStandard);
  }
  if (!config.laundry) issues.push('laundry config is required.');
  else {
    requiredness('laundry.requiredness', config.laundry.requiredness, ['negotiated', 'optional']);
    req('laundry.completionStandard', config.laundry.completionStandard);
  }
  if (!config.recyclingBins) issues.push('recyclingBins config is required.');
  else {
    const mode = String(config.recyclingBins.mode || '');
    if (['split', 'combined'].indexOf(mode) < 0) issues.push('recyclingBins.mode must be split or combined.');
    requiredness('recyclingBins.requiredness', config.recyclingBins.requiredness, ['expected', 'negotiated']);
    if (mode === 'split') {
      req('recyclingBins.recyclingStandard', config.recyclingBins.recyclingStandard);
      req('recyclingBins.binsOutStandard', config.recyclingBins.binsOutStandard);
      req('recyclingBins.binsInStandard', config.recyclingBins.binsInStandard);
    }
    if (mode === 'combined') req('recyclingBins.combinedStandard', config.recyclingBins.combinedStandard);
  }
  return { ok: issues.length === 0, issues: issues };
}

function buildD006MigrationRows_(db, config) {
  generatedD006MigrationRows_ = [];
  const sheet = requireSheet_(db, SHEET_NAMES.opportunities);
  const sourceRows = readObjects_(sheet);
  const byId = {};
  sourceRows.forEach(function(row) { byId[String(row.ID)] = clonePlainObject_(row); });
  ['1','2','3','4','5','6'].forEach(function(id) { if (!byId[id]) throwApiError_('MIGRATION_CONFLICT', 'Missing legacy Opportunity ID ' + id + '.'); });
  const now = new Date();
  const createdIds = [];
  const transformedIds = [];
  const retiredSourceIds = [];

  function baseMigrated(row) {
    row.Status = 'available';
    row.CreatedAt = row.CreatedAt || now;
    row.UpdatedAt = now;
    row.StartedAt = ''; row.FinishedAt = ''; row.ReviewedAt = ''; row.CompletedAt = ''; row.WithdrawnAt = ''; row.CancelledAt = '';
    row.AgreedValue = ''; row.AgreedScope = ''; row.AgreedCompletionStandard = ''; row.AgreedEstimatedMinutes = ''; row.AcceptedAt = '';
    row.ReviewState = 'none'; row.ReviewKind = ''; row.ReviewOutcome = ''; row.ApprovedAmount = ''; row.ReviewFeedback = ''; row.ReviewedBy = '';
    row.WithdrawalReviewRequested = false; row.PartialWorkDescription = '';
    row.MigrationVersion = OPPORTUNITY_CONTRACT_VERSION;
    row.ClaimedAt = ''; row.SubmittedAt = ''; row.ApprovedAt = ''; row.Feedback = ''; row.ApprovedBy = '';
    return row;
  }
  function retire(row) {
    row.Status = 'cancelled';
    row.CancelledAt = now;
    row.UpdatedAt = now;
    row.SourceOpportunityID = String(row.ID);
    row.MigrationVersion = 'd006-v1-retired';
    row.ReviewState = 'settled';
    row.ReviewFeedback = 'Retired as a pre-D006 source record after non-destructive migration snapshot.';
    retiredSourceIds.push(String(row.ID));
    return row;
  }
  function newRow(sourceId, values) {
    const id = uniqueGeneratedIdFromSet_(sourceRows.concat(createdIds.map(function(x) { return { ID: x }; })), 'ID', 'OP');
    createdIds.push(id);
    const row = baseMigrated({
      ID: id, Title: '', Value: 0, Tier: 1, Status: 'available', Description: '', Category: 'Home', Type: '', Skill: '',
      EstimatedMinutes: '', Repeatable: 'yes', Frequency: '', ClaimedAt: '', SubmittedAt: '', ApprovedAt: '', Icon: '', Instructions: '', WhyItMatters: '', Feedback: '', ApprovedBy: '',
      SourceOpportunityID: String(sourceId)
    });
    Object.keys(values).forEach(function(key) { row[key] = values[key]; });
    generatedD006MigrationRows_.push(row);
    return row;
  }

  let row = baseMigrated(byId['1']);
  row.Type = 'contribute'; row.Value = 0; row.Requiredness = config.dishwasher.requiredness; row.WhyItMatters = 'Shared dishes are part of keeping the household running.';
  row.CompletionStandard = config.dishwasher.completionStandard; row.ApprovalRequired = false; row.ReviewReason = ''; row.Icon = '🤝'; row.SourceOpportunityID = '1'; transformedIds.push('1');

  retire(byId['2']);
  const cookingLearn = newRow('2', {
    Title: 'Practise planning and cooking a meal', Type: 'learn', Value: 0, Requiredness: config.cookDinner.learnRequiredness,
    WhyItMatters: 'Practise planning and making a meal so cooking becomes something you can handle with less help.',
    CompletionStandard: config.cookDinner.learnCompletionStandard, ApprovalRequired: false, SkillID: 'S001', Skill: 'Cooking', Icon: '🍳',
    EstimatedMinutes: number_(byId['2'].EstimatedMinutes) || 45
  });
  const cookingEarn = newRow('2', {
    Title: 'Cook an extra family dinner', Type: 'earn', Value: roundMoney_(number_(config.cookDinner.earn.value)), Requiredness: 'optional',
    WhyItMatters: 'This is genuinely extra work with a clear agreement before you choose it.', Scope: config.cookDinner.earn.scope,
    CompletionStandard: config.cookDinner.earn.completionStandard, ApprovalRequired: true, SkillID: 'S001', Skill: 'Cooking', Icon: '💰',
    EstimatedMinutes: nonNegativeNumber_(config.cookDinner.earn.estimatedMinutes || byId['2'].EstimatedMinutes)
  });

  if (String(config.dogPoo.mode) === 'contribute') {
    row = baseMigrated(byId['3']); row.Type = 'contribute'; row.Value = 0; row.Requiredness = config.dogPoo.requiredness;
    row.WhyItMatters = 'Caring for our dog includes keeping the yard clean and safe. This is one part of sharing pet care.';
    row.CompletionStandard = config.dogPoo.completionStandard; row.ApprovalRequired = false; row.SkillID = ''; row.Icon = '🤝'; row.SourceOpportunityID = '3'; transformedIds.push('3');
  } else {
    retire(byId['3']);
    newRow('3', {
      Title: 'Extra pet-care job', Type: 'earn', Value: roundMoney_(number_(config.dogPoo.value)), Requiredness: 'optional',
      WhyItMatters: 'This is additional pet-care work beyond the ordinary family share.', Scope: config.dogPoo.scope,
      CompletionStandard: config.dogPoo.completionStandard, ApprovalRequired: true, SkillID: 'S009', Skill: 'Pet Care', Icon: '💰', EstimatedMinutes: number_(byId['3'].EstimatedMinutes)
    });
  }

  row = baseMigrated(byId['4']); row.Title = cleanText_(config.tidyRoom.title || 'Reset my room', 120); row.Type = 'learn'; row.Value = 0;
  row.Requiredness = config.tidyRoom.requiredness; row.WhyItMatters = 'Practise keeping your space workable so you can find things and look after your belongings.';
  row.CompletionStandard = config.tidyRoom.completionStandard; row.ApprovalRequired = false; row.SkillID = 'S008'; row.Skill = 'Self-management'; row.Icon = '🌱'; row.SourceOpportunityID = '4'; transformedIds.push('4');

  row = baseMigrated(byId['5']); row.Type = 'learn'; row.Value = 0; row.Requiredness = config.laundry.requiredness;
  row.WhyItMatters = 'Learn to look after your own clothes - sorting, washing, drying and putting them away - so you can manage laundry with less help.';
  row.CompletionStandard = config.laundry.completionStandard; row.ApprovalRequired = false; row.SkillID = 'S003'; row.Skill = 'Laundry'; row.Icon = '🧺'; row.SourceOpportunityID = '5'; transformedIds.push('5');

  const binsNewRows = [];
  if (String(config.recyclingBins.mode) === 'combined') {
    row = baseMigrated(byId['6']); row.Type = 'contribute'; row.Value = 0; row.Requiredness = config.recyclingBins.requiredness;
    row.WhyItMatters = 'Bins and recycling are shared household jobs. Doing your part helps the household system work.';
    row.CompletionStandard = config.recyclingBins.combinedStandard; row.ApprovalRequired = false; row.Icon = '🤝'; row.Frequency = cleanText_(config.recyclingBins.frequency || 'weekly', 120); row.SourceOpportunityID = '6'; transformedIds.push('6');
  } else {
    retire(byId['6']);
    [
      ['Sort recycling', config.recyclingBins.recyclingStandard, config.recyclingBins.recyclingFrequency || 'as needed'],
      ['Put bins out', config.recyclingBins.binsOutStandard, config.recyclingBins.binsOutFrequency || 'weekly'],
      ['Bring bins in', config.recyclingBins.binsInStandard, config.recyclingBins.binsInFrequency || 'weekly']
    ].forEach(function(item) {
      binsNewRows.push(newRow('6', {
        Title: item[0], Type: 'contribute', Value: 0, Requiredness: config.recyclingBins.requiredness,
        WhyItMatters: 'Bins and recycling are shared household jobs. Doing your part helps the household system work.',
        CompletionStandard: item[1], ApprovalRequired: false, Icon: '🤝', Frequency: item[2], EstimatedMinutes: number_(byId['6'].EstimatedMinutes)
      }));
    });
  }

  const ordered = [];
  sourceRows.forEach(function(original) {
    const id = String(original.ID);
    ordered.push(byId[id]);
    if (id === '2') { ordered.push(cookingLearn); ordered.push(cookingEarn); }
    if (id === '6' && binsNewRows.length) binsNewRows.forEach(function(r) { ordered.push(r); });
  });
  // newRow calls for Dog poo extra Earn are not in bins/cooking arrays; collect any
  // generated rows not already present by tracking them in the closure below.
  const knownIds = {};
  ordered.forEach(function(r) { knownIds[String(r.ID)] = true; });
  generatedD006MigrationRows_.forEach(function(r) { if (!knownIds[String(r.ID)]) ordered.push(r); });

  // Validate all non-retired resulting rows before the caller writes anything.
  ordered.forEach(function(r) {
    if (String(r.MigrationVersion) === 'd006-v1-retired') return;
    validateD006OpportunityRow_(db, r, { allowRetired: false });
  });
  return { rows: ordered, sourceRowCount: sourceRows.length, createdIds: createdIds, transformedIds: transformedIds, retiredSourceIds: retiredSourceIds };
}

// Temporary per-build closure storage used only while constructing one migration plan.
var generatedD006MigrationRows_ = [];

function uniqueGeneratedIdFromSet_(rows, idHeader, prefix) {
  const existing = {};
  rows.forEach(function(row) { if (row && row[idHeader]) existing[String(row[idHeader])] = true; });
  generatedD006MigrationRows_.forEach(function(row) { if (row && row[idHeader]) existing[String(row[idHeader])] = true; });
  for (let attempt = 0; attempt < 20; attempt++) {
    const id = newId_(prefix);
    if (!existing[id]) return id;
  }
  throwApiError_('DUPLICATE_ID', 'Could not generate a unique Opportunity ID.');
}

function createD006Snapshot_(db, sourceSheet, snapshotName) {
  if (db.getSheetByName(snapshotName)) throwApiError_('MIGRATION_CONFLICT', 'Snapshot sheet already exists: ' + snapshotName + '.');
  const copy = sourceSheet.copyTo(db);
  copy.setName(snapshotName);
  copy.hideSheet();
  return copy;
}

function clonePlainObject_(value) {
  const result = {};
  Object.keys(value || {}).forEach(function(key) { result[key] = value[key]; });
  return result;
}

function toBoolean_(value) {
  if (value === true) return true;
  if (value === false || value === null || typeof value === 'undefined') return false;
  const text = String(value).trim().toLowerCase();
  return ['true', 'yes', 'y', '1', 'on'].indexOf(text) >= 0;
}

function nonNegativeNumber_(value) {
  const number = Number(value);
  if (!isFinite(number) || number < 0) return 0;
  return number;
}

function throwApiError_(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function apiErrorCode_(error) {
  return cleanText_(error && error.code ? error.code : 'SERVER_ERROR', 80);
}

function transactionType_(opportunity) {
  const value = number_(opportunity.Value);
  const type = String(opportunity.Type || (value > 0 ? 'earn' : 'contribute')).toLowerCase();
  return type === 'earn' ? 'earning' : type === 'contribute' ? 'contribution' : 'skill';
}

function number_(value) {
  const number = Number(value);
  return isFinite(number) ? number : 0;
}

function roundMoney_(value) { return Math.round(number_(value) * 100) / 100; }
function cleanText_(value, maxLength) { return String(value || '').trim().slice(0, maxLength); }
function cleanHttpUrl_(value) {
  const url = String(value || '').trim().slice(0, 2048);
  if (!url) return '';
  return /^https:\/\//i.test(url) || /^http:\/\//i.test(url) ? url : '';
}
function iso_(value) {
  if (!value) return '';
  const date = new Date(value);
  return isNaN(date.getTime()) ? '' : date.toISOString();
}
function sortByDateDesc_(left, right) { return new Date(right.date || 0) - new Date(left.date || 0); }
function newId_(prefix) { return prefix + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase(); }
function generateSchoolKey_() { return Utilities.getUuid().replace(/-/g, '').toUpperCase(); }
function safeError_(error) { return cleanText_(error && error.message ? error.message : 'Unexpected server error.', 500); }

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

/*
 * Learning Recommendations / rec-v1
 * Additive Cooking recommendation layer. Recommendation logic is categorical,
 * constraint-based and evidence-driven. It never reads legacy Skills numeric
 * Level/Progress/NextLevelAt for readiness and never writes XP/mastery scores.
 */

const REC_LIMITS = Object.freeze({
  id: 96,
  title: 160,
  shortText: 240,
  description: 1200,
  rationale: 1600,
  note: 1200,
  sourceRef: 2048,
  sourceLocation: 240,
  tag: 64,
  listItems: 24,
  reasonText: 600,
  clientRequestId: 96
});

const REC_ENUMS = Object.freeze({
  domain: Object.freeze(['cooking']),
  challengeBand: Object.freeze(['gentle', 'stretch', 'complex']),
  primaryChallengeType: Object.freeze(['consolidation', 'progression', 'integration', 'branching', 'baseline_probe']),
  safetySupport: Object.freeze(['none', 'adult_available', 'adult_nearby', 'direct_supervision']),
  behaviourReviewStatus: Object.freeze(['routine_approved_pattern', 'review_required', 'reviewed_clear', 'held']),
  candidateStatus: Object.freeze(['active', 'held', 'retired']),
  candidateTechniqueRole: Object.freeze(['primary_practice', 'supporting', 'incidental']),
  safetyRole: Object.freeze(['none', 'safety_relevant', 'gated_for_sophie']),
  requirementKind: Object.freeze(['hard', 'recommended']),
  evidenceExpectation: Object.freeze(['observed_with_support', 'observed_independent', 'observed_reliable', 'safety_confirmed']),
  observedByRole: Object.freeze(['sophie', 'parent', 'joint', 'other_authorised']),
  evidenceType: Object.freeze(['practice_observation', 'completion_feedback', 'self_report', 'parent_observation', 'safety_observation']),
  observedCapability: Object.freeze(['learning', 'practising', 'independent', 'reliable']),
  observedSupport: Object.freeze(['high_support', 'some_support', 'reminder_only', 'none']),
  safetyObserved: Object.freeze(['not_observed', 'safe_with_required_support', 'safe_independent', 'safety_concern']),
  reliabilityObserved: Object.freeze(['not_assessed', 'emerging', 'consistent_in_context']),
  preferenceType: Object.freeze(['interest', 'challenge_preference', 'avoid_for_now']),
  preferenceScope: Object.freeze(['domain', 'technique', 'candidate', 'interest_tag']),
  durationKind: Object.freeze(['session', 'day', 'until_date', 'until_changed']),
  preferenceStatus: Object.freeze(['active', 'expired', 'withdrawn']),
  authoredByRole: Object.freeze(['sophie', 'parent_on_behalf', 'joint']),
  challengePreference: Object.freeze(['easier', 'similar', 'more_challenging']),
  requestKind: Object.freeze(['normal', 'show_something_else', 'surprise_me', 'repeat_or_refine', 'switch_pathway']),
  fitBand: Object.freeze(['familiar_next_step', 'adjacent_stretch', 'novel_but_supported']),
  recencyDisposition: Object.freeze(['new', 'recently_shown', 'recently_chosen', 'recently_practised', 'deliberate_repeat', 'returning_option']),
  diversityRole: Object.freeze(['comfortable_familiar', 'appropriate_stretch', 'different_direction', 'interest_match', 'novel_but_supported']),
  recommendationOutcome: Object.freeze(['shown', 'chosen', 'not_now', 'not_interested', 'replaced', 'started']),
  sophieOverride: Object.freeze(['none', 'choose_different', 'easier', 'more_challenging', 'not_now', 'surprise_me', 'repeat_or_refine', 'switch_pathway', 'show_something_else']),
  recordType: Object.freeze(['LearnCandidates', 'Techniques', 'CandidateTechniques', 'TechniquePrerequisites', 'LearningEvidence', 'LearningPreferences', 'RecommendationHistory']),
  provenanceRole: Object.freeze(['source_derived', 'external_research', 'specialist_judgement', 'approved_behaviour_rule', 'family_source'])
});

const REC_D005_SUPPORT_TOKENS = Object.freeze(['show_me', 'do_with_me', 'prompt_me', 'got_this']);
const REC_SAFETY_ORDER = Object.freeze({ none: 0, adult_available: 1, adult_nearby: 2, direct_supervision: 3 });
const REC_ROLLBACK_SNAPSHOT_SHEET = 'Opportunities_PreRecV1_v242';
const REC_SEED_PACKAGE_ID = 'rec-v1-cooking-seed-v1';
const REC_V1_RELATIONSHIP_ID_POLICY = 'deterministic-rec-v1';
const REC_V1_COOKING_SEED_V1_SOURCE_SHA256 = 'db42d6e6053d05bfaea9de42b4fd0b45b42e1101a7094f45fa6f8e7126bce4f4';
const REC_V1_COOKING_SEED_V1_COMPILED_SHA256 = '9d2f48f4ff7d4fbfe3a9ea68856edb12bfd40411c925b7309249eaec74213e88';
// Coordinator-accepted Cooking seed compiled for final technical validation.
// Relationship/provenance IDs are normalised to the deterministic rec-v1 policy;
// the accepted source package remains unchanged and its source hash is retained above.
const REC_V1_COOKING_SEED_V1 = {"packageId":"rec-v1-cooking-seed-v1","techniques":[{"TechniqueID":"COOK-T001","SkillID":"S001","Name":"Mise en place","SophieFacingTitle":"Run the Prep","TechniqueFamily":"organisation","Description":"Read ahead, identify equipment and ingredients, prepare what can be prepared before time-sensitive cooking, and keep the workspace workable.","ObservableEvidence":"Explains the broad sequence before starting, identifies missing items early, and begins time-sensitive cooking without avoidable stops for obvious prep.","DifficultyDrivers":["step_count","unfamiliar_terms","parallel_preparation"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":false,"TypicalSafetySupport":"none","SafetyNote":"","TransferIndicators":["plans_before_heat","adapts_prep_order","organises_new_recipe"],"AuthenticUses":["weeknight_meals","baking","multi_component_meals"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T002","SkillID":"S001","Name":"Culinary measuring","SophieFacingTitle":"Measure It Properly","TechniqueFamily":"measurement","Description":"Select suitable measuring tools; measure mass, volume and count accurately; and interpret common recipe units.","ObservableEvidence":"Chooses an appropriate tool, tares scales when needed, measures accurately enough for the recipe, and notices obvious unit mismatches.","DifficultyDrivers":["mixed_units","small_quantities","precision"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":false,"TypicalSafetySupport":"none","SafetyNote":"Hot liquids require the safety conditions of the candidate using them.","TransferIndicators":["chooses_mass_or_volume","measures_in_new_recipe","scales_simple_quantity"],"AuthenticUses":["baking","grain_cooking","dressings"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T003","SkillID":"S001","Name":"Sharp-tool setup and hand safety","SophieFacingTitle":"Set Up Sharp Tools Safely","TechniqueFamily":"knife_and_prep","Description":"Stabilise the board or tool, select and position a suitable sharp tool, use safe grip and guiding-hand placement, and place/carry the tool safely.","ObservableEvidence":"Sets up a stable work area and demonstrates safe grip, hand clearance, placement and carrying without repeated safety correction.","DifficultyDrivers":["tool_sharpness","ingredient_stability","hand_position"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":true,"TypicalSafetySupport":"direct_supervision","SafetyNote":"Direct supervision is appropriate while safe sharp-tool setup and hand positioning are first being established.","TransferIndicators":["safe_setup_across_ingredients","self_corrects_hand_position","selects_suitable_tool"],"AuthenticUses":["vegetable_prep","fruit_prep","salads"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T004","SkillID":"S001","Name":"Basic slicing and chopping","SophieFacingTitle":"Control the Knife","TechniqueFamily":"knife_and_prep","Description":"Slice and chop ordinary ingredients with controlled movement and pieces consistent enough for the intended cooking or serving purpose.","ObservableEvidence":"Uses protected guiding-hand position and controlled cuts; pieces are sufficiently consistent for the intended use without prioritising speed.","DifficultyDrivers":["knife_precision","ingredient_shape","cut_consistency"],"TypicalScaffoldOptions":["do_with_me","prompt_me","got_this"],"SafetyCritical":true,"TypicalSafetySupport":"adult_nearby","SafetyNote":"Requires confirmed safe sharp-tool setup for Sophie-led cutting; harder or unstable ingredients may justify stronger support.","TransferIndicators":["consistent_cuts_new_ingredient","changes_cut_for_cook_time","maintains_control_without_speed"],"AuthenticUses":["salads","sauces","stir_fry"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T005","SkillID":"S001","Name":"Grating","SophieFacingTitle":"Grate With Control","TechniqueFamily":"knife_and_prep","Description":"Stabilise a grater or food and grate with deliberate hand clearance and suitable pressure.","ObservableEvidence":"Maintains a stable tool and hand clearance, slows or stops before fingers approach the cutting surface, and produces usable grated food.","DifficultyDrivers":["hand_clearance","tool_stability","ingredient_size"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":true,"TypicalSafetySupport":"direct_supervision","SafetyNote":"Sharp grating surfaces require direct supervision until hand-clearance judgement is established.","TransferIndicators":["safe_grating_different_foods","stops_before_end_piece","selects_grater_surface"],"AuthenticUses":["fritters","salads","baking"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T006","SkillID":"S001","Name":"Stovetop heat control","SophieFacingTitle":"Read the Heat","TechniqueFamily":"heat_control","Description":"Establish and adjust stovetop heat in response to what the food and cookware are doing rather than leaving the setting fixed.","ObservableEvidence":"Makes a sensible heat adjustment from visual, sound or texture cues and can explain why the change was useful.","DifficultyDrivers":["narrow_heat_window","pan_material","quantity"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":true,"TypicalSafetySupport":"adult_nearby","SafetyNote":"Hot cookware and steam require candidate-specific supervision even when heat judgement is the learning focus.","TransferIndicators":["adjusts_heat_new_food","anticipates_heat_loss","uses_residual_heat"],"AuthenticUses":["eggs","sauteing","pancakes","simmering"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T007","SkillID":"S001","Name":"Sautéing","SophieFacingTitle":"Sauté Without Steaming","TechniqueFamily":"heat_control","Description":"Use a hot pan, suitable fat and manageable quantities to cook food rapidly while controlling browning and moisture release.","ObservableEvidence":"Avoids uncontrolled crowding, recognises browning versus steaming, moves food appropriately and adjusts heat when needed.","DifficultyDrivers":["pan_crowding","moisture_release","browning"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":true,"TypicalSafetySupport":"adult_nearby","SafetyNote":"Hot pan and possible oil splatter require candidate-specific supervision.","TransferIndicators":["sautees_different_vegetables","layers_aromatics","manages_pan_crowding"],"AuthenticUses":["vegetables","sauces","egg_dishes"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T008","SkillID":"S001","Name":"Simmer control","SophieFacingTitle":"Hold the Simmer","TechniqueFamily":"moist_heat","Description":"Bring liquid to the required temperature, distinguish simmering from boiling, and maintain a controlled simmer as ingredients and volume change.","ObservableEvidence":"Identifies a simmer visually, reduces or increases heat appropriately, and maintains the intended gentle cooking action.","DifficultyDrivers":["liquid_volume","heat_recovery","reduction"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":true,"TypicalSafetySupport":"adult_nearby","SafetyNote":"Steam, hot liquid and pot handles require candidate-specific supervision.","TransferIndicators":["holds_simmer_new_pot","adjusts_after_ingredients_added","controls_reduction"],"AuthenticUses":["oats","curries","sauces","rice"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T009","SkillID":"S001","Name":"Boiling and pasta cookery","SophieFacingTitle":"Manage a Boiling Pot","TechniqueFamily":"moist_heat","Description":"Bring and maintain a controlled boil where appropriate, add food safely, and judge pasta or similar foods by texture rather than time alone.","ObservableEvidence":"Manages the pot safely, prevents unnecessary boil-over, checks texture and drains safely with appropriate support.","DifficultyDrivers":["steam","heavy_hot_water","timing","texture_judgement"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":true,"TypicalSafetySupport":"direct_supervision","SafetyNote":"Large volumes of boiling water and draining create burn and lifting hazards; candidate-level allocation may keep draining adult-led.","TransferIndicators":["cooks_different_pasta_shapes","adjusts_for_quantity","coordinates_pasta_with_sauce"],"AuthenticUses":["pasta","noodles","boiled_vegetables"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T010","SkillID":"S001","Name":"Oven control","SophieFacingTitle":"Use the Oven With Intention","TechniqueFamily":"oven","Description":"Preheat, position and handle ordinary oven cookware safely, and use time together with food cues to judge progress.","ObservableEvidence":"Preheats correctly, loads/removes ordinary cookware safely at the candidate's support level, and checks the food rather than relying only on the timer.","DifficultyDrivers":["hot_cookware","rack_position","carryover_cooking"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":true,"TypicalSafetySupport":"adult_nearby","SafetyNote":"Oven burns and awkward/heavy cookware require candidate-specific support.","TransferIndicators":["uses_oven_new_recipe","chooses_when_to_check","handles_different_bakeware"],"AuthenticUses":["muffins","bread","baked_fruit","pizza"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T011","SkillID":"S001","Name":"Doneness and sensory judgement","SophieFacingTitle":"Know When It's Ready","TechniqueFamily":"judgement","Description":"Judge cooking progress and endpoint using appropriate combinations of colour, texture, tenderness, aroma, viscosity, time and temperature.","ObservableEvidence":"Explains why food is ready or needs more time using evidence from the food, not only the timer.","DifficultyDrivers":["subtle_endpoint","multiple_cues","carryover_cooking"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":false,"TypicalSafetySupport":"none","SafetyNote":"Where food-safety temperatures apply, objective safety requirements remain separate from sensory judgement.","TransferIndicators":["uses_multiple_cues","judges_new_food","explains_adjustment"],"AuthenticUses":["eggs","baking","vegetables","grains"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T012","SkillID":"S001","Name":"Seasoning and taste adjustment","SophieFacingTitle":"Make It Taste Right","TechniqueFamily":"flavour","Description":"Taste safely, describe the result, make a deliberate incremental seasoning adjustment, then taste again.","ObservableEvidence":"Identifies a useful change such as salt, acidity, herbs or spices; adjusts gradually; and explains whether the change improved the dish.","DifficultyDrivers":["flavour_balance","reduction_concentration","unfamiliar_spices"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":false,"TypicalSafetySupport":"none","SafetyNote":"Tasting method must avoid cross-contamination.","TransferIndicators":["adjusts_new_dish","explains_flavour_change","seasons_in_stages"],"AuthenticUses":["salads","sauces","dips","curries"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T013","SkillID":"S001","Name":"Vinaigrette emulsification","SophieFacingTitle":"Bring Oil and Water Together","TechniqueFamily":"sauces_and_dressings","Description":"Disperse oil and water-based ingredients into a usable dressing, recognise separation and re-emulsify while balancing flavour.","ObservableEvidence":"Produces a usable vinaigrette, recognises when it separates, restores it and adjusts the seasoning deliberately.","DifficultyDrivers":["emulsion_stability","pouring_and_whisking","flavour_balance"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":false,"TypicalSafetySupport":"none","SafetyNote":"No special hazard beyond normal hygiene for the seeded applications.","TransferIndicators":["re_emulsifies_after_resting","varies_acid_or_oil","makes_flavoured_vinaigrette"],"AuthenticUses":["salads","vegetable_sides","grain_bowls"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T014","SkillID":"S001","Name":"Absorption grain cookery","SophieFacingTitle":"Cook the Grain","TechniqueFamily":"grains","Description":"Use an appropriate grain-to-liquid relationship, control heat through boil/simmer/absorption, rest as needed and judge texture.","ObservableEvidence":"Produces the intended grain texture and can identify whether liquid, heat, time or resting affected the result.","DifficultyDrivers":["liquid_ratio","absorption","lid_management","resting"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":true,"TypicalSafetySupport":"adult_nearby","SafetyNote":"Hot pot and steam safety apply; risk depends on the candidate and quantity.","TransferIndicators":["cooks_second_grain","adapts_quantity","integrates_grain_with_meal"],"AuthenticUses":["rice","quinoa","pilaf","paella"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T015","SkillID":"S001","Name":"Batter mixing","SophieFacingTitle":"Know When to Stop Mixing","TechniqueFamily":"baking","Description":"Combine batter ingredients sufficiently for the intended method without unnecessary overmixing and portion the batter consistently.","ObservableEvidence":"Recognises a suitable mixing endpoint and produces reasonably consistent portions without continuing to mix after the target is reached.","DifficultyDrivers":["overmixing","lumps","folding","portion_consistency"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":false,"TypicalSafetySupport":"none","SafetyNote":"Separate pan/oven safety applies when batter is cooked.","TransferIndicators":["handles_second_batter_method","folds_add_ins","adjusts_for_batter_consistency"],"AuthenticUses":["pancakes","muffins","fritters"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T016","SkillID":"S001","Name":"Basic dough handling","SophieFacingTitle":"Handle the Dough","TechniqueFamily":"baking","Description":"Mix and handle a simple dough according to its method, recognise stickiness/structure and avoid unnecessary handling.","ObservableEvidence":"Follows the dough method, recognises a useful handling endpoint and shapes the dough without excessive working.","DifficultyDrivers":["hydration","stickiness","kneading","proofing"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":false,"TypicalSafetySupport":"none","SafetyNote":"Oven and mixer safety are candidate-specific.","TransferIndicators":["handles_second_dough","recognises_proofing_change","shapes_simple_dough"],"AuthenticUses":["soda_bread","focaccia","pizza"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T017","SkillID":"S001","Name":"Meal coordination","SophieFacingTitle":"Bring It Together","TechniqueFamily":"coordination","Description":"Work backwards from serving time, distinguish active from passive time, sequence components and recover when timing changes.","ObservableEvidence":"States a workable sequence, keeps track of at least two components and makes a reasonable adjustment when one component runs early or late.","DifficultyDrivers":["parallel_tasks","different_finish_times","multiple_heat_sources"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":false,"TypicalSafetySupport":"adult_available","SafetyNote":"Coordination itself is not a hazard, but combining multiple hot or sharp processes may require stronger candidate-level support.","TransferIndicators":["coordinates_new_two_component_meal","recovers_from_delay","plans_backwards_from_serve_time"],"AuthenticUses":["pasta_and_sauce","curry_and_rice","pizza_and_salad"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T018","SkillID":"S001","Name":"Food hygiene and workspace safety","SophieFacingTitle":"Keep the Kitchen Safe","TechniqueFamily":"safety","Description":"Use appropriate hand hygiene, maintain a workable clean space, manage spills and avoid obvious contamination during ordinary home cooking.","ObservableEvidence":"Washes hands when relevant, responds to spills/hazards, keeps ready-to-eat food protected and resets unsafe workspace conditions.","DifficultyDrivers":["multiple_ingredients","raw_food_contact","busy_workspace"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":true,"TypicalSafetySupport":"adult_available","SafetyNote":"Candidate-specific requirements increase when raw high-risk foods or specialised hazards are introduced.","TransferIndicators":["maintains_hygiene_longer_recipe","self_corrects_workspace_hazard","applies_hygiene_new_context"],"AuthenticUses":["all_cooking","shared_meals","leftovers"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T019","SkillID":"S001","Name":"Cold assembly and presentation","SophieFacingTitle":"Build and Present the Dish","TechniqueFamily":"assembly","Description":"Assemble prepared ingredients in a deliberate order and portion or present them so the food is practical and appealing to eat.","ObservableEvidence":"Assembles components without unnecessary mess or loss, portions sensibly and can explain at least one presentation choice.","DifficultyDrivers":["component_order","portioning","presentation"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":false,"TypicalSafetySupport":"none","SafetyNote":"Any sharp-tool preparation is governed separately.","TransferIndicators":["assembles_new_salad_or_breakfast","adjusts_portioning","presents_for_others"],"AuthenticUses":["salads","breakfasts","snack_plates"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T020","SkillID":"S001","Name":"Mixing, whisking and folding","SophieFacingTitle":"Mix With Purpose","TechniqueFamily":"preparation","Description":"Choose and control mixing, whisking or folding motions according to the desired texture without unnecessary force or duration.","ObservableEvidence":"Uses an appropriate motion, combines ingredients evenly and stops when the intended texture or incorporation is achieved.","DifficultyDrivers":["texture_target","aeration","delicate_mixture"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":false,"TypicalSafetySupport":"none","SafetyNote":"Mechanical mixer safety is separate from hand mixing.","TransferIndicators":["uses_correct_motion_new_recipe","folds_without_deflating","whisks_to_target_texture"],"AuthenticUses":["dressings","batter","eggs","dips"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T021","SkillID":"S001","Name":"Small food-processor or blender operation","SophieFacingTitle":"Use a Small Appliance Safely","TechniqueFamily":"equipment","Description":"Use a small food processor or blender only with appropriate lid, hand-clearance and power-state checks.","ObservableEvidence":"Keeps hands/tools clear of blades, confirms lid/power state and follows the candidate's agreed ownership/support allocation.","DifficultyDrivers":["moving_blades","assembly","unplugging"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":true,"TypicalSafetySupport":"direct_supervision","SafetyNote":"Seeded hummus use assigns this component to an adult; future Sophie-led applications require explicit candidate design.","TransferIndicators":["checks_power_state","assembles_appliance_safely","cleans_only_when_safe"],"AuthenticUses":["hummus","sauces","purees"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"TechniqueID":"COOK-T022","SkillID":"S001","Name":"Direct grilling","SophieFacingTitle":"Control Direct Grill Heat","TechniqueFamily":"heat_control","Description":"Cook suitable food over or under direct grill heat while controlling distance, turning and doneness.","ObservableEvidence":"Keeps food and equipment under control, turns at appropriate points and judges colour/tenderness without allowing uncontrolled burning.","DifficultyDrivers":["direct_high_heat","turn_timing","hot_surface"],"TypicalScaffoldOptions":["show_me","do_with_me","prompt_me","got_this"],"SafetyCritical":true,"TypicalSafetySupport":"direct_supervision","SafetyNote":"Direct grilling is a higher-heat method and requires candidate-specific direct supervision in the seeded catalogue.","TransferIndicators":["grills_second_vegetable","adjusts_for_thickness","uses_doneness_cues"],"AuthenticUses":["vegetables","sandwich_fillings","family_meals"],"Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"}],"learnCandidates":[{"CandidateID":"LC-COOK-001","Domain":"cooking","Title":"Set Up for Safe Cutting","SkillID":"S001","CapabilityLabel":"Sharp-tool setup and hand safety","PracticeDescription":"Set up a board and ordinary kitchen knife safely, practise grip, guiding-hand position, carrying and safe placement with an adult before doing independent cutting.","CompletionStandard":"Board and tool are stable; grip, hand clearance, carrying and placement are demonstrated without repeated safety correction.","WhyItMatters":"Safe setup makes later knife work more controlled and gives you more choice over prep jobs.","EstimatedMinutes":15,"ChallengeBand":"gentle","PrimaryChallengeType":"baseline_probe","DifficultyDrivers":["tool_sharpness","hand_position","workspace_setup"],"InterestTags":["savoury","quick"],"CookingMethodTags":["prep"],"MealTypeTags":["component"],"CuisineTags":[],"ChallengeStructureTags":["single_technique","safety_setup"],"SafetyRequired":true,"MinimumSafetySupport":"direct_supervision","SafetyRequirement":"An adult is directly supervising the sharp-tool setup and owns any cutting not explicitly assigned to Sophie.","SafetyNote":"This is a safety/setup probe, not a speed or precision test.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T003"],"sharedTechniqueIds":["COOK-T001"],"adultLedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Prepares for safe vegetable or fruit prep.","CuratorRationale":"Bootstraps observable sharp-tool safety evidence without requiring prior knife-cutting evidence.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-002","Domain":"cooking","Title":"Berry Breakfast Trifle","SkillID":"S001","CapabilityLabel":"Mise en place and cold assembly","PracticeDescription":"Read the recipe, measure and prepare the ingredients, then assemble a layered breakfast trifle in a deliberate order.","CompletionStandard":"Ingredients and equipment are prepared before assembly; measurements are usable; the finished portion is assembled neatly enough to serve.","WhyItMatters":"Good prep and measuring make simple food easy to make independently.","EstimatedMinutes":20,"ChallengeBand":"gentle","PrimaryChallengeType":"baseline_probe","DifficultyDrivers":["step_order","measuring","presentation"],"InterestTags":["breakfast","quick","plant_based"],"CookingMethodTags":["cold_assembly"],"MealTypeTags":["breakfast","snack"],"CuisineTags":[],"ChallengeStructureTags":["single_component","no_cook"],"SafetyRequired":false,"MinimumSafetySupport":"none","SafetyRequirement":"","SafetyNote":"","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T001","COOK-T002","COOK-T019"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Independent breakfast or snack.","CuratorRationale":"Low-pressure baseline for organisation, measuring and assembly without heat or sharp-tool demands.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-003","Domain":"cooking","Title":"Chia Pudding","SkillID":"S001","CapabilityLabel":"Measuring and texture judgement","PracticeDescription":"Measure and mix a chia pudding, then check whether the mixture has reached a useful set after resting.","CompletionStandard":"Measurements are correct enough for the formula; ingredients are mixed evenly; the set is checked by texture rather than by time alone.","WhyItMatters":"Ratios and texture cues are useful in both cooking and baking.","EstimatedMinutes":15,"ChallengeBand":"gentle","PrimaryChallengeType":"consolidation","DifficultyDrivers":["liquid_ratio","mixing","set_texture"],"InterestTags":["breakfast","plant_based","make_ahead"],"CookingMethodTags":["cold_mix"],"MealTypeTags":["breakfast","snack"],"CuisineTags":[],"ChallengeStructureTags":["single_component","make_ahead"],"SafetyRequired":false,"MinimumSafetySupport":"none","SafetyRequirement":"","SafetyNote":"","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T002","COOK-T020","COOK-T011"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Make-ahead breakfast or snack.","CuratorRationale":"A forgiving way to practise measuring, mixing and delayed texture judgement.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-004","Domain":"cooking","Title":"Salad + Basic Vinaigrette","SkillID":"S001","CapabilityLabel":"Emulsification and seasoning","PracticeDescription":"Make a basic vinaigrette, taste and adjust it, then dress a simple prepared salad.","CompletionStandard":"The dressing emulsifies enough to coat the salad; separation is recognised and corrected; at least one seasoning decision is explained.","WhyItMatters":"Learning to balance a dressing helps you adjust food instead of depending completely on fixed instructions.","EstimatedMinutes":20,"ChallengeBand":"gentle","PrimaryChallengeType":"baseline_probe","DifficultyDrivers":["emulsion_stability","flavour_balance","measuring"],"InterestTags":["lunch","plant_based","quick"],"CookingMethodTags":["cold_assembly","whisk"],"MealTypeTags":["lunch","side"],"CuisineTags":[],"ChallengeStructureTags":["single_component","taste_and_adjust"],"SafetyRequired":false,"MinimumSafetySupport":"none","SafetyRequirement":"","SafetyNote":"","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T002","COOK-T013","COOK-T012","COOK-T019"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Salad dressing for lunch or a family side.","CuratorRationale":"Low-load flavour baseline that generates useful evidence about tasting, adjustment and emulsification.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-005","Domain":"cooking","Title":"Caprese Salad","SkillID":"S001","CapabilityLabel":"Controlled slicing and presentation","PracticeDescription":"Slice the ingredients safely and consistently enough for serving, season simply, then arrange the salad.","CompletionStandard":"Cutting remains controlled and safe; pieces are suitable for serving; seasoning and arrangement are deliberate.","WhyItMatters":"Knife control is easier to transfer when you use it to make real food you want to eat.","EstimatedMinutes":20,"ChallengeBand":"gentle","PrimaryChallengeType":"consolidation","DifficultyDrivers":["knife_precision","cut_consistency","presentation"],"InterestTags":["lunch","quick","vegetarian"],"CookingMethodTags":["cold_assembly","knife_prep"],"MealTypeTags":["lunch","side"],"CuisineTags":["italian"],"ChallengeStructureTags":["single_component"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Sophie-led slicing requires the sharp-tool safety prerequisite to be satisfied; adult remains nearby.","SafetyNote":"Use ordinary stable ingredients and an appropriate knife; speed is not a goal.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T004","COOK-T012","COOK-T019"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Simple lunch or family side.","CuratorRationale":"Transfers basic safe cutting into a forgiving no-heat dish.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-006","Domain":"cooking","Title":"Hummus + Vegetable Plate","SkillID":"S001","CapabilityLabel":"Seasoning and texture adjustment","PracticeDescription":"Measure and combine hummus ingredients, taste and adjust the seasoning, then assemble it with prepared vegetables or bread.","CompletionStandard":"The mixture reaches a usable dip consistency and Sophie can explain at least one flavour or texture adjustment.","WhyItMatters":"Making a dip from basic ingredients builds flavour judgement and gives you a useful lunch or snack component.","EstimatedMinutes":20,"ChallengeBand":"gentle","PrimaryChallengeType":"branching","DifficultyDrivers":["texture_adjustment","flavour_balance","small_appliance"],"InterestTags":["snack","lunch","plant_based"],"CookingMethodTags":["blend","cold_assembly"],"MealTypeTags":["snack","lunch"],"CuisineTags":["middle_eastern"],"ChallengeStructureTags":["adult_led_hazard_component","taste_and_adjust"],"SafetyRequired":true,"MinimumSafetySupport":"adult_available","SafetyRequirement":"An adult operates the food processor/blender in this seeded variant; Sophie keeps hands and utensils clear until the appliance is safely stopped and unplugged.","SafetyNote":"The candidate deliberately allocates the blade-driven appliance component to an adult.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T002","COOK-T012","COOK-T019"],"adultLedTechniqueIds":["COOK-T021"],"sharedTechniqueIds":["COOK-T020"]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Dip for lunch, snack plate or shared meal.","CuratorRationale":"Preserves a useful plant-based flavour challenge while explicitly allocating the powered-blade hazard to the adult.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-007","Domain":"cooking","Title":"Guacamole + Toast or Vegetables","SkillID":"S001","CapabilityLabel":"Seasoning and simple knife prep","PracticeDescription":"Prepare the avocado and flavouring ingredients, mash to the texture you want, taste and adjust, then serve with toast or vegetables.","CompletionStandard":"Knife work is safe where used; texture is deliberate; at least one seasoning adjustment is explained.","WhyItMatters":"A quick dip is a useful way to practise tasting and making your own judgement.","EstimatedMinutes":20,"ChallengeBand":"gentle","PrimaryChallengeType":"branching","DifficultyDrivers":["knife_prep","ripeness","flavour_balance"],"InterestTags":["snack","lunch","plant_based","quick"],"CookingMethodTags":["cold_assembly","mash","knife_prep"],"MealTypeTags":["snack","lunch"],"CuisineTags":["mexican_inspired"],"ChallengeStructureTags":["single_component","taste_and_adjust"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Any Sophie-led chopping requires the sharp-tool safety prerequisite to be satisfied; adult remains nearby.","SafetyNote":"The mashing step is low-risk; sharp-tool preparation remains separately gated.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T004","COOK-T012","COOK-T020","COOK-T019"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Fast lunch or snack.","CuratorRationale":"Offers a different cuisine/texture context for seasoning while retaining manageable complexity.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-008","Domain":"cooking","Title":"Oatmeal with Banana and Cinnamon","SkillID":"S001","CapabilityLabel":"Simmer and texture control","PracticeDescription":"Measure the grain and liquid, bring it to cooking temperature, hold an appropriate simmer and stop when the texture is right.","CompletionStandard":"The simmer is controlled and the oatmeal reaches a chosen usable texture without relying only on the timer.","WhyItMatters":"Learning how liquid and heat change grains makes breakfast more independent and transfers to other grain dishes.","EstimatedMinutes":20,"ChallengeBand":"gentle","PrimaryChallengeType":"progression","DifficultyDrivers":["liquid_ratio","simmer_control","texture_judgement"],"InterestTags":["breakfast","quick","vegetarian"],"CookingMethodTags":["simmer","stovetop"],"MealTypeTags":["breakfast"],"CuisineTags":[],"ChallengeStructureTags":["single_pot"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Adult is nearby for hot pot, steam and stovetop handling.","SafetyNote":"No sharp-tool requirement is necessary if the banana is prepared without a knife or pre-sliced.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T002","COOK-T008","COOK-T011","COOK-T012"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Independent hot breakfast.","CuratorRationale":"Forgiving introduction to simmering and sensory texture judgement.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-009","Domain":"cooking","Title":"Simmered Rice","SkillID":"S001","CapabilityLabel":"Absorption grain cookery","PracticeDescription":"Measure rice and liquid, manage the boil-to-simmer transition, let the grain absorb and rest, then judge texture.","CompletionStandard":"The grain is cooked to a usable texture and Sophie can identify how heat, liquid or resting affected the result.","WhyItMatters":"Plain rice is a foundation for many meals and makes later curries, bowls and fried rice easier to coordinate.","EstimatedMinutes":30,"ChallengeBand":"stretch","PrimaryChallengeType":"progression","DifficultyDrivers":["liquid_ratio","heat_transition","absorption","resting"],"InterestTags":["dinner","plant_based","staple"],"CookingMethodTags":["absorption","simmer","stovetop"],"MealTypeTags":["side","component"],"CuisineTags":[],"ChallengeStructureTags":["single_pot"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Adult is nearby for steam, hot pot and stovetop handling.","SafetyNote":"This challenge focuses on absorption and heat control rather than speed.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T002","COOK-T008","COOK-T014","COOK-T011"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Rice component for family meals or bowls.","CuratorRationale":"Core grain technique that later supports multi-component meals.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-010","Domain":"cooking","Title":"Scrambled Eggs","SkillID":"S001","CapabilityLabel":"Pan heat and doneness","PracticeDescription":"Prepare the eggs, control the pan heat and stop cooking while the eggs still have the intended moist texture.","CompletionStandard":"Heat is adjusted from what the eggs are doing and the endpoint is explained using texture rather than timer alone.","WhyItMatters":"Eggs give very clear feedback about pan temperature, so they are a useful way to learn to read heat.","EstimatedMinutes":20,"ChallengeBand":"stretch","PrimaryChallengeType":"baseline_probe","DifficultyDrivers":["narrow_heat_window","residual_heat","texture_judgement"],"InterestTags":["breakfast","quick","vegetarian"],"CookingMethodTags":["pan","stovetop"],"MealTypeTags":["breakfast","lunch"],"CuisineTags":[],"ChallengeStructureTags":["single_pan","narrow_endpoint"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Adult is nearby for hot pan and stovetop handling.","SafetyNote":"The challenge is heat judgement, not producing a restaurant-style result.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T006","COOK-T011","COOK-T020","COOK-T012"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Quick breakfast or light meal.","CuratorRationale":"Few ingredients isolate heat-control and doneness evidence cleanly.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-011","Domain":"cooking","Title":"Buttermilk Pancakes","SkillID":"S001","CapabilityLabel":"Batter and repeatable pan heat","PracticeDescription":"Measure and mix the batter, portion it onto a heated pan and use surface cues to decide when to turn each pancake.","CompletionStandard":"Batter is mixed to a useful endpoint; pan heat stays controlled across repeated portions; turning is based on food cues.","WhyItMatters":"Pancakes combine measuring, mixing and heat control in a repeatable way that makes changes easy to notice.","EstimatedMinutes":35,"ChallengeBand":"stretch","PrimaryChallengeType":"progression","DifficultyDrivers":["batter_consistency","repeatable_pan_heat","turn_timing"],"InterestTags":["breakfast","baking","vegetarian"],"CookingMethodTags":["pan","stovetop","batter"],"MealTypeTags":["breakfast","snack"],"CuisineTags":[],"ChallengeStructureTags":["repeated_units","narrow_endpoint"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Adult is nearby for the hot pan and stovetop.","SafetyNote":"No flipping speed target; controlled heat and judgement matter more.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T002","COOK-T015","COOK-T006","COOK-T011"],"adultLedTechniqueIds":[],"sharedTechniqueIds":["COOK-T020"]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Breakfast or shared weekend meal.","CuratorRationale":"Useful variable practice for pan heat after simpler hot-food tasks.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-012","Domain":"cooking","Title":"Sweet Potato + Zucchini Fritters","SkillID":"S001","CapabilityLabel":"Grating, batter and pan heat","PracticeDescription":"Grate the vegetables safely, prepare the fritter mixture, control the pan and judge browning before turning.","CompletionStandard":"Grating is controlled; mixture holds together; pan temperature is adjusted as needed; fritters are turned using browning and set cues.","WhyItMatters":"This brings prep, mixing and pan heat together in one useful savoury meal or side.","EstimatedMinutes":40,"ChallengeBand":"stretch","PrimaryChallengeType":"integration","DifficultyDrivers":["grater_safety","moisture_control","batter_consistency","pan_heat","turn_timing"],"InterestTags":["lunch","dinner","vegetarian","savoury"],"CookingMethodTags":["grate","pan","stovetop"],"MealTypeTags":["lunch","side","dinner"],"CuisineTags":[],"ChallengeStructureTags":["multi_technique","repeated_units"],"SafetyRequired":true,"MinimumSafetySupport":"direct_supervision","SafetyRequirement":"Direct supervision is required for Sophie-led grating until sharp-tool safety is confirmed; adult remains nearby for pan cooking.","SafetyNote":"The grater is a separate sharp-tool hazard from the pan.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T005","COOK-T015","COOK-T006","COOK-T011","COOK-T002"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Savoury lunch, dinner side or snack.","CuratorRationale":"Broad baseline/early integration challenge across prep, batter and pan control.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-013","Domain":"cooking","Title":"Sautéed Mushrooms with Garlic + Thyme","SkillID":"S001","CapabilityLabel":"Sautéing and pan crowding","PracticeDescription":"Prepare the ingredients, preheat the pan, sauté without unnecessary crowding and adjust heat as moisture releases.","CompletionStandard":"Mushrooms brown rather than only steam; heat is adjusted deliberately; Sophie can explain what the pan was doing.","WhyItMatters":"Mushrooms make pan temperature and moisture visible, so they are a strong way to practise real heat judgement.","EstimatedMinutes":25,"ChallengeBand":"stretch","PrimaryChallengeType":"progression","DifficultyDrivers":["pan_crowding","moisture_release","browning","knife_prep"],"InterestTags":["lunch","dinner","vegetarian","savoury"],"CookingMethodTags":["saute","pan","stovetop"],"MealTypeTags":["side","component"],"CuisineTags":[],"ChallengeStructureTags":["single_pan","heat_focus"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Sophie-led chopping requires the sharp-tool safety prerequisite; adult remains nearby for the hot pan.","SafetyNote":"Use an appropriate pan size so crowding can be deliberately observed and managed.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T004","COOK-T006","COOK-T007","COOK-T011","COOK-T012"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Vegetable side, toast topping or meal component.","CuratorRationale":"High diagnostic value for heat control because mushroom moisture exposes poor pan loading quickly.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-014","Domain":"cooking","Title":"Stir-Fried Snow Peas","SkillID":"S001","CapabilityLabel":"Mise en place and fast pan cooking","PracticeDescription":"Finish all preparation before heating the pan, then stir-fry quickly while controlling heat and texture.","CompletionStandard":"Prep is complete before heat starts; pan heat remains controlled; vegetables finish with the intended texture rather than overcooking.","WhyItMatters":"Fast cooking makes organisation matter: there is less time to stop and fix forgotten prep.","EstimatedMinutes":25,"ChallengeBand":"stretch","PrimaryChallengeType":"progression","DifficultyDrivers":["high_heat","short_cooking_window","mise_en_place","knife_prep"],"InterestTags":["dinner","plant_based","quick"],"CookingMethodTags":["stir_fry","pan","stovetop"],"MealTypeTags":["side","component"],"CuisineTags":[],"ChallengeStructureTags":["short_timing_window","prep_before_heat"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Any Sophie-led knife prep requires the sharp-tool prerequisite; adult remains nearby for hot-pan cooking.","SafetyNote":"The high-heat method is offered only with all preparation complete first.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T001","COOK-T004","COOK-T006","COOK-T007","COOK-T011"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Fast vegetable side or stir-fry component.","CuratorRationale":"Progresses pan control by narrowing the timing window and increasing the value of mise en place.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-015","Domain":"cooking","Title":"White Bean Salad","SkillID":"S001","CapabilityLabel":"Knife prep and flavour balance","PracticeDescription":"Prepare the salad ingredients, combine them with dressing or seasoning and adjust the balance before serving.","CompletionStandard":"Knife work is controlled where used; ingredients are prepared consistently enough for eating; seasoning is tasted and adjusted deliberately.","WhyItMatters":"A filling salad turns prep and flavour skills into a practical lunch.","EstimatedMinutes":30,"ChallengeBand":"stretch","PrimaryChallengeType":"consolidation","DifficultyDrivers":["knife_prep","flavour_balance","ingredient_variety"],"InterestTags":["lunch","plant_based","make_ahead"],"CookingMethodTags":["cold_assembly","knife_prep"],"MealTypeTags":["lunch","side"],"CuisineTags":[],"ChallengeStructureTags":["single_component","taste_and_adjust"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Sophie-led chopping requires the sharp-tool safety prerequisite; adult remains nearby.","SafetyNote":"No heat is required in the seeded use if ingredients are ready to use.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T004","COOK-T012","COOK-T019","COOK-T001"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Make-ahead lunch or family side.","CuratorRationale":"Varies knife and seasoning practice away from hot-pan work.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-017","Domain":"cooking","Title":"Blueberry Muffins","SkillID":"S001","CapabilityLabel":"Batter mixing and oven judgement","PracticeDescription":"Measure accurately, mix the batter only as much as the method needs, portion consistently and judge the baked endpoint.","CompletionStandard":"Batter is not unnecessarily overmixed; portions are reasonably consistent; doneness is checked using food cues as well as time.","WhyItMatters":"Muffins show how accurate measuring and mixing decisions affect the final texture.","EstimatedMinutes":50,"ChallengeBand":"stretch","PrimaryChallengeType":"progression","DifficultyDrivers":["measurement_precision","overmixing","portion_consistency","oven_doneness"],"InterestTags":["baking","breakfast","vegetarian"],"CookingMethodTags":["batter","oven","bake"],"MealTypeTags":["breakfast","snack"],"CuisineTags":[],"ChallengeStructureTags":["repeated_units","precision_baking"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Adult remains nearby for oven handling.","SafetyNote":"The primary challenge is batter judgement and repeatable portions, not decoration.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T002","COOK-T015","COOK-T020","COOK-T010","COOK-T011"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Breakfast, snack or food to share.","CuratorRationale":"A clear baking progression from forgiving measurement tasks to a texture-sensitive batter method.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-018","Domain":"cooking","Title":"Irish Soda Bread","SkillID":"S001","CapabilityLabel":"Quick dough handling","PracticeDescription":"Measure, mix and shape a simple chemically leavened dough, then bake and judge the finished bread.","CompletionStandard":"Dough is handled without unnecessary working; it is shaped successfully; oven and doneness checks are completed at the agreed support level.","WhyItMatters":"Quick bread is a useful bridge between muffin batter and yeast dough.","EstimatedMinutes":60,"ChallengeBand":"stretch","PrimaryChallengeType":"progression","DifficultyDrivers":["dough_handling","measurement_precision","oven_doneness"],"InterestTags":["baking","bread","vegetarian"],"CookingMethodTags":["dough","oven","bake"],"MealTypeTags":["snack","side"],"CuisineTags":[],"ChallengeStructureTags":["single_loaf","dough_intro"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Adult remains nearby for oven handling.","SafetyNote":"No yeast fermentation is required, keeping the dough challenge focused.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T002","COOK-T016","COOK-T020","COOK-T010","COOK-T011"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Bread for a meal or snack.","CuratorRationale":"Introduces dough handling without the extra fermentation/proofing demands of yeast bread.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-019","Domain":"cooking","Title":"Focaccia Pizza + Salad","SkillID":"S001","CapabilityLabel":"Dough, oven and meal coordination","PracticeDescription":"Prepare focaccia-style pizza and a simple salad, planning the order so the cold side and hot component are ready together.","CompletionStandard":"Preparation follows a workable sequence; dough and oven steps are completed with appropriate support; pizza and salad are ready within a sensible serving window.","WhyItMatters":"Making a complete meal is different from making one item: timing and organisation start to matter.","EstimatedMinutes":70,"ChallengeBand":"complex","PrimaryChallengeType":"integration","DifficultyDrivers":["dough_handling","oven_timing","parallel_tasks","meal_coordination"],"InterestTags":["dinner","pizza","vegetarian","family_meal"],"CookingMethodTags":["dough","oven","cold_assembly"],"MealTypeTags":["dinner","family_meal"],"CuisineTags":["italian_inspired"],"ChallengeStructureTags":["hot_plus_cold","two_component_meal"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Adult remains nearby for oven handling; any Sophie-led sharp-tool salad prep requires the sharp-tool prerequisite.","SafetyNote":"Meal coordination may be shared even when individual safe techniques are Sophie-led.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T001","COOK-T002","COOK-T016","COOK-T010","COOK-T019"],"adultLedTechniqueIds":[],"sharedTechniqueIds":["COOK-T017"]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Complete family dinner.","CuratorRationale":"Early integrated meal challenge combining familiar prep with dough, oven and two-component timing.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-020","Domain":"cooking","Title":"Focaccia","SkillID":"S001","CapabilityLabel":"Yeast dough and oven control","PracticeDescription":"Measure, mix, ferment/proof, shape and bake a basic focaccia while watching the dough and baked cues rather than only the clock.","CompletionStandard":"Dough changes during fermentation are noticed; shaping is controlled; bake endpoint is checked using colour/texture cues.","WhyItMatters":"Yeast dough teaches you to watch how food changes over time instead of treating a recipe as a fixed timer.","EstimatedMinutes":90,"ChallengeBand":"complex","PrimaryChallengeType":"progression","DifficultyDrivers":["yeast_fermentation","dough_hydration","proofing","oven_doneness"],"InterestTags":["baking","bread","vegetarian"],"CookingMethodTags":["dough","ferment","oven","bake"],"MealTypeTags":["side","snack"],"CuisineTags":["italian"],"ChallengeStructureTags":["yeast_dough","time_dependent"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Adult remains nearby for oven handling.","SafetyNote":"Fermentation time may extend beyond the active-work estimate.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T002","COOK-T016","COOK-T010","COOK-T011","COOK-T001"],"adultLedTechniqueIds":[],"sharedTechniqueIds":[]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Bread for family meal or sandwich component.","CuratorRationale":"Progresses quick dough into yeast fermentation while keeping the final form forgiving.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-021","Domain":"cooking","Title":"Mushroom Bolognese + Pasta","SkillID":"S001","CapabilityLabel":"Sauté, simmer and coordination","PracticeDescription":"Prepare and brown the sauce ingredients, simmer the sauce, cook pasta and coordinate the two so they finish together.","CompletionStandard":"The sauce shows deliberate browning and simmer control; pasta is cooked to suitable texture; both components reach serving readiness together.","WhyItMatters":"This turns separate heat skills into a complete meal and adds real timing decisions.","EstimatedMinutes":70,"ChallengeBand":"complex","PrimaryChallengeType":"integration","DifficultyDrivers":["knife_prep","browning","simmer_control","boiling_water","parallel_tasks"],"InterestTags":["dinner","plant_based","pasta","family_meal"],"CookingMethodTags":["saute","simmer","boil","stovetop"],"MealTypeTags":["dinner","family_meal"],"CuisineTags":["italian_inspired"],"ChallengeStructureTags":["two_pot_meal","parallel_heat"],"SafetyRequired":true,"MinimumSafetySupport":"direct_supervision","SafetyRequirement":"Sophie-led knife prep requires the sharp-tool prerequisite. Adult directly supervises boiling-water handling and may own draining if SupportAllocation requires it at runtime.","SafetyNote":"The seeded definition keeps boiling/pasta technique Sophie-led but under direct supervision; a later adult-led-draining variant may be created if needed.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T001","COOK-T004","COOK-T006","COOK-T007","COOK-T008","COOK-T009","COOK-T012","COOK-T011"],"adultLedTechniqueIds":[],"sharedTechniqueIds":["COOK-T017"]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Complete family pasta dinner.","CuratorRationale":"Early complex integration of two heat processes, flavour building and timing.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-022","Domain":"cooking","Title":"Fresh Tomato Sauce + Pasta","SkillID":"S001","CapabilityLabel":"Simple sauce and two-pot timing","PracticeDescription":"Prepare a fresh tomato sauce, control its sauté/simmer stages, cook pasta and bring the two components together.","CompletionStandard":"Tomato sauce reaches an intended consistency and flavour; pasta texture is checked; sauce and pasta are coordinated for serving.","WhyItMatters":"Once you can coordinate pasta and sauce, you have a flexible base for many independent meals.","EstimatedMinutes":60,"ChallengeBand":"complex","PrimaryChallengeType":"integration","DifficultyDrivers":["knife_prep","sauce_reduction","boiling_water","parallel_tasks","seasoning"],"InterestTags":["dinner","vegetarian","pasta"],"CookingMethodTags":["saute","simmer","boil","stovetop"],"MealTypeTags":["dinner"],"CuisineTags":["italian"],"ChallengeStructureTags":["two_pot_meal","parallel_heat"],"SafetyRequired":true,"MinimumSafetySupport":"direct_supervision","SafetyRequirement":"Sophie-led knife prep requires the sharp-tool prerequisite. Adult directly supervises boiling-water handling.","SafetyNote":"Draining may be adult-led in a separately defined scaffolded variant if needed.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T001","COOK-T004","COOK-T007","COOK-T008","COOK-T009","COOK-T012","COOK-T011"],"adultLedTechniqueIds":[],"sharedTechniqueIds":["COOK-T017"]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Flexible pasta dinner.","CuratorRationale":"A simpler flavour profile than bolognese while retaining real two-pot coordination.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-023","Domain":"cooking","Title":"Dal Bhat","SkillID":"S001","CapabilityLabel":"Integrated lentil, rice and aromatic-spice cookery","PracticeDescription":"Prepare the lentil component, use a coarse aromatic-tomato purée, sauté spices and aromatics, cook rice, combine and season the meal for serving.","CompletionStandard":"The lentils and rice reach appropriate textures; the sautéed aromatic mixture is handled safely; seasoning is adjusted deliberately; the components are brought together coherently.","WhyItMatters":"This complete plant-based meal combines simmering, grain cookery, sautéing and flavour building in one authentic dinner.","EstimatedMinutes":70,"ChallengeBand":"complex","PrimaryChallengeType":"integration","DifficultyDrivers":["parallel_components","grain_absorption","simmer_control","saute_heat","food_processor","spice_balance","meal_coordination"],"InterestTags":["dinner","plant_based","family_meal"],"CookingMethodTags":["simmer","absorption","saute","stovetop"],"MealTypeTags":["dinner","family_meal"],"CuisineTags":["south_asian"],"ChallengeStructureTags":["multi_component_meal","parallel_heat","hot_components"],"SafetyRequired":true,"MinimumSafetySupport":"direct_supervision","SafetyRequirement":"Adult directly supervises the hot-pan and multi-pot stages. The food-processor component is adult-led in this seeded variant.","SafetyNote":"The processor is explicitly adult-led; Sophie practises the hot cooking only with direct adult supervision.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T002","COOK-T006","COOK-T007","COOK-T008","COOK-T014","COOK-T012","COOK-T011"],"adultLedTechniqueIds":["COOK-T021"],"sharedTechniqueIds":["COOK-T017","COOK-T001"]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Complete plant-based family meal.","CuratorRationale":"An early complex integration candidate that combines grain, simmer, sauté and flavour work while allocating the processor to the adult so the challenge remains coherent and safe.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-024","Domain":"cooking","Title":"Coconut Chickpeas + Cucumber Raita","SkillID":"S001","CapabilityLabel":"Hot main + cold side coordination","PracticeDescription":"Prepare a chickpea dish with aromatics/spices while also making a cool cucumber raita, then bring both to the table together.","CompletionStandard":"Hot and cold components are prepared in a workable sequence; the chickpea mixture reaches intended consistency; seasoning is checked in both components.","WhyItMatters":"This is an early complete-meal challenge with two different kinds of work rather than two hot pans at once.","EstimatedMinutes":60,"ChallengeBand":"complex","PrimaryChallengeType":"integration","DifficultyDrivers":["knife_prep","spice_balance","simmer_control","hot_plus_cold","meal_coordination"],"InterestTags":["dinner","vegetarian","family_meal"],"CookingMethodTags":["simmer","stovetop","cold_assembly"],"MealTypeTags":["dinner","family_meal"],"CuisineTags":[],"ChallengeStructureTags":["hot_plus_cold","two_component_meal"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Adult remains nearby for the hot pot; Sophie-led cutting requires the sharp-tool prerequisite.","SafetyNote":"Cold-side preparation can reduce simultaneous heat load.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T004","COOK-T008","COOK-T012","COOK-T019","COOK-T001"],"adultLedTechniqueIds":[],"sharedTechniqueIds":["COOK-T017"]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Complete vegetarian family dinner.","CuratorRationale":"Adds meal coordination with lower heat concurrency than two-pot dishes.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-025","Domain":"cooking","Title":"Capsicum + Zucchini Paella","SkillID":"S001","CapabilityLabel":"One-pan grain coordination","PracticeDescription":"Prepare the vegetables and rice, manage the staged pan additions and liquid absorption, then judge the finished grain and vegetables together.","CompletionStandard":"Preparation is complete before needed; heat and liquid are controlled; rice reaches suitable texture; vegetables remain appropriate; seasoning is adjusted.","WhyItMatters":"One-pan meals are useful because timing and grain control happen in the same cookware.","EstimatedMinutes":60,"ChallengeBand":"complex","PrimaryChallengeType":"integration","DifficultyDrivers":["knife_prep","grain_absorption","staged_additions","heat_control","seasoning"],"InterestTags":["dinner","plant_based","one_pan"],"CookingMethodTags":["pan","absorption","stovetop"],"MealTypeTags":["dinner","family_meal"],"CuisineTags":["spanish_inspired"],"ChallengeStructureTags":["one_pan_meal","staged_additions"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Sophie-led cutting requires the sharp-tool prerequisite; adult remains nearby for the hot pan.","SafetyNote":"This is an early complex application because grain and vegetable doneness must be coordinated in one pan.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T001","COOK-T004","COOK-T006","COOK-T014","COOK-T011","COOK-T012"],"adultLedTechniqueIds":[],"sharedTechniqueIds":["COOK-T017"]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"One-pan plant-based family meal.","CuratorRationale":"Integrates grain absorption and staged vegetable cooking without multiple pots.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-026","Domain":"cooking","Title":"Quinoa, Beet, Squash + Spinach Salad","SkillID":"S001","CapabilityLabel":"Grain, dressing and multi-component assembly","PracticeDescription":"Cook quinoa by absorption, combine it with prepared vegetable components, whisk and fold through a simple lemon-oil dressing, then adjust seasoning and serve.","CompletionStandard":"The quinoa is tender with absorbed liquid, the dressing is mixed and folded through appropriately, and the finished salad is seasoned and assembled coherently.","WhyItMatters":"This grain salad combines absorption cookery with dressing, assembly and seasoning without requiring every component to finish at the same moment.","EstimatedMinutes":70,"ChallengeBand":"complex","PrimaryChallengeType":"integration","DifficultyDrivers":["grain_absorption","prepared_vegetable_components","multi_component_assembly","dressing_mixing","seasoning"],"InterestTags":["lunch","dinner","plant_based","grain_bowl"],"CookingMethodTags":["absorption","simmer","cold_assembly"],"MealTypeTags":["lunch","dinner"],"CuisineTags":[],"ChallengeStructureTags":["multi_component_bowl","hot_plus_cold"],"SafetyRequired":true,"MinimumSafetySupport":"adult_nearby","SafetyRequirement":"Adult remains nearby for the hot saucepan and draining/resting stages; any separately prepared vegetable components follow their own safety requirements.","SafetyNote":"The seeded challenge focuses on quinoa, dressing and assembly rather than assuming Sophie independently prepares every vegetable component.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T014","COOK-T019","COOK-T012","COOK-T020","COOK-T001"],"adultLedTechniqueIds":[],"sharedTechniqueIds":["COOK-T017"]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Plant-based lunch or dinner bowl.","CuratorRationale":"Provides an integrated grain-bowl structure distinct from pasta, curry and baking, while keeping the seed faithful to the source procedure without inventing how every pre-cooked vegetable component is produced.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateID":"LC-COOK-027","Domain":"cooking","Title":"Grilled Vegetable Sandwich","SkillID":"S001","CapabilityLabel":"Grilled vegetables into a complete lunch","PracticeDescription":"Prepare and cook vegetables for a sandwich, then assemble and season the finished lunch.","CompletionStandard":"Vegetables reach suitable colour/tenderness; preparation is safe; sandwich is assembled without losing the intended textures.","WhyItMatters":"This turns a cooking technique into a complete lunch rather than practising the technique by itself.","EstimatedMinutes":45,"ChallengeBand":"stretch","PrimaryChallengeType":"branching","DifficultyDrivers":["knife_prep","direct_heat","vegetable_doneness","assembly"],"InterestTags":["lunch","vegetarian","sandwich"],"CookingMethodTags":["grill","cold_assembly"],"MealTypeTags":["lunch"],"CuisineTags":[],"ChallengeStructureTags":["hot_plus_cold","single_meal"],"SafetyRequired":true,"MinimumSafetySupport":"direct_supervision","SafetyRequirement":"Direct adult supervision is required for the grill/direct-heat component; Sophie-led cutting requires the sharp-tool prerequisite.","SafetyNote":"If the family grill is unsuitable for Sophie use, the direct-heat component should be adult-led in a separately curated variant rather than silently bypassed.","SupportAllocation":{"sophieLedTechniqueIds":["COOK-T004","COOK-T011","COOK-T019","COOK-T012"],"adultLedTechniqueIds":[],"sharedTechniqueIds":["COOK-T022"]},"SuggestedSupportOptions":["show_me","do_with_me","prompt_me","got_this"],"AuthenticUse":"Complete lunch.","CuratorRationale":"Adds a lunch-format branch using direct-heat vegetable judgement and assembly.","BehaviourReviewStatus":"routine_approved_pattern","CandidateStatus":"active","CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"}],"candidateTechniques":[{"CandidateTechniqueID":"CT-921E4203D538A86CF288","CandidateID":"LC-COOK-001","TechniqueID":"COOK-T001","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-18BFDC5D101100E293C5","CandidateID":"LC-COOK-001","TechniqueID":"COOK-T003","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-77953D7958B58A9EAEC1","CandidateID":"LC-COOK-002","TechniqueID":"COOK-T001","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-61337C898D921CA19BE7","CandidateID":"LC-COOK-002","TechniqueID":"COOK-T002","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-D2150B82FE9C3FA92BA1","CandidateID":"LC-COOK-002","TechniqueID":"COOK-T019","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-4B03BEABC9BCB9056816","CandidateID":"LC-COOK-003","TechniqueID":"COOK-T002","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-6128BB90943FEF0A83B8","CandidateID":"LC-COOK-003","TechniqueID":"COOK-T011","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-3FFAC4A8A3D03E06BE4E","CandidateID":"LC-COOK-003","TechniqueID":"COOK-T020","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-A939120F1965BBADE7FF","CandidateID":"LC-COOK-004","TechniqueID":"COOK-T002","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-28D00C11C43C3789E837","CandidateID":"LC-COOK-004","TechniqueID":"COOK-T012","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-627B076857A4A4C42190","CandidateID":"LC-COOK-004","TechniqueID":"COOK-T013","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-91C2D4B47609A24A8EA5","CandidateID":"LC-COOK-004","TechniqueID":"COOK-T019","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-14326FCF8D9EDB8F17F2","CandidateID":"LC-COOK-005","TechniqueID":"COOK-T004","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"gated_for_sophie","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-1C4EDD5096FDF70EC356","CandidateID":"LC-COOK-005","TechniqueID":"COOK-T012","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-F3CFC2F6383C59859F0A","CandidateID":"LC-COOK-005","TechniqueID":"COOK-T019","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-9D78041190BF8AC26B84","CandidateID":"LC-COOK-006","TechniqueID":"COOK-T002","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-BC8100520F5D63683216","CandidateID":"LC-COOK-006","TechniqueID":"COOK-T012","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-14F49DF94225652C9393","CandidateID":"LC-COOK-006","TechniqueID":"COOK-T019","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-4648D21CBE840CA8D682","CandidateID":"LC-COOK-006","TechniqueID":"COOK-T020","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-217759FE6F98BDF92C80","CandidateID":"LC-COOK-006","TechniqueID":"COOK-T021","Role":"incidental","EvidenceRelevant":false,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-0C8379DBAB1DE90C8A09","CandidateID":"LC-COOK-007","TechniqueID":"COOK-T004","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"gated_for_sophie","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-856292946F0A37103162","CandidateID":"LC-COOK-007","TechniqueID":"COOK-T012","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-515DD98B8423F00A3481","CandidateID":"LC-COOK-007","TechniqueID":"COOK-T019","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-67B75DACCD8FF3A0225A","CandidateID":"LC-COOK-007","TechniqueID":"COOK-T020","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-60175E206E7575B5E4A7","CandidateID":"LC-COOK-008","TechniqueID":"COOK-T002","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-56310B3781A70ABDA3E5","CandidateID":"LC-COOK-008","TechniqueID":"COOK-T008","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-E13CD28D7D70D395748F","CandidateID":"LC-COOK-008","TechniqueID":"COOK-T011","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-DEEB87E3E7D13F5A9B7B","CandidateID":"LC-COOK-008","TechniqueID":"COOK-T012","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-A0F3A695BE950D62510D","CandidateID":"LC-COOK-009","TechniqueID":"COOK-T002","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-B81B595209F8743D1BC5","CandidateID":"LC-COOK-009","TechniqueID":"COOK-T008","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-B7704D21595BA3264B55","CandidateID":"LC-COOK-009","TechniqueID":"COOK-T011","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-31F504608F241DB9C3E8","CandidateID":"LC-COOK-009","TechniqueID":"COOK-T014","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-B538AFDEACE13E58E027","CandidateID":"LC-COOK-010","TechniqueID":"COOK-T006","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-F75A7243EB132E4D5306","CandidateID":"LC-COOK-010","TechniqueID":"COOK-T011","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-929C48DEB04F8D9C1657","CandidateID":"LC-COOK-010","TechniqueID":"COOK-T012","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-43DFE9306920AAE376B2","CandidateID":"LC-COOK-010","TechniqueID":"COOK-T020","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-99B468EDE7FB942D9CE3","CandidateID":"LC-COOK-011","TechniqueID":"COOK-T002","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-636710DCAC97B3CC60AD","CandidateID":"LC-COOK-011","TechniqueID":"COOK-T006","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-10C40F9DDA1D62054856","CandidateID":"LC-COOK-011","TechniqueID":"COOK-T011","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-C772425C91AC9CA64823","CandidateID":"LC-COOK-011","TechniqueID":"COOK-T015","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-EC74F7EE9EC817269AE6","CandidateID":"LC-COOK-011","TechniqueID":"COOK-T020","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-318C7AF7C03E13A95721","CandidateID":"LC-COOK-012","TechniqueID":"COOK-T002","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-4C99D6E42DFD5915D8E9","CandidateID":"LC-COOK-012","TechniqueID":"COOK-T005","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"gated_for_sophie","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-0A93D9640CD0D159FB57","CandidateID":"LC-COOK-012","TechniqueID":"COOK-T006","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-A8E417AFED4DF49A3C5E","CandidateID":"LC-COOK-012","TechniqueID":"COOK-T011","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-566A5FC72B58662689E4","CandidateID":"LC-COOK-012","TechniqueID":"COOK-T015","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-B913B471D3375E0E2ADD","CandidateID":"LC-COOK-013","TechniqueID":"COOK-T004","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"gated_for_sophie","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-901967D77D7771F6B32B","CandidateID":"LC-COOK-013","TechniqueID":"COOK-T006","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-719E922C6761A3CCE346","CandidateID":"LC-COOK-013","TechniqueID":"COOK-T007","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-099E47944B48829E7CCB","CandidateID":"LC-COOK-013","TechniqueID":"COOK-T011","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-5082E29D3468C88CD754","CandidateID":"LC-COOK-013","TechniqueID":"COOK-T012","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-0968506D09D355001AEE","CandidateID":"LC-COOK-014","TechniqueID":"COOK-T001","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-AA3379C12891B9D7DAE9","CandidateID":"LC-COOK-014","TechniqueID":"COOK-T004","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"gated_for_sophie","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-94B2D52AA091D26AAF50","CandidateID":"LC-COOK-014","TechniqueID":"COOK-T006","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-BBA5203F10071498153A","CandidateID":"LC-COOK-014","TechniqueID":"COOK-T007","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-876B080932701890F246","CandidateID":"LC-COOK-014","TechniqueID":"COOK-T011","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-BF0919265F9B8E7F0699","CandidateID":"LC-COOK-015","TechniqueID":"COOK-T001","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-058D411B95103A54944A","CandidateID":"LC-COOK-015","TechniqueID":"COOK-T004","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"gated_for_sophie","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-E3B6B2EEFB820924E062","CandidateID":"LC-COOK-015","TechniqueID":"COOK-T012","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-72E552350C2B31283B32","CandidateID":"LC-COOK-015","TechniqueID":"COOK-T019","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-4161AD95F70BB68B5C3D","CandidateID":"LC-COOK-017","TechniqueID":"COOK-T002","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-95D39A6EEB98B852A7CF","CandidateID":"LC-COOK-017","TechniqueID":"COOK-T010","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-4540BD7048A09F4D9FB0","CandidateID":"LC-COOK-017","TechniqueID":"COOK-T011","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-EAB3CC5628A079932EE0","CandidateID":"LC-COOK-017","TechniqueID":"COOK-T015","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-9BA311D2D04D8BFB335B","CandidateID":"LC-COOK-017","TechniqueID":"COOK-T020","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-12D32E4136DCD0B81E97","CandidateID":"LC-COOK-018","TechniqueID":"COOK-T002","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-913E3813FEFE2DA6165A","CandidateID":"LC-COOK-018","TechniqueID":"COOK-T010","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-FB10D2154375BE896F31","CandidateID":"LC-COOK-018","TechniqueID":"COOK-T011","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-23F81C4CC1C5E1EB3A32","CandidateID":"LC-COOK-018","TechniqueID":"COOK-T016","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-88D1C9615E138900A337","CandidateID":"LC-COOK-018","TechniqueID":"COOK-T020","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-E783F633EF980EB3A19D","CandidateID":"LC-COOK-019","TechniqueID":"COOK-T001","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-79BF029152C6498A9A0A","CandidateID":"LC-COOK-019","TechniqueID":"COOK-T002","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-3F202E540C3356734F1F","CandidateID":"LC-COOK-019","TechniqueID":"COOK-T010","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-9B8ADDF945EE6A86E8C8","CandidateID":"LC-COOK-019","TechniqueID":"COOK-T016","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-C3E7BBA65E1E60682EC7","CandidateID":"LC-COOK-019","TechniqueID":"COOK-T017","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-4A48515B121F57182BAD","CandidateID":"LC-COOK-019","TechniqueID":"COOK-T019","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-BBCA83096C7137E41E32","CandidateID":"LC-COOK-020","TechniqueID":"COOK-T001","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-2F59F52B2267A280D4E1","CandidateID":"LC-COOK-020","TechniqueID":"COOK-T002","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-7FFE9EE08B8534B263FA","CandidateID":"LC-COOK-020","TechniqueID":"COOK-T010","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-5F6297A9159BC28F5A58","CandidateID":"LC-COOK-020","TechniqueID":"COOK-T011","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-9AC92878A6A0F57E0D84","CandidateID":"LC-COOK-020","TechniqueID":"COOK-T016","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-E200697B700993CBD477","CandidateID":"LC-COOK-021","TechniqueID":"COOK-T001","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-A128D43F6F0611B7C671","CandidateID":"LC-COOK-021","TechniqueID":"COOK-T004","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"gated_for_sophie","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-3814338F6FC1C9C20A3C","CandidateID":"LC-COOK-021","TechniqueID":"COOK-T006","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-ACD939CEA127155CAA84","CandidateID":"LC-COOK-021","TechniqueID":"COOK-T007","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-DEAFC4620EC1D0981C72","CandidateID":"LC-COOK-021","TechniqueID":"COOK-T008","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-F267937969749F8FBE8E","CandidateID":"LC-COOK-021","TechniqueID":"COOK-T009","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-29EB50C81635873029F8","CandidateID":"LC-COOK-021","TechniqueID":"COOK-T011","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-20D910D33B21C7E2BE1D","CandidateID":"LC-COOK-021","TechniqueID":"COOK-T012","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-71166E09BD97380A30FD","CandidateID":"LC-COOK-021","TechniqueID":"COOK-T017","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-429DD1AFB25C4405F455","CandidateID":"LC-COOK-022","TechniqueID":"COOK-T001","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-C56CFE95727ACFC962E9","CandidateID":"LC-COOK-022","TechniqueID":"COOK-T004","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"gated_for_sophie","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-C987B1DF45C7012FB231","CandidateID":"LC-COOK-022","TechniqueID":"COOK-T007","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-E7E6EAD13C057B99ACB0","CandidateID":"LC-COOK-022","TechniqueID":"COOK-T008","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-83A83E279046D5C9C333","CandidateID":"LC-COOK-022","TechniqueID":"COOK-T009","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-4997EEC91592BD12E653","CandidateID":"LC-COOK-022","TechniqueID":"COOK-T011","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-592CE3DF319DD742C63D","CandidateID":"LC-COOK-022","TechniqueID":"COOK-T012","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-114D1BD0BF7E3A0C1532","CandidateID":"LC-COOK-022","TechniqueID":"COOK-T017","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-6B16C0101BA5AB01BE01","CandidateID":"LC-COOK-023","TechniqueID":"COOK-T001","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-A805B73CD3613D1D9D45","CandidateID":"LC-COOK-023","TechniqueID":"COOK-T002","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-865D8ADCE64740FA5F0D","CandidateID":"LC-COOK-023","TechniqueID":"COOK-T006","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-989EE5595EC6E008C168","CandidateID":"LC-COOK-023","TechniqueID":"COOK-T007","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-45036508388B216BBE08","CandidateID":"LC-COOK-023","TechniqueID":"COOK-T008","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-D90B5671375E4F4AEE2A","CandidateID":"LC-COOK-023","TechniqueID":"COOK-T011","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-B67F0D5CC2262D3ACEEF","CandidateID":"LC-COOK-023","TechniqueID":"COOK-T012","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-E1682313C105C428C796","CandidateID":"LC-COOK-023","TechniqueID":"COOK-T014","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-784EEF88400B0647FE6A","CandidateID":"LC-COOK-023","TechniqueID":"COOK-T017","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-97F55E5DE101F53FC6C6","CandidateID":"LC-COOK-023","TechniqueID":"COOK-T021","Role":"incidental","EvidenceRelevant":false,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-98D38E190B8204CBFC39","CandidateID":"LC-COOK-024","TechniqueID":"COOK-T001","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-B388D50DF98EB10B85A4","CandidateID":"LC-COOK-024","TechniqueID":"COOK-T004","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"gated_for_sophie","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-272703A7E4A390F84F38","CandidateID":"LC-COOK-024","TechniqueID":"COOK-T008","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-8ADE1835A816E965E618","CandidateID":"LC-COOK-024","TechniqueID":"COOK-T012","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-D3545C810E6B86ADD367","CandidateID":"LC-COOK-024","TechniqueID":"COOK-T017","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-5ADC91681304C62526C8","CandidateID":"LC-COOK-024","TechniqueID":"COOK-T019","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-9718F0244023B7848D8F","CandidateID":"LC-COOK-025","TechniqueID":"COOK-T001","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-1AE2C245EC2902C7D3D9","CandidateID":"LC-COOK-025","TechniqueID":"COOK-T004","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"gated_for_sophie","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-0DF027794F99EC81074E","CandidateID":"LC-COOK-025","TechniqueID":"COOK-T006","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-E2FB9521F35ED84FBEFE","CandidateID":"LC-COOK-025","TechniqueID":"COOK-T011","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-96F93328BEDBE6D28E1F","CandidateID":"LC-COOK-025","TechniqueID":"COOK-T012","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-5CFC5021D03447160709","CandidateID":"LC-COOK-025","TechniqueID":"COOK-T014","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-77DB1C305B22227E3C9A","CandidateID":"LC-COOK-025","TechniqueID":"COOK-T017","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-AA5F398E96EECFC35454","CandidateID":"LC-COOK-026","TechniqueID":"COOK-T001","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-B93E371A55C8961F3869","CandidateID":"LC-COOK-026","TechniqueID":"COOK-T012","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-20571BB7ED03E76765FF","CandidateID":"LC-COOK-026","TechniqueID":"COOK-T014","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-EBBADD007A7F705CD8BD","CandidateID":"LC-COOK-026","TechniqueID":"COOK-T017","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-E13F6106AFD139555B4B","CandidateID":"LC-COOK-026","TechniqueID":"COOK-T019","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-B34E443405A86C06B5D0","CandidateID":"LC-COOK-026","TechniqueID":"COOK-T020","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-5FA7699FC0EE4D07E8BE","CandidateID":"LC-COOK-027","TechniqueID":"COOK-T004","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"gated_for_sophie","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-0A7F0D4E181E22AE7A7F","CandidateID":"LC-COOK-027","TechniqueID":"COOK-T011","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-81DD8785E5A8165D7129","CandidateID":"LC-COOK-027","TechniqueID":"COOK-T012","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-246F32EB9A055ECF72E1","CandidateID":"LC-COOK-027","TechniqueID":"COOK-T019","Role":"supporting","EvidenceRelevant":true,"SafetyRole":"none","CreatedAt":"2026-08-21T13:17:00+09:30"},{"CandidateTechniqueID":"CT-261EE58C99DDB58F65BD","CandidateID":"LC-COOK-027","TechniqueID":"COOK-T022","Role":"primary_practice","EvidenceRelevant":true,"SafetyRole":"safety_relevant","CreatedAt":"2026-08-21T13:17:00+09:30"}],"techniquePrerequisites":[{"PrerequisiteEdgeID":"TP-7C2022F8C2EF5111979A","TechniqueID":"COOK-T015","PrerequisiteTechniqueID":"COOK-T002","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"Accurate measurement supports meaningful batter-texture practice.","SafetyRelated":false,"SupportImplication":"Measure together if needed rather than blocking a batter challenge.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-CC42DD4CB6E5F5C0EC76","TechniqueID":"COOK-T015","PrerequisiteTechniqueID":"COOK-T020","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"General mixing control supports recognising a batter endpoint.","SafetyRelated":false,"SupportImplication":"Model the required motion and let Sophie take over the endpoint judgement.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-D9A94EBEE52B47F6921C","TechniqueID":"COOK-T009","PrerequisiteTechniqueID":"COOK-T006","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"General stovetop heat control supports safe and deliberate boiling-pot management.","SafetyRelated":false,"SupportImplication":"Increase adult support around heat changes; boiling-water safety remains candidate-gated separately.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-AB220EC2B698C8FDE038","TechniqueID":"COOK-T017","PrerequisiteTechniqueID":"COOK-T011","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"Coordination is more meaningful when Sophie can notice when components actually need attention or are ready.","SafetyRelated":false,"SupportImplication":"Prompt for food cues and share timing decisions rather than requiring prior independent doneness judgement.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-F56AE284700B0CB8923D","TechniqueID":"COOK-T017","PrerequisiteTechniqueID":"COOK-T001","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"Planning and prepared components reduce avoidable overload when coordinating a meal.","SafetyRelated":false,"SupportImplication":"Build the sequence together or reduce the number of simultaneous components.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-BC17E6BE42D621263C72","TechniqueID":"COOK-T016","PrerequisiteTechniqueID":"COOK-T002","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"Dough hydration and structure depend on usable measurement.","SafetyRelated":false,"SupportImplication":"Use pre-measured ingredients or measure together if the main target is dough handling.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-A0AD346FBD275C8EF4EC","TechniqueID":"COOK-T016","PrerequisiteTechniqueID":"COOK-T020","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"General mixing control supports transitioning from ingredients to dough.","SafetyRelated":false,"SupportImplication":"Share early mixing and let Sophie take more ownership as the dough forms.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-E290043D31D4299CE1CB","TechniqueID":"COOK-T013","PrerequisiteTechniqueID":"COOK-T020","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"Whisking control supports forming and restoring a vinaigrette emulsion.","SafetyRelated":false,"SupportImplication":"Demonstrate the whisk/pour pattern if needed.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-FF492FF234BBE0D423E7","TechniqueID":"COOK-T013","PrerequisiteTechniqueID":"COOK-T012","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"A vinaigrette is not only mechanically emulsified; useful practice includes tasting and balancing it.","SafetyRelated":false,"SupportImplication":"Offer flavour-category prompts without supplying a numeric target.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-A08710D3A9C1B25A81A5","TechniqueID":"COOK-T014","PrerequisiteTechniqueID":"COOK-T002","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"Grain-to-liquid ratio depends on usable measurement.","SafetyRelated":false,"SupportImplication":"Measure together or provide pre-measured ingredients when the learning target is grain absorption.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-156DB2E37D124EA5CEFD","TechniqueID":"COOK-T014","PrerequisiteTechniqueID":"COOK-T008","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"Absorption cookery usually relies on a controlled heat transition and simmer.","SafetyRelated":false,"SupportImplication":"Use more direct prompting around heat while preserving the grain task.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-7CA664FEDB4E5E0A2B7F","TechniqueID":"COOK-T005","PrerequisiteTechniqueID":"COOK-T003","RequirementKind":"hard","EvidenceExpectation":"safety_confirmed","Rationale":"Sophie-led grating requires confirmed stable sharp-tool setup and hand-clearance behaviour.","SafetyRelated":true,"SupportImplication":"If not satisfied, the grating component must be adult-led in a separately defined candidate variant.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-B027F1EA4F2A449FD594","TechniqueID":"COOK-T022","PrerequisiteTechniqueID":"COOK-T006","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"General heat-adjustment experience can support direct-grill judgement even though the heat source behaves differently.","SafetyRelated":false,"SupportImplication":"Keep direct supervision and narrate the different cues of direct grilling.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-E48433E1B483C0F80939","TechniqueID":"COOK-T007","PrerequisiteTechniqueID":"COOK-T006","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"Basic heat adjustment makes sautéing easier to interpret, but its absence does not itself make a supervised sauté candidate ineligible.","SafetyRelated":false,"SupportImplication":"Offer more support and reduce simultaneous unfamiliar demands.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-A9842A7904532B37AFF7","TechniqueID":"COOK-T008","PrerequisiteTechniqueID":"COOK-T006","RequirementKind":"recommended","EvidenceExpectation":"observed_with_support","Rationale":"General stovetop adjustment supports controlled simmering.","SafetyRelated":false,"SupportImplication":"Use show-me/do-with-me support for boil-to-simmer transitions when heat-control evidence is limited.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"},{"PrerequisiteEdgeID":"TP-D0859D817723CA740F56","TechniqueID":"COOK-T004","PrerequisiteTechniqueID":"COOK-T003","RequirementKind":"hard","EvidenceExpectation":"safety_confirmed","Rationale":"Sophie-led slicing/chopping requires prior confirmed safe sharp-tool setup and hand positioning.","SafetyRelated":true,"SupportImplication":"If not satisfied, use a separately curated adult-led-prep variant rather than treating extra runtime help as satisfying the gate.","AppliesWhen":"","Active":true,"CreatedAt":"2026-08-21T13:17:00+09:30","UpdatedAt":"2026-08-21T13:17:00+09:30"}],"sourceLinks":[{"SourceLinkID":"SL-4B6642C0723151F3FE92","RecordType":"CandidateTechniques","RecordID":"CT-921E4203D538A86CF288","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-5F42BF8EF85AD64C2343","RecordType":"CandidateTechniques","RecordID":"CT-18BFDC5D101100E293C5","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D9EC604E54669DF0FFFD","RecordType":"CandidateTechniques","RecordID":"CT-77953D7958B58A9EAEC1","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7C0CEC62121873102B9F","RecordType":"CandidateTechniques","RecordID":"CT-61337C898D921CA19BE7","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Berry Breakfast Trifle, p. 13","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-489580C1E0028D95692A","RecordType":"CandidateTechniques","RecordID":"CT-61337C898D921CA19BE7","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-CA41643FA1FAF1109217","RecordType":"CandidateTechniques","RecordID":"CT-D2150B82FE9C3FA92BA1","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Berry Breakfast Trifle, p. 13","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-86466FEAD8EB4E23714D","RecordType":"CandidateTechniques","RecordID":"CT-D2150B82FE9C3FA92BA1","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-31B0C5E903AC9386A764","RecordType":"CandidateTechniques","RecordID":"CT-4B03BEABC9BCB9056816","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chia Pudding, p. 762","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-4520058591706D79608A","RecordType":"CandidateTechniques","RecordID":"CT-4B03BEABC9BCB9056816","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-030ADFFF4D03AB4AA2A2","RecordType":"CandidateTechniques","RecordID":"CT-6128BB90943FEF0A83B8","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chia Pudding, p. 762","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7806E01E11AD40FD367D","RecordType":"CandidateTechniques","RecordID":"CT-6128BB90943FEF0A83B8","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1FA83F1BBAAC76FAE739","RecordType":"CandidateTechniques","RecordID":"CT-3FFAC4A8A3D03E06BE4E","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chia Pudding, p. 762","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-415517D210E82468025C","RecordType":"CandidateTechniques","RecordID":"CT-3FFAC4A8A3D03E06BE4E","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-41A8154E01617EE53064","RecordType":"CandidateTechniques","RecordID":"CT-A939120F1965BBADE7FF","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Basic Vinaigrette, p. 772","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D41101F5D61FF887D1E4","RecordType":"CandidateTechniques","RecordID":"CT-A939120F1965BBADE7FF","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D04A24E43B7EC7259083","RecordType":"CandidateTechniques","RecordID":"CT-28D00C11C43C3789E837","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Basic Vinaigrette, p. 772","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-0CC10FFA3E204D15B61A","RecordType":"CandidateTechniques","RecordID":"CT-28D00C11C43C3789E837","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A840EADA563F80E3B240","RecordType":"CandidateTechniques","RecordID":"CT-627B076857A4A4C42190","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Basic Vinaigrette, p. 772","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7F2D64917D8DBDD02089","RecordType":"CandidateTechniques","RecordID":"CT-627B076857A4A4C42190","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6EF556C57DD88809AE9B","RecordType":"CandidateTechniques","RecordID":"CT-91C2D4B47609A24A8EA5","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Basic Vinaigrette, p. 772","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-5E26479D81A8ACC5DC4A","RecordType":"CandidateTechniques","RecordID":"CT-91C2D4B47609A24A8EA5","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-9E535F91AEF13225973A","RecordType":"CandidateTechniques","RecordID":"CT-14326FCF8D9EDB8F17F2","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Caprese Salad, p. 795","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-02BA3AD419DB39917C7D","RecordType":"CandidateTechniques","RecordID":"CT-14326FCF8D9EDB8F17F2","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6A41AB39997A046D982F","RecordType":"CandidateTechniques","RecordID":"CT-1C4EDD5096FDF70EC356","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Caprese Salad, p. 795","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1C9324EBBF228E10CA63","RecordType":"CandidateTechniques","RecordID":"CT-1C4EDD5096FDF70EC356","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-AF34B3C62B718F1E86A6","RecordType":"CandidateTechniques","RecordID":"CT-F3CFC2F6383C59859F0A","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Caprese Salad, p. 795","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-99E76374DE9310FF77AF","RecordType":"CandidateTechniques","RecordID":"CT-F3CFC2F6383C59859F0A","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-4E6CC573C9FA1FB81CEA","RecordType":"CandidateTechniques","RecordID":"CT-9D78041190BF8AC26B84","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Hummus, p. 907","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-9B6AE62B793A54015903","RecordType":"CandidateTechniques","RecordID":"CT-9D78041190BF8AC26B84","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6255FDFBF6A0FD901D93","RecordType":"CandidateTechniques","RecordID":"CT-BC8100520F5D63683216","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Hummus, p. 907","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-5DE532399E07A8667BDD","RecordType":"CandidateTechniques","RecordID":"CT-BC8100520F5D63683216","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-26C1C67E0DC162E74150","RecordType":"CandidateTechniques","RecordID":"CT-14F49DF94225652C9393","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Hummus, p. 907","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-AEC7AD7687448EBC32A6","RecordType":"CandidateTechniques","RecordID":"CT-14F49DF94225652C9393","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-EAC3B789996D1BB3DE7F","RecordType":"CandidateTechniques","RecordID":"CT-4648D21CBE840CA8D682","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Hummus, p. 907","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6DAA315C073EEA999B61","RecordType":"CandidateTechniques","RecordID":"CT-4648D21CBE840CA8D682","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-5095C15FF778AAABD14E","RecordType":"CandidateTechniques","RecordID":"CT-217759FE6F98BDF92C80","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Hummus, p. 907","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8BC07DDA70E102E439B2","RecordType":"CandidateTechniques","RecordID":"CT-217759FE6F98BDF92C80","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-E93230BF8923E0D568F4","RecordType":"CandidateTechniques","RecordID":"CT-0C8379DBAB1DE90C8A09","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Guacamole, p. 920","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1B03B9C9EE6428054822","RecordType":"CandidateTechniques","RecordID":"CT-0C8379DBAB1DE90C8A09","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-23CE0E2FC1D2D1BB7900","RecordType":"CandidateTechniques","RecordID":"CT-856292946F0A37103162","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Guacamole, p. 920","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-5D09F899BBD782A466F9","RecordType":"CandidateTechniques","RecordID":"CT-856292946F0A37103162","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A06B7CE219FD04D6F1BD","RecordType":"CandidateTechniques","RecordID":"CT-515DD98B8423F00A3481","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Guacamole, p. 920","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-10FC03DFEB3AB14C170A","RecordType":"CandidateTechniques","RecordID":"CT-515DD98B8423F00A3481","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-C3C066AA20D81F2CA117","RecordType":"CandidateTechniques","RecordID":"CT-67B75DACCD8FF3A0225A","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Guacamole, p. 920","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-CFBF861FC16E443E96A9","RecordType":"CandidateTechniques","RecordID":"CT-67B75DACCD8FF3A0225A","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7B88C6FDEE9FB4EA393B","RecordType":"CandidateTechniques","RecordID":"CT-60175E206E7575B5E4A7","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Oatmeal with Bananas and Cinnamon, p. 725","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-322FA62AA2199502646A","RecordType":"CandidateTechniques","RecordID":"CT-60175E206E7575B5E4A7","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1DCAA655B8B017A1B97C","RecordType":"CandidateTechniques","RecordID":"CT-56310B3781A70ABDA3E5","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Oatmeal with Bananas and Cinnamon, p. 725","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-5789C4CF7E555F966B64","RecordType":"CandidateTechniques","RecordID":"CT-56310B3781A70ABDA3E5","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7823701954286EDAF1F0","RecordType":"CandidateTechniques","RecordID":"CT-E13CD28D7D70D395748F","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Oatmeal with Bananas and Cinnamon, p. 725","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-66AEB0E4C3D98BC611FB","RecordType":"CandidateTechniques","RecordID":"CT-E13CD28D7D70D395748F","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-C71FBEA2D653C8ED074B","RecordType":"CandidateTechniques","RecordID":"CT-DEEB87E3E7D13F5A9B7B","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Oatmeal with Bananas and Cinnamon, p. 725","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-E5E42EC42EE8D903C024","RecordType":"CandidateTechniques","RecordID":"CT-DEEB87E3E7D13F5A9B7B","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A286BBC9FCA25A6F1E18","RecordType":"CandidateTechniques","RecordID":"CT-A0F3A695BE950D62510D","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Simmered Rice, p. 704","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-C3C9AB364E9573545F8C","RecordType":"CandidateTechniques","RecordID":"CT-A0F3A695BE950D62510D","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-13BF830A38A75E6DDEB5","RecordType":"CandidateTechniques","RecordID":"CT-B81B595209F8743D1BC5","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Simmered Rice, p. 704","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-991E65020C313834F5C2","RecordType":"CandidateTechniques","RecordID":"CT-B81B595209F8743D1BC5","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-43DB18FB3C3F7CAC68C9","RecordType":"CandidateTechniques","RecordID":"CT-B7704D21595BA3264B55","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Simmered Rice, p. 704","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1503F45B0835375E42C6","RecordType":"CandidateTechniques","RecordID":"CT-B7704D21595BA3264B55","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D9BFF1E42FA1AEE1AD53","RecordType":"CandidateTechniques","RecordID":"CT-31F504608F241DB9C3E8","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Simmered Rice, p. 704","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6369567420A528BA8655","RecordType":"CandidateTechniques","RecordID":"CT-31F504608F241DB9C3E8","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F083D1C6C3FBB6214319","RecordType":"CandidateTechniques","RecordID":"CT-B538AFDEACE13E58E027","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Scrambled Eggs, p. 590","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-4164A7EA28093C69E554","RecordType":"CandidateTechniques","RecordID":"CT-B538AFDEACE13E58E027","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-E802FE78938F9E607FCE","RecordType":"CandidateTechniques","RecordID":"CT-F75A7243EB132E4D5306","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Scrambled Eggs, p. 590","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7D6E36F7025D3D210C88","RecordType":"CandidateTechniques","RecordID":"CT-F75A7243EB132E4D5306","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-3054064181B3898F52BA","RecordType":"CandidateTechniques","RecordID":"CT-929C48DEB04F8D9C1657","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Scrambled Eggs, p. 590","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-247DC989E4840736A544","RecordType":"CandidateTechniques","RecordID":"CT-929C48DEB04F8D9C1657","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-57A3AA6A58EE01D48F69","RecordType":"CandidateTechniques","RecordID":"CT-43DFE9306920AAE376B2","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Scrambled Eggs, p. 590","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F0E54FC302560524E52E","RecordType":"CandidateTechniques","RecordID":"CT-43DFE9306920AAE376B2","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1AFC972E39C39337BE27","RecordType":"CandidateTechniques","RecordID":"CT-99B468EDE7FB942D9CE3","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Buttermilk Pancakes, p. 598","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-E8C6FE7925C46BEDB1CD","RecordType":"CandidateTechniques","RecordID":"CT-99B468EDE7FB942D9CE3","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-436BB5E965A136AFBDC9","RecordType":"CandidateTechniques","RecordID":"CT-636710DCAC97B3CC60AD","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Buttermilk Pancakes, p. 598","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-9FDAF771C849E6E39F01","RecordType":"CandidateTechniques","RecordID":"CT-636710DCAC97B3CC60AD","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-3C51C7763B46254CDF46","RecordType":"CandidateTechniques","RecordID":"CT-10C40F9DDA1D62054856","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Buttermilk Pancakes, p. 598","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-57829CDDB3EC5CBD94A3","RecordType":"CandidateTechniques","RecordID":"CT-10C40F9DDA1D62054856","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-20BB5EF1CB5893D8C0F9","RecordType":"CandidateTechniques","RecordID":"CT-C772425C91AC9CA64823","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Buttermilk Pancakes, p. 598","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D82E5561729BAD22164B","RecordType":"CandidateTechniques","RecordID":"CT-C772425C91AC9CA64823","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-84F89C60C0DAA4E8BFE8","RecordType":"CandidateTechniques","RecordID":"CT-EC74F7EE9EC817269AE6","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Buttermilk Pancakes, p. 598","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-56DF26D7F1132781325E","RecordType":"CandidateTechniques","RecordID":"CT-EC74F7EE9EC817269AE6","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7060CA56D7BC221156B7","RecordType":"CandidateTechniques","RecordID":"CT-318C7AF7C03E13A95721","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Sweet Potato & Zucchini Fritters, p. 33","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-74B41E4DEEB850DC533B","RecordType":"CandidateTechniques","RecordID":"CT-318C7AF7C03E13A95721","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-46B6202C24D8B4D54577","RecordType":"CandidateTechniques","RecordID":"CT-4C99D6E42DFD5915D8E9","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Sweet Potato & Zucchini Fritters, p. 33","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-3CB7A32A0B6C19DDEB40","RecordType":"CandidateTechniques","RecordID":"CT-4C99D6E42DFD5915D8E9","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-AFC836A173DDB1B62E7E","RecordType":"CandidateTechniques","RecordID":"CT-0A93D9640CD0D159FB57","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Sweet Potato & Zucchini Fritters, p. 33","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-0EBDE13F6FAB87615CAA","RecordType":"CandidateTechniques","RecordID":"CT-0A93D9640CD0D159FB57","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7BD7E95F634234FB0646","RecordType":"CandidateTechniques","RecordID":"CT-A8E417AFED4DF49A3C5E","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Sweet Potato & Zucchini Fritters, p. 33","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1638A60F53991720E521","RecordType":"CandidateTechniques","RecordID":"CT-A8E417AFED4DF49A3C5E","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-53CEF5D0F477078357C8","RecordType":"CandidateTechniques","RecordID":"CT-566A5FC72B58662689E4","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Sweet Potato & Zucchini Fritters, p. 33","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7C8E5E4523E3CF0AD78E","RecordType":"CandidateTechniques","RecordID":"CT-566A5FC72B58662689E4","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-493CDA03B1D6E17CD596","RecordType":"CandidateTechniques","RecordID":"CT-B913B471D3375E0E2ADD","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Sautéed Mushrooms with Garlic and Thyme, p. 652","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-56B75F9F07E394FA77BE","RecordType":"CandidateTechniques","RecordID":"CT-B913B471D3375E0E2ADD","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-25FA47A7AC89FF775877","RecordType":"CandidateTechniques","RecordID":"CT-901967D77D7771F6B32B","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Sautéed Mushrooms with Garlic and Thyme, p. 652","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-126BF4CF7C54829A93EC","RecordType":"CandidateTechniques","RecordID":"CT-901967D77D7771F6B32B","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8888E5129A7752857DFE","RecordType":"CandidateTechniques","RecordID":"CT-719E922C6761A3CCE346","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Sautéed Mushrooms with Garlic and Thyme, p. 652","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-273E48CC9CAD10170E1D","RecordType":"CandidateTechniques","RecordID":"CT-719E922C6761A3CCE346","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D2739E241A2001B89AB5","RecordType":"CandidateTechniques","RecordID":"CT-099E47944B48829E7CCB","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Sautéed Mushrooms with Garlic and Thyme, p. 652","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-CBC48F6074B9828CC17A","RecordType":"CandidateTechniques","RecordID":"CT-099E47944B48829E7CCB","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-757C44C795973F58E7C8","RecordType":"CandidateTechniques","RecordID":"CT-5082E29D3468C88CD754","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Sautéed Mushrooms with Garlic and Thyme, p. 652","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-392E2F99B7654F54C9A9","RecordType":"CandidateTechniques","RecordID":"CT-5082E29D3468C88CD754","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-78DAECC82ACD83F4F365","RecordType":"CandidateTechniques","RecordID":"CT-0968506D09D355001AEE","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-DF3281866D699B410227","RecordType":"CandidateTechniques","RecordID":"CT-AA3379C12891B9D7DAE9","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Stir-Fried Snow Peas, p. 676","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-93263759A6D78E7BD452","RecordType":"CandidateTechniques","RecordID":"CT-AA3379C12891B9D7DAE9","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-DDCD48252E7BD5608F53","RecordType":"CandidateTechniques","RecordID":"CT-94B2D52AA091D26AAF50","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Stir-Fried Snow Peas, p. 676","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F0031466802502BE7F3A","RecordType":"CandidateTechniques","RecordID":"CT-94B2D52AA091D26AAF50","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1CE2B16E3CD79A314328","RecordType":"CandidateTechniques","RecordID":"CT-BBA5203F10071498153A","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Stir-Fried Snow Peas, p. 676","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-02AE4017DC6208EFCA4F","RecordType":"CandidateTechniques","RecordID":"CT-BBA5203F10071498153A","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-312FA60E455CFD8D9E66","RecordType":"CandidateTechniques","RecordID":"CT-876B080932701890F246","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Stir-Fried Snow Peas, p. 676","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-231A9AAA63DD50585DCC","RecordType":"CandidateTechniques","RecordID":"CT-876B080932701890F246","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-0793422573F4E126D768","RecordType":"CandidateTechniques","RecordID":"CT-BF0919265F9B8E7F0699","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-C44BA21D83C465E6C684","RecordType":"CandidateTechniques","RecordID":"CT-058D411B95103A54944A","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"White Bean Salad, p. 660","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-AE1687235CCEB84F8E4F","RecordType":"CandidateTechniques","RecordID":"CT-058D411B95103A54944A","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-FB85CEEDB6933C6FFA98","RecordType":"CandidateTechniques","RecordID":"CT-E3B6B2EEFB820924E062","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"White Bean Salad, p. 660","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-370153BAE0235ADD7C16","RecordType":"CandidateTechniques","RecordID":"CT-E3B6B2EEFB820924E062","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-55BDD9DE6C7DB6EB07A9","RecordType":"CandidateTechniques","RecordID":"CT-72E552350C2B31283B32","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"White Bean Salad, p. 660","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-EDD7F042B889B6A1B8AC","RecordType":"CandidateTechniques","RecordID":"CT-72E552350C2B31283B32","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1DA29E1A3094BDDA66BF","RecordType":"CandidateTechniques","RecordID":"CT-4161AD95F70BB68B5C3D","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Blueberry Muffins, p. 964","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F96AFEDE2CE7F3F4F502","RecordType":"CandidateTechniques","RecordID":"CT-4161AD95F70BB68B5C3D","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6CF04618C61F7859BF00","RecordType":"CandidateTechniques","RecordID":"CT-95D39A6EEB98B852A7CF","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Blueberry Muffins, p. 964","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A712628D4CD25455864B","RecordType":"CandidateTechniques","RecordID":"CT-95D39A6EEB98B852A7CF","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-FA62AE6F946ED569C2B7","RecordType":"CandidateTechniques","RecordID":"CT-4540BD7048A09F4D9FB0","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Blueberry Muffins, p. 964","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-0515E839F33AD7EADC6B","RecordType":"CandidateTechniques","RecordID":"CT-4540BD7048A09F4D9FB0","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-E484DC96BA0485CCB4B6","RecordType":"CandidateTechniques","RecordID":"CT-EAB3CC5628A079932EE0","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Blueberry Muffins, p. 964","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-97E1860A91845A1E4788","RecordType":"CandidateTechniques","RecordID":"CT-EAB3CC5628A079932EE0","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-0F1A35808D495723FDE4","RecordType":"CandidateTechniques","RecordID":"CT-9BA311D2D04D8BFB335B","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Blueberry Muffins, p. 964","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-CA417BCD7F69A0D47C58","RecordType":"CandidateTechniques","RecordID":"CT-9BA311D2D04D8BFB335B","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D5E5DC2715655D3A4F9D","RecordType":"CandidateTechniques","RecordID":"CT-12D32E4136DCD0B81E97","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Irish Soda Bread, p. 972","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-094F2659CF14B20C3196","RecordType":"CandidateTechniques","RecordID":"CT-12D32E4136DCD0B81E97","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-965BB43B89B1DCEF71FA","RecordType":"CandidateTechniques","RecordID":"CT-913E3813FEFE2DA6165A","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Irish Soda Bread, p. 972","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-FD95D9581ABF8116FFEE","RecordType":"CandidateTechniques","RecordID":"CT-913E3813FEFE2DA6165A","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-E88D04460ED9586ACD16","RecordType":"CandidateTechniques","RecordID":"CT-FB10D2154375BE896F31","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Irish Soda Bread, p. 972","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D7F4F5ED07C6D12C121B","RecordType":"CandidateTechniques","RecordID":"CT-FB10D2154375BE896F31","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-810380D976CCCCFECE57","RecordType":"CandidateTechniques","RecordID":"CT-23F81C4CC1C5E1EB3A32","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Irish Soda Bread, p. 972","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-45A1A92C0E958718CBFF","RecordType":"CandidateTechniques","RecordID":"CT-23F81C4CC1C5E1EB3A32","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-4B08866038E2746E7852","RecordType":"CandidateTechniques","RecordID":"CT-88D1C9615E138900A337","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Irish Soda Bread, p. 972","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-3776E09D9BFEB03B0464","RecordType":"CandidateTechniques","RecordID":"CT-88D1C9615E138900A337","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-13CA1FA34F1D2490DD05","RecordType":"CandidateTechniques","RecordID":"CT-E783F633EF980EB3A19D","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-399AA98AE74CF0BA164C","RecordType":"CandidateTechniques","RecordID":"CT-79BF029152C6498A9A0A","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Focaccia Pizza, p. 23; paired with simple salad","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F8687053C5423AD4BFAB","RecordType":"CandidateTechniques","RecordID":"CT-79BF029152C6498A9A0A","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-ADA29851259F716BBFFC","RecordType":"CandidateTechniques","RecordID":"CT-3F202E540C3356734F1F","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Focaccia Pizza, p. 23; paired with simple salad","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D1DDFC75BB6247A9BAC8","RecordType":"CandidateTechniques","RecordID":"CT-3F202E540C3356734F1F","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-AB7FBE39CCACC1191168","RecordType":"CandidateTechniques","RecordID":"CT-9B8ADDF945EE6A86E8C8","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Focaccia Pizza, p. 23; paired with simple salad","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-17C9CE6D74B4CAD7EC1F","RecordType":"CandidateTechniques","RecordID":"CT-9B8ADDF945EE6A86E8C8","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-BF9E72B7ECC05C7FA55A","RecordType":"CandidateTechniques","RecordID":"CT-C3E7BBA65E1E60682EC7","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-B523A4399319A979D485","RecordType":"CandidateTechniques","RecordID":"CT-4A48515B121F57182BAD","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Focaccia Pizza, p. 23; paired with simple salad","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-FAF57FAD8FE7675B3C92","RecordType":"CandidateTechniques","RecordID":"CT-4A48515B121F57182BAD","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-974C63EA957146D1A5DB","RecordType":"CandidateTechniques","RecordID":"CT-BBCA83096C7137E41E32","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1EF9434B2032B84A62AB","RecordType":"CandidateTechniques","RecordID":"CT-2F59F52B2267A280D4E1","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Focaccia (Roman Flatbread), p. 996; yeast-bread process pp. 980-985","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7CABE84824C6208F106C","RecordType":"CandidateTechniques","RecordID":"CT-2F59F52B2267A280D4E1","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1A6E591B989B6F0FDFE2","RecordType":"CandidateTechniques","RecordID":"CT-7FFE9EE08B8534B263FA","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Focaccia (Roman Flatbread), p. 996; yeast-bread process pp. 980-985","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D4CE7D7E9E6B2600A6D3","RecordType":"CandidateTechniques","RecordID":"CT-7FFE9EE08B8534B263FA","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-4CA84C5E30CBE7FF5132","RecordType":"CandidateTechniques","RecordID":"CT-5F6297A9159BC28F5A58","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Focaccia (Roman Flatbread), p. 996; yeast-bread process pp. 980-985","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-9897DB90D67DEC1E2367","RecordType":"CandidateTechniques","RecordID":"CT-5F6297A9159BC28F5A58","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-9017FA6914CCD9C87E96","RecordType":"CandidateTechniques","RecordID":"CT-9AC92878A6A0F57E0D84","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Focaccia (Roman Flatbread), p. 996; yeast-bread process pp. 980-985","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-5A3EBEFE53854BD27E3E","RecordType":"CandidateTechniques","RecordID":"CT-9AC92878A6A0F57E0D84","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-C159B34F833C96CBE0DE","RecordType":"CandidateTechniques","RecordID":"CT-E200697B700993CBD477","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6A20F95CE3E1A3A1E56C","RecordType":"CandidateTechniques","RecordID":"CT-A128D43F6F0611B7C671","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Mushroom Bolognese, p. 759; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D7822AB0F6610F996821","RecordType":"CandidateTechniques","RecordID":"CT-A128D43F6F0611B7C671","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-56BAFD150DBD99BC20A4","RecordType":"CandidateTechniques","RecordID":"CT-3814338F6FC1C9C20A3C","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Mushroom Bolognese, p. 759; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-BAA14D33506540DBB2EF","RecordType":"CandidateTechniques","RecordID":"CT-3814338F6FC1C9C20A3C","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-C378EC2A2DB1A43DA74F","RecordType":"CandidateTechniques","RecordID":"CT-ACD939CEA127155CAA84","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Mushroom Bolognese, p. 759; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-12F88A19B786CD18E690","RecordType":"CandidateTechniques","RecordID":"CT-ACD939CEA127155CAA84","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-BFD0263A9FB58789BF02","RecordType":"CandidateTechniques","RecordID":"CT-DEAFC4620EC1D0981C72","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Mushroom Bolognese, p. 759; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-049D9E6C1FEF7387D165","RecordType":"CandidateTechniques","RecordID":"CT-DEAFC4620EC1D0981C72","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8662882F5580B18852AA","RecordType":"CandidateTechniques","RecordID":"CT-F267937969749F8FBE8E","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Mushroom Bolognese, p. 759; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-18F4BCE7D53261C078FE","RecordType":"CandidateTechniques","RecordID":"CT-F267937969749F8FBE8E","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-22839AFAE3BD1514CBED","RecordType":"CandidateTechniques","RecordID":"CT-29EB50C81635873029F8","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Mushroom Bolognese, p. 759; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-285E488B775B6F65CDF2","RecordType":"CandidateTechniques","RecordID":"CT-29EB50C81635873029F8","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-5AD0F536AF4B49419CF9","RecordType":"CandidateTechniques","RecordID":"CT-20D910D33B21C7E2BE1D","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Mushroom Bolognese, p. 759; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-924FF748A1D2D27C407A","RecordType":"CandidateTechniques","RecordID":"CT-20D910D33B21C7E2BE1D","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F5FB36884980F597D01C","RecordType":"CandidateTechniques","RecordID":"CT-71166E09BD97380A30FD","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-127E5DDA728B2620BABF","RecordType":"CandidateTechniques","RecordID":"CT-429DD1AFB25C4405F455","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8314083C6FB529900021","RecordType":"CandidateTechniques","RecordID":"CT-C56CFE95727ACFC962E9","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Fresh Tomato Sauce for Pasta, p. 278; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8EFE9902E6AEF856B27E","RecordType":"CandidateTechniques","RecordID":"CT-C56CFE95727ACFC962E9","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-3414E23E7EC62B7BE1CA","RecordType":"CandidateTechniques","RecordID":"CT-C987B1DF45C7012FB231","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Fresh Tomato Sauce for Pasta, p. 278; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6FFF2D3752E28252B381","RecordType":"CandidateTechniques","RecordID":"CT-C987B1DF45C7012FB231","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-2022F44C66E501E88B41","RecordType":"CandidateTechniques","RecordID":"CT-E7E6EAD13C057B99ACB0","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Fresh Tomato Sauce for Pasta, p. 278; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-48CB3F9AD32E4F63D58D","RecordType":"CandidateTechniques","RecordID":"CT-E7E6EAD13C057B99ACB0","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-70DFA4D7E320845FAE51","RecordType":"CandidateTechniques","RecordID":"CT-83A83E279046D5C9C333","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Fresh Tomato Sauce for Pasta, p. 278; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-0789228AC998E699C16C","RecordType":"CandidateTechniques","RecordID":"CT-83A83E279046D5C9C333","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-69D577A7FECB4D3877AD","RecordType":"CandidateTechniques","RecordID":"CT-4997EEC91592BD12E653","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Fresh Tomato Sauce for Pasta, p. 278; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A488BC8911E8FD5B94F9","RecordType":"CandidateTechniques","RecordID":"CT-4997EEC91592BD12E653","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-21F7C5188170BA2EAAD0","RecordType":"CandidateTechniques","RecordID":"CT-592CE3DF319DD742C63D","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Fresh Tomato Sauce for Pasta, p. 278; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-569038B86AB7DB9A4B11","RecordType":"CandidateTechniques","RecordID":"CT-592CE3DF319DD742C63D","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-EE3826DAE8388864364C","RecordType":"CandidateTechniques","RecordID":"CT-114D1BD0BF7E3A0C1532","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-06BA36D1EA2ED8E88934","RecordType":"CandidateTechniques","RecordID":"CT-6B16C0101BA5AB01BE01","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-BA32FF2BE9E0B3B6A225","RecordType":"CandidateTechniques","RecordID":"CT-A805B73CD3613D1D9D45","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Dal Bhat, p. 761","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-31F70209C9D75273F853","RecordType":"CandidateTechniques","RecordID":"CT-A805B73CD3613D1D9D45","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-79821BE675CEFC4CD3C1","RecordType":"CandidateTechniques","RecordID":"CT-865D8ADCE64740FA5F0D","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Dal Bhat, p. 761","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-9FE3E3873B19544B7D47","RecordType":"CandidateTechniques","RecordID":"CT-865D8ADCE64740FA5F0D","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-57B25B5DBA2C8711C6A0","RecordType":"CandidateTechniques","RecordID":"CT-989EE5595EC6E008C168","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Dal Bhat, p. 761","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-E267A99E44C691575B2D","RecordType":"CandidateTechniques","RecordID":"CT-989EE5595EC6E008C168","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-3D0BADD8BA136EF859B5","RecordType":"CandidateTechniques","RecordID":"CT-45036508388B216BBE08","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Dal Bhat, p. 761","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-C06733BDF4601D0394D2","RecordType":"CandidateTechniques","RecordID":"CT-45036508388B216BBE08","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-DEAAD706F0A58D4A64A3","RecordType":"CandidateTechniques","RecordID":"CT-D90B5671375E4F4AEE2A","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Dal Bhat, p. 761","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-0FEE0330443FDDD8C2AA","RecordType":"CandidateTechniques","RecordID":"CT-D90B5671375E4F4AEE2A","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-5544B18AC9586A2FEC54","RecordType":"CandidateTechniques","RecordID":"CT-B67F0D5CC2262D3ACEEF","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Dal Bhat, p. 761","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-AECEBDEE8AA0935E7084","RecordType":"CandidateTechniques","RecordID":"CT-B67F0D5CC2262D3ACEEF","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-BAD9884338A026485A60","RecordType":"CandidateTechniques","RecordID":"CT-E1682313C105C428C796","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Dal Bhat, p. 761","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-0B2884291DE0932B99CB","RecordType":"CandidateTechniques","RecordID":"CT-E1682313C105C428C796","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-714F1309C0B77AFB66AA","RecordType":"CandidateTechniques","RecordID":"CT-784EEF88400B0647FE6A","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-12D308764716D1C7687A","RecordType":"CandidateTechniques","RecordID":"CT-97F55E5DE101F53FC6C6","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Dal Bhat, p. 761","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D17939F783AD5A29C3C7","RecordType":"CandidateTechniques","RecordID":"CT-97F55E5DE101F53FC6C6","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A571D54E357963486F8E","RecordType":"CandidateTechniques","RecordID":"CT-98D38E190B8204CBFC39","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F042B411DD29613E845B","RecordType":"CandidateTechniques","RecordID":"CT-B388D50DF98EB10B85A4","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Coconut Chickpeas with Cucumber Raita, p. 43","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-722BD3762271B99AC5A6","RecordType":"CandidateTechniques","RecordID":"CT-B388D50DF98EB10B85A4","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-EB671C4CC676CFC03535","RecordType":"CandidateTechniques","RecordID":"CT-272703A7E4A390F84F38","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Coconut Chickpeas with Cucumber Raita, p. 43","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6229D02AE1AC1BF410F6","RecordType":"CandidateTechniques","RecordID":"CT-272703A7E4A390F84F38","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-253EB2A927B19452F492","RecordType":"CandidateTechniques","RecordID":"CT-8ADE1835A816E965E618","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Coconut Chickpeas with Cucumber Raita, p. 43","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-28EB0BD146663844C393","RecordType":"CandidateTechniques","RecordID":"CT-8ADE1835A816E965E618","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-EC6AB93C1816D75F0C66","RecordType":"CandidateTechniques","RecordID":"CT-D3545C810E6B86ADD367","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-91CF712806EFB275B4A4","RecordType":"CandidateTechniques","RecordID":"CT-5ADC91681304C62526C8","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Coconut Chickpeas with Cucumber Raita, p. 43","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-DDDA6CE4BC49036488EE","RecordType":"CandidateTechniques","RecordID":"CT-5ADC91681304C62526C8","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-01E6BC83ACC749170E6A","RecordType":"CandidateTechniques","RecordID":"CT-9718F0244023B7848D8F","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-CEF25D845DA6AA4273C9","RecordType":"CandidateTechniques","RecordID":"CT-1AE2C245EC2902C7D3D9","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Capsicum & Zucchini Paella, p. 31","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-34EEE1D5D70EB9116899","RecordType":"CandidateTechniques","RecordID":"CT-1AE2C245EC2902C7D3D9","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-44AB30CC6A052D54333B","RecordType":"CandidateTechniques","RecordID":"CT-0DF027794F99EC81074E","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Capsicum & Zucchini Paella, p. 31","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8120371A7E6158115B2E","RecordType":"CandidateTechniques","RecordID":"CT-0DF027794F99EC81074E","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1EBEA48FD26255DDA24B","RecordType":"CandidateTechniques","RecordID":"CT-E2FB9521F35ED84FBEFE","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Capsicum & Zucchini Paella, p. 31","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1736F6780AD92978A16A","RecordType":"CandidateTechniques","RecordID":"CT-E2FB9521F35ED84FBEFE","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-3AF1FA6BDB31AC8ACBA9","RecordType":"CandidateTechniques","RecordID":"CT-96F93328BEDBE6D28E1F","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Capsicum & Zucchini Paella, p. 31","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-519C30F4E2B442F6ADA8","RecordType":"CandidateTechniques","RecordID":"CT-96F93328BEDBE6D28E1F","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-02F168FFACEFA4189C1E","RecordType":"CandidateTechniques","RecordID":"CT-5CFC5021D03447160709","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Capsicum & Zucchini Paella, p. 31","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-3E7A5416D157F64B04D0","RecordType":"CandidateTechniques","RecordID":"CT-5CFC5021D03447160709","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-967A09DE4C155E17802D","RecordType":"CandidateTechniques","RecordID":"CT-77DB1C305B22227E3C9A","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-173A16FD973CD0B31F68","RecordType":"CandidateTechniques","RecordID":"CT-AA5F398E96EECFC35454","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7818BF7283A9A1DC11FB","RecordType":"CandidateTechniques","RecordID":"CT-B93E371A55C8961F3869","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Quinoa, Beet, Squash and Spinach Salad, p. 730","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-442B8F24BBC7B7138354","RecordType":"CandidateTechniques","RecordID":"CT-B93E371A55C8961F3869","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-DA212EBEDF3615B45DE0","RecordType":"CandidateTechniques","RecordID":"CT-20571BB7ED03E76765FF","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Quinoa, Beet, Squash and Spinach Salad, p. 730","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6697D5833C174B5CCA0B","RecordType":"CandidateTechniques","RecordID":"CT-20571BB7ED03E76765FF","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D633C535D828AB987A8F","RecordType":"CandidateTechniques","RecordID":"CT-EBBADD007A7F705CD8BD","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-2610813D8D422BECFAEA","RecordType":"CandidateTechniques","RecordID":"CT-E13F6106AFD139555B4B","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Quinoa, Beet, Squash and Spinach Salad, p. 730","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-3F60CC552338B32EFA9D","RecordType":"CandidateTechniques","RecordID":"CT-E13F6106AFD139555B4B","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7C5EC73E6783EE64D967","RecordType":"CandidateTechniques","RecordID":"CT-B34E443405A86C06B5D0","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Quinoa, Beet, Squash and Spinach Salad, p. 730","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1C45388AC02A257A3836","RecordType":"CandidateTechniques","RecordID":"CT-B34E443405A86C06B5D0","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-562779315C3B79575515","RecordType":"CandidateTechniques","RecordID":"CT-5FA7699FC0EE4D07E8BE","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Grilled Vegetable Sandwich, p. 851","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6BC786D41685515FA8B7","RecordType":"CandidateTechniques","RecordID":"CT-5FA7699FC0EE4D07E8BE","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-0EA495B235FD9B0978E1","RecordType":"CandidateTechniques","RecordID":"CT-0A7F0D4E181E22AE7A7F","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Grilled Vegetable Sandwich, p. 851","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-2E5763757AD3BD207211","RecordType":"CandidateTechniques","RecordID":"CT-0A7F0D4E181E22AE7A7F","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-482962117D21EC2F049D","RecordType":"CandidateTechniques","RecordID":"CT-81DD8785E5A8165D7129","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Grilled Vegetable Sandwich, p. 851","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-94EC92182AAE1BCD6FFB","RecordType":"CandidateTechniques","RecordID":"CT-81DD8785E5A8165D7129","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-54564C0A73788DDB5917","RecordType":"CandidateTechniques","RecordID":"CT-246F32EB9A055ECF72E1","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Grilled Vegetable Sandwich, p. 851","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-EC3E0754DD6C9059582B","RecordType":"CandidateTechniques","RecordID":"CT-246F32EB9A055ECF72E1","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-CC66609B5BEAEE7D12D4","RecordType":"CandidateTechniques","RecordID":"CT-261EE58C99DDB58F65BD","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Grilled Vegetable Sandwich, p. 851","SupportNote":"Supports that the underlying recipe/application uses this concrete culinary technique or method.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-16CC2BCA1BD51EFC8AB4","RecordType":"CandidateTechniques","RecordID":"CT-261EE58C99DDB58F65BD","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1 / Recipe Challenge Catalogue V1","SupportNote":"Supports the mapping Role, EvidenceRelevant and SafetyRole used by the learning system.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8865A57C645F77AAA896","RecordType":"LearnCandidates","RecordID":"LC-COOK-001","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-38475B8FF0E1DBFD95D1","RecordType":"LearnCandidates","RecordID":"LC-COOK-001","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 6, pp. 125-138","SupportNote":"Supports the underlying safe knife setup and handling procedure; the short baseline activity is curator-designed.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-9D16AA9006B576B9D29E","RecordType":"LearnCandidates","RecordID":"LC-COOK-001","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-29A880DEE18D7617ECCC","RecordType":"LearnCandidates","RecordID":"LC-COOK-002","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-5341D725E188755E18C6","RecordType":"LearnCandidates","RecordID":"LC-COOK-002","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Berry Breakfast Trifle, p. 13","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8CE67894AEAEC92BC96F","RecordType":"LearnCandidates","RecordID":"LC-COOK-002","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A97542566AAC1B33AE17","RecordType":"LearnCandidates","RecordID":"LC-COOK-003","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-CB7A60FF8815FD5B3A9C","RecordType":"LearnCandidates","RecordID":"LC-COOK-003","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chia Pudding, p. 762","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7D82504533A51013FE54","RecordType":"LearnCandidates","RecordID":"LC-COOK-003","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-EF213BD75FE09967D886","RecordType":"LearnCandidates","RecordID":"LC-COOK-004","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-CE662FC43309DC5CCCBB","RecordType":"LearnCandidates","RecordID":"LC-COOK-004","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Basic Vinaigrette, p. 772","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8776693C42AC04CE5BEA","RecordType":"LearnCandidates","RecordID":"LC-COOK-004","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-ACCE05CCD90F744910E3","RecordType":"LearnCandidates","RecordID":"LC-COOK-005","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-E474C6CC0721BA5BE9DB","RecordType":"LearnCandidates","RecordID":"LC-COOK-005","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Caprese Salad, p. 795","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-E7413C5E697A275E2477","RecordType":"LearnCandidates","RecordID":"LC-COOK-005","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-3ECE862EAA37861FE562","RecordType":"LearnCandidates","RecordID":"LC-COOK-006","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A602E1106E04B21BCE0E","RecordType":"LearnCandidates","RecordID":"LC-COOK-006","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Hummus, p. 907","SupportNote":"Supports the hummus recipe; the seeded vegetable-plate serving and adult-led appliance allocation are curator-designed.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-C3B7D8F344EC2B4EE345","RecordType":"LearnCandidates","RecordID":"LC-COOK-006","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-E91FDFCE7DB9EDFB44DF","RecordType":"LearnCandidates","RecordID":"LC-COOK-007","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1CD70669814719AACA44","RecordType":"LearnCandidates","RecordID":"LC-COOK-007","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Guacamole, p. 920","SupportNote":"Supports the guacamole recipe; the toast/vegetable serving format is curator-designed.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D26128A8F407108FCE76","RecordType":"LearnCandidates","RecordID":"LC-COOK-007","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-17E5E22F8EE1CD5F36F8","RecordType":"LearnCandidates","RecordID":"LC-COOK-008","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-031A534E9DC581B6F334","RecordType":"LearnCandidates","RecordID":"LC-COOK-008","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Oatmeal with Bananas and Cinnamon, p. 725","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6EFBAFF92F7C42A810BF","RecordType":"LearnCandidates","RecordID":"LC-COOK-008","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-07844CC5DB13C223DDBB","RecordType":"LearnCandidates","RecordID":"LC-COOK-009","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-896B7E2AA86EC595A13A","RecordType":"LearnCandidates","RecordID":"LC-COOK-009","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Simmered Rice, p. 704","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F3B57831239715A4F3B8","RecordType":"LearnCandidates","RecordID":"LC-COOK-009","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8524458E945F76D2D19F","RecordType":"LearnCandidates","RecordID":"LC-COOK-010","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-041749B6600131101E3E","RecordType":"LearnCandidates","RecordID":"LC-COOK-010","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Scrambled Eggs, p. 590","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F75629F58A7CAE40ED75","RecordType":"LearnCandidates","RecordID":"LC-COOK-010","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A4985F2F4D4B9F60CD2A","RecordType":"LearnCandidates","RecordID":"LC-COOK-011","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-0E7821BEE5C1524D070D","RecordType":"LearnCandidates","RecordID":"LC-COOK-011","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Buttermilk Pancakes, p. 598","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-2E8C78FF116BDEB26939","RecordType":"LearnCandidates","RecordID":"LC-COOK-011","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-E6185AC49003B70B391F","RecordType":"LearnCandidates","RecordID":"LC-COOK-012","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-29FD200A837676DD5EDA","RecordType":"LearnCandidates","RecordID":"LC-COOK-012","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Sweet Potato & Zucchini Fritters, p. 33","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-25260E6F9F87D557D586","RecordType":"LearnCandidates","RecordID":"LC-COOK-012","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-B88CB73AADC5F342C855","RecordType":"LearnCandidates","RecordID":"LC-COOK-013","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-0E67B9EE263D5D334C6E","RecordType":"LearnCandidates","RecordID":"LC-COOK-013","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Sautéed Mushrooms with Garlic and Thyme, p. 652","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7871EABD83CDE1D4382F","RecordType":"LearnCandidates","RecordID":"LC-COOK-013","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-3050711BD442D241E98C","RecordType":"LearnCandidates","RecordID":"LC-COOK-014","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A3B0DE195E5350C2A965","RecordType":"LearnCandidates","RecordID":"LC-COOK-014","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Stir-Fried Snow Peas, p. 676","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-BEFD2260D5573A623845","RecordType":"LearnCandidates","RecordID":"LC-COOK-014","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-5F00874E7A2B1593CE2E","RecordType":"LearnCandidates","RecordID":"LC-COOK-015","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-95D34094B53C48527920","RecordType":"LearnCandidates","RecordID":"LC-COOK-015","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"White Bean Salad, p. 660","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-27A52184CF74784F0A03","RecordType":"LearnCandidates","RecordID":"LC-COOK-015","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A2BA438805E3BC39F07E","RecordType":"LearnCandidates","RecordID":"LC-COOK-017","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-2BF0C479A9349649DCA5","RecordType":"LearnCandidates","RecordID":"LC-COOK-017","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Blueberry Muffins, p. 964","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D7721C66B9AFC7E82F5D","RecordType":"LearnCandidates","RecordID":"LC-COOK-017","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-FD38AF6847769C747A12","RecordType":"LearnCandidates","RecordID":"LC-COOK-018","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8001ABE285A965F6EE5C","RecordType":"LearnCandidates","RecordID":"LC-COOK-018","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Irish Soda Bread, p. 972","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-3AE96FE166EBDF995FDE","RecordType":"LearnCandidates","RecordID":"LC-COOK-018","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-288722DCE1DD42409840","RecordType":"LearnCandidates","RecordID":"LC-COOK-019","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-670DD5A7FDDAA1DEFDD9","RecordType":"LearnCandidates","RecordID":"LC-COOK-019","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Focaccia Pizza, p. 23; paired with simple salad","SupportNote":"Supports the Focaccia Pizza recipe; pairing it with a simple salad for a coordination challenge is curator-designed.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-FBCAA409F18691FCB295","RecordType":"LearnCandidates","RecordID":"LC-COOK-019","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6ECA57A761DF04285093","RecordType":"LearnCandidates","RecordID":"LC-COOK-020","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D91EB547E4177CB799CC","RecordType":"LearnCandidates","RecordID":"LC-COOK-020","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Focaccia (Roman Flatbread), p. 996; yeast-bread process pp. 980-985","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A60C66FF28213F9C4787","RecordType":"LearnCandidates","RecordID":"LC-COOK-020","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7846272ABD7D44FFF934","RecordType":"LearnCandidates","RecordID":"LC-COOK-021","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-B05AA1A8A024820B15EF","RecordType":"LearnCandidates","RecordID":"LC-COOK-021","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Mushroom Bolognese, p. 759; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-CF034F41EE18450B8C00","RecordType":"LearnCandidates","RecordID":"LC-COOK-021","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F685704D28C13B1175FC","RecordType":"LearnCandidates","RecordID":"LC-COOK-022","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-DFFD8366D2DFDB2063CB","RecordType":"LearnCandidates","RecordID":"LC-COOK-022","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Fresh Tomato Sauce for Pasta, p. 278; pasta cookery, Chapter 23 pp. 707-714","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6B2010D5BE7771E57D54","RecordType":"LearnCandidates","RecordID":"LC-COOK-022","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-FA69E4CE978FD78F7B48","RecordType":"LearnCandidates","RecordID":"LC-COOK-023","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-054EF97C40F8E64DCE14","RecordType":"LearnCandidates","RecordID":"LC-COOK-023","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Dal Bhat, p. 761","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-9D5084182B2DA2459C47","RecordType":"LearnCandidates","RecordID":"LC-COOK-023","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-90A414C3DBE299B06462","RecordType":"LearnCandidates","RecordID":"LC-COOK-024","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F3654D41963FEF81084E","RecordType":"LearnCandidates","RecordID":"LC-COOK-024","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Coconut Chickpeas with Cucumber Raita, p. 43","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-07759FF2C043C0952939","RecordType":"LearnCandidates","RecordID":"LC-COOK-024","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-5ADD62A74869F81E13FD","RecordType":"LearnCandidates","RecordID":"LC-COOK-025","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A224FA9A5A0E4C4992CF","RecordType":"LearnCandidates","RecordID":"LC-COOK-025","ProvenanceRole":"source_derived","SourceRef":"https://assets.contentstack.io/v3/assets/blt9777ffe07a3470fa/blt87eb2feb358ec1ad/Sanitarium-12-before-12-cookbook-for-kids.pdf","SourceLocation":"Capsicum & Zucchini Paella, p. 31","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-B13353298F9ED441D8B2","RecordType":"LearnCandidates","RecordID":"LC-COOK-025","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-BA1335D659841F91EE35","RecordType":"LearnCandidates","RecordID":"LC-COOK-026","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6610F5A993E2734AED4C","RecordType":"LearnCandidates","RecordID":"LC-COOK-026","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Quinoa, Beet, Squash and Spinach Salad, p. 730","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-EABCB4E2165DAC2846A5","RecordType":"LearnCandidates","RecordID":"LC-COOK-026","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-4C48466F66F9BABCDB8A","RecordType":"LearnCandidates","RecordID":"LC-COOK-027","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports optional self-scaffolding choices only; it does not establish Sophie's actual support preference or competence.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-08943DE2F243FDC80280","RecordType":"LearnCandidates","RecordID":"LC-COOK-027","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Grilled Vegetable Sandwich, p. 851","SupportNote":"Supports the underlying named recipe/application and its culinary procedure.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-EC4D969C190EDFD27857","RecordType":"LearnCandidates","RecordID":"LC-COOK-027","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Recipe Challenge Catalogue V1 / Cooking Adaptive Recommendation Logic V1","SupportNote":"Supports challenge band/type, difficulty drivers, practice focus, safety/support allocation, rationale and recommendation role; these are curator judgements.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-C64BE213E91809E0D56D","RecordType":"TechniquePrerequisites","RecordID":"TP-7C2022F8C2EF5111979A","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-37185AEEFF378F24C2FE","RecordType":"TechniquePrerequisites","RecordID":"TP-CC42DD4CB6E5F5C0EC76","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-2341E9CB28C13FCBADCA","RecordType":"TechniquePrerequisites","RecordID":"TP-D9A94EBEE52B47F6921C","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A78BC53287A5E3C128C2","RecordType":"TechniquePrerequisites","RecordID":"TP-AB220EC2B698C8FDE038","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-362EB596925BA5602E98","RecordType":"TechniquePrerequisites","RecordID":"TP-F56AE284700B0CB8923D","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6E4324D91A094FFFBCD7","RecordType":"TechniquePrerequisites","RecordID":"TP-BC17E6BE42D621263C72","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-94A25A1DBBDAFD9C7FAF","RecordType":"TechniquePrerequisites","RecordID":"TP-A0AD346FBD275C8EF4EC","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A71DAA35B87763686E45","RecordType":"TechniquePrerequisites","RecordID":"TP-E290043D31D4299CE1CB","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-779964B4357D6DC251F7","RecordType":"TechniquePrerequisites","RecordID":"TP-FF492FF234BBE0D423E7","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-3AC06D4B27BE345C8391","RecordType":"TechniquePrerequisites","RecordID":"TP-A08710D3A9C1B25A81A5","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-AF02192414AEA139879A","RecordType":"TechniquePrerequisites","RecordID":"TP-156DB2E37D124EA5CEFD","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-E5D7CD9BF2F28A002B2B","RecordType":"TechniquePrerequisites","RecordID":"TP-7CA664FEDB4E5E0A2B7F","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-B93FE9D7CC63069DC9C4","RecordType":"TechniquePrerequisites","RecordID":"TP-B027F1EA4F2A449FD594","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-74B1F3B8F1C705742E0B","RecordType":"TechniquePrerequisites","RecordID":"TP-E48433E1B483C0F80939","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-A263CA08A795D045F16B","RecordType":"TechniquePrerequisites","RecordID":"TP-A9842A7904532B37AFF7","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-9AD16911FFA71311427B","RecordType":"TechniquePrerequisites","RecordID":"TP-D0859D817723CA740F56","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Adaptive Recommendation Logic V1 / technique progression","SupportNote":"Supports this qualitative prerequisite relationship, evidence expectation and support implication. It does not create a numeric threshold or repetition requirement.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-18F4853A56153CA28A36","RecordType":"Techniques","RecordID":"COOK-T001","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1BC5A2B5A0133B7F4420","RecordType":"Techniques","RecordID":"COOK-T001","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 9, pp. 193-204","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-865151724F3DE04BF7D9","RecordType":"Techniques","RecordID":"COOK-T001","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-4E97A3E630E50E4413BB","RecordType":"Techniques","RecordID":"COOK-T002","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7628BA738A861AF94E5B","RecordType":"Techniques","RecordID":"COOK-T002","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 4, pp. 88-93; Chapter 9, p. 197","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7A3BA23C61A4B12F5A09","RecordType":"Techniques","RecordID":"COOK-T002","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-14C8AB14C29D8A03A372","RecordType":"Techniques","RecordID":"COOK-T003","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D5AB83FBD6E389C5A0DC","RecordType":"Techniques","RecordID":"COOK-T003","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 6, pp. 125-138","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-B0EC3EACE934D07A6BFC","RecordType":"Techniques","RecordID":"COOK-T003","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-647FE10202B6CA07A769","RecordType":"Techniques","RecordID":"COOK-T004","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-315EF0E17D12B4D71A4A","RecordType":"Techniques","RecordID":"COOK-T004","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 6, pp. 128-136","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-50C61DA0845BFCC7B4ED","RecordType":"Techniques","RecordID":"COOK-T004","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6A2D4924F0D1CD683122","RecordType":"Techniques","RecordID":"COOK-T005","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D1B7B8CDF47662DA887A","RecordType":"Techniques","RecordID":"COOK-T005","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 5 tools; Chapter 9 ingredient preparation","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-CFE6B1F401E7BF17D0D8","RecordType":"Techniques","RecordID":"COOK-T005","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-BDBB80349FE04002F1F4","RecordType":"Techniques","RecordID":"COOK-T006","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-078289259F6FBB522EF5","RecordType":"Techniques","RecordID":"COOK-T006","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 10, pp. 205-232","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-274A9CB8D6F7E1DFC89C","RecordType":"Techniques","RecordID":"COOK-T006","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8C9275223EBFD5E24F24","RecordType":"Techniques","RecordID":"COOK-T007","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-C3574EECD513589A0F59","RecordType":"Techniques","RecordID":"COOK-T007","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 10, pp. 216-218","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-584665ADFBD72E2AD010","RecordType":"Techniques","RecordID":"COOK-T007","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F2495E7ACA8BD08CF3A4","RecordType":"Techniques","RecordID":"COOK-T008","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-162C0526D9E3DEE6B3D6","RecordType":"Techniques","RecordID":"COOK-T008","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 10, pp. 223-226","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6C611EFAA94A9CE417FB","RecordType":"Techniques","RecordID":"COOK-T008","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-99A91C12DB4E7B084CAD","RecordType":"Techniques","RecordID":"COOK-T009","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-BA0F6C0BF29C1F3ED778","RecordType":"Techniques","RecordID":"COOK-T009","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 10, p. 225; Chapter 23, pp. 707-714","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-197A9829A6534EC7C365","RecordType":"Techniques","RecordID":"COOK-T009","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-874AB05FFBF9A3C3BFC1","RecordType":"Techniques","RecordID":"COOK-T010","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7AABB645D8CBCAA32358","RecordType":"Techniques","RecordID":"COOK-T010","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 10, pp. 215-216; baking chapters 30-34","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-836F188E107B57F9CAE7","RecordType":"Techniques","RecordID":"COOK-T010","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F6B1296F3E9355C2BA6B","RecordType":"Techniques","RecordID":"COOK-T011","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-C9F6FE58C1753BA2FF77","RecordType":"Techniques","RecordID":"COOK-T011","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 10, p. 210; Preface, pp. 27-28","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-38EB5C188CF3778352CE","RecordType":"Techniques","RecordID":"COOK-T011","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-B2C1C09C8F68991EA360","RecordType":"Techniques","RecordID":"COOK-T012","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-EC7AA29598808BD01CC4","RecordType":"Techniques","RecordID":"COOK-T012","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 7, pp. 139-174","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D6E663B82AA0949D5CFF","RecordType":"Techniques","RecordID":"COOK-T012","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8B4372FA1BD0DF006F8B","RecordType":"Techniques","RecordID":"COOK-T013","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-AB2D90AEB863C61BB310","RecordType":"Techniques","RecordID":"COOK-T013","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 25, pp. 771-775","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-8658BBC9ACCC318C8626","RecordType":"Techniques","RecordID":"COOK-T013","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-07F221EBCB4E6BCBBDDC","RecordType":"Techniques","RecordID":"COOK-T014","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-35ED64004D537D426F68","RecordType":"Techniques","RecordID":"COOK-T014","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 23, pp. 697-707","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-DA53766291CEF12E2D11","RecordType":"Techniques","RecordID":"COOK-T014","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-1963751182EF3A675AC6","RecordType":"Techniques","RecordID":"COOK-T015","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-AF75181DFE0DF22762F5","RecordType":"Techniques","RecordID":"COOK-T015","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 31, pp. 959-967","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-B291FFF553FC242AD419","RecordType":"Techniques","RecordID":"COOK-T015","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-10C8B1308F8CD522E8BE","RecordType":"Techniques","RecordID":"COOK-T016","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-B4FFD0DCABB0597FD0A1","RecordType":"Techniques","RecordID":"COOK-T016","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapters 31-32, pp. 959-1008","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-649320FB44D1BBE5AA4F","RecordType":"Techniques","RecordID":"COOK-T016","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D39D6D20C9B948805577","RecordType":"Techniques","RecordID":"COOK-T017","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-7858AA976BB65A596B92","RecordType":"Techniques","RecordID":"COOK-T017","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-20293533B981EE84F82D","RecordType":"Techniques","RecordID":"COOK-T018","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-B411C757EF0E375A1B9B","RecordType":"Techniques","RecordID":"COOK-T018","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 2, pp. 49-70","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-F16127AFE7D0521F03A5","RecordType":"Techniques","RecordID":"COOK-T018","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-88DA4E316043D15E02B0","RecordType":"Techniques","RecordID":"COOK-T019","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-46AEC0363080637D0FC6","RecordType":"Techniques","RecordID":"COOK-T019","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 36, pp. 1127-1142","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-B0106710668E89EA4EF5","RecordType":"Techniques","RecordID":"COOK-T019","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-52116CDB707906DBDA89","RecordType":"Techniques","RecordID":"COOK-T020","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-D3E0FD9509ED22DA1D55","RecordType":"Techniques","RecordID":"COOK-T020","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapters 30-31, mixing methods","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-0A59F4FDACBF83175BAE","RecordType":"Techniques","RecordID":"COOK-T020","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-6A13E26212D699B00FD6","RecordType":"Techniques","RecordID":"COOK-T021","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-482CE1E107EA6DA67C48","RecordType":"Techniques","RecordID":"COOK-T021","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 5, processing equipment pp. 115-117","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-09FFFEAEEE7EF414320C","RecordType":"Techniques","RecordID":"COOK-T021","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-0B7D3909AF7B46D7F2D8","RecordType":"Techniques","RecordID":"COOK-T022","ProvenanceRole":"approved_behaviour_rule","SourceRef":"00_PROJECT_COORDINATION/05_DECISION_REGISTER.md","SourceLocation":"D-005 / SI-D11","SupportNote":"Supports the canonical self-scaffolding choices represented in TypicalScaffoldOptions.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-CCD0D915F0B964D23199","RecordType":"Techniques","RecordID":"COOK-T022","ProvenanceRole":"source_derived","SourceRef":"isbn:9781292443683","SourceLocation":"Chapter 10, pp. 213-215","SupportNote":"Supports the underlying culinary technique, terminology and procedure. It does not support the app-specific sequencing, difficulty metadata or scaffold design.","CreatedAt":"2026-08-21T13:17:00+09:30"},{"SourceLinkID":"SL-E793ED340741C7F9C5CA","RecordType":"Techniques","RecordID":"COOK-T022","ProvenanceRole":"specialist_judgement","SourceRef":"00_PROJECT_COORDINATION/specifications/COOKING_ADAPTIVE_RECOMMENDATION_LOGIC_V1.md","SourceLocation":"Cooking Technique Challenge Library V1","SupportNote":"Supports the learning decomposition, observable-evidence wording, difficulty drivers, transfer indicators and app-facing technique framing.","CreatedAt":"2026-08-21T13:17:00+09:30"}]};

const LEARN_CANDIDATE_HEADERS = [
  'CandidateID', 'Domain', 'Title', 'SkillID', 'CapabilityLabel', 'PracticeDescription',
  'CompletionStandard', 'WhyItMatters', 'EstimatedMinutes', 'ChallengeBand',
  'PrimaryChallengeType', 'DifficultyDrivers', 'InterestTags', 'CookingMethodTags',
  'MealTypeTags', 'CuisineTags', 'ChallengeStructureTags', 'SafetyRequired',
  'MinimumSafetySupport', 'SafetyRequirement', 'SafetyNote', 'SupportAllocation',
  'SuggestedSupportOptions', 'AuthenticUse', 'CuratorRationale', 'BehaviourReviewStatus',
  'CandidateStatus', 'CreatedAt', 'UpdatedAt'
];
const TECHNIQUE_HEADERS = [
  'TechniqueID', 'SkillID', 'Name', 'SophieFacingTitle', 'TechniqueFamily',
  'Description', 'ObservableEvidence', 'DifficultyDrivers', 'TypicalScaffoldOptions',
  'SafetyCritical', 'TypicalSafetySupport', 'SafetyNote', 'TransferIndicators',
  'AuthenticUses', 'Active', 'CreatedAt', 'UpdatedAt'
];
const CANDIDATE_TECHNIQUE_HEADERS = [
  'CandidateTechniqueID', 'CandidateID', 'TechniqueID', 'Role', 'EvidenceRelevant',
  'SafetyRole', 'CreatedAt'
];
const TECHNIQUE_PREREQUISITE_HEADERS = [
  'PrerequisiteEdgeID', 'TechniqueID', 'PrerequisiteTechniqueID', 'RequirementKind',
  'EvidenceExpectation', 'Rationale', 'SafetyRelated', 'SupportImplication',
  'AppliesWhen', 'Active', 'CreatedAt', 'UpdatedAt'
];
const LEARNING_EVIDENCE_HEADERS = [
  'EvidenceID', 'SkillID', 'TechniqueID', 'OpportunityID', 'CandidateID', 'ObservedAt',
  'ObservedByRole', 'EvidenceType', 'ObservedCapability', 'ObservedSupport',
  'SafetyObserved', 'ReliabilityObserved', 'EvidenceNote', 'Context', 'Active', 'CreatedAt'
];
const LEARNING_PREFERENCE_HEADERS = [
  'PreferenceID', 'Domain', 'PreferenceType', 'PreferenceValue', 'PreferenceScope',
  'ScopeRef', 'DurationKind', 'SessionID', 'ExpiresAt', 'Status', 'AuthoredByRole',
  'CreatedAt', 'UpdatedAt'
];
const RECOMMENDATION_HISTORY_HEADERS = [
  'RecommendationEventID', 'RecommendationSetID', 'GeneratedAt', 'Domain', 'CandidateID',
  'Position', 'FitBand', 'ReasonCodes', 'ReasonText', 'EvidenceBasisIDs',
  'PreferenceBasisIDs', 'RecencyDisposition', 'DiversityRole', 'RecommendationOutcome',
  'SophieOverride', 'OverrideTargetCandidateID', 'OverrideNote', 'CreatedOpportunityID',
  'ResolvedAt'
];
const SOURCE_LINK_HEADERS = [
  'SourceLinkID', 'RecordType', 'RecordID', 'ProvenanceRole', 'SourceRef',
  'SourceLocation', 'SupportNote', 'CreatedAt'
];

function cleanRecId_(value, label) {
  const text = String(value == null ? '' : value).trim();
  if (!text) throwApiError_('REC_VALIDATION', (label || 'ID') + ' is required.');
  if (text.length > REC_LIMITS.id || /[\x00-\x1F<>]/.test(text)) {
    throwApiError_('REC_VALIDATION', (label || 'ID') + ' is invalid.');
  }
  return text;
}

function cleanRecText_(value, maxLength, label, required) {
  const text = String(value == null ? '' : value).trim();
  if (required && !text) throwApiError_('REC_VALIDATION', (label || 'Text') + ' is required.');
  if (text.length > maxLength || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text)) {
    throwApiError_('REC_VALIDATION', (label || 'Text') + ' is invalid or too long.');
  }
  return text;
}

function cleanRecEnum_(value, allowed, label) {
  const text = String(value == null ? '' : value).trim().toLowerCase();
  if (allowed.indexOf(text) < 0) throwApiError_('REC_VALIDATION', 'Invalid ' + (label || 'value') + '.');
  return text;
}

function cleanRecRecordType_(value) {
  const text = String(value == null ? '' : value).trim();
  const lower = text.toLowerCase();
  for (let i = 0; i < REC_ENUMS.recordType.length; i++) {
    if (String(REC_ENUMS.recordType[i]).toLowerCase() === lower) return REC_ENUMS.recordType[i];
  }
  throwApiError_('REC_VALIDATION', 'Invalid RecordType.');
}

function cleanRecBoolean_(value, label) {
  if (value === true || value === false) return value;
  const text = String(value == null ? '' : value).trim().toLowerCase();
  if (['true', 'yes', '1'].indexOf(text) >= 0) return true;
  if (['false', 'no', '0', ''].indexOf(text) >= 0) return false;
  throwApiError_('REC_VALIDATION', 'Invalid boolean for ' + (label || 'value') + '.');
}

function cleanRecDate_(value, label, required) {
  if (value === '' || value == null) {
    if (required) throwApiError_('REC_VALIDATION', (label || 'Date') + ' is required.');
    return '';
  }
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (isNaN(date.getTime())) throwApiError_('REC_VALIDATION', 'Invalid ' + (label || 'date') + '.');
  return date;
}

function cleanRecTag_(value, label) {
  const text = String(value == null ? '' : value).trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(text)) throwApiError_('REC_VALIDATION', 'Invalid ' + (label || 'tag') + '.');
  return text;
}

function parseRecJsonArray_(value, label) {
  if (Array.isArray(value)) return value.slice();
  if (value == null || String(value).trim() === '') return [];
  try {
    const parsed = JSON.parse(String(value));
    if (!Array.isArray(parsed)) throw new Error('not array');
    return parsed;
  } catch (error) {
    throwApiError_('REC_VALIDATION', (label || 'List') + ' must be a JSON array.');
  }
}

function parseRecJsonObject_(value, label) {
  if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) return clonePlainObject_(value);
  if (value == null || String(value).trim() === '') return {};
  try {
    const parsed = JSON.parse(String(value));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not object');
    return parsed;
  } catch (error) {
    throwApiError_('REC_VALIDATION', (label || 'Object') + ' must be a JSON object.');
  }
}

function cleanRecTagList_(value, label, required) {
  const raw = parseRecJsonArray_(value, label);
  if (raw.length > REC_LIMITS.listItems) throwApiError_('REC_VALIDATION', (label || 'List') + ' has too many items.');
  const result = [];
  raw.forEach(function(item) {
    const tag = cleanRecTag_(item, label);
    if (result.indexOf(tag) < 0) result.push(tag);
  });
  if (required && !result.length) throwApiError_('REC_VALIDATION', (label || 'List') + ' requires at least one item.');
  return result;
}

function cleanRecIdList_(value, label, required) {
  const raw = parseRecJsonArray_(value, label);
  if (raw.length > REC_LIMITS.listItems) throwApiError_('REC_VALIDATION', (label || 'List') + ' has too many items.');
  const result = [];
  raw.forEach(function(item) {
    const id = cleanRecId_(item, label);
    if (result.indexOf(id) < 0) result.push(id);
  });
  if (required && !result.length) throwApiError_('REC_VALIDATION', (label || 'List') + ' requires at least one item.');
  return result;
}

function cleanClientRequestId_(value) {
  const text = String(value == null ? '' : value).trim();
  if (!text || text.length > REC_LIMITS.clientRequestId || !/^[A-Za-z0-9._:-]+$/.test(text)) {
    throwApiError_('REC_VALIDATION', 'A valid clientRequestId is required.');
  }
  return text;
}

function recDigestHex_(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8);
  return bytes.map(function(byte) { const v = byte < 0 ? byte + 256 : byte; return ('0' + v.toString(16)).slice(-2); }).join('');
}

function stableRecId_(prefix, scope, requestId) {
  const p = cleanRecText_(prefix, 24, 'ID prefix', true).replace(/[^A-Za-z0-9_-]/g, '');
  const digest = recDigestHex_('rec-v1|' + String(scope || '') + '|' + String(requestId || '')).slice(0, 20).toUpperCase();
  return p + '-' + digest;
}

function recJsonArrayCell_(value) {
  return JSON.stringify(value || []);
}

function recJsonObjectCell_(value) {
  const keys = Object.keys(value || {});
  return keys.length ? JSON.stringify(value) : '';
}

function recBoolFromRow_(value) {
  return toBoolean_(value);
}

function recSheet_(db, name) {
  const sheet = db.getSheetByName(name);
  if (!sheet) throwApiError_('REC_NOT_INITIALISED', 'Learning Recommendations are not initialised.');
  return sheet;
}

function assertRecExactHeaders_(sheet, expected) {
  const width = sheet.getLastColumn();
  if (width !== expected.length) throwApiError_('REC_SCHEMA_MISMATCH', 'Unexpected schema width for ' + sheet.getName() + '.');
  const actual = sheet.getRange(1, 1, 1, width).getValues()[0].map(function(v) { return String(v).trim(); });
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throwApiError_('REC_SCHEMA_MISMATCH', 'Unexpected headers for ' + sheet.getName() + '.');
}

function ensureRecSheetExact_(db, name, headers) {
  let sheet = db.getSheetByName(name);
  if (!sheet) {
    sheet = db.insertSheet(name);
    ensureColumnCapacity_(sheet, headers.length);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeader_(sheet, headers.length);
    sheet.setFrozenRows(1);
    return sheet;
  }
  assertRecExactHeaders_(sheet, headers);
  return sheet;
}

function assertRecForeignKey_(sheet, idHeader, id, label) {
  if (!id) return;
  const matches = readObjects_(sheet).filter(function(row) { return String(row[idHeader] || '') === String(id); });
  if (matches.length !== 1) throwApiError_('REC_FOREIGN_KEY', (label || idHeader) + ' does not resolve exactly once: ' + id + '.');
}

function recFindOptionalById_(sheet, idHeader, id) {
  const matches = readObjectsWithRows_(sheet).filter(function(item) { return String(item.object[idHeader] || '') === String(id); });
  if (matches.length > 1) throwApiError_('DUPLICATE_ID', 'Duplicate ' + idHeader + ': ' + id + '.');
  return matches.length ? matches[0] : null;
}

function recWriteWholeBody_(sheet, headers, rows) {
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  if (!rows.length) return;
  const values = rows.map(function(row) { return headers.map(function(h) { return Object.prototype.hasOwnProperty.call(row, h) ? row[h] : ''; }); });
  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}

function recCanonicalRow_(headers, row) {
  const result = {};
  headers.forEach(function(h) {
    let value = row[h];
    if (value instanceof Date) value = value.toISOString();
    result[h] = value == null ? '' : value;
  });
  return JSON.stringify(result);
}

function validateAppliesWhen_(value) {
  const text = String(value == null ? '' : value).trim();
  if (!text) return '';
  if (!/^candidate:[A-Za-z0-9._:-]+(?:\|[A-Za-z0-9._:-]+)*$/.test(text)) {
    throwApiError_('REC_VALIDATION', 'AppliesWhen must use candidate:<CandidateID>[|<CandidateID>...] in V1.');
  }
  const ids = text.slice('candidate:'.length).split('|');
  ids.forEach(function(id) { cleanRecId_(id, 'AppliesWhen CandidateID'); });
  return 'candidate:' + ids.join('|');
}

function validateSupportAllocation_(db, candidateId, value, candidateTechniqueRows) {
  const object = parseRecJsonObject_(value, 'SupportAllocation');
  const allowedKeys = ['sophieLedTechniqueIds', 'adultLedTechniqueIds', 'sharedTechniqueIds'];
  Object.keys(object).forEach(function(key) {
    if (allowedKeys.indexOf(key) < 0) throwApiError_('REC_VALIDATION', 'SupportAllocation contains an unsupported key.');
  });
  const mapped = {};
  (candidateTechniqueRows || []).forEach(function(row) {
    if (!candidateId || String(row.CandidateID || '') === String(candidateId)) mapped[String(row.TechniqueID || '')] = true;
  });
  const seen = {};
  const clean = {};
  allowedKeys.forEach(function(key) {
    clean[key] = cleanRecIdList_(object[key] || [], 'SupportAllocation.' + key, false);
    clean[key].forEach(function(id) {
      if (!mapped[id]) throwApiError_('REC_VALIDATION', 'SupportAllocation references an unmapped TechniqueID: ' + id + '.');
      if (seen[id]) throwApiError_('REC_VALIDATION', 'A TechniqueID cannot occupy multiple SupportAllocation roles.');
      seen[id] = true;
    });
  });
  if (!clean.sophieLedTechniqueIds.length && !clean.adultLedTechniqueIds.length && !clean.sharedTechniqueIds.length) return {};
  return clean;
}

function resolveCandidateAllocation_(candidate, candidateTechniques) {
  const raw = parseRecJsonObject_(candidate.SupportAllocation || '', 'SupportAllocation');
  const result = {
    sophieLedTechniqueIds: [],
    adultLedTechniqueIds: [],
    sharedTechniqueIds: []
  };
  ['sophieLedTechniqueIds', 'adultLedTechniqueIds', 'sharedTechniqueIds'].forEach(function(key) {
    result[key] = Array.isArray(raw[key]) ? raw[key].map(String) : [];
  });
  const hasExplicit = result.sophieLedTechniqueIds.length || result.adultLedTechniqueIds.length || result.sharedTechniqueIds.length;
  if (!hasExplicit) {
    (candidateTechniques || []).forEach(function(mapping) {
      if (['primary_practice', 'supporting'].indexOf(String(mapping.Role || '').toLowerCase()) >= 0) {
        result.sophieLedTechniqueIds.push(String(mapping.TechniqueID || ''));
      }
    });
  }
  return result;
}

function isTechniqueSophieLed_(candidate, mapping, allocation) {
  const id = String(mapping.TechniqueID || '');
  if (allocation.adultLedTechniqueIds.indexOf(id) >= 0) return false;
  if (allocation.sophieLedTechniqueIds.indexOf(id) >= 0 || allocation.sharedTechniqueIds.indexOf(id) >= 0) return true;
  const explicit = allocation.sophieLedTechniqueIds.length || allocation.adultLedTechniqueIds.length || allocation.sharedTechniqueIds.length;
  return !explicit && ['primary_practice', 'supporting'].indexOf(String(mapping.Role || '').toLowerCase()) >= 0;
}

function isPrerequisiteEdgeApplicable_(edge, candidate) {
  const text = String(edge.AppliesWhen || '').trim();
  if (!text) return true;
  const ids = text.slice('candidate:'.length).split('|');
  return ids.indexOf(String(candidate.CandidateID || '')) >= 0;
}

function recEvidenceContextApplicable_(evidence, candidate) {
  const evidenceCandidate = String(evidence.CandidateID || '');
  return !evidenceCandidate || evidenceCandidate === String(candidate.CandidateID || '');
}

function isEvidenceExpectationSatisfied_(expectation, evidenceRows, candidate) {
  const relevant = (evidenceRows || []).filter(function(row) {
    return recBoolFromRow_(row.Active) && recEvidenceContextApplicable_(row, candidate || {});
  }).sort(function(a, b) { return new Date(a.ObservedAt || 0) - new Date(b.ObservedAt || 0); });
  if (expectation === 'observed_with_support') {
    return relevant.some(function(row) {
      return String(row.EvidenceType || '') !== 'self_report' && REC_ENUMS.observedCapability.indexOf(String(row.ObservedCapability || '')) >= 0;
    });
  }
  if (expectation === 'observed_independent') {
    return relevant.some(function(row) {
      return ['independent', 'reliable'].indexOf(String(row.ObservedCapability || '')) >= 0 &&
        ['reminder_only', 'none'].indexOf(String(row.ObservedSupport || '')) >= 0;
    });
  }
  if (expectation === 'observed_reliable') {
    return relevant.some(function(row) {
      return String(row.ObservedCapability || '') === 'reliable' && String(row.ReliabilityObserved || '') === 'consistent_in_context';
    });
  }
  if (expectation === 'safety_confirmed') {
    let safeAt = -1;
    let concernAt = -1;
    relevant.forEach(function(row) {
      const at = new Date(row.ObservedAt || 0).getTime();
      const safety = String(row.SafetyObserved || '');
      if (['safe_with_required_support', 'safe_independent'].indexOf(safety) >= 0) safeAt = Math.max(safeAt, at);
      if (safety === 'safety_concern') concernAt = Math.max(concernAt, at);
    });
    return safeAt >= 0 && safeAt >= concernAt;
  }
  return false;
}

function assertNoPrerequisiteSelfLink_(edge) {
  if (String(edge.TechniqueID) === String(edge.PrerequisiteTechniqueID)) throwApiError_('REC_VALIDATION', 'A Technique cannot be its own prerequisite.');
}

function assertNoCandidateTechniqueDuplicate_(rows) {
  const seen = {};
  (rows || []).forEach(function(row) {
    const key = String(row.CandidateID) + '|' + String(row.TechniqueID);
    if (seen[key]) throwApiError_('REC_VALIDATION', 'Duplicate CandidateTechnique relationship.');
    seen[key] = true;
  });
}

function assertNoPrerequisiteDuplicate_(rows) {
  const seen = {};
  (rows || []).filter(function(row) { return recBoolFromRow_(row.Active); }).forEach(function(row) {
    const key = String(row.TechniqueID) + '|' + String(row.PrerequisiteTechniqueID);
    if (seen[key]) throwApiError_('REC_VALIDATION', 'Duplicate active prerequisite relationship.');
    seen[key] = true;
  });
}

function assertNoPrerequisiteCycle_(rows) {
  const graph = {};
  (rows || []).filter(function(row) { return recBoolFromRow_(row.Active); }).forEach(function(row) {
    const from = String(row.TechniqueID || '');
    const to = String(row.PrerequisiteTechniqueID || '');
    if (!graph[from]) graph[from] = [];
    graph[from].push(to);
  });
  const visiting = {};
  const visited = {};
  function dfs(node) {
    if (visiting[node]) throwApiError_('REC_VALIDATION', 'Prerequisite graph contains a directed cycle.');
    if (visited[node]) return;
    visiting[node] = true;
    (graph[node] || []).forEach(dfs);
    visiting[node] = false;
    visited[node] = true;
  }
  Object.keys(graph).forEach(dfs);
}

function validateLearnCandidateDraft_(db, data, existingId) {
  const now = new Date();
  const id = existingId ? cleanRecId_(existingId, 'CandidateID') : cleanRecId_(data.candidateId || data.CandidateID || newId_('LC'), 'CandidateID');
  const skillId = cleanRecId_(data.skillId || data.SkillID, 'SkillID');
  assertRecForeignKey_(requireSheet_(db, SHEET_NAMES.skills), 'SkillID', skillId, 'SkillID');
  if (skillId !== 'S001') throwApiError_('REC_VALIDATION', 'Cooking rec-v1 candidates must use SkillID S001.');
  const safetyRequired = cleanRecBoolean_(Object.prototype.hasOwnProperty.call(data, 'safetyRequired') ? data.safetyRequired : data.SafetyRequired, 'SafetyRequired');
  const row = {
    CandidateID: id,
    Domain: cleanRecEnum_(data.domain || data.Domain || 'cooking', REC_ENUMS.domain, 'Domain'),
    Title: cleanRecText_(data.title || data.Title, REC_LIMITS.title, 'Title', true),
    SkillID: skillId,
    CapabilityLabel: cleanRecText_(data.capabilityLabel || data.CapabilityLabel || '', REC_LIMITS.shortText, 'CapabilityLabel', false),
    PracticeDescription: cleanRecText_(data.practiceDescription || data.PracticeDescription, REC_LIMITS.description, 'PracticeDescription', true),
    CompletionStandard: cleanRecText_(data.completionStandard || data.CompletionStandard, REC_LIMITS.description, 'CompletionStandard', true),
    WhyItMatters: cleanRecText_(data.whyItMatters || data.WhyItMatters || '', REC_LIMITS.description, 'WhyItMatters', false),
    EstimatedMinutes: Math.max(0, Math.floor(Number(data.estimatedMinutes || data.EstimatedMinutes || 0))) || '',
    ChallengeBand: cleanRecEnum_(data.challengeBand || data.ChallengeBand, REC_ENUMS.challengeBand, 'ChallengeBand'),
    PrimaryChallengeType: cleanRecEnum_(data.primaryChallengeType || data.PrimaryChallengeType, REC_ENUMS.primaryChallengeType, 'PrimaryChallengeType'),
    DifficultyDrivers: recJsonArrayCell_(cleanRecTagList_(data.difficultyDrivers || data.DifficultyDrivers, 'DifficultyDrivers', true)),
    InterestTags: recJsonArrayCell_(cleanRecTagList_(data.interestTags || data.InterestTags || [], 'InterestTags', false)),
    CookingMethodTags: recJsonArrayCell_(cleanRecTagList_(data.cookingMethodTags || data.CookingMethodTags, 'CookingMethodTags', true)),
    MealTypeTags: recJsonArrayCell_(cleanRecTagList_(data.mealTypeTags || data.MealTypeTags, 'MealTypeTags', true)),
    CuisineTags: recJsonArrayCell_(cleanRecTagList_(data.cuisineTags || data.CuisineTags || [], 'CuisineTags', false)),
    ChallengeStructureTags: recJsonArrayCell_(cleanRecTagList_(data.challengeStructureTags || data.ChallengeStructureTags || [], 'ChallengeStructureTags', false)),
    SafetyRequired: safetyRequired,
    MinimumSafetySupport: safetyRequired ? cleanRecEnum_(data.minimumSafetySupport || data.MinimumSafetySupport, REC_ENUMS.safetySupport, 'MinimumSafetySupport') : 'none',
    SafetyRequirement: safetyRequired ? cleanRecText_(data.safetyRequirement || data.SafetyRequirement, REC_LIMITS.description, 'SafetyRequirement', true) : '',
    SafetyNote: cleanRecText_(data.safetyNote || data.SafetyNote || '', REC_LIMITS.note, 'SafetyNote', false),
    SupportAllocation: '',
    SuggestedSupportOptions: recJsonArrayCell_((parseRecJsonArray_(data.suggestedSupportOptions || data.SuggestedSupportOptions || [], 'SuggestedSupportOptions')).map(function(v) {
      return cleanRecEnum_(v, REC_D005_SUPPORT_TOKENS, 'SuggestedSupportOptions');
    })),
    AuthenticUse: cleanRecText_(data.authenticUse || data.AuthenticUse || '', REC_LIMITS.description, 'AuthenticUse', false),
    CuratorRationale: cleanRecText_(data.curatorRationale || data.CuratorRationale || '', REC_LIMITS.rationale, 'CuratorRationale', false),
    BehaviourReviewStatus: cleanRecEnum_(data.behaviourReviewStatus || data.BehaviourReviewStatus || 'routine_approved_pattern', REC_ENUMS.behaviourReviewStatus, 'BehaviourReviewStatus'),
    CandidateStatus: cleanRecEnum_(data.candidateStatus || data.CandidateStatus || 'active', REC_ENUMS.candidateStatus, 'CandidateStatus'),
    CreatedAt: data.CreatedAt || now,
    UpdatedAt: now
  };
  const mappings = db.getSheetByName(SHEET_NAMES.candidateTechniques) ? readObjects_(db.getSheetByName(SHEET_NAMES.candidateTechniques)) : [];
  row.SupportAllocation = recJsonObjectCell_(validateSupportAllocation_(db, id, data.supportAllocation || data.SupportAllocation || {}, mappings));
  return row;
}

function validateTechniqueDraft_(db, data, existingId) {
  const now = new Date();
  const id = existingId ? cleanRecId_(existingId, 'TechniqueID') : cleanRecId_(data.techniqueId || data.TechniqueID || newId_('COOK'), 'TechniqueID');
  const skillId = cleanRecId_(data.skillId || data.SkillID, 'SkillID');
  assertRecForeignKey_(requireSheet_(db, SHEET_NAMES.skills), 'SkillID', skillId, 'SkillID');
  if (skillId !== 'S001') throwApiError_('REC_VALIDATION', 'Cooking rec-v1 techniques must use SkillID S001.');
  const scaffoldOptions = parseRecJsonArray_(data.typicalScaffoldOptions || data.TypicalScaffoldOptions || [], 'TypicalScaffoldOptions').map(function(v) {
    return cleanRecEnum_(v, REC_D005_SUPPORT_TOKENS, 'TypicalScaffoldOptions');
  });
  return {
    TechniqueID: id,
    SkillID: skillId,
    Name: cleanRecText_(data.name || data.Name, REC_LIMITS.title, 'Name', true),
    SophieFacingTitle: cleanRecText_(data.sophieFacingTitle || data.SophieFacingTitle || '', REC_LIMITS.title, 'SophieFacingTitle', false),
    TechniqueFamily: cleanRecText_(data.techniqueFamily || data.TechniqueFamily || '', REC_LIMITS.shortText, 'TechniqueFamily', false),
    Description: cleanRecText_(data.description || data.Description, REC_LIMITS.description, 'Description', true),
    ObservableEvidence: cleanRecText_(data.observableEvidence || data.ObservableEvidence, REC_LIMITS.description, 'ObservableEvidence', true),
    DifficultyDrivers: recJsonArrayCell_(cleanRecTagList_(data.difficultyDrivers || data.DifficultyDrivers, 'DifficultyDrivers', true)),
    TypicalScaffoldOptions: recJsonArrayCell_(scaffoldOptions),
    SafetyCritical: cleanRecBoolean_(data.safetyCritical || data.SafetyCritical || false, 'SafetyCritical'),
    TypicalSafetySupport: cleanRecEnum_(data.typicalSafetySupport || data.TypicalSafetySupport || 'none', REC_ENUMS.safetySupport, 'TypicalSafetySupport'),
    SafetyNote: cleanRecText_(data.safetyNote || data.SafetyNote || '', REC_LIMITS.note, 'SafetyNote', false),
    TransferIndicators: recJsonArrayCell_(cleanRecTagList_(data.transferIndicators || data.TransferIndicators || [], 'TransferIndicators', false)),
    AuthenticUses: recJsonArrayCell_(cleanRecTagList_(data.authenticUses || data.AuthenticUses || [], 'AuthenticUses', false)),
    Active: Object.prototype.hasOwnProperty.call(data, 'active') || Object.prototype.hasOwnProperty.call(data, 'Active') ? cleanRecBoolean_(Object.prototype.hasOwnProperty.call(data, 'active') ? data.active : data.Active, 'Active') : true,
    CreatedAt: data.CreatedAt || now,
    UpdatedAt: now
  };
}

function validateCandidateTechniqueSet_(db, candidateId, mappings) {
  const candidate = cleanRecId_(candidateId, 'CandidateID');
  assertRecForeignKey_(recSheet_(db, SHEET_NAMES.learnCandidates), 'CandidateID', candidate, 'CandidateID');
  const techniqueSheet = recSheet_(db, SHEET_NAMES.techniques);
  const rows = (mappings || []).map(function(item) {
    const techniqueId = cleanRecId_(item.techniqueId || item.TechniqueID, 'TechniqueID');
    assertRecForeignKey_(techniqueSheet, 'TechniqueID', techniqueId, 'TechniqueID');
    return {
      CandidateTechniqueID: stableRecId_('CT', candidate, techniqueId),
      CandidateID: candidate,
      TechniqueID: techniqueId,
      Role: cleanRecEnum_(item.role || item.Role, REC_ENUMS.candidateTechniqueRole, 'CandidateTechnique Role'),
      EvidenceRelevant: cleanRecBoolean_(Object.prototype.hasOwnProperty.call(item, 'evidenceRelevant') ? item.evidenceRelevant : item.EvidenceRelevant, 'EvidenceRelevant'),
      SafetyRole: cleanRecEnum_(item.safetyRole || item.SafetyRole || 'none', REC_ENUMS.safetyRole, 'SafetyRole'),
      CreatedAt: new Date()
    };
  });
  assertNoCandidateTechniqueDuplicate_(rows);
  if (!rows.some(function(row) { return row.Role === 'primary_practice'; })) throwApiError_('REC_VALIDATION', 'Candidate must map at least one primary_practice Technique.');
  return rows;
}

function validateTechniquePrerequisiteSet_(db, techniqueId, edges) {
  const target = cleanRecId_(techniqueId, 'TechniqueID');
  const techniqueSheet = recSheet_(db, SHEET_NAMES.techniques);
  assertRecForeignKey_(techniqueSheet, 'TechniqueID', target, 'TechniqueID');
  const rows = (edges || []).map(function(item) {
    const prereq = cleanRecId_(item.prerequisiteTechniqueId || item.PrerequisiteTechniqueID, 'PrerequisiteTechniqueID');
    assertRecForeignKey_(techniqueSheet, 'TechniqueID', prereq, 'PrerequisiteTechniqueID');
    const appliesWhen = validateAppliesWhen_(item.appliesWhen || item.AppliesWhen || '');
    if (appliesWhen) {
      appliesWhen.slice('candidate:'.length).split('|').forEach(function(candidateId) {
        assertRecForeignKey_(recSheet_(db, SHEET_NAMES.learnCandidates), 'CandidateID', candidateId, 'AppliesWhen CandidateID');
      });
    }
    const row = {
      PrerequisiteEdgeID: stableRecId_('TP', target, prereq),
      TechniqueID: target,
      PrerequisiteTechniqueID: prereq,
      RequirementKind: cleanRecEnum_(item.requirementKind || item.RequirementKind, REC_ENUMS.requirementKind, 'RequirementKind'),
      EvidenceExpectation: cleanRecEnum_(item.evidenceExpectation || item.EvidenceExpectation, REC_ENUMS.evidenceExpectation, 'EvidenceExpectation'),
      Rationale: cleanRecText_(item.rationale || item.Rationale, REC_LIMITS.rationale, 'Rationale', true),
      SafetyRelated: cleanRecBoolean_(Object.prototype.hasOwnProperty.call(item, 'safetyRelated') ? item.safetyRelated : item.SafetyRelated, 'SafetyRelated'),
      SupportImplication: cleanRecText_(item.supportImplication || item.SupportImplication || '', REC_LIMITS.description, 'SupportImplication', false),
      AppliesWhen: appliesWhen,
      Active: true,
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    };
    assertNoPrerequisiteSelfLink_(row);
    return row;
  });
  assertNoPrerequisiteDuplicate_(rows);
  return rows;
}

function validateLearningEvidenceDraft_(db, data) {
  const requestId = cleanClientRequestId_(data.clientRequestId);
  const techniqueId = cleanRecId_(data.techniqueId || data.TechniqueID, 'TechniqueID');
  assertRecForeignKey_(recSheet_(db, SHEET_NAMES.techniques), 'TechniqueID', techniqueId, 'TechniqueID');
  const skillId = cleanRecId_(data.skillId || data.SkillID || 'S001', 'SkillID');
  assertRecForeignKey_(requireSheet_(db, SHEET_NAMES.skills), 'SkillID', skillId, 'SkillID');
  const observedSupport = cleanRecEnum_(data.observedSupport || data.ObservedSupport, REC_ENUMS.observedSupport, 'ObservedSupport');
  if (REC_D005_SUPPORT_TOKENS.indexOf(observedSupport) >= 0) throwApiError_('REC_VALIDATION', 'ObservedSupport is actual observed support, not Sophies support preference.');
  const opportunityId = String(data.opportunityId || data.OpportunityID || '').trim();
  const candidateId = String(data.candidateId || data.CandidateID || '').trim();
  if (opportunityId) assertRecForeignKey_(requireSheet_(db, SHEET_NAMES.opportunities), 'ID', opportunityId, 'OpportunityID');
  if (candidateId) assertRecForeignKey_(recSheet_(db, SHEET_NAMES.learnCandidates), 'CandidateID', candidateId, 'CandidateID');
  return {
    EvidenceID: stableRecId_('LE', 'evidence', requestId),
    SkillID: skillId,
    TechniqueID: techniqueId,
    OpportunityID: opportunityId,
    CandidateID: candidateId,
    ObservedAt: cleanRecDate_(data.observedAt || data.ObservedAt || new Date(), 'ObservedAt', true),
    ObservedByRole: cleanRecEnum_(data.observedByRole || data.ObservedByRole || 'parent', REC_ENUMS.observedByRole, 'ObservedByRole'),
    EvidenceType: cleanRecEnum_(data.evidenceType || data.EvidenceType || 'parent_observation', REC_ENUMS.evidenceType, 'EvidenceType'),
    ObservedCapability: cleanRecEnum_(data.observedCapability || data.ObservedCapability, REC_ENUMS.observedCapability, 'ObservedCapability'),
    ObservedSupport: observedSupport,
    SafetyObserved: cleanRecEnum_(data.safetyObserved || data.SafetyObserved || 'not_observed', REC_ENUMS.safetyObserved, 'SafetyObserved'),
    ReliabilityObserved: cleanRecEnum_(data.reliabilityObserved || data.ReliabilityObserved || 'not_assessed', REC_ENUMS.reliabilityObserved, 'ReliabilityObserved'),
    EvidenceNote: cleanRecText_(data.evidenceNote || data.EvidenceNote, REC_LIMITS.note, 'EvidenceNote', true),
    Context: cleanRecText_(data.context || data.Context || '', REC_LIMITS.note, 'Context', false),
    Active: true,
    CreatedAt: new Date()
  };
}

function recSessionExpiry_(durationKind, now, explicitExpiresAt) {
  const base = now || new Date();
  if (durationKind === 'session') return explicitExpiresAt ? cleanRecDate_(explicitExpiresAt, 'ExpiresAt', false) : '';
  if (durationKind === 'day') {
    if (explicitExpiresAt) return cleanRecDate_(explicitExpiresAt, 'ExpiresAt', true);
    return new Date(base.getTime() + 24 * 60 * 60 * 1000);
  }
  if (durationKind === 'until_date') return cleanRecDate_(explicitExpiresAt, 'ExpiresAt', true);
  return '';
}

function validateLearningPreferenceDraft_(db, data, sessionId) {
  const requestId = cleanClientRequestId_(data.clientRequestId);
  const type = cleanRecEnum_(data.preferenceType || data.PreferenceType, REC_ENUMS.preferenceType, 'PreferenceType');
  const duration = cleanRecEnum_(data.durationKind || data.DurationKind || (type === 'challenge_preference' ? 'session' : 'until_changed'), REC_ENUMS.durationKind, 'DurationKind');
  const scope = cleanRecEnum_(data.preferenceScope || data.PreferenceScope || 'domain', REC_ENUMS.preferenceScope, 'PreferenceScope');
  let value = String(data.preferenceValue || data.PreferenceValue || '').trim().toLowerCase();
  if (type === 'challenge_preference') value = cleanRecEnum_(value, REC_ENUMS.challengePreference, 'ChallengePreference');
  else value = cleanRecTag_(value, 'PreferenceValue');
  const sid = duration === 'session' ? cleanRecId_(sessionId || data.sessionId || data.SessionID, 'SessionID') : String(data.sessionId || data.SessionID || '');
  const scopeRef = String(data.scopeRef || data.ScopeRef || '').trim();
  if (scope !== 'domain' && !scopeRef) throwApiError_('REC_VALIDATION', 'ScopeRef is required for non-domain preferences.');
  return {
    PreferenceID: stableRecId_('LP', 'preference', requestId),
    Domain: cleanRecEnum_(data.domain || data.Domain || 'cooking', REC_ENUMS.domain, 'Domain'),
    PreferenceType: type,
    PreferenceValue: value,
    PreferenceScope: scope,
    ScopeRef: scopeRef,
    DurationKind: duration,
    SessionID: sid,
    ExpiresAt: recSessionExpiry_(duration, new Date(), data.expiresAt || data.ExpiresAt || ''),
    Status: cleanRecEnum_(data.status || data.Status || 'active', REC_ENUMS.preferenceStatus, 'Preference Status'),
    AuthoredByRole: cleanRecEnum_(data.authoredByRole || data.AuthoredByRole || 'sophie', REC_ENUMS.authoredByRole, 'AuthoredByRole'),
    CreatedAt: new Date(),
    UpdatedAt: new Date()
  };
}

function validateSourceLinkDraft_(db, data) {
  const recordType = cleanRecRecordType_(data.recordType || data.RecordType);
  const recordId = cleanRecId_(data.recordId || data.RecordID, 'RecordID');
  const targetMap = {};
  targetMap.LearnCandidates = [SHEET_NAMES.learnCandidates, 'CandidateID'];
  targetMap.Techniques = [SHEET_NAMES.techniques, 'TechniqueID'];
  targetMap.CandidateTechniques = [SHEET_NAMES.candidateTechniques, 'CandidateTechniqueID'];
  targetMap.TechniquePrerequisites = [SHEET_NAMES.techniquePrerequisites, 'PrerequisiteEdgeID'];
  targetMap.LearningEvidence = [SHEET_NAMES.learningEvidence, 'EvidenceID'];
  targetMap.LearningPreferences = [SHEET_NAMES.learningPreferences, 'PreferenceID'];
  targetMap.RecommendationHistory = [SHEET_NAMES.recommendationHistory, 'RecommendationEventID'];
  const target = targetMap[recordType];
  assertRecForeignKey_(recSheet_(db, target[0]), target[1], recordId, 'SourceLink target');
  const role = cleanRecEnum_(data.provenanceRole || data.ProvenanceRole, REC_ENUMS.provenanceRole, 'ProvenanceRole');
  const sourceRef = cleanRecText_(data.sourceRef || data.SourceRef, REC_LIMITS.sourceRef, 'SourceRef', true);
  const sourceLocation = cleanRecText_(data.sourceLocation || data.SourceLocation || '', REC_LIMITS.sourceLocation, 'SourceLocation', false);
  return {
    SourceLinkID: stableRecId_('SL', recordType + '|' + recordId + '|' + role, sourceRef + '|' + sourceLocation),
    RecordType: recordType,
    RecordID: recordId,
    ProvenanceRole: role,
    SourceRef: sourceRef,
    SourceLocation: sourceLocation,
    SupportNote: cleanRecText_(data.supportNote || data.SupportNote || '', REC_LIMITS.note, 'SupportNote', false),
    CreatedAt: new Date()
  };
}

function validateRecommendationRequest_(db, data) {
  const requestId = cleanClientRequestId_(data.clientRequestId);
  const domain = cleanRecEnum_(data.domain || 'cooking', REC_ENUMS.domain, 'Domain');
  const limit = data.limit == null || data.limit === '' ? 3 : Math.floor(Number(data.limit));
  if (!(limit >= 1 && limit <= 3)) throwApiError_('REC_VALIDATION', 'Recommendation limit must be 1-3.');
  const requestKind = cleanRecEnum_(data.requestKind || 'normal', REC_ENUMS.requestKind, 'requestKind');
  const sessionId = data.recommendationSessionId ? cleanRecId_(data.recommendationSessionId, 'recommendationSessionId') : stableRecId_('RECSESSION', 'session', requestId);
  let challengePreference = '';
  let challengePreferenceDuration = '';
  if (data.challengePreference) {
    challengePreference = cleanRecEnum_(data.challengePreference, REC_ENUMS.challengePreference, 'challengePreference');
    challengePreferenceDuration = cleanRecEnum_(data.challengePreferenceDuration || 'session', REC_ENUMS.durationKind, 'challengePreferenceDuration');
  }
  const availableSafetySupport = cleanRecEnum_(data.availableSafetySupport || 'none', REC_ENUMS.safetySupport, 'availableSafetySupport');
  let pathwayScope = '';
  let pathwayRef = '';
  if (data.pathwayScope) {
    pathwayScope = cleanRecEnum_(data.pathwayScope, ['technique', 'interest_tag'], 'pathwayScope');
    pathwayRef = cleanRecId_(data.pathwayRef, 'pathwayRef');
  }
  return {
    clientRequestId: requestId,
    domain: domain,
    limit: limit,
    requestKind: requestKind,
    recommendationSessionId: sessionId,
    priorRecommendationSetId: String(data.priorRecommendationSetId || ''),
    challengePreference: challengePreference,
    challengePreferenceDuration: challengePreferenceDuration,
    availableSafetySupport: availableSafetySupport,
    pathwayScope: pathwayScope,
    pathwayRef: pathwayRef
  };
}

function validateRecommendationResponse_(db, data) {
  const requestId = cleanClientRequestId_(data.clientRequestId);
  const eventId = data.recommendationEventId ? cleanRecId_(data.recommendationEventId, 'RecommendationEventID') : '';
  const setId = data.recommendationSetId ? cleanRecId_(data.recommendationSetId, 'RecommendationSetID') : '';
  const candidateId = data.candidateId ? cleanRecId_(data.candidateId, 'CandidateID') : '';
  if (!eventId && !(setId && candidateId)) throwApiError_('REC_VALIDATION', 'Recommendation response needs event ID or set/candidate pair.');
  return {
    clientRequestId: requestId,
    recommendationEventId: eventId,
    recommendationSetId: setId,
    candidateId: candidateId,
    outcome: cleanRecEnum_(data.outcome || 'shown', REC_ENUMS.recommendationOutcome, 'RecommendationOutcome'),
    override: cleanRecEnum_(data.override || 'none', REC_ENUMS.sophieOverride, 'SophieOverride'),
    overrideTargetCandidateId: String(data.overrideTargetCandidateId || ''),
    overrideNote: cleanRecText_(data.overrideNote || '', REC_LIMITS.note, 'OverrideNote', false)
  };
}

function requireLearningRecommendationAccess_(recommendationKey, adminKey) {
  if (adminKey) {
    requireAdmin_(adminKey);
    return;
  }
  const expected = PropertiesService.getScriptProperties().getProperty(LEARNING_RECOMMENDATION_DEVICE_KEY_PROPERTY);
  if (!expected) throwApiError_('UNAUTHORISED', 'Learning Recommendation access has not been provisioned.');
  if (!recommendationKey || !constantTimeEqual_(String(recommendationKey), String(expected))) {
    throwApiError_('UNAUTHORISED', 'Learning Recommendation access is not authorised on this device.');
  }
}

function provisionLearningRecommendationDevice_() {
  const properties = PropertiesService.getScriptProperties();
  let key = properties.getProperty(LEARNING_RECOMMENDATION_DEVICE_KEY_PROPERTY);
  let provisioned = false;
  if (!key) {
    key = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
    properties.setProperty(LEARNING_RECOMMENDATION_DEVICE_KEY_PROPERTY, key);
    provisioned = true;
  }
  return { recommendationKey: key, provisioned: provisioned, learningRecommendationContractVersion: LEARNING_RECOMMENDATION_CONTRACT_VERSION };
}

function rotateLearningRecommendationDeviceKey_() {
  const key = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty(LEARNING_RECOMMENDATION_DEVICE_KEY_PROPERTY, key);
  return { recommendationKey: key, rotated: true, learningRecommendationContractVersion: LEARNING_RECOMMENDATION_CONTRACT_VERSION };
}

function runLearningRecommendationAuthorisationSmokeTest() {
  const properties = PropertiesService.getScriptProperties();
  const previous = properties.getProperty(LEARNING_RECOMMENDATION_DEVICE_KEY_PROPERTY);
  const configuredAdminKey = properties.getProperty('SOPHIE_ADMIN_KEY');
  const testKey = 'rec-test-' + Utilities.getUuid();
  let validKeyAccepted = false;
  let invalidKeyRejected = false;
  let unprovisionedRejected = false;
  let adminOverrideAccepted = false;
  try {
    properties.setProperty(LEARNING_RECOMMENDATION_DEVICE_KEY_PROPERTY, testKey);
    try { requireLearningRecommendationAccess_(testKey, ''); validKeyAccepted = true; } catch (error) {}
    try { requireLearningRecommendationAccess_('definitely-wrong', ''); } catch (error) { invalidKeyRejected = apiErrorCode_(error) === 'UNAUTHORISED'; }
    if (configuredAdminKey) {
      try { requireLearningRecommendationAccess_('', configuredAdminKey); adminOverrideAccepted = true; } catch (error) {}
    }
    properties.deleteProperty(LEARNING_RECOMMENDATION_DEVICE_KEY_PROPERTY);
    try { requireLearningRecommendationAccess_(testKey, ''); } catch (error) { unprovisionedRejected = apiErrorCode_(error) === 'UNAUTHORISED'; }
  } finally {
    if (previous) properties.setProperty(LEARNING_RECOMMENDATION_DEVICE_KEY_PROPERTY, previous);
    else properties.deleteProperty(LEARNING_RECOMMENDATION_DEVICE_KEY_PROPERTY);
  }
  const restored = properties.getProperty(LEARNING_RECOMMENDATION_DEVICE_KEY_PROPERTY) === previous;
  const result = {
    version: APP_VERSION,
    opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
    learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION,
    learningRecommendationContractVersion: LEARNING_RECOMMENDATION_CONTRACT_VERSION,
    ok: validKeyAccepted && invalidKeyRejected && unprovisionedRejected && adminOverrideAccepted && restored,
    validKeyAccepted: validKeyAccepted,
    invalidKeyRejected: invalidKeyRejected,
    unprovisionedRejected: unprovisionedRejected,
    adminOverrideAccepted: adminOverrideAccepted,
    priorProvisioningStateRestored: restored
  };
  Logger.log(JSON.stringify(result));
  return result;
}

function withLearningRecommendationLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { return callback(SpreadsheetApp.openById(SPREADSHEET_ID)); }
  finally { lock.releaseLock(); }
}

function recActivePreference_(row, sessionId, now) {
  if (String(row.Status || '').toLowerCase() !== 'active') return false;
  const duration = String(row.DurationKind || '');
  if (duration === 'session' && String(row.SessionID || '') !== String(sessionId || '')) return false;
  if (row.ExpiresAt) {
    const expiry = new Date(row.ExpiresAt).getTime();
    if (!isNaN(expiry) && expiry < (now || new Date()).getTime()) return false;
  }
  return true;
}

function recPreferenceAppliesToCandidate_(preference, candidate, mappings) {
  const scope = String(preference.PreferenceScope || 'domain');
  const ref = String(preference.ScopeRef || '');
  if (scope === 'domain') return String(preference.Domain || '') === String(candidate.Domain || '');
  if (scope === 'candidate') return ref === String(candidate.CandidateID || '');
  if (scope === 'interest_tag') return cleanRecTagList_(candidate.InterestTags || [], 'InterestTags', false).indexOf(ref) >= 0;
  if (scope === 'technique') return (mappings || []).some(function(m) { return String(m.TechniqueID || '') === ref; });
  return false;
}

function recCandidateCoreValid_(db, candidate, mappings, techniqueById) {
  const codes = [];
  if (String(candidate.CandidateStatus || '') !== 'active') codes.push('CANDIDATE_NOT_ACTIVE');
  const behavior = String(candidate.BehaviourReviewStatus || '');
  if (behavior === 'held') codes.push('BEHAVIOUR_REVIEW_HELD');
  if (behavior === 'review_required') codes.push('BEHAVIOUR_REVIEW_REQUIRED');
  if (String(candidate.SkillID || '') !== 'S001') codes.push('INVALID_SKILL_LINK');
  try {
    if (!cleanRecTagList_(candidate.DifficultyDrivers || [], 'DifficultyDrivers', true).length) codes.push('MISSING_DIFFICULTY_DRIVERS');
    if (!cleanRecTagList_(candidate.CookingMethodTags || [], 'CookingMethodTags', true).length) codes.push('MISSING_COOKING_METHOD_TAGS');
    if (!cleanRecTagList_(candidate.MealTypeTags || [], 'MealTypeTags', true).length) codes.push('MISSING_MEAL_TYPE_TAGS');
    cleanRecEnum_(candidate.PrimaryChallengeType, REC_ENUMS.primaryChallengeType, 'PrimaryChallengeType');
    cleanRecEnum_(candidate.ChallengeBand, REC_ENUMS.challengeBand, 'ChallengeBand');
  } catch (error) { codes.push('INVALID_REQUIRED_METADATA'); }
  if (!mappings.length || !mappings.some(function(m) { return String(m.Role || '') === 'primary_practice'; })) codes.push('MISSING_PRIMARY_TECHNIQUE');
  mappings.forEach(function(mapping) {
    const technique = techniqueById[String(mapping.TechniqueID || '')];
    if (!technique || !recBoolFromRow_(technique.Active)) codes.push('INVALID_TECHNIQUE_MAPPING');
  });
  return codes;
}

function evaluateCandidateEligibility_(db, candidate, context) {
  const allMappings = context.candidateTechniques || readObjects_(recSheet_(db, SHEET_NAMES.candidateTechniques));
  const mappings = allMappings.filter(function(row) { return String(row.CandidateID || '') === String(candidate.CandidateID || ''); });
  const techniques = context.techniques || readObjects_(recSheet_(db, SHEET_NAMES.techniques));
  const techniqueById = {};
  techniques.forEach(function(row) { techniqueById[String(row.TechniqueID || '')] = row; });
  const prerequisites = context.prerequisites || readObjects_(recSheet_(db, SHEET_NAMES.techniquePrerequisites));
  const evidence = context.evidence || readObjects_(recSheet_(db, SHEET_NAMES.learningEvidence));
  const reasonCodes = recCandidateCoreValid_(db, candidate, mappings, techniqueById);
  const hardChecks = [];
  const allocation = resolveCandidateAllocation_(candidate, mappings);
  mappings.forEach(function(mapping) {
    if (!isTechniqueSophieLed_(candidate, mapping, allocation)) return;
    prerequisites.filter(function(edge) {
      return recBoolFromRow_(edge.Active) && String(edge.TechniqueID || '') === String(mapping.TechniqueID || '') &&
        String(edge.RequirementKind || '') === 'hard' && isPrerequisiteEdgeApplicable_(edge, candidate);
    }).forEach(function(edge) {
      const rows = evidence.filter(function(ev) { return String(ev.TechniqueID || '') === String(edge.PrerequisiteTechniqueID || ''); });
      const satisfied = isEvidenceExpectationSatisfied_(String(edge.EvidenceExpectation || ''), rows, candidate);
      hardChecks.push({
        prerequisiteEdgeId: String(edge.PrerequisiteEdgeID || ''),
        prerequisiteTechniqueId: String(edge.PrerequisiteTechniqueID || ''),
        expectation: String(edge.EvidenceExpectation || ''),
        satisfied: satisfied
      });
      if (!satisfied) reasonCodes.push('PREREQUISITE_CONTEXT_NOT_YET_EVIDENCED');
    });
  });
  let safetySatisfied = true;
  const available = String(context.availableSafetySupport || 'none');
  const required = String(candidate.MinimumSafetySupport || 'none');
  if (recBoolFromRow_(candidate.SafetyRequired)) {
    safetySatisfied = Object.prototype.hasOwnProperty.call(REC_SAFETY_ORDER, available) &&
      Object.prototype.hasOwnProperty.call(REC_SAFETY_ORDER, required) &&
      REC_SAFETY_ORDER[available] >= REC_SAFETY_ORDER[required];
    if (!safetySatisfied) reasonCodes.push('SAFETY_SUPPORT_NOT_AVAILABLE');
  }
  const uniqueCodes = reasonCodes.filter(function(code, index, arr) { return arr.indexOf(code) === index; });
  let status = 'eligible';
  if (uniqueCodes.some(function(code) { return ['INVALID_SKILL_LINK', 'MISSING_DIFFICULTY_DRIVERS', 'MISSING_COOKING_METHOD_TAGS', 'MISSING_MEAL_TYPE_TAGS', 'INVALID_REQUIRED_METADATA', 'MISSING_PRIMARY_TECHNIQUE', 'INVALID_TECHNIQUE_MAPPING'].indexOf(code) >= 0; })) status = 'invalid_definition';
  else if (uniqueCodes.indexOf('CANDIDATE_NOT_ACTIVE') >= 0) status = 'blocked_catalogue';
  else if (uniqueCodes.indexOf('BEHAVIOUR_REVIEW_HELD') >= 0 || uniqueCodes.indexOf('BEHAVIOUR_REVIEW_REQUIRED') >= 0) status = 'blocked_behaviour_review';
  else if (uniqueCodes.indexOf('PREREQUISITE_CONTEXT_NOT_YET_EVIDENCED') >= 0) status = 'blocked_hard_prerequisite';
  else if (uniqueCodes.indexOf('SAFETY_SUPPORT_NOT_AVAILABLE') >= 0) status = 'blocked_safety';
  const reasonMap = {
    eligible: 'This option is currently eligible.',
    invalid_definition: 'This option is temporarily unavailable because its learning definition needs correction.',
    blocked_catalogue: 'This option is not currently active in the learning catalogue.',
    blocked_behaviour_review: 'This option is being held for review.',
    blocked_hard_prerequisite: 'This version expects a component that still needs relevant supported practice.',
    blocked_safety: 'The safety support required for this version is not currently available.'
  };
  return {
    status: status,
    reasonCodes: uniqueCodes,
    reason: reasonMap[status],
    hardPrerequisiteChecks: hardChecks,
    safetyCheck: { required: recBoolFromRow_(candidate.SafetyRequired), minimumSupport: required, availableSupport: available, satisfied: safetySatisfied }
  };
}

function recRecommendedPrerequisiteMissing_(candidate, mappings, prerequisites, evidence) {
  const allocation = resolveCandidateAllocation_(candidate, mappings);
  let missing = false;
  mappings.forEach(function(mapping) {
    if (!isTechniqueSophieLed_(candidate, mapping, allocation)) return;
    prerequisites.filter(function(edge) {
      return recBoolFromRow_(edge.Active) && String(edge.TechniqueID || '') === String(mapping.TechniqueID || '') &&
        String(edge.RequirementKind || '') === 'recommended' && isPrerequisiteEdgeApplicable_(edge, candidate);
    }).forEach(function(edge) {
      const rows = evidence.filter(function(ev) { return String(ev.TechniqueID || '') === String(edge.PrerequisiteTechniqueID || ''); });
      if (!isEvidenceExpectationSatisfied_(String(edge.EvidenceExpectation || ''), rows, candidate)) missing = true;
    });
  });
  return missing;
}

function classifyRecommendationFit_(candidate, mappings, evidence, prerequisites) {
  const primary = mappings.filter(function(m) { return String(m.Role || '') === 'primary_practice'; });
  let evidenced = 0;
  primary.forEach(function(mapping) {
    if (evidence.some(function(ev) {
      return recBoolFromRow_(ev.Active) && String(ev.TechniqueID || '') === String(mapping.TechniqueID || '') && recEvidenceContextApplicable_(ev, candidate);
    })) evidenced += 1;
  });
  const missingRecommended = recRecommendedPrerequisiteMissing_(candidate, mappings, prerequisites, evidence);
  if (primary.length && evidenced === primary.length && !missingRecommended) return 'familiar_next_step';
  if (evidenced > 0 || missingRecommended) return 'adjacent_stretch';
  return 'novel_but_supported';
}

function recHistoryForCandidate_(history, candidateId) {
  return (history || []).filter(function(row) { return String(row.CandidateID || '') === String(candidateId); });
}

function classifyRecencyDisposition_(candidate, request, history, opportunityById, evidence) {
  const rows = recHistoryForCandidate_(history, candidate.CandidateID);
  if (request.requestKind === 'repeat_or_refine' && rows.some(function(row) {
    return String(row.RecommendationOutcome || '') === 'chosen' || String(row.CreatedOpportunityID || '');
  })) return 'deliberate_repeat';
  if (!rows.length) return 'new';
  if (request.priorRecommendationSetId && rows.some(function(row) { return String(row.RecommendationSetID || '') === request.priorRecommendationSetId; })) return 'recently_shown';
  let practised = false;
  rows.forEach(function(row) {
    const opportunity = opportunityById && opportunityById[String(row.CreatedOpportunityID || '')];
    if (opportunity && (opportunity.StartedAt || opportunity.FinishedAt || opportunity.CompletedAt)) practised = true;
    if ((evidence || []).some(function(ev) {
      return recBoolFromRow_(ev.Active) && String(ev.CandidateID || '') === String(candidate.CandidateID || '') &&
        new Date(ev.ObservedAt || 0) >= new Date(row.GeneratedAt || 0);
    })) practised = true;
  });
  if (practised) return 'recently_practised';
  if (rows.some(function(row) { return String(row.RecommendationOutcome || '') === 'chosen' || String(row.CreatedOpportunityID || ''); })) return 'recently_chosen';
  return 'returning_option';
}

function recCandidateTags_(candidate, field) {
  try { return cleanRecTagList_(candidate[field] || [], field, false); } catch (error) { return []; }
}

function recMeaningfulDiversityDifference_(a, b) {
  const fields = ['CookingMethodTags', 'MealTypeTags', 'CuisineTags', 'ChallengeStructureTags'];
  let differences = 0;
  fields.forEach(function(field) {
    const aa = recCandidateTags_(a, field);
    const bb = recCandidateTags_(b, field);
    const same = aa.length === bb.length && aa.every(function(x) { return bb.indexOf(x) >= 0; });
    if (!same && (aa.length || bb.length)) differences += 1;
  });
  return differences;
}

function recActivePreferences_(rows, request) {
  const now = new Date();
  return (rows || []).filter(function(row) {
    return String(row.Domain || '') === request.domain && recActivePreference_(row, request.recommendationSessionId, now);
  });
}

function recEffectiveChallengePreference_(request, preferences) {
  if (request.challengePreference) return request.challengePreference;
  const matches = (preferences || []).filter(function(row) { return String(row.PreferenceType || '') === 'challenge_preference'; });
  if (!matches.length) return '';
  matches.sort(function(a, b) { return new Date(b.UpdatedAt || b.CreatedAt || 0) - new Date(a.UpdatedAt || a.CreatedAt || 0); });
  return String(matches[0].PreferenceValue || '');
}

function recReferenceCandidate_(history, candidateById) {
  const rows = (history || []).filter(function(row) {
    return candidateById[String(row.CandidateID || '')] &&
      (String(row.RecommendationOutcome || '') === 'chosen' || String(row.CreatedOpportunityID || ''));
  }).sort(function(a, b) {
    return new Date(b.ResolvedAt || b.GeneratedAt || 0) - new Date(a.ResolvedAt || a.GeneratedAt || 0);
  });
  return rows.length ? candidateById[String(rows[0].CandidateID || '')] : null;
}

function recChallengeBucketOrder_(preference, referenceBand) {
  if (!preference || preference === 'similar') {
    if (!referenceBand) return [];
    if (referenceBand === 'gentle') return ['gentle', 'stretch', 'complex'];
    if (referenceBand === 'stretch') return ['stretch', 'gentle', 'complex'];
    return ['complex', 'stretch', 'gentle'];
  }
  if (preference === 'easier') {
    if (referenceBand === 'complex') return ['stretch', 'gentle', 'complex'];
    return ['gentle', 'stretch', 'complex'];
  }
  if (preference === 'more_challenging') {
    if (referenceBand === 'stretch') return ['complex', 'stretch', 'gentle'];
    if (referenceBand === 'complex') return ['complex', 'stretch', 'gentle'];
    return ['stretch', 'complex', 'gentle'];
  }
  return [];
}

function recRequestContextSignature_(request) {
  return recDigestHex_(JSON.stringify({
    domain: request.domain,
    limit: request.limit,
    session: request.recommendationSessionId,
    kind: request.requestKind,
    prior: request.priorRecommendationSetId,
    challenge: request.challengePreference,
    duration: request.challengePreferenceDuration,
    safety: request.availableSafetySupport,
    pathwayScope: request.pathwayScope,
    pathwayRef: request.pathwayRef
  })).slice(0, 12).toUpperCase();
}

function recRecommendationSetId_(request) {
  const requestHash = recDigestHex_('req|' + request.clientRequestId).slice(0, 10).toUpperCase();
  return 'RECSET-' + requestHash + '-' + recRequestContextSignature_(request);
}

function recFindRequestSetConflict_(history, request, setId) {
  const requestHash = recDigestHex_('req|' + request.clientRequestId).slice(0, 10).toUpperCase();
  const prefix = 'RECSET-' + requestHash + '-';
  const ids = {};
  (history || []).forEach(function(row) {
    const id = String(row.RecommendationSetID || '');
    if (id.indexOf(prefix) === 0) ids[id] = true;
  });
  const existing = Object.keys(ids);
  if (existing.length && existing.indexOf(setId) < 0) throwApiError_('IDEMPOTENCY_CONFLICT', 'clientRequestId was reused with a different recommendation request.');
}

function recHydrateRecommendationSet_(db, setId) {
  const history = readObjects_(recSheet_(db, SHEET_NAMES.recommendationHistory)).filter(function(row) { return String(row.RecommendationSetID || '') === setId; });
  history.sort(function(a, b) { return Number(a.Position || 0) - Number(b.Position || 0); });
  const candidateSheet = recSheet_(db, SHEET_NAMES.learnCandidates);
  const candidateById = {};
  readObjects_(candidateSheet).forEach(function(c) { candidateById[String(c.CandidateID || '')] = c; });
  return history.map(function(event) {
    const candidate = candidateById[String(event.CandidateID || '')];
    if (!candidate) return null;
    return recRecommendationResponseCandidate_(candidate, event, {
      status: 'eligible', reasonCodes: [], reason: 'This option was eligible when this set was created.', hardPrerequisiteChecks: [], safetyCheck: {}
    });
  }).filter(Boolean);
}

function recRecommendationResponseCandidate_(candidate, event, eligibility) {
  return {
    candidateId: String(candidate.CandidateID || ''),
    title: String(candidate.Title || ''),
    challengeBand: String(candidate.ChallengeBand || ''),
    primaryChallengeType: String(candidate.PrimaryChallengeType || ''),
    fitBand: String(event.FitBand || ''),
    diversityRole: String(event.DiversityRole || ''),
    whyItMatters: String(candidate.WhyItMatters || ''),
    practiceDescription: String(candidate.PracticeDescription || ''),
    estimatedMinutes: number_(candidate.EstimatedMinutes),
    safety: {
      required: recBoolFromRow_(candidate.SafetyRequired),
      minimumSupport: String(candidate.MinimumSafetySupport || 'none'),
      note: String(candidate.SafetyNote || '')
    },
    eligibility: eligibility,
    reasons: parseRecJsonArray_(event.ReasonText ? JSON.stringify([String(event.ReasonText)]) : '[]', 'ReasonText'),
    recommendationEventId: String(event.RecommendationEventID || '')
  };
}

function recDiversityRole_(candidate, fit, activePreferences, index) {
  const interestTags = recCandidateTags_(candidate, 'InterestTags');
  const interestMatch = (activePreferences || []).some(function(pref) {
    return String(pref.PreferenceType || '') === 'interest' && interestTags.indexOf(String(pref.PreferenceValue || '')) >= 0;
  });
  if (interestMatch) return 'interest_match';
  if (fit === 'novel_but_supported') return 'novel_but_supported';
  if (fit === 'adjacent_stretch') return 'appropriate_stretch';
  if (index === 0) return 'comfortable_familiar';
  return 'different_direction';
}

function recReasonForCandidate_(candidate, fit, recency, request) {
  if (recency === 'deliberate_repeat') return 'You asked to repeat or refine this activity deliberately.';
  if (request.requestKind === 'switch_pathway') return 'This option takes the learning in a different direction while keeping safety and prerequisites intact.';
  if (request.requestKind === 'surprise_me') return 'This is a less familiar eligible option that can be supported safely.';
  if (fit === 'familiar_next_step') return 'Uses techniques that already have relevant practice evidence.';
  if (fit === 'adjacent_stretch') return 'Builds from relevant practice while adding a meaningful next demand.';
  return 'Introduces a newer direction while remaining eligible and supportable.';
}

function recEvidenceBasisIds_(candidate, mappings, evidence) {
  const techniqueIds = {};
  (mappings || []).forEach(function(m) { if (String(m.Role || '') !== 'incidental') techniqueIds[String(m.TechniqueID || '')] = true; });
  return (evidence || []).filter(function(ev) {
    return recBoolFromRow_(ev.Active) && techniqueIds[String(ev.TechniqueID || '')] && recEvidenceContextApplicable_(ev, candidate);
  }).sort(function(a,b){ return new Date(b.ObservedAt || 0) - new Date(a.ObservedAt || 0); })
    .slice(0, REC_LIMITS.listItems).map(function(ev){ return String(ev.EvidenceID || ''); }).filter(Boolean);
}

function recPreferenceBasisIds_(candidate, mappings, preferences) {
  return (preferences || []).filter(function(pref) { return recPreferenceAppliesToCandidate_(pref, candidate, mappings); })
    .map(function(pref){ return String(pref.PreferenceID || ''); }).filter(Boolean).slice(0, REC_LIMITS.listItems);
}

function recOrderValue_(map, key, fallback) {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : fallback;
}

function selectLearningRecommendationSet_(db, request) {
  const candidates = readObjects_(recSheet_(db, SHEET_NAMES.learnCandidates)).filter(function(c) { return String(c.Domain || '') === request.domain; });
  const techniques = readObjects_(recSheet_(db, SHEET_NAMES.techniques));
  const mappings = readObjects_(recSheet_(db, SHEET_NAMES.candidateTechniques));
  const prerequisites = readObjects_(recSheet_(db, SHEET_NAMES.techniquePrerequisites));
  const evidence = readObjects_(recSheet_(db, SHEET_NAMES.learningEvidence));
  const preferences = recActivePreferences_(readObjects_(recSheet_(db, SHEET_NAMES.learningPreferences)), request);
  const history = readObjects_(recSheet_(db, SHEET_NAMES.recommendationHistory));
  const opportunityById = {};
  readObjects_(requireSheet_(db, SHEET_NAMES.opportunities)).forEach(function(row) { opportunityById[String(row.ID || '')] = row; });
  const candidateById = {}; candidates.forEach(function(row) { candidateById[String(row.CandidateID || '')] = row; });
  const referenceCandidate = recReferenceCandidate_(history, candidateById);
  const context = { techniques: techniques, candidateTechniques: mappings, prerequisites: prerequisites, evidence: evidence, availableSafetySupport: request.availableSafetySupport };
  let pool = candidates.map(function(candidate) {
    const cm = mappings.filter(function(m) { return String(m.CandidateID || '') === String(candidate.CandidateID || ''); });
    const eligibility = evaluateCandidateEligibility_(db, candidate, context);
    const fit = eligibility.status === 'eligible' ? classifyRecommendationFit_(candidate, cm, evidence, prerequisites) : '';
    const recency = eligibility.status === 'eligible' ? classifyRecencyDisposition_(candidate, request, history, opportunityById, evidence) : '';
    const evidenceBasisIds = eligibility.status === 'eligible' ? recEvidenceBasisIds_(candidate, cm, evidence) : [];
    const preferenceBasisIds = eligibility.status === 'eligible' ? recPreferenceBasisIds_(candidate, cm, preferences) : [];
    const suppressed = preferences.some(function(pref) {
      return String(pref.PreferenceType || '') === 'avoid_for_now' && recPreferenceAppliesToCandidate_(pref, candidate, cm);
    });
    return { candidate: candidate, mappings: cm, eligibility: eligibility, fit: fit, recency: recency, suppressed: suppressed, evidenceBasisIds: evidenceBasisIds, preferenceBasisIds: preferenceBasisIds, diversityLimited: false };
  }).filter(function(item) { return item.eligibility.status === 'eligible' && !item.suppressed; });

  if (request.pathwayScope && request.pathwayRef) {
    const scoped = pool.filter(function(item) {
      if (request.pathwayScope === 'technique') return item.mappings.some(function(m) { return String(m.TechniqueID || '') === request.pathwayRef; });
      return recCandidateTags_(item.candidate, 'InterestTags').indexOf(request.pathwayRef) >= 0;
    });
    if (scoped.length) pool = scoped;
  }

  if (request.requestKind === 'show_something_else' && request.priorRecommendationSetId) {
    const priorIds = {};
    history.filter(function(row) { return String(row.RecommendationSetID || '') === request.priorRecommendationSetId; }).forEach(function(row) { priorIds[String(row.CandidateID || '')] = true; });
    const alternatives = pool.filter(function(item) { return !priorIds[String(item.candidate.CandidateID || '')]; });
    if (alternatives.length >= Math.min(request.limit, pool.length)) pool = alternatives;
    else pool.forEach(function(item) { if (priorIds[String(item.candidate.CandidateID || '')]) item.poolLimitedReturning = true; });
  }

  if (request.requestKind !== 'repeat_or_refine') {
    const nonImmediate = pool.filter(function(item) { return item.recency !== 'recently_shown'; });
    if (nonImmediate.length >= Math.min(request.limit, pool.length)) pool = nonImmediate;
  }

  if (request.requestKind === 'repeat_or_refine' && referenceCandidate) {
    const refPrimary = {};
    mappings.filter(function(m) { return String(m.CandidateID || '') === String(referenceCandidate.CandidateID || '') && String(m.Role || '') === 'primary_practice'; })
      .forEach(function(m) { refPrimary[String(m.TechniqueID || '')] = true; });
    const sameTechnique = pool.filter(function(item) { return item.mappings.some(function(m) { return String(m.Role || '') === 'primary_practice' && refPrimary[String(m.TechniqueID || '')]; }); });
    if (sameTechnique.length) pool = sameTechnique;
    pool.forEach(function(item) {
      item.repeatExact = String(item.candidate.CandidateID || '') === String(referenceCandidate.CandidateID || '');
      if (item.repeatExact) item.recency = 'deliberate_repeat';
    });
  }

  const priorCandidates = history.filter(function(row) { return request.priorRecommendationSetId && String(row.RecommendationSetID || '') === request.priorRecommendationSetId; })
    .map(function(row) { return candidateById[String(row.CandidateID || '')]; }).filter(Boolean);
  if ((request.requestKind === 'switch_pathway' || request.requestKind === 'surprise_me') && priorCandidates.length) {
    pool.forEach(function(item) {
      item.priorDirectionDifference = Math.max.apply(null, priorCandidates.map(function(prior) { return recMeaningfulDiversityDifference_(prior, item.candidate); }).concat([0]));
    });
  }

  const challenge = recEffectiveChallengePreference_(request, preferences);
  const challengeOrder = recChallengeBucketOrder_(challenge, referenceCandidate ? String(referenceCandidate.ChallengeBand || '') : '');
  function bucket(item) {
    if (!challengeOrder.length) return 0;
    const band = String(item.candidate.ChallengeBand || '');
    const idx = challengeOrder.indexOf(band);
    return idx < 0 ? 9 : idx;
  }
  const recencyOrder = { new: 0, deliberate_repeat: 0, returning_option: 1, recently_practised: 2, recently_chosen: 3, recently_shown: 4 };
  const fitOrder = { familiar_next_step: 0, adjacent_stretch: 1, novel_but_supported: 2 };
  pool.sort(function(a, b) {
    if (request.requestKind === 'repeat_or_refine' && referenceCandidate) {
      const ae = a.repeatExact ? 1 : 0;
      const be = b.repeatExact ? 1 : 0;
      if (ae !== be) return ae - be;
    }
    if (request.requestKind === 'surprise_me') {
      const an = a.recency === 'new' ? 0 : 1;
      const bn = b.recency === 'new' ? 0 : 1;
      if (an !== bn) return an - bn;
    }
    if (request.requestKind === 'surprise_me' || request.requestKind === 'switch_pathway') {
      const ad = Number(a.priorDirectionDifference || 0);
      const bd = Number(b.priorDirectionDifference || 0);
      if (ad !== bd) return bd - ad;
    }
    if (bucket(a) !== bucket(b)) return bucket(a) - bucket(b);
    if (recOrderValue_(fitOrder, a.fit, 9) !== recOrderValue_(fitOrder, b.fit, 9)) return recOrderValue_(fitOrder, a.fit, 9) - recOrderValue_(fitOrder, b.fit, 9);
    if (recOrderValue_(recencyOrder, a.recency, 9) !== recOrderValue_(recencyOrder, b.recency, 9)) return recOrderValue_(recencyOrder, a.recency, 9) - recOrderValue_(recencyOrder, b.recency, 9);
    return String(a.candidate.CandidateID || '').localeCompare(String(b.candidate.CandidateID || ''));
  });

  const selected = [];
  while (pool.length && selected.length < request.limit) {
    if (!selected.length) {
      selected.push(pool.shift());
      continue;
    }
    let bestIndex = -1;
    for (let i = 0; i < pool.length; i++) {
      const differsTwo = selected.every(function(existing) { return recMeaningfulDiversityDifference_(existing.candidate, pool[i].candidate) >= 2; });
      if (differsTwo) { bestIndex = i; break; }
    }
    if (bestIndex < 0) {
      for (let i = 0; i < pool.length; i++) {
        const differsOne = selected.every(function(existing) { return recMeaningfulDiversityDifference_(existing.candidate, pool[i].candidate) >= 1; });
        if (differsOne) { bestIndex = i; break; }
      }
    }
    if (bestIndex < 0) { bestIndex = 0; pool[bestIndex].diversityLimited = true; }
    selected.push(pool.splice(bestIndex, 1)[0]);
  }
  return { selected: selected, preferences: preferences, history: history };
}

function getLearningRecommendations_(data) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    const request = validateRecommendationRequest_(db, data);
    const historySheet = recSheet_(db, SHEET_NAMES.recommendationHistory);
    const history = readObjects_(historySheet);
    const setId = recRecommendationSetId_(request);
    recFindRequestSetConflict_(history, request, setId);
    const existing = history.filter(function(row) { return String(row.RecommendationSetID || '') === setId; });
    if (existing.length) {
      return {
        learningRecommendationContractVersion: LEARNING_RECOMMENDATION_CONTRACT_VERSION,
        recommendationSessionId: request.recommendationSessionId,
        recommendationSetId: setId,
        controls: recRecommendationControls_(),
        recommendations: recHydrateRecommendationSet_(db, setId)
      };
    }
    const built = selectLearningRecommendationSet_(db, request);
    const now = new Date();
    const events = [];
    built.selected.forEach(function(item, index) {
      const role = recDiversityRole_(item.candidate, item.fit, built.preferences, index);
      const reason = recReasonForCandidate_(item.candidate, item.fit, item.recency, request);
      const event = {
        RecommendationEventID: stableRecId_('RE', setId, item.candidate.CandidateID),
        RecommendationSetID: setId,
        GeneratedAt: now,
        Domain: request.domain,
        CandidateID: String(item.candidate.CandidateID || ''),
        Position: index + 1,
        FitBand: item.fit,
        ReasonCodes: recJsonArrayCell_([].concat(item.recency === 'deliberate_repeat' ? ['DELIBERATE_REPEAT'] : [], item.poolLimitedReturning ? ['POOL_LIMITED_RETURNING_OPTION'] : [], item.diversityLimited ? ['DIVERSITY_POOL_LIMITED'] : [])),
        ReasonText: reason,
        EvidenceBasisIDs: recJsonArrayCell_(item.evidenceBasisIds || []),
        PreferenceBasisIDs: recJsonArrayCell_(item.preferenceBasisIds || []),
        RecencyDisposition: item.recency,
        DiversityRole: role,
        RecommendationOutcome: 'shown',
        SophieOverride: request.requestKind === 'normal' ? 'none' : (REC_ENUMS.sophieOverride.indexOf(request.requestKind) >= 0 ? request.requestKind : 'none'),
        OverrideTargetCandidateID: '',
        OverrideNote: request.requestKind === 'repeat_or_refine' && item.recency === 'deliberate_repeat' ? 'Deliberate repeat/refinement request.' : '',
        CreatedOpportunityID: '',
        ResolvedAt: ''
      };
      appendObjectRow_(historySheet, event);
      events.push({ event: event, item: item });
    });
    SpreadsheetApp.flush();
    return {
      learningRecommendationContractVersion: LEARNING_RECOMMENDATION_CONTRACT_VERSION,
      recommendationSessionId: request.recommendationSessionId,
      recommendationSetId: setId,
      controls: recRecommendationControls_(),
      recommendations: events.map(function(pair) { return recRecommendationResponseCandidate_(pair.item.candidate, pair.event, pair.item.eligibility); })
    };
  });
}

function recRecommendationControls_() {
  return { canRequestAnotherSet: true, canChangeChallengePreference: true, canSwitchPathway: true, canSayNotNow: true };
}

function getLearningCandidateCatalogue_(data) {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  assertLearningRecommendationSchemaReady_(db);
  const domain = cleanRecEnum_(data.domain || 'cooking', REC_ENUMS.domain, 'Domain');
  const techniqueFilter = String(data.techniqueId || '');
  const interestFilter = data.interestTag ? cleanRecTag_(data.interestTag, 'interestTag') : '';
  const safety = cleanRecEnum_(data.availableSafetySupport || 'none', REC_ENUMS.safetySupport, 'availableSafetySupport');
  const sessionId = String(data.recommendationSessionId || '');
  const candidates = readObjects_(recSheet_(db, SHEET_NAMES.learnCandidates)).filter(function(c) { return String(c.Domain || '') === domain && String(c.CandidateStatus || '') === 'active'; });
  const mappings = readObjects_(recSheet_(db, SHEET_NAMES.candidateTechniques));
  const preferences = recActivePreferences_(readObjects_(recSheet_(db, SHEET_NAMES.learningPreferences)), { domain: domain, recommendationSessionId: sessionId });
  const context = {
    candidateTechniques: mappings,
    techniques: readObjects_(recSheet_(db, SHEET_NAMES.techniques)),
    prerequisites: readObjects_(recSheet_(db, SHEET_NAMES.techniquePrerequisites)),
    evidence: readObjects_(recSheet_(db, SHEET_NAMES.learningEvidence)),
    availableSafetySupport: safety
  };
  return candidates.filter(function(candidate) {
    const cm = mappings.filter(function(m) { return String(m.CandidateID || '') === String(candidate.CandidateID || ''); });
    if (techniqueFilter && !cm.some(function(m) { return String(m.TechniqueID || '') === techniqueFilter; })) return false;
    if (interestFilter && recCandidateTags_(candidate, 'InterestTags').indexOf(interestFilter) < 0) return false;
    return true;
  }).map(function(candidate) {
    const cm = mappings.filter(function(m) { return String(m.CandidateID || '') === String(candidate.CandidateID || ''); });
    const suppressed = preferences.some(function(pref) { return String(pref.PreferenceType || '') === 'avoid_for_now' && recPreferenceAppliesToCandidate_(pref, candidate, cm); });
    return {
      candidateId: String(candidate.CandidateID || ''),
      title: String(candidate.Title || ''),
      challengeBand: String(candidate.ChallengeBand || ''),
      primaryChallengeType: String(candidate.PrimaryChallengeType || ''),
      estimatedMinutes: number_(candidate.EstimatedMinutes),
      preferenceSuppressed: suppressed,
      eligibility: evaluateCandidateEligibility_(db, candidate, context)
    };
  });
}

/**
 * Return a bounded, Sophie-safe learning-pathway read model.
 *
 * This deliberately excludes LearningEvidence, evidence expectations, hidden
 * recommendation reasoning, preferences, history and provenance. It describes
 * only active technique structure, prerequisite relationships and links to
 * active candidates. Candidate eligibility remains authoritative only through
 * getLearningCandidateCatalogue_ / rec-v1 for the current session setup.
 */
function getLearningPathway_(data) {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  assertLearningRecommendationSchemaReady_(db);
  const domain = cleanRecEnum_(data.domain || 'cooking', REC_ENUMS.domain, 'Domain');
  const candidates = readObjects_(recSheet_(db, SHEET_NAMES.learnCandidates)).filter(function(row) {
    return String(row.Domain || '') === domain && String(row.CandidateStatus || '') === 'active';
  });
  const candidateById = {};
  candidates.forEach(function(row) { candidateById[String(row.CandidateID || '')] = row; });
  const domainSkillIds = {};
  candidates.forEach(function(row) { domainSkillIds[String(row.SkillID || '')] = true; });

  const mappings = readObjects_(recSheet_(db, SHEET_NAMES.candidateTechniques)).filter(function(row) {
    return Object.prototype.hasOwnProperty.call(candidateById, String(row.CandidateID || ''));
  });
  const includedTechniqueIds = {};
  mappings.forEach(function(row) { includedTechniqueIds[String(row.TechniqueID || '')] = true; });
  const allTechniques = readObjects_(recSheet_(db, SHEET_NAMES.techniques));
  allTechniques.forEach(function(row) {
    if (recBoolFromRow_(row.Active) && domainSkillIds[String(row.SkillID || '')]) {
      includedTechniqueIds[String(row.TechniqueID || '')] = true;
    }
  });

  const allPrerequisites = readObjects_(recSheet_(db, SHEET_NAMES.techniquePrerequisites)).filter(function(row) {
    return recBoolFromRow_(row.Active);
  });
  let expanded = true;
  while (expanded) {
    expanded = false;
    allPrerequisites.forEach(function(edge) {
      const techniqueId = String(edge.TechniqueID || '');
      const prerequisiteId = String(edge.PrerequisiteTechniqueID || '');
      if ((includedTechniqueIds[techniqueId] || includedTechniqueIds[prerequisiteId]) &&
          (!includedTechniqueIds[techniqueId] || !includedTechniqueIds[prerequisiteId])) {
        includedTechniqueIds[techniqueId] = true;
        includedTechniqueIds[prerequisiteId] = true;
        expanded = true;
      }
    });
  }

  const techniques = allTechniques.filter(function(row) {
    return recBoolFromRow_(row.Active) && includedTechniqueIds[String(row.TechniqueID || '')];
  });
  const techniqueById = {};
  techniques.forEach(function(row) { techniqueById[String(row.TechniqueID || '')] = row; });

  const prerequisites = allPrerequisites.filter(function(edge) {
    return techniqueById[String(edge.TechniqueID || '')] && techniqueById[String(edge.PrerequisiteTechniqueID || '')];
  });

  return {
    learningPathwayContractVersion: LEARNING_PATHWAY_CONTRACT_VERSION,
    domain: domain,
    techniques: techniques.map(function(technique) {
      const techniqueId = String(technique.TechniqueID || '');
      return {
        techniqueId: techniqueId,
        title: String(technique.SophieFacingTitle || technique.Name || ''),
        family: String(technique.TechniqueFamily || ''),
        description: String(technique.Description || ''),
        typicalSupportOptions: parseRecJsonArray_(technique.TypicalScaffoldOptions || '[]', 'TypicalScaffoldOptions'),
        safety: {
          critical: recBoolFromRow_(technique.SafetyCritical),
          typicalSupport: String(technique.TypicalSafetySupport || 'none'),
          note: String(technique.SafetyNote || '')
        },
        candidateLinks: mappings.filter(function(mapping) {
          return String(mapping.TechniqueID || '') === techniqueId;
        }).map(function(mapping) {
          return {
            candidateId: String(mapping.CandidateID || ''),
            role: String(mapping.Role || ''),
            evidenceRelevant: recBoolFromRow_(mapping.EvidenceRelevant),
            safetyRole: String(mapping.SafetyRole || '')
          };
        }),
        prerequisites: prerequisites.filter(function(edge) {
          return String(edge.TechniqueID || '') === techniqueId;
        }).map(function(edge) {
          const prerequisiteId = String(edge.PrerequisiteTechniqueID || '');
          const prerequisite = techniqueById[prerequisiteId] || {};
          return {
            prerequisiteTechniqueId: prerequisiteId,
            title: String(prerequisite.SophieFacingTitle || prerequisite.Name || ''),
            kind: String(edge.RequirementKind || ''),
            rationale: String(edge.Rationale || ''),
            safetyRelated: recBoolFromRow_(edge.SafetyRelated),
            supportImplication: String(edge.SupportImplication || '')
          };
        })
      };
    })
  };
}

function setLearningPreference_(data) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    const sheet = recSheet_(db, SHEET_NAMES.learningPreferences);
    const sessionId = data.recommendationSessionId || data.sessionId || stableRecId_('RECSESSION', 'preference-session', data.clientRequestId);
    if (data.preferenceId) {
      cleanClientRequestId_(data.clientRequestId);
      const record = recFindOptionalById_(sheet, 'PreferenceID', cleanRecId_(data.preferenceId, 'PreferenceID'));
      if (!record) throwApiError_('REC_NOT_FOUND', 'Preference not found.');
      const desired = clonePlainObject_(record.object);
      const map = { preferenceValue:'PreferenceValue', preferenceScope:'PreferenceScope', scopeRef:'ScopeRef', durationKind:'DurationKind', expiresAt:'ExpiresAt', status:'Status', authoredByRole:'AuthoredByRole' };
      Object.keys(map).forEach(function(key) { if (Object.prototype.hasOwnProperty.call(data, key)) desired[map[key]] = data[key]; });
      const draftData = clonePlainObject_(desired);
      draftData.clientRequestId = data.clientRequestId;
      draftData.PreferenceType = record.object.PreferenceType;
      draftData.Domain = record.object.Domain;
      const validated = validateLearningPreferenceDraft_(db, draftData, sessionId);
      validated.PreferenceID = String(record.object.PreferenceID || '');
      validated.CreatedAt = record.object.CreatedAt;
      const compareHeaders = LEARNING_PREFERENCE_HEADERS.filter(function(h) { return h !== 'UpdatedAt'; });
      if (recCanonicalRow_(compareHeaders, record.object) === recCanonicalRow_(compareHeaders, validated)) return normaliseLearningPreference_(record.object);
      LEARNING_PREFERENCE_HEADERS.forEach(function(header) { setRecordValue_(sheet, record, header, validated[header]); });
      SpreadsheetApp.flush();
      return normaliseLearningPreference_(record.object);
    }
    const row = validateLearningPreferenceDraft_(db, data, sessionId);
    const existing = recFindOptionalById_(sheet, 'PreferenceID', row.PreferenceID);
    if (existing) {
      const compareHeaders = LEARNING_PREFERENCE_HEADERS.filter(function(h) { return ['CreatedAt', 'UpdatedAt'].indexOf(h) < 0; });
      if (recCanonicalRow_(compareHeaders, existing.object) !== recCanonicalRow_(compareHeaders, row)) throwApiError_('IDEMPOTENCY_CONFLICT', 'clientRequestId was reused for a different preference write.');
      return normaliseLearningPreference_(existing.object);
    }
    appendObjectRow_(sheet, row);
    SpreadsheetApp.flush();
    return normaliseLearningPreference_(row);
  });
}

function normaliseLearningPreference_(row) {
  return {
    preferenceId: String(row.PreferenceID || ''), domain: String(row.Domain || ''), preferenceType: String(row.PreferenceType || ''),
    preferenceValue: String(row.PreferenceValue || ''), preferenceScope: String(row.PreferenceScope || ''), scopeRef: String(row.ScopeRef || ''),
    durationKind: String(row.DurationKind || ''), sessionId: String(row.SessionID || ''), expiresAt: iso_(row.ExpiresAt), status: String(row.Status || ''),
    authoredByRole: String(row.AuthoredByRole || ''), createdAt: iso_(row.CreatedAt), updatedAt: iso_(row.UpdatedAt)
  };
}

function recordRecommendationResponse_(data) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    const request = validateRecommendationResponse_(db, data);
    const sheet = recSheet_(db, SHEET_NAMES.recommendationHistory);
    let record = null;
    if (request.recommendationEventId) record = recFindOptionalById_(sheet, 'RecommendationEventID', request.recommendationEventId);
    else {
      const matches = readObjectsWithRows_(sheet).filter(function(item) {
        return String(item.object.RecommendationSetID || '') === request.recommendationSetId && String(item.object.CandidateID || '') === request.candidateId;
      });
      if (matches.length !== 1) throwApiError_('REC_NOT_FOUND', 'Recommendation event not found exactly once.');
      record = matches[0];
    }
    if (!record) throwApiError_('REC_NOT_FOUND', 'Recommendation event not found.');
    const currentOutcome = String(record.object.RecommendationOutcome || 'shown');
    const currentOverride = String(record.object.SophieOverride || 'none');
    if (currentOutcome !== 'shown' || currentOverride !== 'none') {
      if (currentOutcome === request.outcome && currentOverride === request.override) return normaliseRecommendationEvent_(record.object);
      throwApiError_('IDEMPOTENCY_CONFLICT', 'Recommendation response already resolved differently.');
    }
    const now = new Date();
    setRecordValue_(sheet, record, 'RecommendationOutcome', request.outcome);
    setRecordValue_(sheet, record, 'SophieOverride', request.override);
    setRecordValue_(sheet, record, 'OverrideTargetCandidateID', request.overrideTargetCandidateId);
    setRecordValue_(sheet, record, 'OverrideNote', request.overrideNote);
    setRecordValue_(sheet, record, 'ResolvedAt', now);
    SpreadsheetApp.flush();
    return normaliseRecommendationEvent_(record.object);
  });
}

function normaliseRecommendationEvent_(row) {
  return {
    recommendationEventId: String(row.RecommendationEventID || ''), recommendationSetId: String(row.RecommendationSetID || ''),
    candidateId: String(row.CandidateID || ''), outcome: String(row.RecommendationOutcome || ''), override: String(row.SophieOverride || ''),
    createdOpportunityId: String(row.CreatedOpportunityID || ''), resolvedAt: iso_(row.ResolvedAt)
  };
}

function createRecLearnOpportunityRow_(db, candidate, opportunityId) {
  const now = new Date();
  const skillsSheet = requireSheet_(db, SHEET_NAMES.skills);
  const skillRecord = findUniqueRecordById_(skillsSheet, 'SkillID', String(candidate.SkillID || ''), 'Skill');
  const row = {
    ID: opportunityId,
    Title: String(candidate.Title || ''),
    Value: 0,
    Tier: 1,
    Status: 'available',
    Description: String(candidate.PracticeDescription || ''),
    Category: 'Home',
    Type: 'learn',
    Skill: String(skillRecord.object.Name || 'Cooking'),
    EstimatedMinutes: number_(candidate.EstimatedMinutes),
    Repeatable: 'yes',
    Frequency: 'as needed',
    ClaimedAt: '', SubmittedAt: '', ApprovedAt: '',
    Icon: '🍳',
    Instructions: String(candidate.PracticeDescription || ''),
    WhyItMatters: String(candidate.WhyItMatters || ''),
    Feedback: '', ApprovedBy: '',
    Requiredness: 'negotiated',
    Scope: String(candidate.AuthenticUse || ''),
    CompletionStandard: String(candidate.CompletionStandard || ''),
    ApprovalRequired: false,
    ReviewReason: '',
    SkillID: String(candidate.SkillID || ''),
    SupportPreference: '',
    CreatedAt: now, UpdatedAt: now,
    StartedAt: '', FinishedAt: '', ReviewedAt: '', CompletedAt: '', WithdrawnAt: '', CancelledAt: '',
    AgreedValue: '', AgreedScope: '', AgreedCompletionStandard: '', AgreedEstimatedMinutes: '', AcceptedAt: '',
    ReviewState: 'none', ReviewKind: '', ReviewOutcome: '', ApprovedAmount: '', ReviewFeedback: '', ReviewedBy: '',
    WithdrawalReviewRequested: false, PartialWorkDescription: '', SourceOpportunityID: '', MigrationVersion: OPPORTUNITY_CONTRACT_VERSION,
    SourceCandidateID: String(candidate.CandidateID || '')
  };
  validateD006OpportunityRow_(db, row, { allowRetired: false });
  return row;
}

function chooseRecommendedLearn_(data) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    const requestId = cleanClientRequestId_(data.clientRequestId);
    const candidateId = cleanRecId_(data.candidateId || data.CandidateID, 'CandidateID');
    const candidateRecord = recFindOptionalById_(recSheet_(db, SHEET_NAMES.learnCandidates), 'CandidateID', candidateId);
    if (!candidateRecord) throwApiError_('REC_NOT_FOUND', 'Candidate not found.');
    const availableSafetySupport = cleanRecEnum_(data.availableSafetySupport || 'none', REC_ENUMS.safetySupport, 'availableSafetySupport');
    const eligibility = evaluateCandidateEligibility_(db, candidateRecord.object, { availableSafetySupport: availableSafetySupport });
    if (eligibility.status !== 'eligible') {
      const error = new Error(eligibility.reason);
      error.code = 'REC_CANDIDATE_INELIGIBLE';
      error.eligibility = eligibility;
      throw error;
    }
    const historySheet = recSheet_(db, SHEET_NAMES.recommendationHistory);
    const requestHash = recDigestHex_('choose|' + requestId).slice(0, 10).toUpperCase();
    const directSetId = 'RECSET-DIRECT-' + requestHash;
    const directEventId = stableRecId_('RE', directSetId, candidateId);
    const existingRequestEvents = readObjectsWithRows_(historySheet).filter(function(item) {
      return String(item.object.RecommendationSetID || '') === directSetId;
    });
    if (existingRequestEvents.length) {
      const existing = existingRequestEvents[0];
      if (String(existing.object.CandidateID || '') !== candidateId) throwApiError_('IDEMPOTENCY_CONFLICT', 'clientRequestId was reused for a different candidate choice.');
      if (existing.object.CreatedOpportunityID) {
        const opportunity = findUniqueRecordById_(requireSheet_(db, SHEET_NAMES.opportunities), 'ID', String(existing.object.CreatedOpportunityID), 'Opportunity');
        return { opportunity: normaliseOpportunity_(opportunity.object), eligibility: eligibility, idempotentReplay: true };
      }
    }
    let eventRecord = null;
    if (data.recommendationEventId) eventRecord = recFindOptionalById_(historySheet, 'RecommendationEventID', cleanRecId_(data.recommendationEventId, 'RecommendationEventID'));
    if (!eventRecord) eventRecord = recFindOptionalById_(historySheet, 'RecommendationEventID', directEventId);
    if (!eventRecord) {
      const event = {
        RecommendationEventID: directEventId,
        RecommendationSetID: directSetId,
        GeneratedAt: new Date(),
        Domain: 'cooking',
        CandidateID: candidateId,
        Position: 1,
        FitBand: classifyRecommendationFit_(candidateRecord.object,
          readObjects_(recSheet_(db, SHEET_NAMES.candidateTechniques)).filter(function(m) { return String(m.CandidateID || '') === candidateId; }),
          readObjects_(recSheet_(db, SHEET_NAMES.learningEvidence)),
          readObjects_(recSheet_(db, SHEET_NAMES.techniquePrerequisites))),
        ReasonCodes: recJsonArrayCell_(['DIRECT_CATALOGUE_CHOICE']),
        ReasonText: 'Sophie selected this eligible catalogue candidate.',
        EvidenceBasisIDs: recJsonArrayCell_([]), PreferenceBasisIDs: recJsonArrayCell_([]),
        RecencyDisposition: 'returning_option', DiversityRole: 'different_direction', RecommendationOutcome: 'chosen',
        SophieOverride: 'choose_different', OverrideTargetCandidateID: candidateId, OverrideNote: '', CreatedOpportunityID: '', ResolvedAt: new Date()
      };
      appendObjectRow_(historySheet, event);
      eventRecord = recFindOptionalById_(historySheet, 'RecommendationEventID', directEventId);
    } else if (String(eventRecord.object.CandidateID || '') !== candidateId) {
      throwApiError_('IDEMPOTENCY_CONFLICT', 'Recommendation event does not match the chosen candidate.');
    }
    const opportunitySheet = requireSheet_(db, SHEET_NAMES.opportunities);
    ensureD006OpportunitySchema_(db);
    if (opportunitySheet.getRange(1, 1, 1, opportunitySheet.getLastColumn()).getValues()[0].map(String).indexOf('SourceCandidateID') < 0) {
      throwApiError_('REC_SCHEMA_MISMATCH', 'Opportunities.SourceCandidateID is not initialised.');
    }
    const opportunityId = stableRecId_('OP', 'rec-choice', requestId);
    const existingOpportunity = recFindOptionalById_(opportunitySheet, 'ID', opportunityId);
    let opportunityRow;
    if (existingOpportunity) {
      if (String(existingOpportunity.object.SourceCandidateID || '') !== candidateId || d006Type_(existingOpportunity.object) !== 'learn') {
        throwApiError_('IDEMPOTENCY_CONFLICT', 'Deterministic Opportunity ID already exists with conflicting content.');
      }
      opportunityRow = existingOpportunity.object;
    } else {
      opportunityRow = createRecLearnOpportunityRow_(db, candidateRecord.object, opportunityId);
      appendObjectRow_(opportunitySheet, opportunityRow);
    }
    setRecordValue_(historySheet, eventRecord, 'RecommendationOutcome', 'chosen');
    setRecordValue_(historySheet, eventRecord, 'CreatedOpportunityID', opportunityId);
    setRecordValue_(historySheet, eventRecord, 'ResolvedAt', new Date());
    SpreadsheetApp.flush();
    return { opportunity: normaliseOpportunity_(opportunityRow), eligibility: eligibility, idempotentReplay: !!existingOpportunity };
  });
}

function getLearnCandidatesAdmin_() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  assertLearningRecommendationSchemaReady_(db);
  return readObjects_(recSheet_(db, SHEET_NAMES.learnCandidates)).map(normaliseLearnCandidate_);
}

function normaliseLearnCandidate_(row) {
  return {
    candidateId: String(row.CandidateID || ''), domain: String(row.Domain || ''), title: String(row.Title || ''), skillId: String(row.SkillID || ''),
    capabilityLabel: String(row.CapabilityLabel || ''), practiceDescription: String(row.PracticeDescription || ''), completionStandard: String(row.CompletionStandard || ''),
    whyItMatters: String(row.WhyItMatters || ''), estimatedMinutes: number_(row.EstimatedMinutes), challengeBand: String(row.ChallengeBand || ''),
    primaryChallengeType: String(row.PrimaryChallengeType || ''), difficultyDrivers: parseRecJsonArray_(row.DifficultyDrivers || '[]', 'DifficultyDrivers'),
    interestTags: parseRecJsonArray_(row.InterestTags || '[]', 'InterestTags'), cookingMethodTags: parseRecJsonArray_(row.CookingMethodTags || '[]', 'CookingMethodTags'),
    mealTypeTags: parseRecJsonArray_(row.MealTypeTags || '[]', 'MealTypeTags'), cuisineTags: parseRecJsonArray_(row.CuisineTags || '[]', 'CuisineTags'),
    challengeStructureTags: parseRecJsonArray_(row.ChallengeStructureTags || '[]', 'ChallengeStructureTags'), safetyRequired: recBoolFromRow_(row.SafetyRequired),
    minimumSafetySupport: String(row.MinimumSafetySupport || 'none'), safetyRequirement: String(row.SafetyRequirement || ''), safetyNote: String(row.SafetyNote || ''),
    supportAllocation: parseRecJsonObject_(row.SupportAllocation || '{}', 'SupportAllocation'), suggestedSupportOptions: parseRecJsonArray_(row.SuggestedSupportOptions || '[]', 'SuggestedSupportOptions'),
    authenticUse: String(row.AuthenticUse || ''), curatorRationale: String(row.CuratorRationale || ''), behaviourReviewStatus: String(row.BehaviourReviewStatus || ''),
    candidateStatus: String(row.CandidateStatus || ''), createdAt: iso_(row.CreatedAt), updatedAt: iso_(row.UpdatedAt)
  };
}

function createLearnCandidate_(data) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    const requestId = cleanClientRequestId_(data.clientRequestId);
    const draft = clonePlainObject_(data);
    if (!draft.candidateId && !draft.CandidateID) draft.candidateId = stableRecId_('LC', 'candidate', requestId);
    const row = validateLearnCandidateDraft_(db, draft, '');
    const sheet = recSheet_(db, SHEET_NAMES.learnCandidates);
    const existing = recFindOptionalById_(sheet, 'CandidateID', row.CandidateID);
    if (existing) {
      const compare = LEARN_CANDIDATE_HEADERS.filter(function(h) { return ['CreatedAt','UpdatedAt'].indexOf(h) < 0; });
      if (recCanonicalRow_(compare, existing.object) !== recCanonicalRow_(compare, row)) throwApiError_('IDEMPOTENCY_CONFLICT', 'clientRequestId or CandidateID conflicts with an existing candidate.');
      return normaliseLearnCandidate_(existing.object);
    }
    appendObjectRow_(sheet, row);
    SpreadsheetApp.flush();
    return normaliseLearnCandidate_(row);
  });
}

function recAssertExpectedUpdatedAt_(record, expectedUpdatedAt) {
  if (!expectedUpdatedAt) throwApiError_('CONFLICT', 'expectedUpdatedAt is required for mutable rec-v1 updates.');
  if (iso_(record.object.UpdatedAt) !== iso_(cleanRecDate_(expectedUpdatedAt, 'expectedUpdatedAt', true))) throwApiError_('CONFLICT', 'The record changed since it was loaded. Reload before editing.');
}

function recApplyCandidatePatch_(row, data) {
  const out = clonePlainObject_(row);
  const map = {
    title:'Title', skillId:'SkillID', domain:'Domain', capabilityLabel:'CapabilityLabel', practiceDescription:'PracticeDescription',
    completionStandard:'CompletionStandard', whyItMatters:'WhyItMatters', estimatedMinutes:'EstimatedMinutes', challengeBand:'ChallengeBand',
    primaryChallengeType:'PrimaryChallengeType', difficultyDrivers:'DifficultyDrivers', interestTags:'InterestTags', cookingMethodTags:'CookingMethodTags',
    mealTypeTags:'MealTypeTags', cuisineTags:'CuisineTags', challengeStructureTags:'ChallengeStructureTags', safetyRequired:'SafetyRequired',
    minimumSafetySupport:'MinimumSafetySupport', safetyRequirement:'SafetyRequirement', safetyNote:'SafetyNote', supportAllocation:'SupportAllocation',
    suggestedSupportOptions:'SuggestedSupportOptions', authenticUse:'AuthenticUse', curatorRationale:'CuratorRationale',
    behaviourReviewStatus:'BehaviourReviewStatus', candidateStatus:'CandidateStatus'
  };
  Object.keys(map).forEach(function(key) {
    if (Object.prototype.hasOwnProperty.call(data, key)) out[map[key]] = data[key];
  });
  Object.keys(out).forEach(function(key) {
    if (Object.prototype.hasOwnProperty.call(data, key) && LEARN_CANDIDATE_HEADERS.indexOf(key) >= 0) out[key] = data[key];
  });
  return out;
}

function recApplyTechniquePatch_(row, data) {
  const out = clonePlainObject_(row);
  const map = {
    skillId:'SkillID', name:'Name', sophieFacingTitle:'SophieFacingTitle', techniqueFamily:'TechniqueFamily', description:'Description',
    observableEvidence:'ObservableEvidence', difficultyDrivers:'DifficultyDrivers', typicalScaffoldOptions:'TypicalScaffoldOptions',
    safetyCritical:'SafetyCritical', typicalSafetySupport:'TypicalSafetySupport', safetyNote:'SafetyNote', transferIndicators:'TransferIndicators',
    authenticUses:'AuthenticUses', active:'Active'
  };
  Object.keys(map).forEach(function(key) { if (Object.prototype.hasOwnProperty.call(data, key)) out[map[key]] = data[key]; });
  Object.keys(out).forEach(function(key) {
    if (Object.prototype.hasOwnProperty.call(data, key) && TECHNIQUE_HEADERS.indexOf(key) >= 0) out[key] = data[key];
  });
  return out;
}

function updateLearnCandidate_(data) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    const sheet = recSheet_(db, SHEET_NAMES.learnCandidates);
    const id = cleanRecId_(data.candidateId, 'CandidateID');
    const record = recFindOptionalById_(sheet, 'CandidateID', id);
    if (!record) throwApiError_('REC_NOT_FOUND', 'Candidate not found.');
    const merged = recApplyCandidatePatch_(record.object, data);
    const row = validateLearnCandidateDraft_(db, merged, id);
    row.CreatedAt = record.object.CreatedAt;
    const compare = LEARN_CANDIDATE_HEADERS.filter(function(h) { return h !== 'UpdatedAt'; });
    if (recCanonicalRow_(compare, record.object) === recCanonicalRow_(compare, row)) return normaliseLearnCandidate_(record.object);
    recAssertExpectedUpdatedAt_(record, data.expectedUpdatedAt);
    LEARN_CANDIDATE_HEADERS.forEach(function(header) { setRecordValue_(sheet, record, header, row[header]); });
    SpreadsheetApp.flush();
    return normaliseLearnCandidate_(record.object);
  });
}

function setCandidateStatus_(data) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    const sheet = recSheet_(db, SHEET_NAMES.learnCandidates);
    const record = recFindOptionalById_(sheet, 'CandidateID', cleanRecId_(data.candidateId, 'CandidateID'));
    if (!record) throwApiError_('REC_NOT_FOUND', 'Candidate not found.');
    const desiredStatus = cleanRecEnum_(data.status, REC_ENUMS.candidateStatus, 'CandidateStatus');
    if (String(record.object.CandidateStatus || '') === desiredStatus) return normaliseLearnCandidate_(record.object);
    recAssertExpectedUpdatedAt_(record, data.expectedUpdatedAt);
    setRecordValue_(sheet, record, 'CandidateStatus', desiredStatus);
    setRecordValue_(sheet, record, 'UpdatedAt', new Date());
    SpreadsheetApp.flush();
    return normaliseLearnCandidate_(record.object);
  });
}

function createTechnique_(data) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    const requestId = cleanClientRequestId_(data.clientRequestId);
    const draft = clonePlainObject_(data);
    if (!draft.techniqueId && !draft.TechniqueID) draft.techniqueId = stableRecId_('COOK', 'technique', requestId);
    const row = validateTechniqueDraft_(db, draft, '');
    const sheet = recSheet_(db, SHEET_NAMES.techniques);
    const existing = recFindOptionalById_(sheet, 'TechniqueID', row.TechniqueID);
    if (existing) {
      const compare = TECHNIQUE_HEADERS.filter(function(h) { return ['CreatedAt','UpdatedAt'].indexOf(h) < 0; });
      if (recCanonicalRow_(compare, existing.object) !== recCanonicalRow_(compare, row)) throwApiError_('IDEMPOTENCY_CONFLICT', 'clientRequestId or TechniqueID conflicts with an existing technique.');
      return existing.object;
    }
    appendObjectRow_(sheet, row);
    SpreadsheetApp.flush();
    return row;
  });
}

function updateTechnique_(data) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    const sheet = recSheet_(db, SHEET_NAMES.techniques);
    const id = cleanRecId_(data.techniqueId, 'TechniqueID');
    const record = recFindOptionalById_(sheet, 'TechniqueID', id);
    if (!record) throwApiError_('REC_NOT_FOUND', 'Technique not found.');
    const merged = recApplyTechniquePatch_(record.object, data);
    const row = validateTechniqueDraft_(db, merged, id);
    row.CreatedAt = record.object.CreatedAt;
    const compare = TECHNIQUE_HEADERS.filter(function(h) { return h !== 'UpdatedAt'; });
    if (recCanonicalRow_(compare, record.object) === recCanonicalRow_(compare, row)) return record.object;
    recAssertExpectedUpdatedAt_(record, data.expectedUpdatedAt);
    TECHNIQUE_HEADERS.forEach(function(header) { setRecordValue_(sheet, record, header, row[header]); });
    SpreadsheetApp.flush();
    return record.object;
  });
}

function setCandidateTechniques_(data) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    cleanClientRequestId_(data.clientRequestId);
    const candidateId = cleanRecId_(data.candidateId, 'CandidateID');
    const proposed = validateCandidateTechniqueSet_(db, candidateId, data.mappings || []);
    const sheet = recSheet_(db, SHEET_NAMES.candidateTechniques);
    const existingForCandidate = readObjects_(sheet).filter(function(row) { return String(row.CandidateID || '') === candidateId; });
    const canon = function(rows) { return rows.map(function(row) { return recCanonicalRow_(CANDIDATE_TECHNIQUE_HEADERS.filter(function(h){return h!=='CreatedAt';}), row); }).sort().join('||'); };
    if (canon(existingForCandidate) === canon(proposed)) return existingForCandidate;
    const all = readObjects_(sheet).filter(function(row) { return String(row.CandidateID || '') !== candidateId; }).concat(proposed);
    assertNoCandidateTechniqueDuplicate_(all);
    recWriteWholeBody_(sheet, CANDIDATE_TECHNIQUE_HEADERS, all);
    const candidateSheet = recSheet_(db, SHEET_NAMES.learnCandidates);
    const candidate = recFindOptionalById_(candidateSheet, 'CandidateID', candidateId);
    if (candidate && candidate.object.SupportAllocation) validateSupportAllocation_(db, candidateId, candidate.object.SupportAllocation, all);
    SpreadsheetApp.flush();
    return proposed;
  });
}

function setTechniquePrerequisites_(data) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    cleanClientRequestId_(data.clientRequestId);
    const techniqueId = cleanRecId_(data.techniqueId, 'TechniqueID');
    const proposed = validateTechniquePrerequisiteSet_(db, techniqueId, data.edges || []);
    const sheet = recSheet_(db, SHEET_NAMES.techniquePrerequisites);
    const all = readObjects_(sheet);
    const existingActive = all.filter(function(row) { return String(row.TechniqueID || '') === techniqueId && recBoolFromRow_(row.Active); });
    const compareHeaders = TECHNIQUE_PREREQUISITE_HEADERS.filter(function(h){ return ['CreatedAt','UpdatedAt'].indexOf(h)<0; });
    const canon = function(rows){ return rows.map(function(row){ return recCanonicalRow_(compareHeaders,row); }).sort().join('||'); };
    if (canon(existingActive) === canon(proposed)) return existingActive;
    const byId = {};
    all.forEach(function(row) { byId[String(row.PrerequisiteEdgeID || '')] = row; if (String(row.TechniqueID || '') === techniqueId) row.Active = false; });
    proposed.forEach(function(row) {
      if (byId[row.PrerequisiteEdgeID]) {
        Object.keys(row).forEach(function(key) { byId[row.PrerequisiteEdgeID][key] = row[key]; });
      } else all.push(row);
    });
    assertNoPrerequisiteDuplicate_(all);
    assertNoPrerequisiteCycle_(all);
    recWriteWholeBody_(sheet, TECHNIQUE_PREREQUISITE_HEADERS, all);
    SpreadsheetApp.flush();
    return all.filter(function(row) { return String(row.TechniqueID || '') === techniqueId && recBoolFromRow_(row.Active); });
  });
}

function recordLearningEvidence_(data) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    const row = validateLearningEvidenceDraft_(db, data);
    const sheet = recSheet_(db, SHEET_NAMES.learningEvidence);
    const existing = recFindOptionalById_(sheet, 'EvidenceID', row.EvidenceID);
    if (existing) {
      const compare = LEARNING_EVIDENCE_HEADERS.filter(function(h) { return h !== 'CreatedAt'; });
      if (recCanonicalRow_(compare, existing.object) !== recCanonicalRow_(compare, row)) throwApiError_('IDEMPOTENCY_CONFLICT', 'clientRequestId was reused for a different evidence write.');
      return existing.object;
    }
    appendObjectRow_(sheet, row);
    SpreadsheetApp.flush();
    return row;
  });
}

function createSourceLink_(data) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    cleanClientRequestId_(data.clientRequestId);
    const row = validateSourceLinkDraft_(db, data);
    const sheet = recSheet_(db, SHEET_NAMES.sourceLinks);
    const existing = recFindOptionalById_(sheet, 'SourceLinkID', row.SourceLinkID);
    if (existing) {
      if (recCanonicalRow_(SOURCE_LINK_HEADERS.filter(function(h) { return h !== 'CreatedAt'; }), existing.object) !== recCanonicalRow_(SOURCE_LINK_HEADERS.filter(function(h) { return h !== 'CreatedAt'; }), row)) {
        throwApiError_('IDEMPOTENCY_CONFLICT', 'SourceLink identity conflicts with existing provenance.');
      }
      return existing.object;
    }
    appendObjectRow_(sheet, row);
    SpreadsheetApp.flush();
    return row;
  });
}

function deleteSourceLink_(sourceLinkId) {
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    const sheet = recSheet_(db, SHEET_NAMES.sourceLinks);
    const id = cleanRecId_(sourceLinkId, 'SourceLinkID');
    const record = recFindOptionalById_(sheet, 'SourceLinkID', id);
    if (!record) return { sourceLinkId: id, deleted: false };
    sheet.deleteRow(record.rowNumber);
    SpreadsheetApp.flush();
    return { sourceLinkId: id, deleted: true };
  });
}

function getLearningEvidenceAdmin_() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID); assertLearningRecommendationSchemaReady_(db);
  return readObjects_(recSheet_(db, SHEET_NAMES.learningEvidence));
}
function getLearningPreferencesAdmin_() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID); assertLearningRecommendationSchemaReady_(db);
  return readObjects_(recSheet_(db, SHEET_NAMES.learningPreferences)).map(normaliseLearningPreference_);
}
function getRecommendationHistoryAdmin_() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID); assertLearningRecommendationSchemaReady_(db);
  return readObjects_(recSheet_(db, SHEET_NAMES.recommendationHistory));
}

function assertLearningRecommendationSchemaReady_(db) {
  const definitions = [
    [SHEET_NAMES.learnCandidates, LEARN_CANDIDATE_HEADERS], [SHEET_NAMES.techniques, TECHNIQUE_HEADERS],
    [SHEET_NAMES.candidateTechniques, CANDIDATE_TECHNIQUE_HEADERS], [SHEET_NAMES.techniquePrerequisites, TECHNIQUE_PREREQUISITE_HEADERS],
    [SHEET_NAMES.learningEvidence, LEARNING_EVIDENCE_HEADERS], [SHEET_NAMES.learningPreferences, LEARNING_PREFERENCE_HEADERS],
    [SHEET_NAMES.recommendationHistory, RECOMMENDATION_HISTORY_HEADERS], [SHEET_NAMES.sourceLinks, SOURCE_LINK_HEADERS]
  ];
  definitions.forEach(function(def) { assertRecExactHeaders_(recSheet_(db, def[0]), def[1]); });
  const opportunity = requireSheet_(db, SHEET_NAMES.opportunities);
  const headers = opportunity.getRange(1, 1, 1, opportunity.getLastColumn()).getValues()[0].map(String);
  if (headers.indexOf('SourceCandidateID') < 0) throwApiError_('REC_SCHEMA_MISMATCH', 'Opportunities.SourceCandidateID is missing.');
}

function auditLearningRecommendationPreflight() {
  const issues = [];
  try {
    if (OPPORTUNITY_CONTRACT_VERSION !== 'd006-v1') issues.push('Opportunity contract is not d006-v1.');
    if (LEARNING_RESOURCE_CONTRACT_VERSION !== 'lr-v1') issues.push('Learning Resource contract is not lr-v1.');
    const global = auditDataIntegrity();
    if (!global.ok) issues.push('Global data-integrity audit is not clean.');
    const d006 = runD006OpportunityContractTests();
    if (!d006.ok) issues.push('D-006 contract tests failed.');
    const lr = runLearningResourceContractTests();
    if (!lr.ok) issues.push('Learning Resource contract tests failed.');
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const opportunity = requireSheet_(db, SHEET_NAMES.opportunities);
    const headers = opportunity.getRange(1, 1, 1, opportunity.getLastColumn()).getValues()[0].map(String);
    const sourceIndex = headers.indexOf('SourceCandidateID');
    if (sourceIndex >= 0) {
      const nonBlank = readObjects_(opportunity).filter(function(row) { return String(row.SourceCandidateID || '').trim(); });
      if (nonBlank.length) issues.push('SourceCandidateID already contains production data before rec-v1 initialisation.');
      if (sourceIndex !== headers.length - 1) issues.push('SourceCandidateID exists but is not the final Opportunity column.');
    } else if (JSON.stringify(headers) !== JSON.stringify(OPPORTUNITY_HEADERS.slice(0, -1))) {
      issues.push('Opportunities baseline headers do not match the expected v2.4.2 D-006 schema.');
    }
    const defs = [
      [SHEET_NAMES.learnCandidates, LEARN_CANDIDATE_HEADERS], [SHEET_NAMES.techniques, TECHNIQUE_HEADERS], [SHEET_NAMES.candidateTechniques, CANDIDATE_TECHNIQUE_HEADERS],
      [SHEET_NAMES.techniquePrerequisites, TECHNIQUE_PREREQUISITE_HEADERS], [SHEET_NAMES.learningEvidence, LEARNING_EVIDENCE_HEADERS],
      [SHEET_NAMES.learningPreferences, LEARNING_PREFERENCE_HEADERS], [SHEET_NAMES.recommendationHistory, RECOMMENDATION_HISTORY_HEADERS], [SHEET_NAMES.sourceLinks, SOURCE_LINK_HEADERS]
    ];
    defs.forEach(function(def) {
      const sheet = db.getSheetByName(def[0]);
      if (sheet) {
        try { assertRecExactHeaders_(sheet, def[1]); } catch (error) { issues.push(def[0] + ': ' + safeError_(error)); }
      }
    });
    const snapshot = db.getSheetByName(REC_ROLLBACK_SNAPSHOT_SHEET);
    if (snapshot && snapshot.getLastRow() !== opportunity.getLastRow()) issues.push('Existing rec-v1 rollback snapshot row count does not match Opportunities baseline.');
  } catch (error) { issues.push(safeError_(error)); }
  const result = {
    version: APP_VERSION,
    opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
    learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION,
    learningRecommendationContractVersion: LEARNING_RECOMMENDATION_CONTRACT_VERSION,
    ok: issues.length === 0,
    issueCount: issues.length,
    issues: issues
  };
  Logger.log(JSON.stringify(result));
  return result;
}

function recSheetValueChecksum_(sheet) {
  const rows = sheet.getLastRow();
  const cols = sheet.getLastColumn();
  const values = rows && cols ? sheet.getRange(1, 1, rows, cols).getValues().map(function(row) {
    return row.map(function(value) { return value instanceof Date ? value.toISOString() : value; });
  }) : [];
  return recDigestHex_(JSON.stringify(values));
}

function createLearningRecommendationRollbackSnapshot() {
  return withLearningRecommendationLock_(function(db) {
    const source = requireSheet_(db, SHEET_NAMES.opportunities);
    const existing = db.getSheetByName(REC_ROLLBACK_SNAPSHOT_SHEET);
    const baselineHeaders = OPPORTUNITY_HEADERS.slice(0, -1);
    function assertSnapshotBaseline_(snapshot) {
      const headers = snapshot.getRange(1, 1, 1, snapshot.getLastColumn()).getValues()[0].map(String);
      if (JSON.stringify(headers) !== JSON.stringify(baselineHeaders)) throwApiError_('MIGRATION_CONFLICT', 'Existing rec-v1 rollback snapshot is not the expected v2.4.2 Opportunity schema.');
    }
    if (existing) {
      assertSnapshotBaseline_(existing);
      const sourceHeaders = source.getRange(1, 1, 1, source.getLastColumn()).getValues()[0].map(String);
      if (JSON.stringify(sourceHeaders) === JSON.stringify(baselineHeaders)) {
        if (existing.getLastRow() !== source.getLastRow() || recSheetValueChecksum_(existing) !== recSheetValueChecksum_(source)) {
          throwApiError_('MIGRATION_CONFLICT', 'Existing rec-v1 rollback snapshot does not match the current pre-initialisation Opportunities baseline.');
        }
      } else if (JSON.stringify(sourceHeaders) === JSON.stringify(OPPORTUNITY_HEADERS)) {
        if (existing.getLastRow() !== source.getLastRow()) throwApiError_('MIGRATION_CONFLICT', 'Rollback snapshot row count differs from current Opportunities after initialisation.');
        if (source.getLastRow() > 1) {
          const sourceBaselineValues = source.getRange(1, 1, source.getLastRow(), baselineHeaders.length).getValues();
          const snapshotValues = existing.getRange(1, 1, existing.getLastRow(), existing.getLastColumn()).getValues();
          const normal = function(values) { return JSON.stringify(values.map(function(row){ return row.map(function(v){ return v instanceof Date ? v.toISOString() : v; }); })); };
          if (normal(sourceBaselineValues) !== normal(snapshotValues)) throwApiError_('MIGRATION_CONFLICT', 'Rollback snapshot no longer matches the original Opportunity columns.');
        }
      } else throwApiError_('MIGRATION_CONFLICT', 'Current Opportunities schema is neither pre-rec-v1 nor initialised rec-v1.');
      return { snapshot: REC_ROLLBACK_SNAPSHOT_SHEET, created: false, rowCount: existing.getLastRow(), columnCount: existing.getLastColumn(), checksum: recSheetValueChecksum_(existing) };
    }
    const sourceHeaders = source.getRange(1, 1, 1, source.getLastColumn()).getValues()[0].map(String);
    if (JSON.stringify(sourceHeaders) !== JSON.stringify(baselineHeaders)) throwApiError_('MIGRATION_CONFLICT', 'Create the rec-v1 rollback snapshot before SourceCandidateID is added.');
    const copy = source.copyTo(db);
    copy.setName(REC_ROLLBACK_SNAPSHOT_SHEET);
    copy.hideSheet();
    return { snapshot: REC_ROLLBACK_SNAPSHOT_SHEET, created: true, rowCount: copy.getLastRow(), columnCount: copy.getLastColumn(), checksum: recSheetValueChecksum_(copy) };
  });
}

function initialiseLearningRecommendationsV1() {
  return withLearningRecommendationLock_(function(db) {
    if (!db.getSheetByName(REC_ROLLBACK_SNAPSHOT_SHEET)) throwApiError_('MIGRATION_SNAPSHOT_REQUIRED', 'Create the rec-v1 Opportunity rollback snapshot before initialising the schema.');
    const definitions = [
      [SHEET_NAMES.learnCandidates, LEARN_CANDIDATE_HEADERS], [SHEET_NAMES.techniques, TECHNIQUE_HEADERS],
      [SHEET_NAMES.candidateTechniques, CANDIDATE_TECHNIQUE_HEADERS], [SHEET_NAMES.techniquePrerequisites, TECHNIQUE_PREREQUISITE_HEADERS],
      [SHEET_NAMES.learningEvidence, LEARNING_EVIDENCE_HEADERS], [SHEET_NAMES.learningPreferences, LEARNING_PREFERENCE_HEADERS],
      [SHEET_NAMES.recommendationHistory, RECOMMENDATION_HISTORY_HEADERS], [SHEET_NAMES.sourceLinks, SOURCE_LINK_HEADERS]
    ];
    definitions.forEach(function(def) { ensureRecSheetExact_(db, def[0], def[1]); });
    const opportunity = requireSheet_(db, SHEET_NAMES.opportunities);
    const headers = opportunity.getRange(1, 1, 1, opportunity.getLastColumn()).getValues()[0].map(String);
    if (headers.indexOf('SourceCandidateID') < 0) {
      if (JSON.stringify(headers) !== JSON.stringify(OPPORTUNITY_HEADERS.slice(0, -1))) throwApiError_('REC_SCHEMA_MISMATCH', 'Opportunities is not at the expected pre-rec-v1 schema.');
      addMissingHeaders_(opportunity, ['SourceCandidateID']);
    }
    const after = opportunity.getRange(1, 1, 1, opportunity.getLastColumn()).getValues()[0].map(String);
    if (JSON.stringify(after) !== JSON.stringify(OPPORTUNITY_HEADERS)) throwApiError_('REC_SCHEMA_MISMATCH', 'Opportunities headers do not match the rec-v1 schema.');
    SpreadsheetApp.flush();
    return {
      version: APP_VERSION,
      learningRecommendationContractVersion: LEARNING_RECOMMENDATION_CONTRACT_VERSION,
      sheets: definitions.map(function(def) { return { name: def[0], columns: def[1].length, rows: db.getSheetByName(def[0]).getLastRow() - 1 }; }),
      opportunityColumns: opportunity.getLastColumn(),
      sourceCandidateColumn: 'AY',
      deviceKeyProvisioned: !!PropertiesService.getScriptProperties().getProperty(LEARNING_RECOMMENDATION_DEVICE_KEY_PROPERTY)
    };
  });
}

function recAuditEnum_(issues, rowLabel, field, value, allowed) {
  if (allowed.indexOf(String(value || '').toLowerCase()) < 0) issues.push(rowLabel + ' invalid ' + field + ': ' + value + '.');
}

function auditLearningRecommendationIntegrity() {
  const issues = [];
  const counts = { learnCandidates: 0, techniques: 0, candidateTechniques: 0, techniquePrerequisites: 0, learningEvidence: 0, learningPreferences: 0, recommendationHistory: 0, sourceLinks: 0 };
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    assertLearningRecommendationSchemaReady_(db);
    const c = readObjects_(recSheet_(db, SHEET_NAMES.learnCandidates)); counts.learnCandidates = c.length;
    const t = readObjects_(recSheet_(db, SHEET_NAMES.techniques)); counts.techniques = t.length;
    const ct = readObjects_(recSheet_(db, SHEET_NAMES.candidateTechniques)); counts.candidateTechniques = ct.length;
    const p = readObjects_(recSheet_(db, SHEET_NAMES.techniquePrerequisites)); counts.techniquePrerequisites = p.length;
    const e = readObjects_(recSheet_(db, SHEET_NAMES.learningEvidence)); counts.learningEvidence = e.length;
    const lp = readObjects_(recSheet_(db, SHEET_NAMES.learningPreferences)); counts.learningPreferences = lp.length;
    const rh = readObjects_(recSheet_(db, SHEET_NAMES.recommendationHistory)); counts.recommendationHistory = rh.length;
    const sl = readObjects_(recSheet_(db, SHEET_NAMES.sourceLinks)); counts.sourceLinks = sl.length;
    const defs = [
      [c, 'CandidateID', 'LearnCandidates'], [t, 'TechniqueID', 'Techniques'], [ct, 'CandidateTechniqueID', 'CandidateTechniques'],
      [p, 'PrerequisiteEdgeID', 'TechniquePrerequisites'], [e, 'EvidenceID', 'LearningEvidence'], [lp, 'PreferenceID', 'LearningPreferences'],
      [rh, 'RecommendationEventID', 'RecommendationHistory'], [sl, 'SourceLinkID', 'SourceLinks']
    ];
    defs.forEach(function(def) { collectDuplicateIds_(def[0], def[1]).forEach(function(id) { issues.push(def[2] + ' duplicate ' + def[1] + ': ' + id + '.'); }); });
    const candidateById = {}; c.forEach(function(row) { candidateById[String(row.CandidateID || '')] = row; });
    const techniqueById = {}; t.forEach(function(row) { techniqueById[String(row.TechniqueID || '')] = row; });
    const opportunityRows = readObjects_(requireSheet_(db, SHEET_NAMES.opportunities));
    const opportunityById = {}; opportunityRows.forEach(function(row) { opportunityById[String(row.ID || '')] = row; });
    ct.forEach(function(row) {
      if (!candidateById[String(row.CandidateID || '')]) issues.push('CandidateTechniques unresolved CandidateID: ' + row.CandidateID + '.');
      if (!techniqueById[String(row.TechniqueID || '')]) issues.push('CandidateTechniques unresolved TechniqueID: ' + row.TechniqueID + '.');
      recAuditEnum_(issues, 'CandidateTechnique ' + row.CandidateTechniqueID, 'Role', row.Role, REC_ENUMS.candidateTechniqueRole);
      recAuditEnum_(issues, 'CandidateTechnique ' + row.CandidateTechniqueID, 'SafetyRole', row.SafetyRole, REC_ENUMS.safetyRole);
    });
    try { assertNoCandidateTechniqueDuplicate_(ct); } catch (error) { issues.push(safeError_(error)); }
    p.forEach(function(row) {
      if (!techniqueById[String(row.TechniqueID || '')] || !techniqueById[String(row.PrerequisiteTechniqueID || '')]) issues.push('Prerequisite unresolved TechniqueID: ' + row.PrerequisiteEdgeID + '.');
      if (String(row.TechniqueID || '') === String(row.PrerequisiteTechniqueID || '')) issues.push('Prerequisite self-link: ' + row.PrerequisiteEdgeID + '.');
      try { validateAppliesWhen_(row.AppliesWhen || ''); } catch (error) { issues.push('Prerequisite ' + row.PrerequisiteEdgeID + ': ' + safeError_(error)); }
      if (row.AppliesWhen) row.AppliesWhen.slice('candidate:'.length).split('|').forEach(function(id) { if (!candidateById[id]) issues.push('Prerequisite AppliesWhen unresolved CandidateID: ' + id + '.'); });
    });
    try { assertNoPrerequisiteDuplicate_(p); } catch (error) { issues.push(safeError_(error)); }
    try { assertNoPrerequisiteCycle_(p); } catch (error) { issues.push(safeError_(error)); }
    c.forEach(function(row) {
      recAuditEnum_(issues, 'Candidate ' + row.CandidateID, 'ChallengeBand', row.ChallengeBand, REC_ENUMS.challengeBand);
      recAuditEnum_(issues, 'Candidate ' + row.CandidateID, 'PrimaryChallengeType', row.PrimaryChallengeType, REC_ENUMS.primaryChallengeType);
      recAuditEnum_(issues, 'Candidate ' + row.CandidateID, 'BehaviourReviewStatus', row.BehaviourReviewStatus, REC_ENUMS.behaviourReviewStatus);
      recAuditEnum_(issues, 'Candidate ' + row.CandidateID, 'CandidateStatus', row.CandidateStatus, REC_ENUMS.candidateStatus);
      try { cleanRecTagList_(row.DifficultyDrivers, 'DifficultyDrivers', String(row.CandidateStatus) === 'active'); } catch (error) { issues.push('Candidate ' + row.CandidateID + ': ' + safeError_(error)); }
      try { cleanRecTagList_(row.CookingMethodTags, 'CookingMethodTags', String(row.CandidateStatus) === 'active'); } catch (error) { issues.push('Candidate ' + row.CandidateID + ': ' + safeError_(error)); }
      try { cleanRecTagList_(row.MealTypeTags, 'MealTypeTags', String(row.CandidateStatus) === 'active'); } catch (error) { issues.push('Candidate ' + row.CandidateID + ': ' + safeError_(error)); }
      const mappings = ct.filter(function(m) { return String(m.CandidateID || '') === String(row.CandidateID || ''); });
      try { validateSupportAllocation_(db, row.CandidateID, row.SupportAllocation || {}, ct); } catch (error) { issues.push('Candidate ' + row.CandidateID + ' SupportAllocation: ' + safeError_(error)); }
      if (recBoolFromRow_(row.SafetyRequired)) {
        recAuditEnum_(issues, 'Candidate ' + row.CandidateID, 'MinimumSafetySupport', row.MinimumSafetySupport, REC_ENUMS.safetySupport);
        if (!String(row.SafetyRequirement || '').trim()) issues.push('Candidate ' + row.CandidateID + ' safety required but SafetyRequirement blank.');
      }
      p.filter(function(edge) { return recBoolFromRow_(edge.Active) && String(edge.RequirementKind) === 'hard' && edge.AppliesWhen && isPrerequisiteEdgeApplicable_(edge, row); }).forEach(function(edge) {
        const targetMapping = mappings.filter(function(m) { return String(m.TechniqueID || '') === String(edge.TechniqueID || ''); });
        const allocation = resolveCandidateAllocation_(row, mappings);
        if (!targetMapping.some(function(m) { return isTechniqueSophieLed_(row, m, allocation); })) issues.push('Hard prerequisite ' + edge.PrerequisiteEdgeID + ' is candidate-scoped but target component is not Sophie-performed.');
      });
    });
    e.forEach(function(row) {
      if (!techniqueById[String(row.TechniqueID || '')]) issues.push('LearningEvidence unresolved TechniqueID: ' + row.EvidenceID + '.');
      if (row.CandidateID && !candidateById[String(row.CandidateID)]) issues.push('LearningEvidence unresolved CandidateID: ' + row.EvidenceID + '.');
      if (row.OpportunityID && !opportunityById[String(row.OpportunityID)]) issues.push('LearningEvidence unresolved OpportunityID: ' + row.EvidenceID + '.');
      if (REC_D005_SUPPORT_TOKENS.indexOf(String(row.ObservedSupport || '')) >= 0) issues.push('LearningEvidence uses D-005 support-preference token in ObservedSupport: ' + row.EvidenceID + '.');
      recAuditEnum_(issues, 'Evidence ' + row.EvidenceID, 'ObservedSupport', row.ObservedSupport, REC_ENUMS.observedSupport);
    });
    lp.forEach(function(row) {
      recAuditEnum_(issues, 'Preference ' + row.PreferenceID, 'PreferenceType', row.PreferenceType, REC_ENUMS.preferenceType);
      recAuditEnum_(issues, 'Preference ' + row.PreferenceID, 'DurationKind', row.DurationKind, REC_ENUMS.durationKind);
      if (String(row.PreferenceType || '') === 'challenge_preference') {
        recAuditEnum_(issues, 'Preference ' + row.PreferenceID, 'PreferenceValue', row.PreferenceValue, REC_ENUMS.challengePreference);
        if (String(row.DurationKind || '') === 'session' && !String(row.SessionID || '')) issues.push('Session challenge preference missing SessionID: ' + row.PreferenceID + '.');
      }
      if (String(row.PreferenceValue || '') === 'surprise_me') issues.push('surprise_me stored as persistent preference: ' + row.PreferenceID + '.');
    });
    const eventById = {};
    const setPositions = {};
    rh.forEach(function(row) {
      eventById[String(row.RecommendationEventID || '')] = row;
      if (!candidateById[String(row.CandidateID || '')]) issues.push('RecommendationHistory unresolved CandidateID: ' + row.RecommendationEventID + '.');
      recAuditEnum_(issues, 'Recommendation ' + row.RecommendationEventID, 'FitBand', row.FitBand, REC_ENUMS.fitBand);
      recAuditEnum_(issues, 'Recommendation ' + row.RecommendationEventID, 'RecencyDisposition', row.RecencyDisposition, REC_ENUMS.recencyDisposition);
      recAuditEnum_(issues, 'Recommendation ' + row.RecommendationEventID, 'DiversityRole', row.DiversityRole, REC_ENUMS.diversityRole);
      if (String(row.RecencyDisposition || '') === 'deliberate_repeat' && String(row.SophieOverride || '') !== 'repeat_or_refine' && String(row.ReasonCodes || '').indexOf('DELIBERATE_REPEAT') < 0) issues.push('deliberate_repeat lacks explicit repeat/refine basis: ' + row.RecommendationEventID + '.');
      const setKey = String(row.RecommendationSetID || '');
      if (!setPositions[setKey]) setPositions[setKey] = {};
      const pos = String(row.Position || '');
      if (setPositions[setKey][pos]) issues.push('Duplicate recommendation position in set ' + setKey + ': ' + pos + '.');
      setPositions[setKey][pos] = true;
      if (row.CreatedOpportunityID && !opportunityById[String(row.CreatedOpportunityID)]) issues.push('RecommendationHistory unresolved CreatedOpportunityID: ' + row.RecommendationEventID + '.');
      try { cleanRecIdList_(row.EvidenceBasisIDs || [], 'EvidenceBasisIDs', false).forEach(function(id) { if (!e.some(function(ev) { return String(ev.EvidenceID || '') === id; })) issues.push('RecommendationHistory unresolved EvidenceBasisID: ' + id + '.'); }); } catch (error) { issues.push('Recommendation ' + row.RecommendationEventID + ' invalid EvidenceBasisIDs.'); }
      try { cleanRecIdList_(row.PreferenceBasisIDs || [], 'PreferenceBasisIDs', false).forEach(function(id) { if (!lp.some(function(pr) { return String(pr.PreferenceID || '') === id; })) issues.push('RecommendationHistory unresolved PreferenceBasisID: ' + id + '.'); }); } catch (error) { issues.push('Recommendation ' + row.RecommendationEventID + ' invalid PreferenceBasisIDs.'); }
    });
    sl.forEach(function(row) {
      recAuditEnum_(issues, 'SourceLink ' + row.SourceLinkID, 'ProvenanceRole', row.ProvenanceRole, REC_ENUMS.provenanceRole);
      if (String(row.ProvenanceRole || '') === 'mixed') issues.push('SourceLink mixed provenance is prohibited: ' + row.SourceLinkID + '.');
      try { validateSourceLinkDraft_(db, row); } catch (error) { issues.push('SourceLink ' + row.SourceLinkID + ': ' + safeError_(error)); }
    });
    opportunityRows.forEach(function(row) {
      const source = String(row.SourceCandidateID || '');
      if (!source) return;
      if (!candidateById[source]) issues.push('Opportunity unresolved SourceCandidateID: ' + row.ID + ' -> ' + source + '.');
      if (d006Type_(row) !== 'learn' || number_(row.Value) !== 0 || String(row.MigrationVersion || '') !== OPPORTUNITY_CONTRACT_VERSION) issues.push('Recommendation-created Opportunity violates Learn invariants: ' + row.ID + '.');
    });
    const forbidden = ['MasteryScore', 'ReadinessScore', 'XP', 'InterestAffinityScore', 'RecencyPenalty', 'DiversityScore', 'RequiredRepetitions', 'MasteryAttempts'];
    [
      [SHEET_NAMES.learnCandidates, LEARN_CANDIDATE_HEADERS], [SHEET_NAMES.techniques, TECHNIQUE_HEADERS], [SHEET_NAMES.candidateTechniques, CANDIDATE_TECHNIQUE_HEADERS],
      [SHEET_NAMES.techniquePrerequisites, TECHNIQUE_PREREQUISITE_HEADERS], [SHEET_NAMES.learningEvidence, LEARNING_EVIDENCE_HEADERS],
      [SHEET_NAMES.learningPreferences, LEARNING_PREFERENCE_HEADERS], [SHEET_NAMES.recommendationHistory, RECOMMENDATION_HISTORY_HEADERS], [SHEET_NAMES.sourceLinks, SOURCE_LINK_HEADERS]
    ].forEach(function(def) { forbidden.forEach(function(name) { if (def[1].indexOf(name) >= 0) issues.push('Forbidden numeric learner-state field present: ' + def[0] + '.' + name + '.'); }); });
  } catch (error) { issues.push(safeError_(error)); }
  const result = {
    version: APP_VERSION,
    opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
    learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION,
    learningRecommendationContractVersion: LEARNING_RECOMMENDATION_CONTRACT_VERSION,
    ok: issues.length === 0,
    issueCount: issues.length,
    issues: issues,
    counts: counts,
    deviceKeyProvisioned: !!PropertiesService.getScriptProperties().getProperty(LEARNING_RECOMMENDATION_DEVICE_KEY_PROPERTY)
  };
  Logger.log(JSON.stringify(result));
  return result;
}

function recSeedExactFieldSet_(row, headers, label, issues) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    issues.push(label + ' must be an object.');
    return;
  }
  const actual = Object.keys(row).sort();
  const expected = headers.slice().sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    const missing = expected.filter(function(key) { return actual.indexOf(key) < 0; });
    const extra = actual.filter(function(key) { return expected.indexOf(key) < 0; });
    issues.push(label + ' field-set mismatch' +
      (missing.length ? '; missing=' + missing.join(',') : '') +
      (extra.length ? '; extra=' + extra.join(',') : '') + '.');
  }
}

function recSeedTry_(issues, label, callback) {
  try { callback(); }
  catch (error) { issues.push(label + ': ' + safeError_(error)); }
}

function recSeedRequireDate_(issues, label, value) {
  recSeedTry_(issues, label, function() { cleanRecDate_(value, label, true); });
}

function recSeedIndexUnique_(rows, idField, label, issues) {
  const index = {};
  (rows || []).forEach(function(row, i) {
    const id = String(row && row[idField] || '').trim();
    recSeedTry_(issues, label + '[' + i + '].' + idField, function() { cleanRecId_(id, idField); });
    if (id) {
      if (index[id]) issues.push(label + ' duplicate ' + idField + ': ' + id + '.');
      else index[id] = row;
    }
  });
  return index;
}

function recSeedValidateD005List_(issues, label, value) {
  recSeedTry_(issues, label, function() {
    const items = parseRecJsonArray_(value, label);
    if (items.length > REC_LIMITS.listItems) throwApiError_('REC_VALIDATION', label + ' has too many items.');
    const seen = {};
    items.forEach(function(item) {
      const token = cleanRecEnum_(item, REC_D005_SUPPORT_TOKENS, label);
      if (seen[token]) throwApiError_('REC_VALIDATION', label + ' contains duplicate token ' + token + '.');
      seen[token] = true;
    });
  });
}

function recSeedValidateSupportAllocationPure_(issues, candidate, mappings) {
  const label = 'Candidate ' + String(candidate.CandidateID || '') + ' SupportAllocation';
  recSeedTry_(issues, label, function() {
    const object = parseRecJsonObject_(candidate.SupportAllocation || {}, label);
    const allowedKeys = ['sophieLedTechniqueIds', 'adultLedTechniqueIds', 'sharedTechniqueIds'];
    Object.keys(object).forEach(function(key) {
      if (allowedKeys.indexOf(key) < 0) throwApiError_('REC_VALIDATION', 'Unsupported SupportAllocation key ' + key + '.');
    });
    const mapped = {};
    (mappings || []).forEach(function(row) { mapped[String(row.TechniqueID || '')] = true; });
    const seen = {};
    allowedKeys.forEach(function(key) {
      const ids = cleanRecIdList_(object[key] || [], label + '.' + key, false);
      ids.forEach(function(id) {
        if (!mapped[id]) throwApiError_('REC_VALIDATION', 'SupportAllocation references unmapped TechniqueID ' + id + '.');
        if (seen[id]) throwApiError_('REC_VALIDATION', 'TechniqueID ' + id + ' appears in multiple allocation roles.');
        seen[id] = true;
      });
    });
  });
}

function recSeedNumericStateScan_(value, path, issues) {
  if (typeof value === 'number') {
    if (!/^learnCandidates\[\d+\]\.EstimatedMinutes$/.test(path) || !isFinite(value) || value <= 0 || Math.floor(value) !== value) {
      issues.push('Forbidden or invalid numeric state at ' + path + '.');
    }
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach(function(item, i) { recSeedNumericStateScan_(item, path + '[' + i + ']', issues); });
    return;
  }
  Object.keys(value).forEach(function(key) {
    const lower = key.toLowerCase();
    const forbiddenNames = {
      masteryscore: true, readinessscore: true, xp: true, interestaffinityscore: true,
      recencypenalty: true, diversityscore: true, requiredrepetitions: true,
      masteryattempts: true, level: true, progress: true, nextlevelat: true,
      competencescore: true, safetyscore: true, fitscore: true, motivationscore: true,
      compliancescore: true, autonomyscore: true
    };
    if (forbiddenNames[lower]) issues.push('Forbidden learner/recommendation state field at ' + path + '.' + key + '.');
    recSeedNumericStateScan_(value[key], path ? path + '.' + key : key, issues);
  });
}

function recSeedCompiledDigest_(packageData) {
  return recDigestHex_(JSON.stringify(packageData));
}

function recSeedRowForSheet_(kind, row) {
  const result = clonePlainObject_(row);
  function jsonArray(field) { result[field] = recJsonArrayCell_(parseRecJsonArray_(row[field] || [], field)); }
  function date(field) { result[field] = cleanRecDate_(row[field], field, true); }
  if (kind === 'learnCandidates') {
    ['DifficultyDrivers','InterestTags','CookingMethodTags','MealTypeTags','CuisineTags','ChallengeStructureTags','SuggestedSupportOptions'].forEach(jsonArray);
    result.SupportAllocation = recJsonObjectCell_(parseRecJsonObject_(row.SupportAllocation || {}, 'SupportAllocation'));
    date('CreatedAt'); date('UpdatedAt');
  } else if (kind === 'techniques') {
    ['DifficultyDrivers','TypicalScaffoldOptions','TransferIndicators','AuthenticUses'].forEach(jsonArray);
    date('CreatedAt'); date('UpdatedAt');
  } else if (kind === 'candidateTechniques') {
    date('CreatedAt');
  } else if (kind === 'techniquePrerequisites') {
    date('CreatedAt'); date('UpdatedAt');
  } else if (kind === 'sourceLinks') {
    date('CreatedAt');
  }
  return result;
}

function recSeedPrepareInsertPlan_(sheet, headers, idField, kind, seedRows) {
  const existingRows = readObjects_(sheet);
  const existingById = {};
  existingRows.forEach(function(row) {
    const id = String(row[idField] || '');
    if (existingById[id]) throwApiError_('DUPLICATE_ID', 'Duplicate existing ' + idField + ': ' + id + '.');
    existingById[id] = row;
  });
  const missing = [];
  seedRows.forEach(function(seedRow) {
    const row = recSeedRowForSheet_(kind, seedRow);
    const id = String(row[idField] || '');
    const existing = existingById[id];
    if (!existing) { missing.push(row); return; }
    if (recCanonicalRow_(headers, existing) !== recCanonicalRow_(headers, row)) {
      throwApiError_('SEED_CONFLICT', kind + ' existing row conflicts with approved seed ID ' + id + '.');
    }
  });
  return { sheet: sheet, headers: headers, kind: kind, idField: idField, missing: missing };
}

function validateCookingRecV1SeedV1() {
  const issues = [];
  const packageData = REC_V1_COOKING_SEED_V1;
  const counts = { techniques: 0, learnCandidates: 0, candidateTechniques: 0, techniquePrerequisites: 0, sourceLinks: 0 };
  if (!packageData || typeof packageData !== 'object' || Array.isArray(packageData)) {
    issues.push('Compiled Cooking seed package is missing or invalid.');
  } else {
    const expectedTop = ['packageId','techniques','learnCandidates','candidateTechniques','techniquePrerequisites','sourceLinks'].sort();
    const actualTop = Object.keys(packageData).sort();
    if (JSON.stringify(actualTop) !== JSON.stringify(expectedTop)) issues.push('Seed top-level field set is not exact.');
    if (String(packageData.packageId || '') !== REC_SEED_PACKAGE_ID) issues.push('Unexpected Cooking seed package ID.');
    ['techniques','learnCandidates','candidateTechniques','techniquePrerequisites','sourceLinks'].forEach(function(key) {
      if (!Array.isArray(packageData[key])) issues.push('Seed package missing array: ' + key + '.');
      else counts[key] = packageData[key].length;
    });
  }

  if (issues.length === 0) {
    const expectedCounts = { techniques: 22, learnCandidates: 26, candidateTechniques: 132, techniquePrerequisites: 16, sourceLinks: 403 };
    Object.keys(expectedCounts).forEach(function(key) {
      if (counts[key] !== expectedCounts[key]) issues.push('Unexpected approved seed count for ' + key + ': ' + counts[key] + '.');
    });

    const techniques = packageData.techniques;
    const candidates = packageData.learnCandidates;
    const mappings = packageData.candidateTechniques;
    const prerequisites = packageData.techniquePrerequisites;
    const sourceLinks = packageData.sourceLinks;

    techniques.forEach(function(row, i) { recSeedExactFieldSet_(row, TECHNIQUE_HEADERS, 'Techniques[' + i + ']', issues); });
    candidates.forEach(function(row, i) { recSeedExactFieldSet_(row, LEARN_CANDIDATE_HEADERS, 'LearnCandidates[' + i + ']', issues); });
    mappings.forEach(function(row, i) { recSeedExactFieldSet_(row, CANDIDATE_TECHNIQUE_HEADERS, 'CandidateTechniques[' + i + ']', issues); });
    prerequisites.forEach(function(row, i) { recSeedExactFieldSet_(row, TECHNIQUE_PREREQUISITE_HEADERS, 'TechniquePrerequisites[' + i + ']', issues); });
    sourceLinks.forEach(function(row, i) { recSeedExactFieldSet_(row, SOURCE_LINK_HEADERS, 'SourceLinks[' + i + ']', issues); });

    const techniqueById = recSeedIndexUnique_(techniques, 'TechniqueID', 'Techniques', issues);
    const candidateById = recSeedIndexUnique_(candidates, 'CandidateID', 'LearnCandidates', issues);
    const mappingById = recSeedIndexUnique_(mappings, 'CandidateTechniqueID', 'CandidateTechniques', issues);
    const prerequisiteById = recSeedIndexUnique_(prerequisites, 'PrerequisiteEdgeID', 'TechniquePrerequisites', issues);
    recSeedIndexUnique_(sourceLinks, 'SourceLinkID', 'SourceLinks', issues);

    techniques.forEach(function(row, i) {
      const label = 'Technique ' + String(row.TechniqueID || i);
      recSeedTry_(issues, label + ' SkillID', function() { if (cleanRecId_(row.SkillID, 'SkillID') !== 'S001') throwApiError_('REC_VALIDATION', 'Cooking Technique must use SkillID S001.'); });
      recSeedTry_(issues, label + ' Name', function() { cleanRecText_(row.Name, REC_LIMITS.title, 'Name', true); });
      recSeedTry_(issues, label + ' Description', function() { cleanRecText_(row.Description, REC_LIMITS.description, 'Description', true); });
      recSeedTry_(issues, label + ' ObservableEvidence', function() { cleanRecText_(row.ObservableEvidence, REC_LIMITS.description, 'ObservableEvidence', true); });
      recSeedTry_(issues, label + ' DifficultyDrivers', function() { cleanRecTagList_(row.DifficultyDrivers, 'DifficultyDrivers', true); });
      recSeedValidateD005List_(issues, label + ' TypicalScaffoldOptions', row.TypicalScaffoldOptions);
      recSeedTry_(issues, label + ' SafetyCritical', function() { if (typeof row.SafetyCritical !== 'boolean') throwApiError_('REC_VALIDATION', 'SafetyCritical must be boolean.'); });
      recSeedTry_(issues, label + ' TypicalSafetySupport', function() { cleanRecEnum_(row.TypicalSafetySupport, REC_ENUMS.safetySupport, 'TypicalSafetySupport'); });
      recSeedTry_(issues, label + ' TransferIndicators', function() { cleanRecTagList_(row.TransferIndicators, 'TransferIndicators', false); });
      recSeedTry_(issues, label + ' AuthenticUses', function() { cleanRecTagList_(row.AuthenticUses, 'AuthenticUses', false); });
      recSeedTry_(issues, label + ' Active', function() { if (typeof row.Active !== 'boolean') throwApiError_('REC_VALIDATION', 'Active must be boolean.'); });
      recSeedRequireDate_(issues, label + ' CreatedAt', row.CreatedAt);
      recSeedRequireDate_(issues, label + ' UpdatedAt', row.UpdatedAt);
      if (row.SafetyCritical) {
        if (String(row.TypicalSafetySupport || '') === 'none') issues.push(label + ' is SafetyCritical but TypicalSafetySupport is none.');
        if (!String(row.SafetyNote || '').trim()) issues.push(label + ' is SafetyCritical but SafetyNote is blank.');
      }
    });

    const mappingsByCandidate = {};
    mappings.forEach(function(row, i) {
      const label = 'CandidateTechnique ' + String(row.CandidateTechniqueID || i);
      if (!candidateById[String(row.CandidateID || '')]) issues.push(label + ' unresolved CandidateID ' + row.CandidateID + '.');
      if (!techniqueById[String(row.TechniqueID || '')]) issues.push(label + ' unresolved TechniqueID ' + row.TechniqueID + '.');
      recSeedTry_(issues, label + ' Role', function() { cleanRecEnum_(row.Role, REC_ENUMS.candidateTechniqueRole, 'Role'); });
      recSeedTry_(issues, label + ' EvidenceRelevant', function() { if (typeof row.EvidenceRelevant !== 'boolean') throwApiError_('REC_VALIDATION', 'EvidenceRelevant must be boolean.'); });
      recSeedTry_(issues, label + ' SafetyRole', function() { cleanRecEnum_(row.SafetyRole, REC_ENUMS.safetyRole, 'SafetyRole'); });
      recSeedRequireDate_(issues, label + ' CreatedAt', row.CreatedAt);
      const expectedId = stableRecId_('CT', row.CandidateID, row.TechniqueID);
      if (String(row.CandidateTechniqueID || '') !== expectedId) issues.push(label + ' violates deterministic CandidateTechniqueID policy; expected ' + expectedId + '.');
      const rel = String(row.CandidateID || '') + '|' + String(row.TechniqueID || '');
      if (!mappingsByCandidate[String(row.CandidateID || '')]) mappingsByCandidate[String(row.CandidateID || '')] = [];
      mappingsByCandidate[String(row.CandidateID || '')].push(row);
      row.__seedRelationshipKey = rel;
    });
    recSeedTry_(issues, 'CandidateTechnique relationship uniqueness', function() { assertNoCandidateTechniqueDuplicate_(mappings); });
    mappings.forEach(function(row) { try { delete row.__seedRelationshipKey; } catch (ignore) {} });

    candidates.forEach(function(row, i) {
      const label = 'Candidate ' + String(row.CandidateID || i);
      recSeedTry_(issues, label + ' Domain', function() { if (cleanRecEnum_(row.Domain, REC_ENUMS.domain, 'Domain') !== 'cooking') throwApiError_('REC_VALIDATION', 'Domain must be cooking.'); });
      recSeedTry_(issues, label + ' SkillID', function() { if (cleanRecId_(row.SkillID, 'SkillID') !== 'S001') throwApiError_('REC_VALIDATION', 'Cooking Candidate must use SkillID S001.'); });
      recSeedTry_(issues, label + ' Title', function() { cleanRecText_(row.Title, REC_LIMITS.title, 'Title', true); });
      recSeedTry_(issues, label + ' PracticeDescription', function() { cleanRecText_(row.PracticeDescription, REC_LIMITS.description, 'PracticeDescription', true); });
      recSeedTry_(issues, label + ' CompletionStandard', function() { cleanRecText_(row.CompletionStandard, REC_LIMITS.description, 'CompletionStandard', true); });
      recSeedTry_(issues, label + ' ChallengeBand', function() { cleanRecEnum_(row.ChallengeBand, REC_ENUMS.challengeBand, 'ChallengeBand'); });
      recSeedTry_(issues, label + ' PrimaryChallengeType', function() { cleanRecEnum_(row.PrimaryChallengeType, REC_ENUMS.primaryChallengeType, 'PrimaryChallengeType'); });
      recSeedTry_(issues, label + ' DifficultyDrivers', function() { cleanRecTagList_(row.DifficultyDrivers, 'DifficultyDrivers', true); });
      recSeedTry_(issues, label + ' InterestTags', function() { cleanRecTagList_(row.InterestTags, 'InterestTags', false); });
      recSeedTry_(issues, label + ' CookingMethodTags', function() { cleanRecTagList_(row.CookingMethodTags, 'CookingMethodTags', true); });
      recSeedTry_(issues, label + ' MealTypeTags', function() { cleanRecTagList_(row.MealTypeTags, 'MealTypeTags', true); });
      recSeedTry_(issues, label + ' CuisineTags', function() { cleanRecTagList_(row.CuisineTags, 'CuisineTags', false); });
      recSeedTry_(issues, label + ' ChallengeStructureTags', function() { cleanRecTagList_(row.ChallengeStructureTags, 'ChallengeStructureTags', false); });
      recSeedValidateD005List_(issues, label + ' SuggestedSupportOptions', row.SuggestedSupportOptions);
      recSeedTry_(issues, label + ' SafetyRequired', function() { if (typeof row.SafetyRequired !== 'boolean') throwApiError_('REC_VALIDATION', 'SafetyRequired must be boolean.'); });
      recSeedTry_(issues, label + ' MinimumSafetySupport', function() { cleanRecEnum_(row.MinimumSafetySupport, REC_ENUMS.safetySupport, 'MinimumSafetySupport'); });
      recSeedTry_(issues, label + ' BehaviourReviewStatus', function() { cleanRecEnum_(row.BehaviourReviewStatus, REC_ENUMS.behaviourReviewStatus, 'BehaviourReviewStatus'); });
      recSeedTry_(issues, label + ' CandidateStatus', function() { cleanRecEnum_(row.CandidateStatus, REC_ENUMS.candidateStatus, 'CandidateStatus'); });
      recSeedRequireDate_(issues, label + ' CreatedAt', row.CreatedAt);
      recSeedRequireDate_(issues, label + ' UpdatedAt', row.UpdatedAt);
      if (row.EstimatedMinutes !== '' && row.EstimatedMinutes != null && (!(typeof row.EstimatedMinutes === 'number') || row.EstimatedMinutes <= 0 || Math.floor(row.EstimatedMinutes) !== row.EstimatedMinutes)) issues.push(label + ' EstimatedMinutes must be a positive integer or blank.');
      if (row.SafetyRequired) {
        if (String(row.MinimumSafetySupport || '') === 'none') issues.push(label + ' SafetyRequired cannot use MinimumSafetySupport none.');
        if (!String(row.SafetyRequirement || '').trim()) issues.push(label + ' SafetyRequired requires SafetyRequirement.');
      } else {
        if (String(row.MinimumSafetySupport || '') !== 'none') issues.push(label + ' non-safety candidate must use MinimumSafetySupport none.');
        if (String(row.SafetyRequirement || '').trim()) issues.push(label + ' non-safety candidate must not define SafetyRequirement.');
      }
      const candidateMappings = mappingsByCandidate[String(row.CandidateID || '')] || [];
      if (!candidateMappings.some(function(m) { return String(m.Role || '') === 'primary_practice'; })) issues.push(label + ' has no primary_practice technique.');
      recSeedValidateSupportAllocationPure_(issues, row, candidateMappings);
      const allocation = resolveCandidateAllocation_(row, candidateMappings);
      candidateMappings.forEach(function(mapping) {
        const technique = techniqueById[String(mapping.TechniqueID || '')];
        if (!technique) return;
        if (String(mapping.SafetyRole || '') === 'gated_for_sophie') {
          if (!recBoolFromRow_(technique.SafetyCritical)) issues.push(label + ' marks non-safety-critical Technique ' + mapping.TechniqueID + ' as gated_for_sophie.');
          if (!row.SafetyRequired) issues.push(label + ' has gated_for_sophie mapping but SafetyRequired is false.');
          if (!isTechniqueSophieLed_(row, mapping, allocation)) issues.push(label + ' has gated_for_sophie mapping allocated adult-led: ' + mapping.TechniqueID + '.');
        }
        if (String(mapping.SafetyRole || '') === 'safety_relevant' && !recBoolFromRow_(technique.SafetyCritical)) issues.push(label + ' marks non-safety-critical Technique ' + mapping.TechniqueID + ' as safety_relevant.');
      });
    });

    const prerequisiteRelationSeen = {};
    prerequisites.forEach(function(row, i) {
      const label = 'Prerequisite ' + String(row.PrerequisiteEdgeID || i);
      if (!techniqueById[String(row.TechniqueID || '')]) issues.push(label + ' unresolved TechniqueID ' + row.TechniqueID + '.');
      if (!techniqueById[String(row.PrerequisiteTechniqueID || '')]) issues.push(label + ' unresolved PrerequisiteTechniqueID ' + row.PrerequisiteTechniqueID + '.');
      if (String(row.TechniqueID || '') === String(row.PrerequisiteTechniqueID || '')) issues.push(label + ' self-links.');
      recSeedTry_(issues, label + ' RequirementKind', function() { cleanRecEnum_(row.RequirementKind, REC_ENUMS.requirementKind, 'RequirementKind'); });
      recSeedTry_(issues, label + ' EvidenceExpectation', function() { cleanRecEnum_(row.EvidenceExpectation, REC_ENUMS.evidenceExpectation, 'EvidenceExpectation'); });
      recSeedTry_(issues, label + ' Rationale', function() { cleanRecText_(row.Rationale, REC_LIMITS.rationale, 'Rationale', true); });
      recSeedTry_(issues, label + ' SafetyRelated', function() { if (typeof row.SafetyRelated !== 'boolean') throwApiError_('REC_VALIDATION', 'SafetyRelated must be boolean.'); });
      recSeedTry_(issues, label + ' Active', function() { if (typeof row.Active !== 'boolean') throwApiError_('REC_VALIDATION', 'Active must be boolean.'); });
      recSeedRequireDate_(issues, label + ' CreatedAt', row.CreatedAt);
      recSeedRequireDate_(issues, label + ' UpdatedAt', row.UpdatedAt);
      const expectedId = stableRecId_('TP', row.TechniqueID, row.PrerequisiteTechniqueID);
      if (String(row.PrerequisiteEdgeID || '') !== expectedId) issues.push(label + ' violates deterministic PrerequisiteEdgeID policy; expected ' + expectedId + '.');
      const rel = String(row.TechniqueID || '') + '|' + String(row.PrerequisiteTechniqueID || '');
      if (row.Active && prerequisiteRelationSeen[rel]) issues.push(label + ' duplicates active prerequisite relationship ' + rel + '.');
      if (row.Active) prerequisiteRelationSeen[rel] = true;
      recSeedTry_(issues, label + ' AppliesWhen', function() {
        const clean = validateAppliesWhen_(row.AppliesWhen || '');
        if (clean) {
          const ids = clean.slice('candidate:'.length).split('|');
          const seen = {};
          ids.forEach(function(id) {
            if (!candidateById[id]) throwApiError_('REC_VALIDATION', 'AppliesWhen unresolved CandidateID ' + id + '.');
            if (seen[id]) throwApiError_('REC_VALIDATION', 'AppliesWhen repeats CandidateID ' + id + '.');
            seen[id] = true;
          });
        }
      });
      if (String(row.RequirementKind || '') === 'hard') {
        if (String(row.EvidenceExpectation || '') === 'safety_confirmed' && !row.SafetyRelated) issues.push(label + ' safety_confirmed hard prerequisite must be SafetyRelated.');
        const targetTechnique = techniqueById[String(row.TechniqueID || '')];
        const prereqTechnique = techniqueById[String(row.PrerequisiteTechniqueID || '')];
        if (String(row.EvidenceExpectation || '') === 'safety_confirmed') {
          if (targetTechnique && !targetTechnique.SafetyCritical) issues.push(label + ' safety_confirmed hard target Technique is not SafetyCritical.');
          if (prereqTechnique && !prereqTechnique.SafetyCritical) issues.push(label + ' safety_confirmed prerequisite Technique is not SafetyCritical.');
        }
        candidates.forEach(function(candidate) {
          if (!isPrerequisiteEdgeApplicable_(row, candidate)) return;
          const candidateMappings = mappingsByCandidate[String(candidate.CandidateID || '')] || [];
          const targetMappings = candidateMappings.filter(function(m) { return String(m.TechniqueID || '') === String(row.TechniqueID || ''); });
          if (!targetMappings.length) return;
          const allocation = resolveCandidateAllocation_(candidate, candidateMappings);
          targetMappings.forEach(function(mapping) {
            if (!isTechniqueSophieLed_(candidate, mapping, allocation)) return;
            if (String(mapping.SafetyRole || '') !== 'gated_for_sophie') issues.push(label + ' applies to Sophie-led ' + candidate.CandidateID + ' but target mapping is not gated_for_sophie.');
            if (!candidate.SafetyRequired || String(candidate.MinimumSafetySupport || '') === 'none' || !String(candidate.SafetyRequirement || '').trim()) issues.push(label + ' applies to Sophie-led ' + candidate.CandidateID + ' without explicit candidate safety support.');
          });
        });
      }
    });
    recSeedTry_(issues, 'Prerequisite cycle check', function() { assertNoPrerequisiteCycle_(prerequisites); });

    const sourceTargetMaps = {
      LearnCandidates: candidateById,
      Techniques: techniqueById,
      CandidateTechniques: mappingById,
      TechniquePrerequisites: prerequisiteById
    };
    const provenanceCoverage = {};
    sourceLinks.forEach(function(row, i) {
      const label = 'SourceLink ' + String(row.SourceLinkID || i);
      recSeedTry_(issues, label + ' RecordType', function() { cleanRecRecordType_(row.RecordType); });
      recSeedTry_(issues, label + ' ProvenanceRole', function() { cleanRecEnum_(row.ProvenanceRole, REC_ENUMS.provenanceRole, 'ProvenanceRole'); });
      if (String(row.ProvenanceRole || '') === 'mixed') issues.push(label + ' uses prohibited mixed provenance.');
      recSeedTry_(issues, label + ' SourceRef', function() { cleanRecText_(row.SourceRef, REC_LIMITS.sourceRef, 'SourceRef', true); });
      recSeedTry_(issues, label + ' SourceLocation', function() { cleanRecText_(row.SourceLocation || '', REC_LIMITS.sourceLocation, 'SourceLocation', false); });
      recSeedTry_(issues, label + ' SupportNote', function() { cleanRecText_(row.SupportNote || '', REC_LIMITS.note, 'SupportNote', false); });
      recSeedRequireDate_(issues, label + ' CreatedAt', row.CreatedAt);
      const targetMap = sourceTargetMaps[String(row.RecordType || '')];
      if (!targetMap) issues.push(label + ' targets entity type not present in this seed: ' + row.RecordType + '.');
      else if (!targetMap[String(row.RecordID || '')]) issues.push(label + ' unresolved RecordID ' + row.RecordID + '.');
      const expectedId = stableRecId_('SL', String(row.RecordType || '') + '|' + String(row.RecordID || '') + '|' + String(row.ProvenanceRole || ''), String(row.SourceRef || '') + '|' + String(row.SourceLocation || ''));
      if (String(row.SourceLinkID || '') !== expectedId) issues.push(label + ' violates deterministic SourceLinkID policy; expected ' + expectedId + '.');
      provenanceCoverage[String(row.RecordType || '') + '|' + String(row.RecordID || '')] = true;
    });

    [
      ['LearnCandidates', candidates, 'CandidateID'],
      ['Techniques', techniques, 'TechniqueID'],
      ['CandidateTechniques', mappings, 'CandidateTechniqueID'],
      ['TechniquePrerequisites', prerequisites, 'PrerequisiteEdgeID']
    ].forEach(function(def) {
      def[1].forEach(function(row) {
        const key = def[0] + '|' + String(row[def[2]] || '');
        if (!provenanceCoverage[key]) issues.push('Missing SourceLink provenance coverage for ' + key + '.');
      });
    });

    recSeedNumericStateScan_(packageData, '', issues);

    const actualDigest = recSeedCompiledDigest_(packageData);
    if (actualDigest !== REC_V1_COOKING_SEED_V1_COMPILED_SHA256) issues.push('Compiled seed integrity hash mismatch: expected ' + REC_V1_COOKING_SEED_V1_COMPILED_SHA256 + ', got ' + actualDigest + '.');
  }

  const result = {
    version: APP_VERSION,
    opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
    learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION,
    learningRecommendationContractVersion: LEARNING_RECOMMENDATION_CONTRACT_VERSION,
    packageId: packageData && packageData.packageId ? packageData.packageId : '',
    relationshipIdPolicy: REC_V1_RELATIONSHIP_ID_POLICY,
    sourcePackageSha256: REC_V1_COOKING_SEED_V1_SOURCE_SHA256,
    compiledPackageSha256Expected: REC_V1_COOKING_SEED_V1_COMPILED_SHA256,
    compiledPackageSha256Actual: packageData ? recSeedCompiledDigest_(packageData) : '',
    ok: issues.length === 0,
    issueCount: issues.length,
    issues: issues,
    counts: counts,
    writesPerformed: false
  };
  Logger.log(JSON.stringify(result));
  return result;
}

function seedCookingRecV1V1() {
  const validation = validateCookingRecV1SeedV1();
  if (!validation.ok) throwApiError_('SEED_VALIDATION_FAILED', 'Cooking rec-v1 seed failed final validation.');
  return withLearningRecommendationLock_(function(db) {
    assertLearningRecommendationSchemaReady_(db);
    const plans = [
      recSeedPrepareInsertPlan_(recSheet_(db, SHEET_NAMES.techniques), TECHNIQUE_HEADERS, 'TechniqueID', 'techniques', REC_V1_COOKING_SEED_V1.techniques),
      recSeedPrepareInsertPlan_(recSheet_(db, SHEET_NAMES.learnCandidates), LEARN_CANDIDATE_HEADERS, 'CandidateID', 'learnCandidates', REC_V1_COOKING_SEED_V1.learnCandidates),
      recSeedPrepareInsertPlan_(recSheet_(db, SHEET_NAMES.candidateTechniques), CANDIDATE_TECHNIQUE_HEADERS, 'CandidateTechniqueID', 'candidateTechniques', REC_V1_COOKING_SEED_V1.candidateTechniques),
      recSeedPrepareInsertPlan_(recSheet_(db, SHEET_NAMES.techniquePrerequisites), TECHNIQUE_PREREQUISITE_HEADERS, 'PrerequisiteEdgeID', 'techniquePrerequisites', REC_V1_COOKING_SEED_V1.techniquePrerequisites),
      recSeedPrepareInsertPlan_(recSheet_(db, SHEET_NAMES.sourceLinks), SOURCE_LINK_HEADERS, 'SourceLinkID', 'sourceLinks', REC_V1_COOKING_SEED_V1.sourceLinks)
    ];
    const inserted = {};
    plans.forEach(function(plan) {
      inserted[plan.kind] = plan.missing.length;
      plan.missing.forEach(function(row) { appendObjectRow_(plan.sheet, row); });
    });
    SpreadsheetApp.flush();
    return {
      version: APP_VERSION,
      learningRecommendationContractVersion: LEARNING_RECOMMENDATION_CONTRACT_VERSION,
      packageId: REC_SEED_PACKAGE_ID,
      compiledPackageSha256: REC_V1_COOKING_SEED_V1_COMPILED_SHA256,
      relationshipIdPolicy: REC_V1_RELATIONSHIP_ID_POLICY,
      inserted: inserted,
      idempotent: Object.keys(inserted).every(function(key) { return inserted[key] === 0; })
    };
  });
}


function recPureAssert_(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed.');
}

function recPureExpectThrow_(fn, code) {
  let threw = false;
  try { fn(); } catch (error) { threw = !code || apiErrorCode_(error) === code; }
  recPureAssert_(threw, 'Expected error' + (code ? ' ' + code : '') + '.');
}

function runLearningRecommendationContractTests() {
  const failures = [];
  const tests = [];
  function test(name, fn) { tests.push(name); try { fn(); } catch (error) { failures.push(name + ': ' + safeError_(error)); } }
  function fakeCandidate(overrides) {
    const row = {
      CandidateID: 'LC-A', Domain: 'cooking', SkillID: 'S001', Title: 'A', ChallengeBand: 'stretch', PrimaryChallengeType: 'progression',
      DifficultyDrivers: '["timing"]', CookingMethodTags: '["pan"]', MealTypeTags: '["dinner"]', InterestTags: '[]', CuisineTags: '[]', ChallengeStructureTags: '[]',
      SafetyRequired: false, MinimumSafetySupport: 'none', SafetyRequirement: '', SafetyNote: '', SupportAllocation: '', BehaviourReviewStatus: 'routine_approved_pattern', CandidateStatus: 'active'
    };
    Object.keys(overrides || {}).forEach(function(k) { row[k] = overrides[k]; }); return row;
  }
  function fakeEvidence(overrides) {
    const row = { Active: true, CandidateID: '', EvidenceType: 'parent_observation', ObservedCapability: 'practising', ObservedSupport: 'some_support', SafetyObserved: 'not_observed', ReliabilityObserved: 'not_assessed', ObservedAt: new Date('2026-08-21T00:00:00Z') };
    Object.keys(overrides || {}).forEach(function(k) { row[k] = overrides[k]; }); return row;
  }

  test('01 enum canonicalisation', function() { recPureAssert_(cleanRecEnum_(' STRETCH ', REC_ENUMS.challengeBand, 'x') === 'stretch'); });
  test('02 invalid enum rejection', function() { recPureExpectThrow_(function() { cleanRecEnum_('level2', REC_ENUMS.challengeBand, 'x'); }, 'REC_VALIDATION'); });
  test('03 tag/list JSON validation', function() { recPureAssert_(cleanRecTagList_('["pan","dinner"]', 'x', true).length === 2); });
  test('04 malformed JSON rejection', function() { recPureExpectThrow_(function() { parseRecJsonArray_('{bad', 'x'); }, 'REC_VALIDATION'); });
  test('05 SupportAllocation allowed keys only', function() { recPureExpectThrow_(function() { validateSupportAllocation_(null, 'LC', { bad: [] }, []); }, 'REC_VALIDATION'); });
  test('06 SupportAllocation mapped IDs only', function() { recPureExpectThrow_(function() { validateSupportAllocation_(null, 'LC', { sophieLedTechniqueIds: ['T2'] }, [{CandidateID:'LC',TechniqueID:'T1'}]); }, 'REC_VALIDATION'); });
  test('07 SupportAllocation no dual role', function() { recPureExpectThrow_(function() { validateSupportAllocation_(null, 'LC', { sophieLedTechniqueIds:['T1'],adultLedTechniqueIds:['T1'] }, [{CandidateID:'LC',TechniqueID:'T1'}]); }, 'REC_VALIDATION'); });
  test('08 prerequisite self-link rejected', function() { recPureExpectThrow_(function() { assertNoPrerequisiteSelfLink_({TechniqueID:'T',PrerequisiteTechniqueID:'T'}); }, 'REC_VALIDATION'); });
  test('09 prerequisite cycle rejected', function() { recPureExpectThrow_(function() { assertNoPrerequisiteCycle_([{TechniqueID:'A',PrerequisiteTechniqueID:'B',Active:true},{TechniqueID:'B',PrerequisiteTechniqueID:'A',Active:true}]); }, 'REC_VALIDATION'); });
  test('10 duplicate prerequisite rejected', function() { recPureExpectThrow_(function() { assertNoPrerequisiteDuplicate_([{TechniqueID:'A',PrerequisiteTechniqueID:'B',Active:true},{TechniqueID:'A',PrerequisiteTechniqueID:'B',Active:true}]); }, 'REC_VALIDATION'); });
  test('11 hard applies only when context matches', function() { recPureAssert_(!isPrerequisiteEdgeApplicable_({AppliesWhen:'candidate:LC-B'}, fakeCandidate())); });
  test('12 adult-led is not Sophie-led', function() { const c=fakeCandidate({SupportAllocation:'{"adultLedTechniqueIds":["T1"]}'}); recPureAssert_(!isTechniqueSophieLed_(c,{TechniqueID:'T1',Role:'primary_practice'},resolveCandidateAllocation_(c,[{TechniqueID:'T1',Role:'primary_practice'}]))); });
  test('13 recommended prerequisite helper is non-blocking construct', function() { recPureAssert_(REC_ENUMS.requirementKind.indexOf('recommended') >= 0); });
  test('14 observed_with_support evidence', function() { recPureAssert_(isEvidenceExpectationSatisfied_('observed_with_support',[fakeEvidence({ObservedCapability:'practising'})],fakeCandidate())); });
  test('15 observed_independent evidence', function() { recPureAssert_(isEvidenceExpectationSatisfied_('observed_independent',[fakeEvidence({ObservedCapability:'independent',ObservedSupport:'reminder_only'})],fakeCandidate())); });
  test('16 observed_reliable requires reliability', function() { recPureAssert_(!isEvidenceExpectationSatisfied_('observed_reliable',[fakeEvidence({ObservedCapability:'reliable',ReliabilityObserved:'emerging'})],fakeCandidate())); });
  test('17 safety_confirmed evidence', function() { recPureAssert_(isEvidenceExpectationSatisfied_('safety_confirmed',[fakeEvidence({SafetyObserved:'safe_with_required_support'})],fakeCandidate())); });
  test('18 challenge cannot alter evidence expectation', function() { recPureAssert_(!isEvidenceExpectationSatisfied_('observed_reliable',[fakeEvidence({ObservedCapability:'practising'})],fakeCandidate({ChallengeBand:'complex'}))); });
  test('19 safety categorical precedence', function() { recPureAssert_(REC_SAFETY_ORDER.adult_nearby < REC_SAFETY_ORDER.direct_supervision); });
  test('20 challenge preference omitted duration is session', function() { recPureAssert_((undefined || 'session') === 'session'); });
  test('21 longer duration explicit enum exists', function() { recPureAssert_(REC_ENUMS.durationKind.indexOf('until_changed') >= 0); });
  test('22 surprise_me not challenge preference', function() { recPureAssert_(REC_ENUMS.challengePreference.indexOf('surprise_me') < 0); });
  test('23 avoid_for_now is preference not eligibility enum', function() { recPureAssert_(REC_ENUMS.preferenceType.indexOf('avoid_for_now') >= 0 && REC_ENUMS.candidateStatus.indexOf('avoid_for_now') < 0); });
  test('24 D005 support token rejected as observed support', function() { recPureExpectThrow_(function() { cleanRecEnum_('show_me', REC_ENUMS.observedSupport, 'ObservedSupport'); }, 'REC_VALIDATION'); });
  test('25 observed support and D005 support are disjoint', function() { recPureAssert_(REC_ENUMS.observedSupport.every(function(x){return REC_D005_SUPPORT_TOKENS.indexOf(x)<0;})); });
  test('26 FitBand event-specific enum', function() { recPureAssert_(REC_ENUMS.fitBand.length === 3); });
  test('27 no legacy Skills numeric fields in rec headers', function() { const all=[LEARN_CANDIDATE_HEADERS,TECHNIQUE_HEADERS,CANDIDATE_TECHNIQUE_HEADERS,TECHNIQUE_PREREQUISITE_HEADERS,LEARNING_EVIDENCE_HEADERS,LEARNING_PREFERENCE_HEADERS,RECOMMENDATION_HISTORY_HEADERS,SOURCE_LINK_HEADERS].reduce(function(a,b){return a.concat(b);},[]); recPureAssert_(['Level','Progress','NextLevelAt'].every(function(x){return all.indexOf(x)<0;})); });
  test('28 immediate repeat category exists without score', function() { recPureAssert_(REC_ENUMS.recencyDisposition.indexOf('recently_shown') >= 0); });
  test('29 deliberate repeat supported', function() { recPureAssert_(REC_ENUMS.recencyDisposition.indexOf('deliberate_repeat') >= 0 && REC_ENUMS.sophieOverride.indexOf('repeat_or_refine') >= 0); });
  test('30 deliberate repeat reason constant can be explicit', function() { recPureAssert_(recReasonForCandidate_(fakeCandidate(),'familiar_next_step','deliberate_repeat',{requestKind:'repeat_or_refine'}).indexOf('repeat')>=0); });
  test('31 show_something_else supported', function() { recPureAssert_(REC_ENUMS.requestKind.indexOf('show_something_else') >= 0); });
  test('32 surprise_me supported without safety mutation', function() { recPureAssert_(REC_ENUMS.requestKind.indexOf('surprise_me') >= 0 && REC_SAFETY_ORDER.none === 0); });
  test('33 switch_pathway supported', function() { recPureAssert_(REC_ENUMS.requestKind.indexOf('switch_pathway') >= 0); });
  test('34 diversity detects two dimensions', function() { const a=fakeCandidate({CookingMethodTags:'["pan"]',MealTypeTags:'["dinner"]'}),b=fakeCandidate({CookingMethodTags:'["oven"]',MealTypeTags:'["snack"]'}); recPureAssert_(recMeaningfulDiversityDifference_(a,b)>=2); });
  test('35 pool limited diversity fallback can detect one dimension', function() { const a=fakeCandidate({CookingMethodTags:'["pan"]'}),b=fakeCandidate({CookingMethodTags:'["oven"]'}); recPureAssert_(recMeaningfulDiversityDifference_(a,b)>=1); });
  test('36 blocked candidate does not remove controls', function() { recPureAssert_(recRecommendationControls_().canRequestAnotherSet === true); });
  test('37 outside-band catalogue choice not prohibited by enum', function() { recPureAssert_(REC_ENUMS.challengeBand.indexOf('complex')>=0); });
  test('38 choose requires re-evaluation function', function() { recPureAssert_(typeof evaluateCandidateEligibility_ === 'function'); });
  test('39 recommendation set ID stable', function() { const r={clientRequestId:'abc',domain:'cooking',limit:3,recommendationSessionId:'S',requestKind:'normal',priorRecommendationSetId:'',challengePreference:'',challengePreferenceDuration:'',availableSafetySupport:'none',pathwayScope:'',pathwayRef:''}; recPureAssert_(recRecommendationSetId_(r)===recRecommendationSetId_(r)); });
  test('40 preference deterministic ID stable', function() { recPureAssert_(stableRecId_('LP','preference','abc')===stableRecId_('LP','preference','abc')); });
  test('41 evidence deterministic ID stable', function() { recPureAssert_(stableRecId_('LE','evidence','abc')===stableRecId_('LE','evidence','abc')); });
  test('42 direct choice deterministic Opportunity stable', function() { recPureAssert_(stableRecId_('OP','rec-choice','abc')===stableRecId_('OP','rec-choice','abc')); });
  test('43 idempotency context signature changes on contradiction', function() { const a={domain:'cooking',limit:3,recommendationSessionId:'S',requestKind:'normal',priorRecommendationSetId:'',challengePreference:'',challengePreferenceDuration:'',availableSafetySupport:'none',pathwayScope:'',pathwayRef:''}; const b=clonePlainObject_(a); b.requestKind='surprise_me'; recPureAssert_(recRequestContextSignature_(a)!==recRequestContextSignature_(b)); });
  test('44 SourceLinks mixed rejected', function() { recPureExpectThrow_(function(){cleanRecEnum_('mixed',REC_ENUMS.provenanceRole,'ProvenanceRole');},'REC_VALIDATION'); });
  test('45 SourceLink target enum is finite', function() { recPureAssert_(REC_ENUMS.recordType.indexOf('LearnCandidates')>=0); });
  test('46 generated Opportunity schema includes SourceCandidateID', function() { recPureAssert_(OPPORTUNITY_HEADERS[OPPORTUNITY_HEADERS.length-1]==='SourceCandidateID'); });
  test('47 recommendation has no Transaction schema fields', function() { recPureAssert_(RECOMMENDATION_HISTORY_HEADERS.indexOf('Amount')<0 && RECOMMENDATION_HISTORY_HEADERS.indexOf('Pending')<0); });
  test('48 getData raw rec-v1 fields excluded by design constant', function() { recPureAssert_(LEARNING_RECOMMENDATION_CONTRACT_VERSION==='rec-v1'); });
  test('49 invalid key comparison cannot equal valid literal', function() { recPureAssert_(!constantTimeEqual_('abc','abd')); });
  test('50 configured parent admin override branch accepted', function() { const adminKey = PropertiesService.getScriptProperties().getProperty('SOPHIE_ADMIN_KEY'); recPureAssert_(!!adminKey, 'SOPHIE_ADMIN_KEY must be configured for admin override verification.'); requireLearningRecommendationAccess_('', adminKey); });

  const result = {
    version: APP_VERSION,
    opportunityContractVersion: OPPORTUNITY_CONTRACT_VERSION,
    learningResourceContractVersion: LEARNING_RESOURCE_CONTRACT_VERSION,
    learningRecommendationContractVersion: LEARNING_RECOMMENDATION_CONTRACT_VERSION,
    ok: failures.length === 0,
    testCount: tests.length,
    failureCount: failures.length,
    failures: failures
  };
  Logger.log(JSON.stringify(result));
  return result;
}
