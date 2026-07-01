/**
 * app_logic.js — Auto-generated from safe_incident_form_24.html
 * DO NOT EDIT MANUALLY.
 */

// Note: formData, flowIndex, incidentType, SUBJECT_ROLES, WITNESS_ROLES
// are expected to be declared in the consuming test file before eval().

// ── SECURITY: HTML escaping for all user-controlled content ────────────────
function escapeHtml(str){
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') str = String(str);
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

var ROLE_CATEGORIES = [
  'Subject',
  'Alleged Aggressor',
  'Victim',
  'Witness',
  'Employee',
  'Reporting Party',
  'Other Involved Party',
  'Unknown',
];

// Roles that belong in the "subject/involved parties" section of the report
var SUBJECT_ROLES = ['Subject','Alleged Aggressor','Victim','Employee','Other Involved Party'];
// Roles that belong in the "witnesses" section of the report
var WITNESS_ROLES = ['Witness'];

function newPerson(){
  return {
    id: 'person_' + Date.now() + '_' + Math.floor(Math.random()*10000),
    // ── Structured name fields (source of truth) ──────────────────────────
    firstName:     '',
    middleName:    '',   // e.g. "Nicole"
    middleInitial: '',   // e.g. "N." (set if only an initial was given)
    lastName:      '',
    suffix:        '',   // e.g. "Jr.", "III", "Sr."
    displayName:   '',   // computed: rendered name for PDF, narrative, UI
    name:          '',   // alias kept for backward compat with all rendering sites
    // ── Role / categorization ─────────────────────────────────────────────
    role: '',            // free-text role/position (e.g. "Event Security")
    roleCategory: '',    // one of ROLE_CATEGORIES — drives report section placement
    // ── Physical description ──────────────────────────────────────────────
    gender: '',
    ageRange: '',
    height: '',
    build: '',
    hairColor: '',
    hairStyle: '',
    clothing: '',
    features: '',
    seatLocation: '',
    // ── Statement & evidence ─────────────────────────────────────────────
    statement: '',
    photoDataUrls: [],
    photoMeta: [],
    // ── Additional ────────────────────────────────────────────────────────
    contactInfo: '',
    notes: '',
  };
}

// Builds the canonical display name from structured fields.
// Used everywhere a full name needs to be rendered: PDF, live card, AI narrative, Sheets.
function buildDisplayName(p){
  var parts = [p.firstName];
  if(p.middleName)    parts.push(p.middleName);
  else if(p.middleInitial) parts.push(p.middleInitial);
  if(p.lastName)      parts.push(p.lastName);
  if(p.suffix)        parts.push(p.suffix);
  var full = parts.filter(Boolean).join(' ').trim();
  return full || 'Unknown';
}

// Applies displayName → name alias so all existing rendering sites
// that reference p.name still work without modification.
function syncPersonName(p){
  p.displayName = buildDisplayName(p);
  p.name = p.displayName; // backward-compat alias
  return p;
}

// ── EMPLOYEE NAME HELPERS (Recognition reports) ───────────────────────────
// Mirrors the person name model but applied to the recognized employee fields.
// Keeps incident-report and recognition-report name models separate.
function buildEmployeeDisplayName(){
  var parts = [formData.employeeFirstName];
  if(formData.employeeMiddleName)    parts.push(formData.employeeMiddleName);
  else if(formData.employeeMiddleInitial) parts.push(formData.employeeMiddleInitial);
  if(formData.employeeLastName)      parts.push(formData.employeeLastName);
  if(formData.employeeSuffix)        parts.push(formData.employeeSuffix);
  return parts.filter(Boolean).join(' ').trim() || 'the employee';
}

function syncEmployeeDisplayName(){
  formData.employeeDisplayName = buildEmployeeDisplayName();
  // Also keep the legacy flat field for backward compat with any code that reads fd.employeeName
  formData.employeeName = formData.employeeDisplayName;
}

// ── STAGE 1: CANONICAL COMPUTED-VALUES LAYER ─────────────────────────────────
// computeReportContext(fd) is the single place where derived display values are
// computed. Every renderer (PDF, Word, Sheets, AI prompt, preview, email body,
// resume fallback) calls this instead of recomputing names independently.
//
// Rules:
// - Pure function: reads fd, returns a plain object, never mutates fd.
// - No async: called synchronously at the top of each renderer.
// - Canonical: if this returns ctx.supervisorName, renderers use ctx.supervisorName.
//   They do NOT also compute `var supName = ...` locally.
// - Extensible: add new derived values here, not in each renderer.
function computeReportContext(fd){
  // ── Supervisor ────────────────────────────────────────────────────────────
  var supervisorName = (
    `${fd.supervisorFirstName||''} ${fd.supervisorLastName||''}`.trim()
  ) || 'Unknown';

  // ── Employee (recognition reports) ────────────────────────────────────────
  var employeeName = (
    fd.employeeDisplayName ||
    `${fd.employeeFirstName||''} ${fd.employeeLastName||''}`.trim()
  ) || 'the employee';

  // The fallback used in AI prompts needs "The employee" capitalised when used
  // as a sentence subject — keep both forms here so callers pick what they need.
  var employeeNameForPrompt = employeeName === 'the employee' ? 'The employee' : employeeName;

  // ── People summaries (incident reports) ───────────────────────────────────
  var people = fd.people || [];
  var subjectPeople  = people.filter(p => (typeof SUBJECT_ROLES !== 'undefined' ? SUBJECT_ROLES : []).includes(p.roleCategory));
  var witnessPeople  = people.filter(p => (typeof WITNESS_ROLES !== 'undefined' ? WITNESS_ROLES : []).includes(p.roleCategory));

  // One-line summary for Sheets, analytics, AI prompts, context banner
  var peopleSummary = people.map(p =>
    `${p.displayName||p.name||'Unknown'} (${p.roleCategory||'Unknown'})`
  ).join('; ');

  // Structured narrative block for the AI narrative system prompt
  var peopleNarrativeBlock = people.map(p => {
    var displayName = p.displayName || p.name || 'Unknown';
    var lastName    = p.lastName || (displayName.includes(' ') ? displayName.split(' ').slice(-1)[0] : '');
    var desc  = [p.gender, p.ageRange, p.height, p.build].filter(Boolean).join(', ');
    var hair  = [p.hairColor, p.hairStyle].filter(Boolean).join(' ');
    return `- ${displayName}${lastName?' (last name: '+lastName+')':''}`
      + ` | Role: ${p.roleCategory||'Unknown'}${p.role?' ('+p.role+')':''}`
      + ` | Description: ${desc||'N/A'}${hair?', Hair: '+hair:''}${p.clothing?', Wearing: '+p.clothing:''}${p.features?', Features: '+p.features:''}${p.seatLocation?', Seat: '+p.seatLocation:''}`
      + ` | Statement: ${p.statement||'None provided'}`;
  }).join('\n');

  // ── Report metadata ────────────────────────────────────────────────────────
  var incidentDate = fd.incidentDate || fd.date || '';
  var incidentTime = fd.incidentTime || fd.time || '';
  var filedAt      = fd.date && fd.time ? `${fd.date} at ${fd.time}` : (fd.date || fd.time || '');
  var reportType   = fd.formType || (fd.incidentCategory ? 'Incident Report' : '');
  var isIncident   = reportType.toLowerCase().includes('incident') || !!fd.incidentCategory;
  var isRecognition= reportType.toLowerCase().includes('recognition') || !!fd.recognitionDescription;

  return {
    // Names — use these; never recompute locally in a renderer
    supervisorName,
    employeeName,
    employeeNameForPrompt,
    // People
    people,
    subjectPeople,
    witnessPeople,
    peopleSummary,
    peopleNarrativeBlock,
    // Metadata
    incidentDate,
    incidentTime,
    filedAt,
    reportType,
    isIncident,
    isRecognition,
    // Pass-through of raw fd for fields that don't need derivation
    // (renderers can still access fd.fieldName for raw values)
    fd,
  };
}

// ── STAGE 2: AUDIT LOG + setField SCAFFOLDING ────────────────────────────────
// auditLog[] records every field mutation with provenance.
// setField() is the single write path for all form fields — UI, AI, and voice.
//
// Source values:
//   'supervisor_typed'   — officer typed the value
//   'supervisor_voice'   — officer dictated (speech-to-text)
//   'supervisor_tapped'  — officer tapped a chip/button option
//   'ai_draft'           — AI proposed the value (not yet confirmed)
//   'ai_confirmed'       — AI proposed, supervisor confirmed ("Yes, that looks right")
//   'system'             — auto-captured (timestamp, venue, submission ID)
//   'migration'          — promoted from legacy flat field
//
// Confidence: 0.0–1.0. 1.0 = supervisor explicitly confirmed. 0.7 = AI-generated
// and confirmed. 0.4 = AI-generated, not yet confirmed. 0.0 = unknown.
//
// NOTE: setField is not yet wired to every write site (that is Stage 3).
// It IS wired to the system-captured fields (timestamp, venue) and the
// AI-rewrite confirmation path. All other writes still go direct to formData[key]
// and are logged retrospectively in showFinalForm via logFinalFormData().

var auditLog = [];

function setField(key, value, source, confidence){
  // Always write to formData (backward compat — renderers still read formData)
  formData[key] = value;

  // Log the mutation
  auditLog.push({
    key,
    value: typeof value === 'string' ? value.slice(0, 200) : value, // truncate long strings
    source: source || 'unknown',
    confidence: confidence != null ? confidence : 1.0,
    ts: new Date().toISOString(),
    flowIndex: typeof flowIndex !== 'undefined' ? flowIndex : null,
  });
}

// Convenience wrappers for the most common sources
function setFieldSupervisor(key, value){ setField(key, value, 'supervisor_typed', 1.0); }
function setFieldTapped(key, value)    { setField(key, value, 'supervisor_tapped', 1.0); }
function setFieldAIDraft(key, value)   { setField(key, value, 'ai_draft', 0.4); }
function setFieldAIConfirmed(key, value){ setField(key, value, 'ai_confirmed', 0.85); }
function setFieldSystem(key, value)    { setField(key, value, 'system', 1.0); }

// Called at the end of showFinalForm to retrospectively log all fields that
// were written directly to formData before setField was fully wired.
// This creates a complete audit snapshot even for Stage 1/2.
function logFinalFormData(fd){
  var snapshot = { ...fd };
  delete snapshot.people; // logged separately
  Object.entries(snapshot).forEach(([key, value]) => {
    if(value === undefined || value === null || value === '') return;
    // Only log if not already in auditLog for this key (avoid double-logging
    // fields that were already set via setField)
    var alreadyLogged = auditLog.some(e => e.key === key);
    if(!alreadyLogged){
      auditLog.push({
        key,
        value: typeof value === 'string' ? value.slice(0, 200) : value,
        source: 'supervisor_typed', // best assumption for retrospective log
        confidence: 1.0,
        ts: new Date().toISOString(),
        flowIndex: null,
        retrospective: true,
      });
    }
  });
  // Log people array as a single entry
  if(fd.people && fd.people.length > 0){
    auditLog.push({
      key: 'people',
      value: fd.people.map(p => `${p.displayName||p.name} (${p.roleCategory})`).join('; '),
      source: 'supervisor_typed',
      confidence: 1.0,
      ts: new Date().toISOString(),
      retrospective: true,
    });
  }
}

// Returns the audit log as a structured object for debugging or future reporting
function getAuditSummary(){
  return {
    totalEntries:    auditLog.length,
    supervisorFields: auditLog.filter(e => e.source.startsWith('supervisor')).length,
    aiDraftFields:   auditLog.filter(e => e.source === 'ai_draft').length,
    aiConfirmedFields: auditLog.filter(e => e.source === 'ai_confirmed').length,
    systemFields:    auditLog.filter(e => e.source === 'system').length,
    log: auditLog,
  };
}

formData.people = [];

// Migration shim: if older saved drafts or any legacy code path still writes
// to the flat formData.guestName/guestGender/etc. fields, this converts that
// single-guest data into a people[] entry so nothing downstream breaks.
function migrateLegacyGuestToPeople(){
  if(!formData.people) formData.people = []; // defensive: never assume the caller initialized this
  if(formData.people.length > 0) return; // already migrated/populated
  if(!formData.guestName && !formData.guestGender) return; // nothing to migrate

  var p = newPerson();
  // Parse legacy flat name into structured fields where possible
  var legacyName = formData.guestName || 'Unknown';
  var legacyParsed = parseNameTokens(legacyName);
  if(legacyParsed && legacyParsed.confidence !== 'first_only' && legacyParsed.lastName){
    p.firstName     = toProperCase(legacyParsed.firstName);
    p.middleName    = legacyParsed.middleName    ? toProperCase(legacyParsed.middleName)    : '';
    p.middleInitial = legacyParsed.middleInitial || '';
    p.lastName      = legacyParsed.lastName      ? toProperCase(legacyParsed.lastName)      : '';
    p.suffix        = legacyParsed.suffix        || '';
  } else {
    // Only one name word, or unparseable — store it all in firstName
    p.firstName = legacyName !== 'Unknown' ? legacyName : '';
  }
  syncPersonName(p);
  p.role = formData.guestRole || '';
  p.roleCategory = formData.incidentCategory === 'Employee Misconduct' ? 'Employee' : 'Subject';
  p.gender = formData.guestGender || '';
  p.ageRange = formData.guestAgeRange || '';
  p.height = formData.guestHeight || '';
  p.build = formData.guestBuild || '';
  p.hairColor = formData.guestHair || '';
  p.hairStyle = formData.guestHairStyle || '';
  p.clothing = formData.guestClothing || '';
  p.features = formData.guestFeatures || '';
  p.seatLocation = formData.guestSeat || '';
  p.statement = formData.guestStatement || '';
  p.photoDataUrls = formData.guestPhotoDataUrls || [];
  p.photoMeta = formData.guestPhotoMeta || [];
  formData.people.push(p);
}

function getSubjectPeople(){
  return (formData.people||[]).filter(p => SUBJECT_ROLES.includes(p.roleCategory));
}
function getWitnessPeople(){
  return (formData.people||[]).filter(p => WITNESS_ROLES.includes(p.roleCategory));
}

function toProperCase(s){
  if(!s) return '';
  // Handle hyphenated names: each segment gets its own proper-case treatment
  // Handle apostrophe names: O'Connor, O'Brien — capitalize after the apostrophe
  // Handle compound prefixes (van, de, etc.) — these stay lowercase when mid-name
  return s
    .split(/(-)/g)  // split on hyphen, preserving the hyphen
    .map(segment => {
      // Capitalize after apostrophes too: o'connor → O'Connor
      return segment.replace(/\w\S*/g, t => {
        // Handle apostrophe sub-parts: O'connor → O'Connor
        var parts = t.split("'");
        return parts.map((p, i) =>
          p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
        ).join("'");
      });
    })
    .join('');
}

// ── STAGE 1: CANONICAL COMPUTED-VALUES LAYER ─────────────────────────────────
// computeReportContext(fd) is the single place where derived display values are
// computed. Every renderer (PDF, Word, Sheets, AI prompt, preview, email body,
// resume fallback) calls this instead of recomputing names independently.
//
// Rules:
// - Pure function: reads fd, returns a plain object, never mutates fd.
// - No async: called synchronously at the top of each renderer.
// - Canonical: if this returns ctx.supervisorName, renderers use ctx.supervisorName.
//   They do NOT also compute `var supName = ...` locally.
// - Extensible: add new derived values here, not in each renderer.
function computeReportContext(fd){
  // ── Supervisor ────────────────────────────────────────────────────────────
  var supervisorName = (
    `${fd.supervisorFirstName||''} ${fd.supervisorLastName||''}`.trim()
  ) || 'Unknown';

  // ── Employee (recognition reports) ────────────────────────────────────────
  var employeeName = (
    fd.employeeDisplayName ||
    `${fd.employeeFirstName||''} ${fd.employeeLastName||''}`.trim()
  ) || 'the employee';

  // The fallback used in AI prompts needs "The employee" capitalised when used
  // as a sentence subject — keep both forms here so callers pick what they need.
  var employeeNameForPrompt = employeeName === 'the employee' ? 'The employee' : employeeName;

  // ── People summaries (incident reports) ───────────────────────────────────
  var people = fd.people || [];
  var subjectPeople  = people.filter(p => (typeof SUBJECT_ROLES !== 'undefined' ? SUBJECT_ROLES : []).includes(p.roleCategory));
  var witnessPeople  = people.filter(p => (typeof WITNESS_ROLES !== 'undefined' ? WITNESS_ROLES : []).includes(p.roleCategory));

  // One-line summary for Sheets, analytics, AI prompts, context banner
  var peopleSummary = people.map(p =>
    `${p.displayName||p.name||'Unknown'} (${p.roleCategory||'Unknown'})`
  ).join('; ');

  // Structured narrative block for the AI narrative system prompt
  var peopleNarrativeBlock = people.map(p => {
    var displayName = p.displayName || p.name || 'Unknown';
    var lastName    = p.lastName || (displayName.includes(' ') ? displayName.split(' ').slice(-1)[0] : '');
    var desc  = [p.gender, p.ageRange, p.height, p.build].filter(Boolean).join(', ');
    var hair  = [p.hairColor, p.hairStyle].filter(Boolean).join(' ');
    return `- ${displayName}${lastName?' (last name: '+lastName+')':''}`
      + ` | Role: ${p.roleCategory||'Unknown'}${p.role?' ('+p.role+')':''}`
      + ` | Description: ${desc||'N/A'}${hair?', Hair: '+hair:''}${p.clothing?', Wearing: '+p.clothing:''}${p.features?', Features: '+p.features:''}${p.seatLocation?', Seat: '+p.seatLocation:''}`
      + ` | Statement: ${p.statement||'None provided'}`;
  }).join('\n');

  // ── Report metadata ────────────────────────────────────────────────────────
  var incidentDate = fd.incidentDate || fd.date || '';
  var incidentTime = fd.incidentTime || fd.time || '';
  var filedAt      = fd.date && fd.time ? `${fd.date} at ${fd.time}` : (fd.date || fd.time || '');
  var reportType   = fd.formType || (fd.incidentCategory ? 'Incident Report' : '');
  var isIncident   = reportType.toLowerCase().includes('incident') || !!fd.incidentCategory;
  var isRecognition= reportType.toLowerCase().includes('recognition') || !!fd.recognitionDescription;

  return {
    // Names — use these; never recompute locally in a renderer
    supervisorName,
    employeeName,
    employeeNameForPrompt,
    // People
    people,
    subjectPeople,
    witnessPeople,
    peopleSummary,
    peopleNarrativeBlock,
    // Metadata
    incidentDate,
    incidentTime,
    filedAt,
    reportType,
    isIncident,
    isRecognition,
    // Pass-through of raw fd for fields that don't need derivation
    // (renderers can still access fd.fieldName for raw values)
    fd,
  };
}

// ── STAGE 2: AUDIT LOG + setField SCAFFOLDING ────────────────────────────────
// auditLog[] records every field mutation with provenance.
// setField() is the single write path for all form fields — UI, AI, and voice.
//
// Source values:
//   'supervisor_typed'   — officer typed the value
//   'supervisor_voice'   — officer dictated (speech-to-text)
//   'supervisor_tapped'  — officer tapped a chip/button option
//   'ai_draft'           — AI proposed the value (not yet confirmed)
//   'ai_confirmed'       — AI proposed, supervisor confirmed ("Yes, that looks right")
//   'system'             — auto-captured (timestamp, venue, submission ID)
//   'migration'          — promoted from legacy flat field
//
// Confidence: 0.0–1.0. 1.0 = supervisor explicitly confirmed. 0.7 = AI-generated
// and confirmed. 0.4 = AI-generated, not yet confirmed. 0.0 = unknown.
//
// NOTE: setField is not yet wired to every write site (that is Stage 3).
// It IS wired to the system-captured fields (timestamp, venue) and the
// AI-rewrite confirmation path. All other writes still go direct to formData[key]
// and are logged retrospectively in showFinalForm via logFinalFormData().

var auditLog = [];

function setField(key, value, source, confidence){
  // Always write to formData (backward compat — renderers still read formData)
  formData[key] = value;

  // Log the mutation
  auditLog.push({
    key,
    value: typeof value === 'string' ? value.slice(0, 200) : value, // truncate long strings
    source: source || 'unknown',
    confidence: confidence != null ? confidence : 1.0,
    ts: new Date().toISOString(),
    flowIndex: typeof flowIndex !== 'undefined' ? flowIndex : null,
  });
}

// Convenience wrappers for the most common sources
function setFieldSupervisor(key, value){ setField(key, value, 'supervisor_typed', 1.0); }
function setFieldTapped(key, value)    { setField(key, value, 'supervisor_tapped', 1.0); }
function setFieldAIDraft(key, value)   { setField(key, value, 'ai_draft', 0.4); }
function setFieldAIConfirmed(key, value){ setField(key, value, 'ai_confirmed', 0.85); }
function setFieldSystem(key, value)    { setField(key, value, 'system', 1.0); }

// Called at the end of showFinalForm to retrospectively log all fields that
// were written directly to formData before setField was fully wired.
// This creates a complete audit snapshot even for Stage 1/2.
function logFinalFormData(fd){
  var snapshot = { ...fd };
  delete snapshot.people; // logged separately
  Object.entries(snapshot).forEach(([key, value]) => {
    if(value === undefined || value === null || value === '') return;
    // Only log if not already in auditLog for this key (avoid double-logging
    // fields that were already set via setField)
    var alreadyLogged = auditLog.some(e => e.key === key);
    if(!alreadyLogged){
      auditLog.push({
        key,
        value: typeof value === 'string' ? value.slice(0, 200) : value,
        source: 'supervisor_typed', // best assumption for retrospective log
        confidence: 1.0,
        ts: new Date().toISOString(),
        flowIndex: null,
        retrospective: true,
      });
    }
  });
  // Log people array as a single entry
  if(fd.people && fd.people.length > 0){
    auditLog.push({
      key: 'people',
      value: fd.people.map(p => `${p.displayName||p.name} (${p.roleCategory})`).join('; '),
      source: 'supervisor_typed',
      confidence: 1.0,
      ts: new Date().toISOString(),
      retrospective: true,
    });
  }
}

// Returns the audit log as a structured object for debugging or future reporting
function getAuditSummary(){
  return {
    totalEntries:    auditLog.length,
    supervisorFields: auditLog.filter(e => e.source.startsWith('supervisor')).length,
    aiDraftFields:   auditLog.filter(e => e.source === 'ai_draft').length,
    aiConfirmedFields: auditLog.filter(e => e.source === 'ai_confirmed').length,
    systemFields:    auditLog.filter(e => e.source === 'system').length,
    log: auditLog,
  };
}

// ── INTELLIGENT NAME PARSER ───────────────────────────────────────────────────
// Attempts to parse a raw string into structured name components.
// Returns: { firstName, middleName, middleInitial, lastName, suffix, confidence }
// confidence: 'full_name' | 'first_middle_last' | 'first_initial_last' |
//             'first_only' | 'unknown'

var NAME_SUFFIXES = ['jr','jr.','sr','sr.','ii','iii','iv','v','esq','esq.','phd','md'];

// Known compound surname prefixes — never split these from what follows
var COMPOUND_PREFIXES = ['van','de','del','della','di','da','la','le','les','los',
  'mac','mc','st','st.','von','zu','al','el','bin','binte','den','der','des',
  'du','im','in','op','te','ten','ter','ver'];

// Known two-part first names — if someone enters one of these as "firstName",
// we should NOT suggest splitting them
var COMPOUND_FIRST_NAMES = [
  'mary ann','mary jane','mary beth','mary jo','mary lou','mary sue',
  'billy bob','billy joe','bobby joe','betty sue','betty jo',
  'jean luc','jean claude','jean pierre','jean paul',
  'anna marie','anne marie','anna lee','anna belle',
  'joe bob','jim bob','james lee','james paul','james ray',
  'sarah jane','sarah beth','sarah ann','sarah jo',
  'lily ann','lily rose','lily grace',
];

function parseNameTokens(raw){
  if(!raw || !raw.trim()) return null;
  var trimmed = raw.trim();
  var tokens = trimmed.split(/\s+/);

  // Single token — just a first name (or unknown)
  if(tokens.length === 1){
    return { firstName: tokens[0], middleName:'', middleInitial:'', lastName:'', suffix:'', confidence:'first_only' };
  }

  // Check for a suffix at the end
  var suffix = '';
  var remaining = [...tokens];
  var lastToken = remaining[remaining.length - 1].toLowerCase().replace(/\./g,'');
  if(NAME_SUFFIXES.includes(lastToken) || NAME_SUFFIXES.includes(remaining[remaining.length-1].toLowerCase())){
    suffix = remaining.pop();
  }

  // Now work with the remaining tokens
  if(remaining.length === 1){
    return { firstName: remaining[0], middleName:'', middleInitial:'', lastName:'', suffix, confidence:'first_only' };
  }

  // Check if the input starts with a known compound first name
  var lowerInput = trimmed.toLowerCase();
  var compoundFirst = COMPOUND_FIRST_NAMES.find(cf => lowerInput.startsWith(cf + ' ') || lowerInput === cf);
  if(compoundFirst){
    var cfTokens = compoundFirst.split(' ');
    var cfPart = cfTokens.map((t,i) => remaining[i] || '').join(' ');
    var rest = remaining.slice(cfTokens.length);
    if(rest.length === 0){
      // It's just a compound first name
      return { firstName: cfPart, middleName:'', middleInitial:'', lastName:'', suffix, confidence:'first_only' };
    }
    // Compound first + something after
    var lastName = buildCompoundLastName(rest);
    return { firstName: cfPart, middleName:'', middleInitial:'', lastName, suffix, confidence:'full_name' };
  }

  // Check for compound last name prefix in positions >= 1
  // e.g. "Whitney Van Dyke" → firstName=Whitney, lastName=Van Dyke
  var firstName = remaining[0];
  var afterFirst = remaining.slice(1);

  if(afterFirst.length === 1){
    // "First Last" — two tokens, clearly first + last
    var isInitial = /^[A-Za-z]\.$/.test(afterFirst[0]);
    if(isInitial){
      return { firstName, middleName:'', middleInitial: afterFirst[0], lastName:'', suffix, confidence:'first_only' };
    }
    return { firstName, middleName:'', middleInitial:'', lastName: afterFirst[0], suffix, confidence:'full_name' };
  }

  if(afterFirst.length === 2){
    // Could be: First Middle Last, First M. Last, First CompoundLast
    var second = afterFirst[0];
    var third = afterFirst[1];
    var secondIsInitial = /^[A-Za-z]\.$/.test(second);
    var thirdIsCompoundStart = COMPOUND_PREFIXES.includes(second.toLowerCase());

    if(secondIsInitial){
      // First M. Last
      return { firstName, middleName:'', middleInitial: second, lastName: third, suffix, confidence:'first_initial_last' };
    }
    if(thirdIsCompoundStart){
      // First (CompoundPrefix) Next — last name is "CompoundPrefix Next"
      return { firstName, middleName:'', middleInitial:'', lastName: buildCompoundLastName(afterFirst), suffix, confidence:'full_name' };
    }
    // First Middle Last
    return { firstName, middleName: second, middleInitial:'', lastName: third, suffix, confidence:'first_middle_last' };
  }

  if(afterFirst.length >= 3){
    // First Middle Last Compound, or First M. Last Compound, etc.
    var second = afterFirst[0];
    var secondIsInitial = /^[A-Za-z]\.$/.test(second);
    if(secondIsInitial){
      // First M. RestIsLastName
      return { firstName, middleName:'', middleInitial: second, lastName: buildCompoundLastName(afterFirst.slice(1)), suffix, confidence:'first_initial_last' };
    }
    // First Middle RestIsLastName
    return { firstName, middleName: second, middleInitial:'', lastName: buildCompoundLastName(afterFirst.slice(1)), suffix, confidence:'first_middle_last' };
  }

  return { firstName: trimmed, middleName:'', middleInitial:'', lastName:'', suffix, confidence:'first_only' };
}

function buildCompoundLastName(tokens){
  // Rejoin compound last names: ["Van","Dyke"] → "Van Dyke"
  return tokens.join(' ');
}

function formatParsedNameSuggestion(parsed){
  // Returns a human-readable summary of the parsed name for the AI to display
  var lines = [];
  if(parsed.firstName)     lines.push(`First Name: ${parsed.firstName}`);
  if(parsed.middleName)    lines.push(`Middle Name: ${parsed.middleName}`);
  if(parsed.middleInitial) lines.push(`Middle Initial: ${parsed.middleInitial}`);
  if(parsed.lastName)      lines.push(`Last Name: ${parsed.lastName}`);
  if(parsed.suffix)        lines.push(`Suffix: ${parsed.suffix}`);
  return lines.join('\n');
}

function correctKnownNames(raw){
  // Use displayName (computed from structured fields) as the authoritative name for correction
  var allKnownNames = (formData.people||[]).map(p=>p.displayName||p.name).filter(n=>n && n!=='Unknown');
  if(formData.guestName && formData.guestName!=='Unknown') allKnownNames.push(formData.guestName);
  allKnownNames.forEach(fullName => {
    var nameParts = fullName.trim().split(' ').filter(p=>p.length>2);
    nameParts.forEach(namePart => {
      var escaped = namePart.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      var lastChar = namePart.slice(-1);
      // Fix double-letter variations (Chartell → Chartel, Perrry → Perry)
      var doubleRegex = new RegExp(escaped.slice(0,-1) + lastChar + '+', 'gi');
      raw = raw.replace(doubleRegex, namePart);
      // Fix case variations
      var caseRegex = new RegExp(escaped, 'gi');
      raw = raw.replace(caseRegex, namePart);
    });
  });
  return raw;
}

// ── INTELLIGENT NAME PARSER ───────────────────────────────────────────────────
// Attempts to parse a raw string into structured name components.
// Returns: { firstName, middleName, middleInitial, lastName, suffix, confidence }
// confidence: 'full_name' | 'first_middle_last' | 'first_initial_last' |
//             'first_only' | 'unknown'

var NAME_SUFFIXES = ['jr','jr.','sr','sr.','ii','iii','iv','v','esq','esq.','phd','md'];

// Known compound surname prefixes — never split these from what follows
var COMPOUND_PREFIXES = ['van','de','del','della','di','da','la','le','les','los',
  'mac','mc','st','st.','von','zu','al','el','bin','binte','den','der','des',
  'du','im','in','op','te','ten','ter','ver'];

// Known two-part first names — if someone enters one of these as "firstName",
// we should NOT suggest splitting them
var COMPOUND_FIRST_NAMES = [
  'mary ann','mary jane','mary beth','mary jo','mary lou','mary sue',
  'billy bob','billy joe','bobby joe','betty sue','betty jo',
  'jean luc','jean claude','jean pierre','jean paul',
  'anna marie','anne marie','anna lee','anna belle',
  'joe bob','jim bob','james lee','james paul','james ray',
  'sarah jane','sarah beth','sarah ann','sarah jo',
  'lily ann','lily rose','lily grace',
];

function parseNameTokens(raw){
  if(!raw || !raw.trim()) return null;
  var trimmed = raw.trim();
  var tokens = trimmed.split(/\s+/);

  // Single token — just a first name (or unknown)
  if(tokens.length === 1){
    return { firstName: tokens[0], middleName:'', middleInitial:'', lastName:'', suffix:'', confidence:'first_only' };
  }

  // Check for a suffix at the end
  var suffix = '';
  var remaining = [...tokens];
  var lastToken = remaining[remaining.length - 1].toLowerCase().replace(/\./g,'');
  if(NAME_SUFFIXES.includes(lastToken) || NAME_SUFFIXES.includes(remaining[remaining.length-1].toLowerCase())){
    suffix = remaining.pop();
  }

  // Now work with the remaining tokens
  if(remaining.length === 1){
    return { firstName: remaining[0], middleName:'', middleInitial:'', lastName:'', suffix, confidence:'first_only' };
  }

  // Check if the input starts with a known compound first name
  var lowerInput = trimmed.toLowerCase();
  var compoundFirst = COMPOUND_FIRST_NAMES.find(cf => lowerInput.startsWith(cf + ' ') || lowerInput === cf);
  if(compoundFirst){
    var cfTokens = compoundFirst.split(' ');
    var cfPart = cfTokens.map((t,i) => remaining[i] || '').join(' ');
    var rest = remaining.slice(cfTokens.length);
    if(rest.length === 0){
      // It's just a compound first name
      return { firstName: cfPart, middleName:'', middleInitial:'', lastName:'', suffix, confidence:'first_only' };
    }
    // Compound first + something after
    var lastName = buildCompoundLastName(rest);
    return { firstName: cfPart, middleName:'', middleInitial:'', lastName, suffix, confidence:'full_name' };
  }

  // Check for compound last name prefix in positions >= 1
  // e.g. "Whitney Van Dyke" → firstName=Whitney, lastName=Van Dyke
  var firstName = remaining[0];
  var afterFirst = remaining.slice(1);

  if(afterFirst.length === 1){
    // "First Last" — two tokens, clearly first + last
    var isInitial = /^[A-Za-z]\.$/.test(afterFirst[0]);
    if(isInitial){
      return { firstName, middleName:'', middleInitial: afterFirst[0], lastName:'', suffix, confidence:'first_only' };
    }
    return { firstName, middleName:'', middleInitial:'', lastName: afterFirst[0], suffix, confidence:'full_name' };
  }

  if(afterFirst.length === 2){
    // Could be: First Middle Last, First M. Last, First CompoundLast
    var second = afterFirst[0];
    var third = afterFirst[1];
    var secondIsInitial = /^[A-Za-z]\.$/.test(second);
    var thirdIsCompoundStart = COMPOUND_PREFIXES.includes(second.toLowerCase());

    if(secondIsInitial){
      // First M. Last
      return { firstName, middleName:'', middleInitial: second, lastName: third, suffix, confidence:'first_initial_last' };
    }
    if(thirdIsCompoundStart){
      // First (CompoundPrefix) Next — last name is "CompoundPrefix Next"
      return { firstName, middleName:'', middleInitial:'', lastName: buildCompoundLastName(afterFirst), suffix, confidence:'full_name' };
    }
    // First Middle Last
    return { firstName, middleName: second, middleInitial:'', lastName: third, suffix, confidence:'first_middle_last' };
  }

  if(afterFirst.length >= 3){
    // First Middle Last Compound, or First M. Last Compound, etc.
    var second = afterFirst[0];
    var secondIsInitial = /^[A-Za-z]\.$/.test(second);
    if(secondIsInitial){
      // First M. RestIsLastName
      return { firstName, middleName:'', middleInitial: second, lastName: buildCompoundLastName(afterFirst.slice(1)), suffix, confidence:'first_initial_last' };
    }
    // First Middle RestIsLastName
    return { firstName, middleName: second, middleInitial:'', lastName: buildCompoundLastName(afterFirst.slice(1)), suffix, confidence:'first_middle_last' };
  }

  return { firstName: trimmed, middleName:'', middleInitial:'', lastName:'', suffix, confidence:'first_only' };
}

function buildCompoundLastName(tokens){
  // Rejoin compound last names: ["Van","Dyke"] → "Van Dyke"
  return tokens.join(' ');
}

function formatParsedNameSuggestion(parsed){
  // Returns a human-readable summary of the parsed name for the AI to display
  var lines = [];
  if(parsed.firstName)     lines.push(`First Name: ${parsed.firstName}`);
  if(parsed.middleName)    lines.push(`Middle Name: ${parsed.middleName}`);
  if(parsed.middleInitial) lines.push(`Middle Initial: ${parsed.middleInitial}`);
  if(parsed.lastName)      lines.push(`Last Name: ${parsed.lastName}`);
  if(parsed.suffix)        lines.push(`Suffix: ${parsed.suffix}`);
  return lines.join('\n');
}

function generateAnalyticsTags(fd){
  var tags = [];
  if(fd.incidentCategory) tags.push(fd.incidentCategory);
  if(fd.incidentLocation){
    var gateMatch = fd.incidentLocation.match(/Gate [A-G]/);
    if(gateMatch) tags.push(gateMatch[0]);
  }
  if(fd.incidentSeverity){
    if(fd.incidentSeverity.includes('Minor')) tags.push('Low Severity');
    else if(fd.incidentSeverity.includes('Moderate')) tags.push('Medium Severity');
    else if(fd.incidentSeverity.includes('Serious')) tags.push('High Severity');
  }
  if(fd.guestName && fd.guestName !== 'Unknown') tags.push('Identified Subject');
  if(fd.guestTransported && fd.guestTransported.includes('EMS')) tags.push('Medical Transport');
  if(fd.emsPolice && !fd.emsPolice.toLowerCase().includes('not applicable')) tags.push('Law Enforcement Involved');
  if(fd.witnesses && fd.witnesses !== 'None') tags.push('Witnesses Present');
  if(fd.cameraCapture && fd.cameraCapture.startsWith('Yes')) tags.push('Camera Footage Available');
  // Day of week tag
  try {
    var dow = new Date(fd.incidentDate||fd.date).toLocaleDateString('en-US',{weekday:'long'});
    if(dow && dow !== 'Invalid Date') tags.push(dow);
  } catch(e){}
  return tags.join(', ');
}

// Draft helpers
var DRAFT_KEY = 'safe_incident_draft';
var autosaveTimer = null;

function saveDraft(){
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    try {
      // Capture the current chat transcript as a serialized array of bubbles
      // Each entry: { role: 'ai'|'user', html: string, ts: ISO timestamp }
      var transcript = [];
      var bubbleRows = chatWindow.querySelectorAll('.bubble-row');
      bubbleRows.forEach(row => {
        var isAI   = row.classList.contains('ai');
        var isUser = row.classList.contains('user');
        var bub    = row.querySelector('.bubble');
        if(bub && (isAI || isUser)){
          transcript.push({
            role: isAI ? 'ai' : 'user',
            html: bub.innerHTML,
            ts:   new Date().toISOString(),
          });
        }
      });

      // Current context: who we're editing in the people loop, what step label we're on
      var currentStep = (activeFlow && activeFlow[flowIndex]) ? activeFlow[flowIndex].key : null;
      var draft = {
        formData:      formData,
        flowIndex:     flowIndex,
        incidentType:  incidentType,
        savedAt:       new Date().toISOString(),
        transcript,
        context: {
          reportType:    incidentType === 'recognition' ? 'Employee Recognition'
                       : incidentType === 'incident'    ? 'Incident Report'
                       : 'In Progress',
          category:      formData.incidentCategory || formData.recognitionType || '',
          currentStep:   currentStep,
          currentPerson: formData.people && formData.people.length > 0
                           ? (formData.people[formData.people.length - 1].displayName || formData.people[formData.people.length - 1].name || '')
                           : '',
        },
      };

      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        flashAutosaveIndicator();
      } catch(quotaErr){
        // If the full draft (with base64 photos) exceeds localStorage quota,
        // fall back to saving without the transcript (photos are the likely culprit)
        console.warn('Draft save with transcript failed — retrying without transcript:', quotaErr);
        var slimDraft = { ...draft, transcript: [] };
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(slimDraft));
          flashAutosaveIndicator();
        } catch(e2){
          console.error('Draft save failed even without transcript:', e2);
        }
      }
    } catch(e){ console.error('Draft save error:', e); }
  }, 400);
}

function loadDraft(){
  try {
    var raw = localStorage.getItem(DRAFT_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
}

function formatDraftAge(savedAt){
  var diffMs = Date.now() - new Date(savedAt).getTime();
  var mins = Math.floor(diffMs / 60000);
  if(mins < 1) return 'moments ago';
  if(mins < 60) return `${mins} minute${mins!==1?'s':''} ago`;
  var hrs = Math.floor(mins / 60);
  if(hrs < 24) return `${hrs} hour${hrs!==1?'s':''} ago`;
  return new Date(savedAt).toLocaleDateString();
}