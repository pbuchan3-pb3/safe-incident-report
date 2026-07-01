// Auto-extracted from safe_incident_form_24.html
var RECOGNITION_IMPACT_CATEGORIES = {
  'Guest Experience': [
    'Improved the guest experience.',
    'Helped a guest without being asked.',
    'Provided exceptional customer service.',
    'Resolved a guest concern professionally.',
    'Made guests feel welcome.',
    'Created a positive first impression.',
    'Assisted guests in finding their seats.',
    'Assisted guests with accessibility needs.',
  ],
  'Teamwork': [
    'Helped fellow staff members.',
    'Volunteered to assist another post.',
    'Demonstrated excellent teamwork.',
    'Supported supervisors during a busy period.',
    'Took initiative without being directed.',
    'Helped maintain smooth event operations.',
  ],
  'Safety & Security': [
    'Helped maintain a safe environment.',
    'Prevented a situation from escalating.',
    'Followed security procedures correctly.',
    'Demonstrated excellent situational awareness.',
    'Assisted with crowd management.',
    'Quickly reported a safety concern.',
    'Helped enforce stadium policies professionally.',
  ],
  'Professionalism': [
    'Maintained a calm and professional attitude.',
    'Demonstrated outstanding communication.',
    'Showed integrity and accountability.',
    'Displayed leadership under pressure.',
    'Went above and beyond expectations.',
    'Maintained a positive attitude throughout the event.',
  ],
  'Operations': [
    'Helped keep event operations running smoothly.',
    'Reduced delays for guests.',
    'Assisted with efficient entry operations.',
    'Helped maintain orderly crowd movement.',
    'Improved communication between departments.',
  ],
  'Recognition': [
    'Consistently volunteered to help.',
    'Demonstrated exceptional work ethic.',
    'Showed outstanding reliability.',
    'Represented S.A.F.E. professionally.',
    'Exceeded normal job expectations.',
  ],
};

// Returns category order tuned to the employee's role, so the most relevant
// suggestions appear first. Falls back to default order when role is unknown.
function getRoleAwareCategoryOrder(employeeRole){
  var r = (employeeRole||'').toLowerCase();
  if(r.includes('usher')||r.includes('guest services')||r.includes('accessibility')){
    return ['Guest Experience','Professionalism','Teamwork','Safety & Security','Operations','Recognition'];
  }
  if(r.includes('security')||r.includes('crowd')||r.includes('gate')){
    return ['Safety & Security','Professionalism','Teamwork','Guest Experience','Operations','Recognition'];
  }
  if(r.includes('supervisor')||r.includes('manager')||r.includes('lead')){
    return ['Professionalism','Teamwork','Operations','Safety & Security','Guest Experience','Recognition'];
  }
  if(r.includes('concession')||r.includes('vendor')||r.includes('parking')){
    return ['Professionalism','Guest Experience','Teamwork','Operations','Safety & Security','Recognition'];
  }
  return ['Guest Experience','Teamwork','Safety & Security','Professionalism','Operations','Recognition'];
}

// Category metadata
var RECOGNITION_CATEGORY_META = {
  'Safety & Security': { icon:'🛡️', bg:'#1A2E4A', color:'#fff',   border:'#1A2E4A' },
  'Guest Experience':  { icon:'😊', bg:'#E8192C', color:'#fff',   border:'#E8192C' },
  'Professionalism':   { icon:'⭐', bg:'#fff',     color:'#1A2E4A',border:'#1A2E4A' },
  'Teamwork':          { icon:'🤝', bg:'#1B4B8A', color:'#fff',   border:'#1B4B8A' },
  'Operations':        { icon:'⚙️', bg:'#4b5563', color:'#fff',   border:'#4b5563' },
  'Recognition':       { icon:'🏆', bg:'#92701a', color:'#fff',   border:'#92701a' },
};