/**
 * app_logic.js — Auto-generated from safe_incident_form_24.html
 * DO NOT EDIT MANUALLY.
 */

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
  return s.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
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