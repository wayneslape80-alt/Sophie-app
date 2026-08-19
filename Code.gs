/**
 * Sophie App v2 — Google Apps Script backend.
 *
 * Replace the old code with this file, run initialiseSophieAppV2() once,
 * then update the existing web-app deployment so its URL stays unchanged.
 */

const SPREADSHEET_ID = '1qfuPKdDIT6WkLPRQ9qf7ww38JqYBu37bvLfYu3X2Eq0';
const APP_VERSION = '2.2.0';

const SHEET_NAMES = Object.freeze({
  stats: 'Stats',
  opportunities: 'Opportunities',
  goals: 'Goals',
  skills: 'Skills',
  transactions: 'Transactions',
  schoolTasks: 'SchoolTasks'
});

const OPPORTUNITY_HEADERS = [
  'ID', 'Title', 'Value', 'Tier', 'Status', 'Description', 'Category', 'Type',
  'Skill', 'EstimatedMinutes', 'Repeatable', 'Frequency', 'ClaimedAt',
  'SubmittedAt', 'ApprovedAt', 'Icon', 'Instructions', 'WhyItMatters',
  'Feedback', 'ApprovedBy'
];
const GOAL_HEADERS = ['GoalID', 'Title', 'TargetAmount', 'SavedAmount', 'Icon', 'Status', 'CreatedAt', 'ImageUrl', 'ProductUrl'];
const SKILL_HEADERS = ['SkillID', 'Name', 'Level', 'Progress', 'NextLevelAt', 'Icon', 'Description'];
const TRANSACTION_HEADERS = ['TransactionID', 'Date', 'Type', 'Description', 'Amount', 'OpportunityID', 'GoalID', 'Status', 'ApprovedBy', 'Feedback'];
const SCHOOL_TASK_HEADERS = [
  'TaskID', 'Subject', 'Title', 'DueDate', 'TaskType', 'Status', 'NextAction',
  'HelpType', 'Source', 'CreatedAt', 'StartedAt', 'UpdatedAt', 'SubmittedAt',
  'ReceiptConfirmedAt', 'ArchivedAt'
];

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'getData');
    if (action === 'health') return json_({ success: true, version: APP_VERSION });
    if (action !== 'getData') throw new Error('Unsupported GET action.');
    return json_(getAppData_());
  } catch (error) {
    return json_({ success: false, error: safeError_(error) });
  }
}

function doPost(e) {
  try {
    const data = parsePostData_(e);
    const action = String(data.action || '');
    let result;

    switch (action) {
      case 'claimJob':
        result = claimJob_(data.jobId);
        break;
      case 'getParentData':
        requireAdmin_(data.adminKey);
        result = getAppData_();
        break;
      case 'approveJob':
        requireAdmin_(data.adminKey);
        result = approveJob_(data.jobId, data.feedback, data.approvedBy);
        break;
      case 'rejectJob':
        requireAdmin_(data.adminKey);
        result = rejectJob_(data.jobId, data.feedback);
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
      default:
        throw new Error('Unsupported action.');
    }

    return json_({ success: true, data: result });
  } catch (error) {
    return json_({ success: false, error: safeError_(error) });
  }
}

function getAppData_() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const statsSheet = requireSheet_(db, SHEET_NAMES.stats);
  const opportunitiesSheet = requireSheet_(db, SHEET_NAMES.opportunities);
  const stats = readStats_(statsSheet);
  const jobs = readObjects_(opportunitiesSheet).map(normaliseOpportunity_);
  const goalsSheet = db.getSheetByName(SHEET_NAMES.goals);
  const skillsSheet = db.getSheetByName(SHEET_NAMES.skills);
  const transactionsSheet = db.getSheetByName(SHEET_NAMES.transactions);
  const goals = goalsSheet ? readObjects_(goalsSheet).map(normaliseGoal_) : [];
  const skills = skillsSheet ? readObjects_(skillsSheet).map(normaliseSkill_) : [];
  const transactions = transactionsSheet
    ? readObjects_(transactionsSheet).map(normaliseTransaction_).sort(sortByDateDesc_).slice(0, 80)
    : [];

  return {
    appVersion: APP_VERSION,
    balance: stats.balance,
    pending: stats.pending,
    familyValue: stats.familyValue,
    badges: stats.badges,
    impact: calculateImpact_(transactions),
    jobs: jobs,
    goals: goals,
    skills: skills,
    transactions: transactions
  };
}

