/**
 * app_logic.js — Auto-generated from the S.A.F.E. app source file.
 * DO NOT EDIT MANUALLY. Re-generate with: python3 tests/extract_logic.py
 *
 * Source: safe_incident_form_24.html
 * Blocks: escapeHtml, roleModel, nameCorrection, analytics
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
    name: '',
    role: '',           // free-text role/position (e.g. "Event Security", job title)
    roleCategory: '',   // one of ROLE_CATEGORIES — drives report section placement
    gender: '',
    ageRange: '',
    height: '',
    build: '',
    hairColor: '',
    hairStyle: '',
    clothing: '',
    features: '',
    seatLocation: '',
    statement: '',
    photoDataUrls: [],
    photoMeta: [],
    contactInfo: '',
    notes: '',
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
  p.name = formData.guestName || 'Unknown';
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

function correctKnownNames(raw){
  var allKnownNames = (formData.people||[]).map(p=>p.name).filter(n=>n && n!=='Unknown');
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