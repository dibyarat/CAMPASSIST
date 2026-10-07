const fs = require('fs');

let content = fs.readFileSync('e:/ADI/campusmate/src/pages/cr/Timetable.tsx', 'utf8');

// Update formData
content = content.replace(/subjectId: '',\s+roomId: '',/, "subjectName: '',\n    roomNumber: '',");

// Replace Subject Select with Input
content = content.replace(
  /<select required value=\{formData.subjectId\} onChange=\{e => setFormData\(\{\.\.\.formData, subjectId: e.target.value\}\)\} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none">[\s\S]*?<\/select>/,
  '<input required type="text" placeholder="e.g. Data Structures" value={formData.subjectName} onChange={e => setFormData({...formData, subjectName: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none" />'
);

// Replace Room Select with Input
content = content.replace(
  /<select value=\{formData.roomId\} onChange=\{e => setFormData\(\{\.\.\.formData, roomId: e.target.value\}\)\} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none">[\s\S]*?<\/select>/,
  '<input type="text" placeholder="e.g. Room 101 (Optional)" value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none" />'
);

// Remove roomId undefined logic in handleAddSubmit
content = content.replace(
  /body: JSON.stringify\(\{ \.\.\.formData, roomId: formData.roomId \|\| undefined \}\)/,
  'body: JSON.stringify(formData)'
);

fs.writeFileSync('e:/ADI/campusmate/src/pages/cr/Timetable.tsx', content);
console.log('Fixed CR Timetable Inputs');