function claimJob_(jobId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = requireSheet_(db, SHEET_NAMES.opportunities);
    const statsSheet = requireSheet_(db, SHEET_NAMES.stats);
    const record = findRecordById_(sheet, 'ID', jobId);
    const status = String(record.object.Status || 'open').toLowerCase();
    if (status !== 'open') throw new Error('That opportunity is no longer open.');

    const value = number_(record.object.Value);
    const now = new Date();
    setRecordValue_(sheet, record, 'Status', 'pending');
    setRecordValueIfPresent_(sheet, record, 'ClaimedAt', now);
    setRecordValueIfPresent_(sheet, record, 'SubmittedAt', now);

    const stats = readStats_(statsSheet);
    statsSheet.getRange('B2').setValue(roundMoney_(stats.pending + value));
    appendPendingTransaction_(db, record.object, now);
    SpreadsheetApp.flush();
    return { jobId: String(record.object.ID), status: 'pending' };
  } finally {
    lock.releaseLock();
  }
}

function approveJob_(jobId, feedback, approvedBy) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = requireSheet_(db, SHEET_NAMES.opportunities);
    const record = findRecordById_(sheet, 'ID', jobId);
    const status = String(record.object.Status || '').toLowerCase();
    if (status !== 'pending' && status !== 'claimed') throw new Error('Only pending opportunities can be approved.');

    const value = number_(record.object.Value);
    const now = new Date();
    const reviewer = cleanText_(approvedBy || 'Parent', 80);
    const note = cleanText_(feedback || '', 500);
    const statsSheet = requireSheet_(db, SHEET_NAMES.stats);
    const stats = readStats_(statsSheet);

    setRecordValue_(sheet, record, 'Status', 'completed');
    setRecordValueIfPresent_(sheet, record, 'ApprovedAt', now);
    setRecordValueIfPresent_(sheet, record, 'Feedback', note);
    setRecordValueIfPresent_(sheet, record, 'ApprovedBy', reviewer);
    statsSheet.getRange('A2').setValue(roundMoney_(stats.balance + value));
    statsSheet.getRange('B2').setValue(roundMoney_(Math.max(0, stats.pending - value)));

    finalisePendingTransaction_(db, record.object, 'completed', now, reviewer, note);
    SpreadsheetApp.flush();
    return { jobId: String(record.object.ID), status: 'completed', balance: roundMoney_(stats.balance + value) };
  } finally {
    lock.releaseLock();
  }
}

function rejectJob_(jobId, feedback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = requireSheet_(db, SHEET_NAMES.opportunities);
    const record = findRecordById_(sheet, 'ID', jobId);
    const status = String(record.object.Status || '').toLowerCase();
    if (status !== 'pending' && status !== 'claimed') throw new Error('Only a pending opportunity can be returned.');

    const value = number_(record.object.Value);
    const note = cleanText_(feedback || '', 500);
    const statsSheet = requireSheet_(db, SHEET_NAMES.stats);
    const stats = readStats_(statsSheet);
    setRecordValue_(sheet, record, 'Status', 'open');
    setRecordValueIfPresent_(sheet, record, 'Feedback', note);
    statsSheet.getRange('B2').setValue(roundMoney_(Math.max(0, stats.pending - value)));
    finalisePendingTransaction_(db, record.object, 'rejected', new Date(), 'Parent', note);
    SpreadsheetApp.flush();
    return { jobId: String(record.object.ID), status: 'open' };
  } finally {
    lock.releaseLock();
  }
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

function appendPendingTransaction_(db, opportunity, date) {
  const sheet = ensureSheet_(db, SHEET_NAMES.transactions, TRANSACTION_HEADERS);
  sheet.appendRow([
    newId_('TX'), date, transactionType_(opportunity), String(opportunity.Title || 'Opportunity'),
    number_(opportunity.Value), String(opportunity.ID), '', 'pending', '', ''
  ]);
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
  const sheet = ensureSheet_(db, SHEET_NAMES.schoolTasks, SCHOOL_TASK_HEADERS);
  addMissingHeaders_(sheet, SCHOOL_TASK_HEADERS);
  return readObjects_(sheet)
    .map(normaliseSchoolTask_)
    .filter(function(task) { return !task.archivedAt; })
    .sort(sortSchoolTasks_);
}

function createSchoolTask_(data) {
  const subject = cleanText_(data.subject || '', 60);
  const title = cleanText_(data.title || '', 120);
  const dueDate = cleanDateOnly_(data.dueDate, true);
  const nextAction = cleanText_(data.nextAction || '', 240);
  const taskType = cleanTaskType_(data.taskType || 'assignment');

  if (!subject) throw new Error('Choose a subject.');
  if (!title) throw new Error('A school task needs a name.');
  if (!nextAction) throw new Error('Add one concrete next step.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ensureSheet_(db, SHEET_NAMES.schoolTasks, SCHOOL_TASK_HEADERS);
    addMissingHeaders_(sheet, SCHOOL_TASK_HEADERS);
    const now = new Date();
    const id = newId_('ST');

    sheet.appendRow([
      id, subject, title, dueDate, taskType, 'todo', nextAction,
      '', cleanText_(data.source || 'manual', 40) || 'manual',
      now, '', now, '', '', ''
    ]);

    SpreadsheetApp.flush();
    return {
      taskId: id,
      subject: subject,
      title: title,
      dueDate: dueDate,
      taskType: taskType,
      status: 'todo',
      nextAction: nextAction,
      helpType: ''
    };
  } finally {
    lock.releaseLock();
  }
}

function updateSchoolTask_(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const db = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = requireSheet_(db, SHEET_NAMES.schoolTasks);
    const record = findSchoolTaskById_(sheet, data.taskId);
    const now = new Date();

    if (Object.prototype.hasOwnProperty.call(data, 'subject')) {
      const subject = cleanText_(data.subject || '', 60);
      if (!subject) throw new Error('Choose a subject.');
      setRecordValue_(sheet, record, 'Subject', subject);
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
    if (Object.prototype.hasOwnProperty.call(data, 'nextAction')) {
      const nextAction = cleanText_(data.nextAction || '', 240);
      if (!nextAction) throw new Error('Add one concrete next step.');
      setRecordValue_(sheet, record, 'NextAction', nextAction);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
      const status = cleanSchoolStatus_(data.status);
      setRecordValue_(sheet, record, 'Status', status);
      if (status === 'working' && !record.object.StartedAt) {
        setRecordValue_(sheet, record, 'StartedAt', now);
      }
      if (status !== 'submitted' && record.object.SubmittedAt) {
        setRecordValue_(sheet, record, 'SubmittedAt', '');
        setRecordValue_(sheet, record, 'ReceiptConfirmedAt', '');
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
    const sheet = requireSheet_(db, SHEET_NAMES.schoolTasks);
    const record = findSchoolTaskById_(sheet, taskId);
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
    const sheet = requireSheet_(db, SHEET_NAMES.schoolTasks);
    const record = findSchoolTaskById_(sheet, taskId);
    if (record.object.ArchivedAt) throw new Error('This task is archived.');
    const now = new Date();
    setRecordValue_(sheet, record, 'Status', 'submitted');
    setRecordValue_(sheet, record, 'SubmittedAt', now);
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
    const sheet = requireSheet_(db, SHEET_NAMES.schoolTasks);
    const record = findSchoolTaskById_(sheet, taskId);
    if (String(record.object.Status || '').toLowerCase() !== 'submitted') {
      throw new Error('Mark the task as submitted before confirming receipt.');
    }
    const now = new Date();
    setRecordValue_(sheet, record, 'ReceiptConfirmedAt', now);
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
    const sheet = requireSheet_(db, SHEET_NAMES.schoolTasks);
    const record = findSchoolTaskById_(sheet, taskId);
    const now = new Date();
    setRecordValue_(sheet, record, 'ArchivedAt', now);
    setRecordValue_(sheet, record, 'UpdatedAt', now);
    SpreadsheetApp.flush();
    return { taskId: String(record.object.TaskID), archived: true };
  } finally {
    lock.releaseLock();
  }
}

function normaliseSchoolTask_(row) {
  return {
    taskId: String(row.TaskID || ''),
    subject: String(row.Subject || ''),
    title: String(row.Title || ''),
    dueDate: String(row.DueDate || ''),
    taskType: String(row.TaskType || 'assignment').toLowerCase(),
    status: String(row.Status || 'todo').toLowerCase(),
    nextAction: String(row.NextAction || ''),
    helpType: String(row.HelpType || ''),
    source: String(row.Source || 'manual'),
    createdAt: iso_(row.CreatedAt),
    startedAt: iso_(row.StartedAt),
    updatedAt: iso_(row.UpdatedAt),
    submittedAt: iso_(row.SubmittedAt),
    receiptConfirmedAt: iso_(row.ReceiptConfirmedAt),
    archivedAt: iso_(row.ArchivedAt)
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error('Use a valid due date.');
  const parts = text.split('-').map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  if (date.getUTCFullYear() !== parts[0] || date.getUTCMonth() !== parts[1] - 1 || date.getUTCDate() !== parts[2]) {
    throw new Error('Use a valid due date.');
  }
  return text;
}

function cleanTaskType_(value) {
  const type = String(value || 'assignment').trim().toLowerCase();
  const allowed = ['assignment', 'checkpoint', 'homework', 'other'];
  if (allowed.indexOf(type) < 0) throw new Error('Unsupported school task type.');
  return type;
}

function cleanSchoolStatus_(value) {
  const status = String(value || '').trim().toLowerCase();
  const allowed = ['todo', 'working', 'ready', 'submitted'];
  if (allowed.indexOf(status) < 0) throw new Error('Unsupported school task status.');
  return status;
}

function cleanHelpType_(value) {
  const help = String(value || '').trim().toLowerCase();
  const allowed = ['', 'understand', 'stuck', 'feedback', 'submitting'];
  if (allowed.indexOf(help) < 0) throw new Error('Unsupported help request.');
  return help;
}

function finalisePendingTransaction_(db, opportunity, status, date, approvedBy, feedback) {
  const sheet = ensureSheet_(db, SHEET_NAMES.transactions, TRANSACTION_HEADERS);
  const rows = readObjectsWithRows_(sheet);
  const match = rows.reverse().find(function(item) {
    return String(item.object.OpportunityID) === String(opportunity.ID) &&
      String(item.object.Status).toLowerCase() === 'pending';
  });
  if (match) {
    setRecordValue_(sheet, match, 'Date', date);
    setRecordValue_(sheet, match, 'Status', status);
    setRecordValue_(sheet, match, 'ApprovedBy', approvedBy);
    setRecordValue_(sheet, match, 'Feedback', feedback);
  } else {
    sheet.appendRow([
      newId_('TX'), date, transactionType_(opportunity), String(opportunity.Title || 'Opportunity'),
      number_(opportunity.Value), String(opportunity.ID), '', status, approvedBy, feedback
    ]);
  }
}

function initialiseSophieAppV2() {
  const db = SpreadsheetApp.openById(SPREADSHEET_ID);
  const stats = ensureSheet_(db, SHEET_NAMES.stats, ['Balance', 'Pending', 'FamilyValue', 'Badges']);
  if (stats.getLastRow() < 2) stats.appendRow([0, 0, 0, '']);

  const opportunities = ensureSheet_(db, SHEET_NAMES.opportunities, OPPORTUNITY_HEADERS);
  addMissingHeaders_(opportunities, OPPORTUNITY_HEADERS);
  populateOpportunityDefaults_(opportunities);
  ensureSheet_(db, SHEET_NAMES.goals, GOAL_HEADERS);
  const skills = ensureSheet_(db, SHEET_NAMES.skills, SKILL_HEADERS);
  ensureSheet_(db, SHEET_NAMES.transactions, TRANSACTION_HEADERS);
  const schoolTasks = ensureSheet_(db, SHEET_NAMES.schoolTasks, SCHOOL_TASK_HEADERS);
  addMissingHeaders_(schoolTasks, SCHOOL_TASK_HEADERS);
  seedSkills_(skills);

  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('SOPHIE_ADMIN_KEY')) {
    throw new Error('Set SOPHIE_ADMIN_KEY manually in Project Settings > Script Properties, then run initialiseSophieAppV2() again.');
  }

  SpreadsheetApp.flush();
  Logger.log('Sophie App v2.2.0 is ready. No credentials were written to logs.');
  return 'Setup complete. Existing parent credentials were preserved. School device access can be provisioned from Parent Mode.';
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
  const value = number_(row.Value);
  return {
    id: String(row.ID),
    title: String(row.Title || 'Untitled opportunity'),
    value: value,
    tier: number_(row.Tier) || 1,
    status: String(row.Status || 'open').toLowerCase(),
    description: String(row.Description || ''),
    category: String(row.Category || 'Home'),
    type: String(row.Type || (value > 0 ? 'earn' : 'contribute')).toLowerCase(),
    skill: String(row.Skill || 'Independence'),
    estimatedMinutes: number_(row.EstimatedMinutes),
    repeatable: String(row.Repeatable || ''),
    frequency: String(row.Frequency || ''),
    claimedAt: iso_(row.ClaimedAt),
    submittedAt: iso_(row.SubmittedAt),
    approvedAt: iso_(row.ApprovedAt),
    icon: String(row.Icon || (value > 0 ? '💰' : '🤝')),
    instructions: String(row.Instructions || ''),
    whyItMatters: String(row.WhyItMatters || ''),
    feedback: String(row.Feedback || '')
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
    feedback: String(row.Feedback || '')
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
  const match = readObjectsWithRows_(sheet).find(function(item) {
    return String(item.object[idHeader]) === String(id);
  });
  if (!match) throw new Error('Opportunity not found.');
  return match;
}

function findGoalById_(sheet, goalId) {
  const match = readObjectsWithRows_(sheet).find(function(item) {
    return String(item.object.GoalID) === String(goalId);
  });
  if (!match) throw new Error('Goal not found.');
  return match;
}

function findSchoolTaskById_(sheet, taskId) {
  const match = readObjectsWithRows_(sheet).find(function(item) {
    return String(item.object.TaskID) === String(taskId);
  });
  if (!match) throw new Error('School task not found.');
  return match;
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
  if (sheet.getLastColumn() === 0 || sheet.getRange(1, 1).getValue() === '') {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeader_(sheet, headers.length);
    sheet.setFrozenRows(1);
    return sheet;
  }
  const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const missing = headers.filter(function(header) { return currentHeaders.indexOf(header) < 0; });
  if (missing.length) {
    sheet.getRange(1, sheet.getLastColumn() + 1, 1, missing.length).setValues([missing]);
    styleHeader_(sheet, sheet.getLastColumn());
  }
  return sheet;
}

function addMissingHeaders_(sheet, requiredHeaders) {
  const width = Math.max(1, sheet.getLastColumn());
  const existing = sheet.getRange(1, 1, 1, width).getValues()[0].map(String);
  const missing = requiredHeaders.filter(function(header) { return existing.indexOf(header) < 0; });
  if (!missing.length) return;
  sheet.getRange(1, width + 1, 1, missing.length).setValues([missing]);
  styleHeaderRange_(sheet.getRange(1, width + 1, 1, missing.length));
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
  if (!expected) throw new Error('Parent access is not configured. Run initialiseSophieAppV2().');
  if (!key || !constantTimeEqual_(String(key), String(expected))) throw new Error('Invalid parent admin key.');
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
function generateAdminKey_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 16).toUpperCase(); }
function generateSchoolKey_() { return Utilities.getUuid().replace(/-/g, '').toUpperCase(); }
function safeError_(error) { return cleanText_(error && error.message ? error.message : 'Unexpected server error.', 500); }

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
